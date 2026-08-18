import { get, set, del } from 'idb-keyval';
import type { BusinessSettings, Product, Sale, StaffMember, StockMovement, Supplier } from '../types';

const PREFIX = 'awastock';
const GLOBAL_KEYS = { shopId: `${PREFIX}:shopId`, authProfile: `${PREFIX}:authProfile` };

export interface CachedAuthProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: 'owner' | 'staff';
  shopId: string;
}

export interface PendingSyncItem {
  id: string;
  kind: 'upsert' | 'delete';
  collectionName: string;
  recordId: string;
  queuedAt: string;
}

const pendingKey = (shopId: string) => `${PREFIX}:${shopId}:pendingSync`;


let activeShopId: string | null = null;

async function getActiveShopId() {
  if (activeShopId) return activeShopId;
  activeShopId = (await get<string>(GLOBAL_KEYS.shopId)) ?? null;
  return activeShopId;
}

async function scopedKey(name: string) {
  const shopId = await getActiveShopId();
  if (!shopId) throw new Error('No shop is selected. Please sign in again.');
  return `${PREFIX}:${shopId}:${name}`;
}

export const loadProducts = async () => get<Product[]>(await scopedKey('products'));
export const saveProducts = async (value: Product[]) => set(await scopedKey('products'), value);
export const loadSales = async () => get<Sale[]>(await scopedKey('sales'));
export const saveSales = async (value: Sale[]) => set(await scopedKey('sales'), value);
export const loadMovements = async () => get<StockMovement[]>(await scopedKey('movements'));
export const saveMovements = async (value: StockMovement[]) => set(await scopedKey('movements'), value);
export const loadSuppliers = async () => get<Supplier[]>(await scopedKey('suppliers'));
export const saveSuppliers = async (value: Supplier[]) => set(await scopedKey('suppliers'), value);
export const loadStaff = async () => get<StaffMember[]>(await scopedKey('staff'));
export const saveStaff = async (value: StaffMember[]) => set(await scopedKey('staff'), value);
export const loadSettings = async () => get<BusinessSettings>(await scopedKey('settings'));
export const saveSettings = async (value: BusinessSettings) => set(await scopedKey('settings'), value);

export const getShopId = async () => getActiveShopId();
export const getCachedAuthProfile = async () => get<CachedAuthProfile>(GLOBAL_KEYS.authProfile);
export const setCachedAuthProfile = async (profile: CachedAuthProfile | null) => {
  if (profile) await set(GLOBAL_KEYS.authProfile, profile);
  else await del(GLOBAL_KEYS.authProfile);
};
export const setShopId = async (value: string | null) => {
  activeShopId = value;
  if (value) await set(GLOBAL_KEYS.shopId, value);
  else await del(GLOBAL_KEYS.shopId);
};

export const getLastSyncedAt = async () => get<string>(await scopedKey('lastSyncedAt'));
export const setLastSyncedAt = async (value: string) => set(await scopedKey('lastSyncedAt'), value);
export const isSeeded = async () => (await get(await scopedKey('seeded'))) === true;
export const markSeeded = async () => set(await scopedKey('seeded'), true);

export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  const shopId = await getActiveShopId();
  if (!shopId) return [];
  return (await get<PendingSyncItem[]>(pendingKey(shopId))) ?? [];
}

export async function queueSyncItem(item: Omit<PendingSyncItem, 'id' | 'queuedAt'>): Promise<number> {
  const shopId = await getActiveShopId();
  if (!shopId) return 0;
  const current = await getPendingSyncItems();
  const id = `${item.kind}:${item.collectionName}:${item.recordId}`;
  const next = [
    ...current.filter((entry) => entry.id !== id),
    { ...item, id, queuedAt: new Date().toISOString() },
  ];
  await set(pendingKey(shopId), next);
  return next.length;
}

export async function clearPendingSyncItems(): Promise<void> {
  const shopId = await getActiveShopId();
  if (!shopId) return;
  await del(pendingKey(shopId));
}

export async function removePendingSyncItems(items: Array<Pick<PendingSyncItem, 'id' | 'queuedAt'>>): Promise<number> {
  const shopId = await getActiveShopId();
  if (!shopId || items.length === 0) return (await getPendingSyncItems()).length;
  const current = await getPendingSyncItems();
  const completed = new Set(items.map((item) => `${item.id}\u0000${item.queuedAt}`));
  const remaining = current.filter((entry) => !completed.has(`${entry.id}\u0000${entry.queuedAt}`));
  if (remaining.length === 0) await del(pendingKey(shopId));
  else await set(pendingKey(shopId), remaining);
  return remaining.length;
}


export async function clearLocalData() {
  const shopId = await getActiveShopId();
  if (!shopId) return;
  await Promise.all([
    'products', 'sales', 'movements', 'suppliers', 'staff', 'settings', 'seeded', 'lastSyncedAt',
  ].map(async (name) => del(`${PREFIX}:${shopId}:${name}`)));
  await del(pendingKey(shopId));
}
