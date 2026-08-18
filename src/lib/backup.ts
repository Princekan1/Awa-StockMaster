import type { BusinessSettings, Product, Sale, StaffMember, StockMovement, Supplier } from '../types';

export interface AwaStockBackup {
  schemaVersion: 2;
  app: 'Awa Stock';
  exportedAt: string;
  shopId: string;
  shopName: string;
  lastSyncedAt: string | null;
  syncStatus: string;
  backupSource: 'synced-cloud' | 'local-offline';
  recordCounts: { products: number; sales: number; movements: number; suppliers: number; staff: number };
  products: Product[];
  sales: Sale[];
  movements: StockMovement[];
  suppliers: Supplier[];
  staff: StaffMember[];
  settings: BusinessSettings | null;
}

export function downloadBackup(data: AwaStockBackup) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeShopName = data.shopName.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'shop';
  const date = new Date(data.exportedAt).toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `awa-stock-${safeShopName}-backup-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function parseBackupFile(file: File, expectedShopId: string): Promise<AwaStockBackup> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Backup file is too large. Maximum size is 10 MB.');
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('That file is not a valid JSON backup.');
  }
  if (!isObject(raw) || raw.app !== 'Awa Stock' || (raw.schemaVersion !== 1 && raw.schemaVersion !== 2)) {
    throw new Error('This is not a supported Awa Stock backup file.');
  }
  if (raw.shopId !== expectedShopId) {
    throw new Error('This backup belongs to a different shop and cannot be restored here.');
  }
  const arrays = ['products', 'sales', 'movements', 'suppliers', 'staff'] as const;
  for (const key of arrays) {
    if (!Array.isArray(raw[key])) throw new Error(`Backup is missing a valid ${key} list.`);
  }
  if (raw.settings !== null && !isObject(raw.settings)) throw new Error('Backup contains invalid business settings.');

  const source = raw.schemaVersion === 2 && (raw.backupSource === 'synced-cloud' || raw.backupSource === 'local-offline')
    ? raw.backupSource
    : 'local-offline';
  const backup = {
    ...raw,
    schemaVersion: 2 as const,
    backupSource: source,
    recordCounts: isObject(raw.recordCounts) ? raw.recordCounts : {
      products: (raw.products as unknown[]).length,
      sales: (raw.sales as unknown[]).length,
      movements: (raw.movements as unknown[]).length,
      suppliers: (raw.suppliers as unknown[]).length,
      staff: (raw.staff as unknown[]).length,
    },
  } as unknown as AwaStockBackup;
  const expectedCounts = backup.recordCounts;
  if (!isObject(expectedCounts)) throw new Error('Backup is missing record counts.');
  for (const key of arrays) {
    if (expectedCounts[key] !== backup[key].length) throw new Error(`Backup count mismatch for ${key}. The file may be incomplete or damaged.`);
  }
  return backup;
}
