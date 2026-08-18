import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { useInventoryStore } from '../store/useInventoryStore';

export default function ReceiveStock() {
  const products = useInventoryStore((s) => s.products).filter((p) => !p.archived);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const addStock = useInventoryStore((s) => s.addStock);
  const [productId, setProductId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!productId || !Number.isInteger(qty) || qty <= 0) { setMessage('Select a product and enter a whole-number quantity.'); return; }
    const supplier = suppliers.find((s) => s.id === supplierId);
    addStock(productId, qty, `Received${supplier ? ` from ${supplier.name}` : ''}${reference.trim() ? ` · Ref ${reference.trim()}` : ''}`);
    setMessage('Stock received and recorded.'); setQuantity(''); setReference('');
  }

  if (!products.length) return <EmptyState icon={<PackagePlus size={28}/>} title="Add a product first" description="Receive Stock works with products already registered in your catalog." />;

  return <div className="max-w-lg"><Header title="Receive Stock" subtitle="Record a delivery into an existing product"/><div className="ui-card p-5"><form onSubmit={submit} className="space-y-4">
    <label><span className="label">Product</span><select required value={productId} onChange={(e) => setProductId(e.target.value)} className="field"><option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.quantity} in stock</option>)}</select></label>
    <label><span className="label">Supplier</span><select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="field"><option value="">Not specified</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label><span className="label">Quantity received</span><input required type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="field" placeholder="20"/></label>
    <label><span className="label">Invoice / reference (optional)</span><input value={reference} onChange={(e) => setReference(e.target.value)} className="field" placeholder="INV-0012"/></label>
    {message && <p className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-blue-soft)', color: 'var(--color-blue)' }}>{message}</p>}
    <button className="btn-primary w-full py-3"><PackagePlus size={17}/> Receive stock</button>
  </form></div></div>;
}
