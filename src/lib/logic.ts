import type { Product, StockStatus, ExpiryStatus } from '../types';

export function normalizeBarcode(barcode: string): string {
  return barcode.trim().toLowerCase();
}

export function getStockStatus(product: Pick<Product, 'quantity' | 'minimumStock'>): StockStatus {
  if (product.quantity <= 0) return 'OUT_OF_STOCK';
  if (product.quantity <= product.minimumStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function getExpiryStatus(expiryDate: string | null, warningDays = 30): ExpiryStatus {
  if (!expiryDate) return 'NONE';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= warningDays) return 'EXPIRING_SOON';
  return 'SAFE';
}

export function daysUntil(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  return Math.floor((expiry.getTime() - today.getTime()) / 86400000);
}

export function formatExpiryLabel(expiryDate: string | null): string {
  if (!expiryDate) return 'No expiry';
  const days = daysUntil(expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days < 30) return `Expires in ${days}d`;
  const months = Math.round(days / 30);
  return `Expires in ${months} month${months > 1 ? 's' : ''}`;
}

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowIso(): string { return new Date().toISOString(); }
