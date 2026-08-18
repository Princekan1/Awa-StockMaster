import type { Product } from '../types';
import { uid, nowIso } from '../lib/logic';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildSeedProducts(): Product[] {
  const now = nowIso();
  const raw: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [
    { name: 'Indomie Noodles (70g)', category: 'Groceries', barcode: '8991001234567', costPrice: 850, price: 1200, quantity: 5, minimumStock: 10, expiryDate: daysFromNow(200) },
    { name: 'Coca Cola (50cl)', category: 'Drinks', barcode: '8992345678901', costPrice: 250, price: 400, quantity: 3, minimumStock: 10, expiryDate: daysFromNow(180) },
    { name: 'Golden Penny Semovita (1kg)', category: 'Groceries', barcode: '8998765432109', costPrice: 1300, price: 1800, quantity: 4, minimumStock: 10, expiryDate: daysFromNow(250) },
    { name: 'Sunlight Soap (200g)', category: 'Toiletries', barcode: '8991122334455', costPrice: 480, price: 700, quantity: 6, minimumStock: 10, expiryDate: null },
    { name: 'Peak Milk (325g)', category: 'Groceries', barcode: '6001234567891', costPrice: 2200, price: 3000, quantity: 7, minimumStock: 10, expiryDate: daysFromNow(90) },
    { name: 'Yoghurt (200ml)', category: 'Dairy', barcode: '6001234567801', costPrice: 320, price: 500, quantity: 15, minimumStock: 8, expiryDate: daysFromNow(67) },
    { name: 'Corned Beef (340g)', category: 'Food', barcode: '6001234567802', costPrice: 1800, price: 2500, quantity: 12, minimumStock: 5, expiryDate: daysFromNow(83) },
    { name: 'Evaporated Milk (170g)', category: 'Dairy', barcode: '6001234567803', costPrice: 550, price: 800, quantity: 20, minimumStock: 8, expiryDate: daysFromNow(96) },
    { name: 'Milo (400g)', category: 'Drinks', barcode: '6001234567890', costPrice: 3300, price: 4500, quantity: 18, minimumStock: 5, expiryDate: daysFromNow(119) },
    { name: 'Butter Cookies (400g)', category: 'Snacks', barcode: '6001234567804', costPrice: 1000, price: 1500, quantity: 10, minimumStock: 5, expiryDate: daysFromNow(131) },
    { name: 'Pepsi (50cl)', category: 'Drinks', barcode: '6001234567896', costPrice: 250, price: 400, quantity: 0, minimumStock: 15, expiryDate: daysFromNow(180) },
    { name: 'Rice (5kg)', category: 'Groceries', barcode: '6001234567898', costPrice: 9500, price: 12000, quantity: 0, minimumStock: 5, expiryDate: daysFromNow(365) },
    { name: 'Vegetable Oil (1L)', category: 'Food', barcode: '6001234567899', costPrice: 2600, price: 3500, quantity: 22, minimumStock: 6, expiryDate: daysFromNow(220) },
    { name: 'Detergent Omo (1kg)', category: 'Household', barcode: '6001234567901', costPrice: 1500, price: 2200, quantity: 15, minimumStock: 4, expiryDate: null },
  ];

  return raw.map((p) => ({
    ...p,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    archived: false,
  }));
}
