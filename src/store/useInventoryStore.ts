import { create } from 'zustand';
import type {
  BusinessSettings,
  Product,
  Sale,
  StaffMember,
  StockMovement,
  StockMovementType,
  Role,
  Supplier,
  PaymentMethod,
} from '../types';
import { uid, nowIso, normalizeBarcode } from '../lib/logic';
import * as db from '../lib/db';
import * as cloud from '../lib/cloud';
import { buildSeedProducts } from '../data/seed';
import { signOutUser, type UserProfile } from '../lib/authService';
import type { AwaStockBackup } from '../lib/backup';

interface InventoryState {
  products: Product[];
  sales: Sale[];
  movements: StockMovement[];
  suppliers: Supplier[];
  staff: StaffMember[];
  settings: BusinessSettings | null;
  role: Role;
  isAuthenticated: boolean;
  userName: string;
  uid: string | null;
  email: string | null;
  shopId: string | null;
  authLoading: boolean;
  isOnline: boolean;
  hydrated: boolean;
  hydrationError: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string | null;
  lastSyncedAt: string | null;
  pendingSyncCount: number;

  hydrate: () => Promise<void>;
  setAuthUser: (profile: UserProfile | null) => Promise<void>;
  logout: () => Promise<void>;
  setOnline: (online: boolean) => void;
  syncCloud: () => Promise<void>;
  stopCloudSync: () => void;

