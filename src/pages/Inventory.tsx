import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus } from '../lib/logic';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import ProductTable from '../components/ProductTable';
import EmptyState from '../components/EmptyState';

type StockFilter = 'all' | 'in' | 'low' | 'out';
type ExpiryFilter = 'all' | 'expired' | 'expiring' | 'safe';

export default function Inventory() {
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    params.get('filter') === 'low' ? 'low' : params.get('filter') === 'out' ? 'out' : 'all',
  );
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>(
    params.get('filter') === 'expiring' ? 'expiring' : 'all',
  );
  const [sort, setSort] = useState<'name' | 'stock-asc' | 'stock-desc'>('name');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.filter((p) => !p.archived).map((p) => p.category)))],
    [products],
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => !p.archived && (() => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || p.category === category;

      const status = getStockStatus(p);
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in' && status === 'IN_STOCK') ||
        (stockFilter === 'low' && status === 'LOW_STOCK') ||
        (stockFilter === 'out' && status === 'OUT_OF_STOCK');

      const expiry = getExpiryStatus(p.expiryDate, expiryWarningDays);
      const matchesExpiry =
        expiryFilter === 'all' ||
        (expiryFilter === 'expired' && expiry === 'EXPIRED') ||
        (expiryFilter === 'expiring' && expiry === 'EXPIRING_SOON') ||
        (expiryFilter === 'safe' && expiry === 'SAFE');

      return matchesQuery && matchesCategory && matchesStock && matchesExpiry;
    })());

    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'stock-asc') list = [...list].sort((a, b) => a.quantity - b.quantity);
    if (sort === 'stock-desc') list = [...list].sort((a, b) => b.quantity - a.quantity);

    return list;
  }, [products, query, category, stockFilter, expiryFilter, sort]);

  return (
    <div>
      <Header title="Inventory" subtitle={`${products.filter((p) => !p.archived).length} active products registered`} />

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={query} onChange={setQuery} />
          <Link to="/products/new" className="btn-primary shrink-0 whitespace-nowrap">
            <Plus size={16} strokeWidth={2.5} />
            Add Product
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={category} onChange={setCategory} options={categories} />
          <Select
            value={stockFilter}
            onChange={(v) => setStockFilter(v as StockFilter)}
            options={['all', 'in', 'low', 'out']}
            labels={{
              all: 'All stock',
              in: 'In stock',
              low: 'Low stock',
              out: 'Out of stock',
            }}
          />
          <Select
            value={expiryFilter}
            onChange={(v) => setExpiryFilter(v as ExpiryFilter)}
            options={['all', 'expired', 'expiring', 'safe']}
            labels={{
              all: 'All expiry',
              expired: 'Expired',
              expiring: 'Expiring soon',
              safe: 'Safe',
            }}
          />
          <Select
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={['name', 'stock-asc', 'stock-desc']}
            labels={{
              name: 'Sort: Name',
              'stock-asc': 'Sort: Stock low → high',
              'stock-desc': 'Sort: Stock high → low',
            }}
          />
        </div>
      </div>

      {products.filter((p) => !p.archived).length === 0 ? (
        <EmptyState
          icon={<Plus size={24} strokeWidth={1.75} />}
          title="No products yet"
          description="Add your first product to start tracking stock."
          action={
            <Link to="/products/new" className="btn-primary mt-3 text-sm">
              <Plus size={16} />
              Add Product
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={24} strokeWidth={1.75} />}
          title="No products match your filters"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <ProductTable products={filtered} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border bg-white px-3 py-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-[var(--color-brand-accent)]/30 focus:border-[var(--color-brand-accent)]"
      style={{ borderColor: 'var(--color-line)' }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
