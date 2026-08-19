import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Package,
  X,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import type { Product } from '../types';

type StockFilter = 'all' | 'in' | 'low' | 'out';

export default function Inventory() {
  const role = useInventoryStore((s) => s.role);
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);

  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const isOwner = role === 'owner';

  const counts = useMemo(() => {
    let all = 0;
    let inStock = 0;
    let low = 0;
    let out = 0;
    for (const p of products) {
      if (p.archived) continue;
      all++;
      const s = getStockStatus(p);
      if (s === 'OUT_OF_STOCK') out++;
      else if (s === 'LOW_STOCK') low++;
      else inStock++;
    }
    return { all, inStock, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !p.archived)
      .filter((p) => {
        if (stockFilter === 'in') return getStockStatus(p) === 'IN_STOCK';
        if (stockFilter === 'low') return getStockStatus(p) === 'LOW_STOCK';
        if (stockFilter === 'out') return getStockStatus(p) === 'OUT_OF_STOCK';
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, stockFilter]);

  return (
    <div>
      <Header
        title="Products"
        subtitle={`${counts.all} product${counts.all === 1 ? '' : 's'} in inventory`}
      />

      {/* Search + Add */}
      <section className="page-section">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              strokeWidth={2.25}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, barcode, SKU…"
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-8 text-sm outline-none shadow-sm focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              style={{ borderColor: 'var(--color-line)' }}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[var(--color-ink-muted)]"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {isOwner && (
            <Link
              to="/products/new"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-sm"
              aria-label="Add product"
            >
              <Plus size={18} strokeWidth={2.5} />
            </Link>
          )}
        </div>

        {/* Filter chips — always visible, horizontal */}
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Chip
            label="All"
            count={counts.all}
            active={stockFilter === 'all'}
            onClick={() => setStockFilter('all')}
          />
          <Chip
            label="In stock"
            count={counts.inStock}
            active={stockFilter === 'in'}
            onClick={() => setStockFilter('in')}
          />
          <Chip
            label="Low"
            count={counts.low}
            active={stockFilter === 'low'}
            tone="warn"
            onClick={() => setStockFilter('low')}
          />
          <Chip
            label="Out"
            count={counts.out}
            active={stockFilter === 'out'}
            tone="danger"
            onClick={() => setStockFilter('out')}
          />
        </div>
      </section>

      {/* Product list */}
      <section className="page-section">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white py-10 px-4 text-center shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            <Package size={28} strokeWidth={1.5} className="mx-auto mb-2 text-[var(--color-ink-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {query || stockFilter !== 'all' ? 'No matching products' : 'No products yet'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {query || stockFilter !== 'all'
                ? 'Try a different search or filter'
                : isOwner
                  ? 'Tap + to add your first product'
                  : 'Ask the owner to add products'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            {filtered.map((p) => (
              <ProductRow key={p.id} product={p} expiryWarningDays={expiryWarningDays} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: 'warn' | 'danger';
  onClick: () => void;
}) {
  let activeCls =
    'border-[var(--color-brand)] bg-[var(--color-brand-muted)] text-[var(--color-brand)]';
  let countCls = 'bg-[var(--color-brand)] text-white';

  if (active && tone === 'warn') {
    activeCls = 'border-amber-400 bg-amber-50 text-amber-800';
    countCls = 'bg-amber-600 text-white';
  }
  if (active && tone === 'danger') {
    activeCls = 'border-red-300 bg-red-50 text-red-700';
    countCls = 'bg-red-600 text-white';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? activeCls
          : 'border-[var(--color-line)] bg-white text-[var(--color-ink-soft)]'
      }`}
    >
      {label}
      <span
        className={`inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-bold ${
          active ? countCls : 'bg-slate-100 text-[var(--color-ink-muted)]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ProductRow({
  product,
  expiryWarningDays,
}: {
  product: Product;
  expiryWarningDays: number;
}) {
  const stock = getStockStatus(product);
  const expiry = getExpiryStatus(product.expiryDate, expiryWarningDays);

  return (
    <Link
      to={`/products/${product.id}`}
      className="flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0 active:bg-slate-50"
      style={{ borderColor: 'var(--color-line)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
          {product.name}
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          {product.category} · Qty {product.quantity} · {formatNaira(product.price)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={stock} />
        {expiry === 'EXPIRING_SOON' && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-700">
            Expiring
          </span>
        )}
        {expiry === 'EXPIRED' && (
          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-red-600">
            Expired
          </span>
        )}
      </div>
    </Link>
  );
}