  addProduct: (input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  sellProduct: (productId: string, quantity: number, paymentMethod?: PaymentMethod) => { ok: boolean; message?: string; sale?: Sale };
  addStock: (productId: string, quantity: number, reason: string) => void;
  adjustStock: (productId: string, delta: number, reason: string, type?: StockMovementType) => { ok: boolean; message?: string };
  findByBarcode: (barcode: string) => Product | undefined;
  addSupplier: (input: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier;
  deleteSupplier: (id: string) => void;
  updateBusinessSettings: (patch: Partial<BusinessSettings>) => Promise<void>;
  inviteStaff: (input: { name: string; email: string }) => Promise<{ ok: boolean; message: string }>;
  setStaffStatus: (id: string, status: StaffMember['status']) => Promise<void>;
  loadSampleData: () => Promise<void>;
  restoreBackup: (backup: AwaStockBackup) => Promise<{ ok: boolean; message: string }>;
}

let cloudUnsubscribe: (() => void) | null = null;
let syncInFlight: Promise<void> | null = null;
let authGeneration = 0;

function mergeByUpdatedAt<T extends { id: string; updatedAt?: string; createdAt?: string }>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const current = map.get(item.id);
    if (!current) map.set(item.id, item);
    else if ((item.updatedAt || item.createdAt || '') > (current.updatedAt || current.createdAt || '')) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function mergeAppendOnly<T extends { id: string; createdAt: string }>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  for (const item of [...local, ...remote]) map.set(item.id, item);
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}


function ensureOpeningMovements(products: Product[], movements: StockMovement[], userId?: string | null, userName?: string) {
  const productsWithMovement = new Set(movements.map((movement) => movement.productId));
  const additions: StockMovement[] = [];
  for (const product of products) {
    if (product.quantity <= 0 || productsWithMovement.has(product.id)) continue;
    additions.push({
      id: `opening:${product.id}`,
      productId: product.id,
      productName: product.name,
      type: 'STOCK_IN',
      quantity: product.quantity,
      reason: 'Opening stock balance',
      createdAt: product.createdAt,
      userId: userId ?? undefined,
      userName: userName || undefined,
    });
  }
  return additions;
}

function reconcileProductQuantities(products: Product[], movements: StockMovement[]) {
  const totals = new Map<string, number>();
  for (const movement of movements) {
    totals.set(movement.productId, (totals.get(movement.productId) ?? 0) + movement.quantity);
  }

  let conflict = false;
  const value = products.map((product) => {
    const total = totals.get(product.id);
    if (total === undefined) return product;

    if (total < 0) conflict = true;

    return {
      ...product,
      // The append-only movement ledger is the source of truth for stock
      // whenever a product has stock movements. This prevents two offline
      // devices from overwriting each other's quantity with a stale value.
      quantity: Math.max(0, total),
    };
  });

  return { products: value, conflict };
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [], sales: [], movements: [], suppliers: [], staff: [], settings: null,
  role: 'staff', isAuthenticated: false, userName: '', uid: null, email: null, shopId: null,
  authLoading: true,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  hydrated: false, hydrationError: null,
  syncStatus: 'idle', syncError: null, lastSyncedAt: null, pendingSyncCount: 0,

  hydrate: async () => {
    set({ hydrationError: null });
    try {
      const shopId = await db.getShopId();
      if (!shopId) {
        set({ hydrated: false, hydrationError: null });
        return;
      }
      const [products, sales, movements, suppliers, staff, settings, lastSyncedAt, pendingSync] = await Promise.all([
        db.loadProducts(), db.loadSales(), db.loadMovements(), db.loadSuppliers(), db.loadStaff(), db.loadSettings(), db.getLastSyncedAt(), db.getPendingSyncItems(),
      ]);
      const normalizedProducts = (products ?? []).map((p) => ({ ...p, costPrice: p.costPrice ?? 0, archived: p.archived ?? false }));
      const normalizedSales = (sales ?? []).map((s) => ({ ...s, unitCost: s.unitCost ?? 0, profit: s.profit ?? ((s.unitPrice - (s.unitCost ?? 0)) * s.quantity), paymentMethod: s.paymentMethod ?? 'cash' }));
      const normalizedMovements = movements ?? [];
      const openingMovements = ensureOpeningMovements(normalizedProducts, normalizedMovements, get().uid, get().userName);
      const allMovements = [...openingMovements, ...normalizedMovements];
      const reconciled = reconcileProductQuantities(normalizedProducts, allMovements);
      set({
        products: reconciled.products, sales: normalizedSales, movements: allMovements, suppliers: suppliers ?? [], staff: staff ?? [],
        settings: settings ?? null, lastSyncedAt: lastSyncedAt ?? null, pendingSyncCount: pendingSync.length + openingMovements.length, hydrated: true, hydrationError: null,
      });
      await Promise.all([db.saveProducts(reconciled.products), db.saveSales(normalizedSales), db.saveMovements(allMovements)]);
      for (const movement of openingMovements) await db.queueSyncItem({ kind: 'upsert', collectionName: 'movements', recordId: movement.id });
      if (!(await db.isSeeded())) await db.markSeeded();
    } catch (err) {
      set({ hydrated: false, hydrationError: err instanceof Error ? err.message : 'Could not load your shop data.' });
    }
  },

  setAuthUser: async (profile) => {
    authGeneration += 1;
    if (cloudUnsubscribe) { cloudUnsubscribe(); cloudUnsubscribe = null; }
    if (!profile) {
      await db.setCachedAuthProfile(null);
      set({ products: [], sales: [], movements: [], suppliers: [], staff: [], settings: null, lastSyncedAt: null, pendingSyncCount: 0, isAuthenticated: false, role: 'staff', userName: '', uid: null, email: null, shopId: null, authLoading: false, syncStatus: 'idle', syncError: null, hydrated: true });
      await db.setShopId(null);
      return;
    }

    const previousShopId = await db.getShopId();
    const shopChanged = previousShopId !== profile.shopId;
    await db.setShopId(profile.shopId);
    await db.setCachedAuthProfile(profile);
    set({ isAuthenticated: true, role: profile.role, userName: profile.displayName, uid: profile.uid, email: profile.email, shopId: profile.shopId, authLoading: false, ...(shopChanged ? { products: [], sales: [], movements: [], suppliers: [], staff: [], settings: null, lastSyncedAt: null, pendingSyncCount: 0, hydrated: false } : {}) });
    await get().hydrate();
    void get().syncCloud();
  },

  logout: async () => { await signOutUser(); },

  setOnline: (isOnline) => {
    set({ isOnline, syncStatus: isOnline ? get().syncStatus : 'offline' });
    if (isOnline && get().isAuthenticated) void get().syncCloud();
  },

  stopCloudSync: () => {
    if (cloudUnsubscribe) { cloudUnsubscribe(); cloudUnsubscribe = null; }
  },

  syncCloud: async () => {
    if (syncInFlight) return syncInFlight;
    syncInFlight = (async () => {
      const shopId = get().shopId;
      const generation = authGeneration;
      if (!shopId) return;
      if (!get().isOnline) { set({ syncStatus: 'offline' }); return; }
      set({ syncStatus: 'syncing', syncError: null });
      try {
        const pendingSync = await db.getPendingSyncItems();
        set({ pendingSyncCount: pendingSync.length });

        for (const item of pendingSync.filter((entry) => entry.kind === 'delete')) {
          await cloud.deleteRecord(shopId, item.collectionName, item.recordId);
        }

        const remote = await cloud.readShopData(shopId);
        if (generation !== authGeneration || get().shopId !== shopId || !get().isAuthenticated) return;
        const local = get();
        const mergedSales = mergeAppendOnly(local.sales, remote.sales);
        const mergedMovements = mergeAppendOnly(local.movements, remote.movements);
        const mergedProductMetadata = mergeByUpdatedAt(local.products, remote.products);
        const openingMovements = ensureOpeningMovements(mergedProductMetadata, mergedMovements, local.uid, local.userName);
        const allMovements = mergeAppendOnly(mergedMovements, openingMovements);
        const reconciled = reconcileProductQuantities(mergedProductMetadata, allMovements);

        const merged = {
          products: reconciled.products,
          sales: mergedSales,
          movements: allMovements,
          suppliers: mergeByUpdatedAt(local.suppliers, remote.suppliers),
          staff: mergeByUpdatedAt(local.staff, remote.staff),
          settings: remote.settings ?? local.settings,
        };

        const remoteSaleIds = new Set(remote.sales.map((item) => item.id));
        const remoteMovementIds = new Set(remote.movements.map((item) => item.id));
        const newSales = merged.sales.filter((item) => !remoteSaleIds.has(item.id));
        const newMovements = merged.movements.filter((item) => !remoteMovementIds.has(item.id));

        const isOwner = get().role === 'owner';
        const productsToPush = isOwner ? merged.products : [];

        if (generation !== authGeneration || get().shopId !== shopId || !get().isAuthenticated) return;

        await cloud.writeShopRecords(
          shopId,
          {
            products: productsToPush,
            sales: newSales,
            movements: newMovements,
            suppliers: isOwner ? merged.suppliers : [],
            staff: isOwner ? merged.staff : [],
            settings: isOwner ? merged.settings : null,
          },
          isOwner,
          isOwner,
        );

        await Promise.all([
          db.saveProducts(merged.products), db.saveSales(merged.sales), db.saveMovements(merged.movements),
          db.saveSuppliers(merged.suppliers), db.saveStaff(merged.staff),
          merged.settings ? db.saveSettings(merged.settings) : Promise.resolve(),
        ]);

        // A sync only acknowledges the exact queue entries it observed at its
        // start. If a sale/edit was queued while this sync was running, its
        // newer queuedAt value remains and will be retried by the next sync.
        const remaining = await db.removePendingSyncItems(
          pendingSync.map((item) => ({ id: item.id, queuedAt: item.queuedAt })),
        );
        const synced = nowIso();
        await db.setLastSyncedAt(synced);
        set({
          ...merged,
          pendingSyncCount: remaining,
          lastSyncedAt: synced,
          syncStatus: remaining > 0 ? 'syncing' : 'synced',
          syncError: reconciled.conflict
            ? 'Stock conflict detected while merging offline changes. Review recent sales and stock movements.'
            : null,
        });

        cloudUnsubscribe?.();
        cloudUnsubscribe = cloud.subscribeShopData(
          shopId,
          (name, records) => {
            const state = get();
            if (name === 'products') {
              const metadata = mergeByUpdatedAt(state.products, records as Product[]);
              const reconciled = reconcileProductQuantities(metadata, state.movements);
              set({ products: reconciled.products, syncError: reconciled.conflict ? 'Stock conflict detected while merging offline changes. Review recent sales and stock movements.' : state.syncError });
              void db.saveProducts(reconciled.products);
            }
            if (name === 'sales') { const value = mergeAppendOnly(state.sales, records as Sale[]); set({ sales: value }); void db.saveSales(value); }
            if (name === 'movements') {
              const value = mergeAppendOnly(state.movements, records as StockMovement[]);
              const reconciled = reconcileProductQuantities(state.products, value);
              set({ movements: value, products: reconciled.products, syncError: reconciled.conflict ? 'Stock conflict detected while merging offline changes. Review recent sales and stock movements.' : state.syncError });
              void db.saveMovements(value); void db.saveProducts(reconciled.products);
            }
            if (name === 'suppliers') { const value = mergeByUpdatedAt(state.suppliers, records as Supplier[]); set({ suppliers: value }); void db.saveSuppliers(value); }
            if (name === 'staff') {
              const value = mergeByUpdatedAt(state.staff, records as StaffMember[]);
              set({ staff: value });
              void db.saveStaff(value);
              if (state.role === 'staff' && state.email) {
                const own = value.find((member) => member.email.trim().toLowerCase() === state.email!.trim().toLowerCase());
                if (own?.status === 'inactive') {
                  void signOutUser().catch(() => undefined);
                }
              }
            }
          },
          (error) => set({ syncStatus: get().isOnline ? 'error' : 'offline', syncError: error.message }),
        );
      } catch (err) {
        console.error('Cloud sync failed:', err);
        set({ syncStatus: get().isOnline ? 'error' : 'offline', syncError: err instanceof Error ? err.message : 'Cloud sync failed.' });
      } finally {
        syncInFlight = null;
      }
    })();
    return syncInFlight;
  },

  addProduct: (input) => {
    const normalizedBarcode = normalizeBarcode(input.barcode);
    if (normalizedBarcode && get().products.some((p) => normalizeBarcode(p.barcode) === normalizedBarcode)) {
      throw new Error('This barcode is already assigned to another product.');
    }
    const now = nowIso();
    const product: Product = { ...input, barcode: input.barcode.trim(), id: uid(), createdAt: now, updatedAt: now };
    const products = [product, ...get().products];
    set({ products });
    void db.saveProducts(products);
    if (product.quantity > 0) recordMovement(set, get, product.id, product.name, 'STOCK_IN', product.quantity, 'New product registered');
    void persist(get, 'products', product);
    return product;
  },

  updateProduct: (id, patch) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;

    const nextBarcode = patch.barcode !== undefined ? normalizeBarcode(patch.barcode) : normalizeBarcode(product.barcode);
    if (nextBarcode && get().products.some((p) => p.id !== id && normalizeBarcode(p.barcode) === nextBarcode)) {
      throw new Error('This barcode is already assigned to another product.');
    }
    const requestedQuantity = patch.quantity;
    const quantityChanged = requestedQuantity !== undefined && requestedQuantity !== product.quantity;
    const updated = { ...product, ...patch, barcode: patch.barcode !== undefined ? patch.barcode.trim() : product.barcode, updatedAt: nowIso() };
    const products = get().products.map((p) => p.id === id ? updated : p);

    set({ products });
    void db.saveProducts(products);
    void persist(get, 'products', updated);

    if (quantityChanged) {
      const delta = requestedQuantity! - product.quantity;
      recordMovement(
        set,
        get,
        product.id,
        product.name,
        'ADJUSTMENT',
        delta,
        'Quantity changed from product details',
      );
    }
  },

