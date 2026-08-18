import { useState } from 'react';
import type { Product } from '../types';
import { normalizeBarcode, uid } from '../lib/logic';

interface Props {
  initial?: Partial<Product>;
  onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  submitLabel?: string;
  existingProducts?: Product[];
  currentProductId?: string;
}

const CATEGORIES = ['Groceries', 'Drinks', 'Food', 'Dairy', 'Noodles', 'Household', 'Toiletries', 'Personal Care', 'Snacks', 'Other'];

export default function ProductForm({ initial, onSubmit, submitLabel = 'Save Product', existingProducts = [], currentProductId }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [barcode, setBarcode] = useState(initial?.barcode ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [costPrice, setCostPrice] = useState(initial?.costPrice != null ? String(initial.costPrice) : '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '');
  const [minimumStock, setMinimumStock] = useState(initial?.minimumStock != null ? String(initial.minimumStock) : '5');
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter a product name.';
    const normalizedBarcode = normalizeBarcode(barcode);
    if (normalizedBarcode && existingProducts.some((p) => p.id !== currentProductId && normalizeBarcode(p.barcode) === normalizedBarcode)) {
      e.barcode = 'This barcode is already assigned to another product.';
    }
    if (!costPrice || Number(costPrice) < 0 || !Number.isFinite(Number(costPrice))) e.costPrice = 'Enter a valid cost price.';
    if (!price || Number(price) <= 0 || !Number.isFinite(Number(price))) e.price = 'Enter a valid selling price.';
    if (Number(costPrice) > Number(price)) e.costPrice = 'Cost price cannot exceed selling price.';
    if (quantity === '' || Number(quantity) < 0 || !Number.isInteger(Number(quantity))) e.quantity = 'Enter a whole-number quantity.';
    if (minimumStock === '' || Number(minimumStock) < 0 || !Number.isInteger(Number(minimumStock))) e.minimumStock = 'Enter a whole-number minimum stock level.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      onSubmit({
        name: name.trim(), category, barcode: barcode.trim() || `LOCAL-${uid()}`,
        sku: sku.trim() || undefined, costPrice: Number(costPrice), price: Number(price),
        quantity: Number(quantity), minimumStock: Number(minimumStock), expiryDate: expiryDate || null,
        archived: false,
      });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Could not save the product.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Product Name" error={errors.name}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Indomie Noodles (70g)" className={inputClass(!!errors.name)} autoComplete="off" /></Field>
      <Field label="Category"><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass(false)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Barcode" error={errors.barcode}><input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type" className={inputClass(!!errors.barcode)} inputMode="numeric" /></Field>
        <Field label="SKU (optional)"><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. IND-70G" className={inputClass(false)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost Price (₦)" error={errors.costPrice}><input type="number" min="0" step="1" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="800" className={inputClass(!!errors.costPrice)} /></Field>
        <Field label="Selling Price (₦)" error={errors.price}><input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1200" className={inputClass(!!errors.price)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Quantity" error={errors.quantity}><input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="20" className={inputClass(!!errors.quantity)} /></Field>
        <Field label="Minimum Stock" error={errors.minimumStock}><input type="number" min="0" step="1" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} className={inputClass(!!errors.minimumStock)} /></Field>
      </div>
      <Field label="Expiry Date (optional)"><input type="date" value={expiryDate ?? ''} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass(false)} /></Field>
      {errors.form && <p className="text-xs font-medium text-[var(--color-red)]">{errors.form}</p>}
      <button type="submit" className="btn-primary w-full py-3 mt-1">{submitLabel}</button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</span>{children}{error && <span className="text-xs font-medium text-[var(--color-red)]">{error}</span>}</label>;
}
function inputClass(hasError: boolean) { return `rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]/25 focus:border-[var(--color-brand)] ${hasError ? 'border-[var(--color-red)]' : 'border-[var(--color-line)]'}`; }
