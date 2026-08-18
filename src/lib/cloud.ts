import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BusinessSettings, Product, Sale, StaffMember, StockMovement, Supplier } from '../types';

export interface CloudSnapshot {
  products: Product[];
  sales: Sale[];
  movements: StockMovement[];
  suppliers: Supplier[];
  staff: StaffMember[];
  settings: BusinessSettings | null;
}

const shopRef = (shopId: string) => doc(db, 'shops', shopId);
const sub = (shopId: string, name: string) => collection(shopRef(shopId), name);

async function readCollection<T>(shopId: string, name: string): Promise<T[]> {
  const snap = await getDocs(sub(shopId, name));
  return snap.docs.map((d) => d.data() as T);
}

export async function readShopData(shopId: string): Promise<CloudSnapshot> {
  const [products, sales, movements, suppliers, staff, settingsSnap] = await Promise.all([
    readCollection<Product>(shopId, 'products'),
    readCollection<Sale>(shopId, 'sales'),
    readCollection<StockMovement>(shopId, 'movements'),
    readCollection<Supplier>(shopId, 'suppliers'),
    readCollection<StaffMember>(shopId, 'staff'),
    getDoc(doc(db, 'shops', shopId, 'settings', 'main')),
  ]);
  return {
    products,
    sales,
    movements,
    suppliers,
    staff,
    settings: settingsSnap.exists() ? (settingsSnap.data() as BusinessSettings) : null,
  };
}

export async function writeShopRecords(
  shopId: string,
  data: CloudSnapshot,
  includeManagement = true,
  includeProducts = true,
): Promise<void> {
  const groups: Array<[string, unknown[]]> = [
    ...(includeProducts ? [['products', data.products] as [string, unknown[]]] : []),
    ['sales', data.sales],
    ['movements', data.movements],
  ];
  if (includeManagement) {
    groups.push(['suppliers', data.suppliers], ['staff', data.staff]);
  }

  for (const [name, records] of groups) {
    for (let i = 0; i < records.length; i += 450) {
      const batch = writeBatch(db);
      for (const record of records.slice(i, i + 450) as Array<{ id: string }>) {
        batch.set(doc(sub(shopId, name), record.id), record, { merge: true });
      }
      await batch.commit();
    }
  }

  if (includeManagement && data.settings) {
    await setDoc(doc(db, 'shops', shopId, 'settings', 'main'), data.settings, { merge: true });
  }
}

export async function replaceShopData(shopId: string, data: CloudSnapshot): Promise<void> {
  const current = await readShopData(shopId);
  const groups: Array<[string, Array<{ id: string }>, Array<{ id: string }>]> = [
    ['products', current.products, data.products],
    ['sales', current.sales, data.sales],
    ['movements', current.movements, data.movements],
    ['suppliers', current.suppliers, data.suppliers],
    ['staff', current.staff, data.staff],
  ];

  for (const [name, remoteRecords, backupRecords] of groups) {
    const backupIds = new Set(backupRecords.map((record) => record.id));
    const remoteOnly = remoteRecords.filter((record) => !backupIds.has(record.id));
    const operations = [
      ...remoteOnly.map((record) => ({ kind: 'delete' as const, id: record.id })),
      ...backupRecords.map((record) => ({ kind: 'set' as const, record })),
    ];

    for (let i = 0; i < operations.length; i += 450) {
      const batch = writeBatch(db);
      for (const operation of operations.slice(i, i + 450)) {
        const ref = doc(sub(shopId, name), operation.kind === 'delete' ? operation.id : operation.record.id);
        if (operation.kind === 'delete') batch.delete(ref);
        else batch.set(ref, operation.record, { merge: true });
      }
      await batch.commit();
    }
  }

  const backupStaffEmails = new Set(data.staff.map((member) => member.email.trim().toLowerCase()));
  for (const member of current.staff) {
    const email = member.email.trim().toLowerCase();
    if (!backupStaffEmails.has(email)) {
      await deleteDoc(doc(db, 'staffInvites', email));
    }
  }
  for (const member of data.staff) {
    await upsertGlobalInvite(member.email, { shopId, name: member.name, status: member.status });
  }

  if (data.settings) {
    await setDoc(doc(db, 'shops', shopId, 'settings', 'main'), data.settings, { merge: true });
  } else {
    await deleteDoc(doc(db, 'shops', shopId, 'settings', 'main'));
  }
}

export async function upsertRecord(shopId: string, collectionName: string, id: string, value: unknown) {
  await setDoc(doc(sub(shopId, collectionName), id), value as Record<string, unknown>, { merge: true });
}

export async function deleteRecord(shopId: string, collectionName: string, id: string) {
  await deleteDoc(doc(sub(shopId, collectionName), id));
}

export async function upsertSettings(shopId: string, value: BusinessSettings) {
  await setDoc(doc(db, 'shops', shopId, 'settings', 'main'), value, { merge: true });
}

export function subscribeShopData(
  shopId: string,
  onChange: (collectionName: string, records: unknown[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const names = ['products', 'sales', 'movements', 'suppliers', 'staff'];
  const unsubs = names.map((name) =>
    onSnapshot(
      sub(shopId, name),
      (snap) => onChange(name, snap.docs.map((d) => d.data())),
      (error) => onError(error),
    ),
  );
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

export async function upsertGlobalInvite(email: string, value: { shopId: string; name: string; status: string }) {
  const rawEmail = email.trim();
  const normalizedEmail = rawEmail.toLowerCase();
  const payload = { ...value, email: normalizedEmail, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'staffInvites', normalizedEmail), payload, { merge: true });
  // Firebase Auth may expose the email claim with its original casing. Keep
  // an exact-case alias so security-rule lookups cannot strand an invitation.
  if (rawEmail !== normalizedEmail) {
    await setDoc(doc(db, 'staffInvites', rawEmail), { ...payload, email: rawEmail }, { merge: true });
  }
}