  deleteProduct: (id) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;
    const updated = { ...product, archived: true, updatedAt: nowIso() };
    const products = get().products.map((p) => p.id === id ? updated : p);
    set({ products }); void db.saveProducts(products); void persist(get, 'products', updated);
  },

  findByBarcode: (barcode) => {
    const code = barcode.trim().toLowerCase();
    if (!code) return undefined;
    return get().products.find((p) => !p.archived && p.barcode.trim().toLowerCase() === code);
  },

  sellProduct: (productId, quantity, paymentMethod = 'cash') => {
    const product = get().products.find((p) => p.id === productId && !p.archived);
    if (!product) return { ok: false, message: 'Product not found.' };
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) return { ok: false, message: 'Enter a whole-number quantity greater than zero.' };
    if (product.quantity < quantity) return { ok: false, message: `Not enough stock. Only ${product.quantity} unit${product.quantity === 1 ? '' : 's'} available.` };
    const now = nowIso();
    const sale: Sale = {
      id: uid(), productId, productName: product.name, quantity, unitPrice: product.price,
      unitCost: product.costPrice ?? 0, total: product.price * quantity,
      profit: (product.price - (product.costPrice ?? 0)) * quantity,
      paymentMethod, createdAt: now, cashierId: get().uid ?? undefined, cashierName: get().userName || undefined,
    };
    const updatedProduct = { ...product, quantity: product.quantity - quantity, updatedAt: now };
    const products = get().products.map((p) => p.id === productId ? updatedProduct : p);
    const sales = [sale, ...get().sales];
    set({ products, sales });
    void db.saveProducts(products); void db.saveSales(sales); void persist(get, 'products', updatedProduct); void persist(get, 'sales', sale);
    recordMovement(set, get, productId, product.name, 'SALE', -quantity, 'Sale');
    return { ok: true, sale };
  },

  addStock: (productId, quantity, reason) => {
    const product = get().products.find((p) => p.id === productId && !p.archived);
    if (!product || quantity <= 0 || !Number.isInteger(quantity)) return;
    const updated = { ...product, quantity: product.quantity + quantity, updatedAt: nowIso() };
    const products = get().products.map((p) => p.id === productId ? updated : p);
    set({ products }); void db.saveProducts(products); void persist(get, 'products', updated);
    recordMovement(set, get, productId, product.name, 'STOCK_IN', quantity, reason);
  },

  adjustStock: (productId, delta, reason, type) => {
    const product = get().products.find((p) => p.id === productId && !p.archived);
    if (!product) return { ok: false, message: 'Product not found.' };
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) return { ok: false, message: 'Enter a whole-number non-zero quantity.' };
    const newQty = product.quantity + delta;
    if (newQty < 0) return { ok: false, message: 'Stock cannot go below zero.' };
    let movementType = type ?? 'ADJUSTMENT';
    const r = reason.toLowerCase();
    if (!type && r.includes('damage')) movementType = 'DAMAGE';
    else if (!type && (r.includes('missing') || r.includes('loss'))) movementType = 'LOSS';
    else if (!type && delta > 0 && (r.includes('delivery') || r.includes('new'))) movementType = 'STOCK_IN';
    const updated = { ...product, quantity: newQty, updatedAt: nowIso() };
    const products = get().products.map((p) => p.id === productId ? updated : p);
    set({ products }); void db.saveProducts(products); void persist(get, 'products', updated);
    recordMovement(set, get, productId, product.name, movementType, delta, reason);
    return { ok: true };
  },

  addSupplier: (input) => {
    const now = nowIso();
    const supplier: Supplier = { ...input, id: uid(), createdAt: now, updatedAt: now };
    const suppliers = [supplier, ...get().suppliers];
    set({ suppliers }); void db.saveSuppliers(suppliers); void persist(get, 'suppliers', supplier);
    return supplier;
  },

  deleteSupplier: (id) => {
    const suppliers = get().suppliers.filter((s) => s.id !== id);
    set({ suppliers }); void db.saveSuppliers(suppliers);
    void queuePersist(get, 'delete', 'suppliers', id);
  },

  updateBusinessSettings: async (patch) => {
    const current = get().settings;
    const settings: BusinessSettings = {
      shopName: patch.shopName ?? current?.shopName ?? 'My Shop',
      currency: 'NGN',
      defaultMinimumStock: patch.defaultMinimumStock ?? current?.defaultMinimumStock ?? 5,
      expiryWarningDays: patch.expiryWarningDays ?? current?.expiryWarningDays ?? 30,
      ownerUid: current?.ownerUid ?? get().uid ?? '',
      updatedAt: nowIso(),
    };
    set({ settings }); await db.saveSettings(settings);
    if (get().shopId && get().isOnline) await cloud.upsertSettings(get().shopId!, settings);
  },

  inviteStaff: async ({ name, email }) => {
    const shopId = get().shopId;
    if (get().role !== 'owner' || !shopId) return { ok: false, message: 'Only the shop owner can add staff.' };
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@') || normalized.length > 254) return { ok: false, message: 'Enter a valid staff email.' };
    if (normalized === (get().email ?? '').trim().toLowerCase()) return { ok: false, message: 'The shop owner cannot be added as staff.' };
    const existing = get().staff.find((member) => member.email.trim().toLowerCase() === normalized);
    if (existing) {
      return { ok: false, message: existing.status === 'active' ? 'A staff record already exists for this email.' : 'This email belongs to an inactive staff member. Enable that account instead.' };
    }
    const now = nowIso();
    const staff: StaffMember = { id: uid(), email: normalized, name: name.trim() || normalized, role: 'staff', status: 'active', createdAt: now, updatedAt: now };
    const staffList = [staff, ...get().staff];
    set({ staff: staffList }); await db.saveStaff(staffList);
    if (!get().isOnline) return { ok: true, message: 'Staff saved locally. Connect to the internet to send the invitation.' };
    await cloud.upsertRecord(shopId, 'staff', staff.id, staff);
    await cloud.upsertGlobalInvite(normalized, { shopId, name: staff.name, status: 'active' });
    return { ok: true, message: `Invitation prepared for ${normalized}. Ask them to create an account with this email.` };
  },

  setStaffStatus: async (id, status) => {
    const staff = get().staff.find((s) => s.id === id);
    if (!staff) return;
    const updated = { ...staff, status, updatedAt: nowIso() };
    const list = get().staff.map((s) => s.id === id ? updated : s);
    set({ staff: list }); await db.saveStaff(list);
    if (get().shopId && get().isOnline) await cloud.upsertRecord(get().shopId!, 'staff', id, updated);
    if (get().isOnline) await cloud.upsertGlobalInvite(staff.email, { shopId: get().shopId!, name: staff.name, status });
  },

  restoreBackup: async (backup) => {
    const state = get();
    if (state.role !== 'owner' || !state.shopId) return { ok: false, message: 'Only the shop owner can restore a backup.' };
    if (!state.isOnline) return { ok: false, message: 'Connect to the internet before restoring a backup.' };
    if (backup.shopId !== state.shopId) return { ok: false, message: 'This backup belongs to a different shop.' };

    try {
      await cloud.replaceShopData(state.shopId, {
        products: backup.products,
        sales: backup.sales,
        movements: backup.movements,
        suppliers: backup.suppliers,
        staff: backup.staff,
        settings: backup.settings,
      });
      await Promise.all([
        db.saveProducts(backup.products),
        db.saveSales(backup.sales),
        db.saveMovements(backup.movements),
        db.saveSuppliers(backup.suppliers),
        db.saveStaff(backup.staff),
        backup.settings ? db.saveSettings(backup.settings) : Promise.resolve(),
        db.clearPendingSyncItems(),
      ]);
      const synced = nowIso();
      await db.setLastSyncedAt(synced);
      set({
        products: backup.products,
        sales: backup.sales,
        movements: backup.movements,
        suppliers: backup.suppliers,
        staff: backup.staff,
        settings: backup.settings,
        pendingSyncCount: 0,
        lastSyncedAt: synced,
        syncStatus: 'synced',
        syncError: null,
      });
      return { ok: true, message: 'Backup restored successfully. Your shop now matches the backup.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not restore the backup.';
      set({ syncStatus: 'error', syncError: message });
      return { ok: false, message };
    }
  },

  loadSampleData: async () => {
    const products = buildSeedProducts().map((p) => ({ ...p, costPrice: p.price * 0.75, archived: false }));
    const movements = products.flatMap((product) => product.quantity > 0 ? [{
      id: `opening:${product.id}`, productId: product.id, productName: product.name, type: 'STOCK_IN' as const,
      quantity: product.quantity, reason: 'Opening stock balance', createdAt: product.createdAt,
      userId: get().uid ?? undefined, userName: get().userName || undefined,
    }] : []);
    set({ products, sales: [], movements });
    await Promise.all([db.saveProducts(products), db.saveSales([]), db.saveMovements(movements)]);
    for (const movement of movements) await db.queueSyncItem({ kind: 'upsert', collectionName: 'movements', recordId: movement.id });
    if (get().shopId && get().isOnline) void get().syncCloud();
  },


}));

