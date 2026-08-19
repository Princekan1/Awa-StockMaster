import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  PackageX,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import type { Product } from '../types';

type AlertFilter = 'all' | 'out' | 'low' | 'expiring';

function normalizeFilter(raw: string | null): AlertFilter {
  if (raw === 'out' || raw === 'low' || raw === 'expiring') return raw;
  return 'all';
}

export default function Alerts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = normalizeFilter(searchParams.get('filter'));

  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);

  const { counts, list } = useMemo(() => {
    const items: Array<{ product: Product; kind: 'OUT' | 'LOW' | 'EXPIRING' }> = [];
    let out = 0;
    let low = 0;
    let expiring = 0;

    for (const p of products) {
      if (p.archived) continue;
      const stock = getStockStatus(p);
      const expiry = getExpiryStatus(p.expiryDate, expiryWarningDays);

      if (stock === 'OUT_OF_STOCK') {
        out++;
        items.push({ product: p, kind: 'OUT' });
      } else if (stock === 'LOW_STOCK') {
        low++;
        items.push({ product: p, kind: 'LOW' });
      } else if (expiry === 'EXPIRING_SOON' || expiry === 'EXPIRED') {
        expiring++;
        items.push({ product: p, kind: 'EXPIRING' });
      }
    }

    items.sort((a, b) => {
      const order = { OUT: 0, LOW: 1, EXPIRING: 2 };
      if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
      return a.product.name.localeCompare(b.product.name);
    });

    const filtered =
      filter === 'all'
        ? items
        : items.filter((i) => {
            if (filter === 'out') return i.kind === 'OUT';
            if (filter === 'low') return i.kind === 'LOW';
            return i.kind === 'EXPIRING';
          });

    return {
      counts: { all: items.length, out, low, expiring },
      list: filtered,
    };
  }, [products, expiryWarningDays, filter]);

  function setFilter(next: AlertFilter) {
    if (next === 'all') setSearchParams({});
    else setSearchParams({ filter: next });
  }

  return (
    <div>
      <Header
        title="Alerts"
        subtitle={
          counts.all === 0
            ? 'No stock or expiry issues'
            : `${counts.all} item${counts.all === 1 ? '' : 's'} need attention`
        }
      />

      {/* Filter chips */}
      <section className="page-section">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Chip
            label="All"
            count={counts.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <Chip
            label="Out"
            count={counts.out}
            active={filter === 'out'}
            tone="danger"
            icon={<PackageX size={13} strokeWidth={2.5} />}
            onClick={() => setFilter('out')}
          />
          <Chip
            label="Low"
            count={counts.low}
            active={filter === 'low'}
            tone="warn"
            icon={<AlertTriangle size={13} strokeWidth={2.5} />}
            onClick={() => setFilter('low')}
          />
          <Chip
            label="Expiring"
            count={counts.expiring}
            active={filter === 'expiring'}
            tone="warn"
            icon={<Clock size={13} strokeWidth={2.5} />}
            onClick={() => setFilter('expiring')}
          />
        </div>
      </section>

      {/* List */}
      <section className="page-section">
        {list.length === 0 ? (
          <div
            className="rounded-2xl border bg-white py-10 px-4 text-center shadow-sm"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <Package size={28} strokeWidth={1.5} className="mx-auto mb-2 text-[var(--color-ink-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {filter === 'all' ? 'All clear' : 'Nothing in this filter'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {filter === 'all'
                ? 'No products are out, low, or expiring soon'
                : 'Try another filter or check Products'}
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="btn-secondary mt-3"
              >
                Show all alerts
              </button>
            )}
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: 'var(--color-line)' }}
          >
            {list.map(({ product, kind }) => (
              <Link
                key={`${product.id}-${kind}`}
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
                    {kind === 'EXPIRING' && product.expiryDate
                      ? ` · Exp ${new Date(product.expiryDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {kind === 'OUT' && <StatusBadge status="OUT_OF_STOCK" />}
                  {kind === 'LOW' && <StatusBadge status="LOW_STOCK" />}
                  {kind === 'EXPIRING' && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-700">
                      Expiring
                    </span>
                  )}
                  <ChevronRight size={16} className="text-[var(--color-ink-muted)]" strokeWidth={2} />
                </div>
              </Link>
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
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: 'warn' | 'danger';
  icon?: React.ReactNode;
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
      {icon}
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
