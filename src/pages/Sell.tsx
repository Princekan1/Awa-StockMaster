import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Camera, ArrowLeft, CheckCircle2, Search, Printer, Share2 } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, formatNaira } from '../lib/logic';
import type { Product } from '../types';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import BarcodeScanner from '../components/BarcodeScanner';
import EmptyState from '../components/EmptyState';

export default function Sell() {
  const products = useInventoryStore((s) => s.products);
  const sellProduct = useInventoryStore((s) => s.sellProduct);
  const findByBarcode = useInventoryStore((s) => s.findByBarcode);
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos' | 'other'>('cash');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReturnType<typeof sellProduct>['sale']>(undefined);

  useEffect(() => {
    const productId = params.get('product');
    if (productId) {
      const p = products.find((x) => x.id === productId && !x.archived);
      if (p) setSelected(p);
    }
  }, [params, products]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => !p.archived && (p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))).slice(0, 8);
  }, [products, query]);

  const handleDetected = useCallback((barcode: string) => {
    setScannerOpen(false);
    const p = findByBarcode(barcode);
    if (p) { setSelected(p); setNotFoundBarcode(null); } else setNotFoundBarcode(barcode);
  }, [findByBarcode]);

  function confirmSale() {
    if (!selected) return;
    const qty = Number(quantity);
    const result = sellProduct(selected.id, qty, paymentMethod);
    if (!result.ok) { setError(result.message ?? 'Could not complete sale.'); setSuccess(null); return; }
    setError(null);
    setSuccess(`Sold ${qty} × ${selected.name} for ${formatNaira(selected.price * qty)}`);
    setReceipt(result.sale);
    setSelected(null); setQuantity('1'); setQuery('');
  }

  async function shareReceipt() {
    if (!receipt) return;
    const text = `${receipt.productName} × ${receipt.quantity}\nTotal: ${formatNaira(receipt.total)}\nPayment: ${receipt.paymentMethod}\nReceipt: ${receipt.id.slice(0, 8)}`;
    if (navigator.share) await navigator.share({ title: 'Awa Stock receipt', text });
    else await navigator.clipboard?.writeText(text);
  }

  return (
    <div className="max-w-lg">
      <Header title="Sell" subtitle="Find a product and record a sale" />

      {success && <div className="flex items-start gap-2.5 rounded-xl p-3.5 mb-4 text-sm font-medium" style={{ background: 'var(--color-green-soft)', color: 'var(--color-green)' }}><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><span>{success}</span></div>}

      {receipt && <div className="ui-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3"><div><p className="font-semibold">Sale completed</p><p className="text-xs text-[var(--color-ink-muted)]">Receipt #{receipt.id.slice(0, 8)}</p></div><CheckCircle2 className="text-[var(--color-green)]" size={20} /></div>
        <div className="text-sm space-y-1 mb-4"><div className="flex justify-between"><span>{receipt.productName} × {receipt.quantity}</span><b>{formatNaira(receipt.total)}</b></div><div className="flex justify-between text-xs text-[var(--color-ink-muted)]"><span>Payment</span><span className="capitalize">{receipt.paymentMethod}</span></div><div className="flex justify-between text-xs text-[var(--color-ink-muted)]"><span>Profit</span><span>{formatNaira(receipt.profit)}</span></div></div>
        <div className="flex gap-2"><button type="button" className="btn-secondary flex-1 text-xs" onClick={() => window.print()}><Printer size={15}/> Print</button><button type="button" className="btn-secondary flex-1 text-xs" onClick={() => void shareReceipt()}><Share2 size={15}/> Share</button><button type="button" className="btn-primary flex-1 text-xs" onClick={() => setReceipt(undefined)}>Done</button></div>
      </div>}

      {notFoundBarcode && <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'var(--color-amber-soft)', color: '#b45309' }}><p className="font-semibold mb-1">Product not found</p><p className="opacity-80 mb-3 text-[13px]">No product matches barcode <code className="font-mono">{notFoundBarcode}</code>.</p><Link to="/products/new" className="btn-primary text-xs py-2 px-3">Register New Product</Link></div>}

      {!selected ? <>
        <div className="flex gap-2.5 mb-4"><SearchBar value={query} onChange={setQuery} placeholder="Search product name or barcode…" autoFocus /><button type="button" onClick={() => setScannerOpen(true)} className="btn-primary shrink-0 px-3.5" title="Scan barcode"><Camera size={18} strokeWidth={2.25} /><span className="hidden sm:inline">Scan</span></button></div>
        {query && results.length === 0 && <EmptyState icon={<Search size={24} strokeWidth={1.75} />} title="No matching products" description="Try a different name or scan the barcode." />}
        <ul className="flex flex-col gap-2">{results.map((p) => { const status = getStockStatus(p); return <li key={p.id}><button type="button" onClick={() => setSelected(p)} disabled={status === 'OUT_OF_STOCK'} className="ui-card ui-card-interactive w-full flex items-center justify-between gap-3 p-4 text-left disabled:opacity-50 disabled:pointer-events-none"><div className="min-w-0"><p className="font-semibold text-[15px] truncate text-[var(--color-ink)]">{p.name}</p><p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{formatNaira(p.price)} · {p.quantity} available</p></div><StatusBadge status={status} /></button></li>; })}</ul>
      </> : <div className="ui-card p-5 sm:p-6">
        <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] mb-5"><ArrowLeft size={14}/>Choose a different product</button>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">Product</p><p className="font-display text-xl font-bold text-[var(--color-ink)] mb-5">{selected.name}</p>
        <div className="grid grid-cols-3 gap-3 mb-5"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Price</p><p className="font-semibold text-[15px]">{formatNaira(selected.price)}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Available</p><p className="font-semibold text-[15px]">{selected.quantity}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Margin</p><p className="font-semibold text-[15px]">{formatNaira(selected.price - selected.costPrice)}</p></div></div>
        <label className="flex flex-col gap-1.5 mb-4"><span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Quantity</span><input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-xl border bg-white px-4 py-3 text-lg font-semibold outline-none" style={{ borderColor: 'var(--color-line)' }} /></label>
        <label className="flex flex-col gap-1.5 mb-5"><span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Payment Method</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className="rounded-xl border bg-white px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--color-line)' }}><option value="cash">Cash</option><option value="transfer">Bank Transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>
        <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ background: 'var(--color-blue-soft)' }}><span className="text-sm font-semibold" style={{ color: 'var(--color-blue)' }}>Total</span><span className="font-display text-xl font-bold" style={{ color: 'var(--color-blue)' }}>{formatNaira(selected.price * (Number(quantity) || 0))}</span></div>
        {error && <p className="text-sm font-medium rounded-xl p-3.5 mb-4" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>{error}</p>}
        <button type="button" onClick={confirmSale} className="btn-primary w-full py-3.5 text-[15px]">Confirm Sale</button>
      </div>}
      <BarcodeScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetected} />
    </div>
  );
}