function recordMovement(
  set: (partial: Partial<InventoryState>) => void,
  get: () => InventoryState,
  productId: string,
  productName: string,
  type: StockMovementType,
  quantity: number,
  reason?: string,
) {
  const movement: StockMovement = {
    id: uid(), productId, productName, type, quantity, reason, createdAt: nowIso(),
    userId: get().uid ?? undefined, userName: get().userName || undefined,
  };
  const movements = [movement, ...get().movements];
  set({ movements }); void db.saveMovements(movements); void persist(get, 'movements', movement);
}

async function queuePersist(
  state: InventoryState | (() => InventoryState),
  kind: 'upsert' | 'delete',
  collectionName: string,
  recordId: string,
) {
  const currentState = typeof state === 'function' ? state() : state;
  if (!currentState.shopId) return;
  const count = await db.queueSyncItem({ kind, collectionName, recordId });
  setPendingCount(count);
  if (currentState.isOnline) void useInventoryStore.getState().syncCloud();
}

function setPendingCount(count: number) {
  useInventoryStore.setState({ pendingSyncCount: count });
}

async function persist(state: InventoryState | (() => InventoryState), collectionName: string, value: unknown) {
  const currentState = typeof state === 'function' ? state() : state;
  const recordId = (value as { id?: string }).id;
  if (!currentState.shopId || !recordId) return;

  const count = await db.queueSyncItem({ kind: 'upsert', collectionName, recordId });
  setPendingCount(count);

  if (!currentState.isOnline) return;

  try {
    await cloud.upsertRecord(currentState.shopId, collectionName, recordId, value);
    const queued = await db.getPendingSyncItems();
    const completed = queued.find((item) => item.id === `upsert:${collectionName}:${recordId}`);
    const remaining = completed
      ? await db.removePendingSyncItems([{ id: completed.id, queuedAt: completed.queuedAt }])
      : queued.length;
    setPendingCount(remaining);
  } catch (err) {
    console.warn('Cloud write queued for next sync:', err);
  }
}
