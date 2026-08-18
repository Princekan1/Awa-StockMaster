export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  sku?: string;
  costPrice: number;
  price: number;
  quantity: number;
  minimumStock: number;
  expiryDate: string | null;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'SALE' | 'STOCK_IN' | 'ADJUSTMENT' | 'DAMAGE' | 'LOSS';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'other';

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  cashierId?: string;
  cashierName?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  leadTimeDays: number;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessSettings {
  shopName: string;
  currency: 'NGN';
  defaultMinimumStock: number;
  expiryWarningDays: number;
  ownerUid: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: 'staff';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ExpiryStatus = 'EXPIRED' | 'EXPIRING_SOON' | 'SAFE' | 'NONE';
export type Role = 'owner' | 'staff';
