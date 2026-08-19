import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  PackageX,
  ShoppingCart,
  PackagePlus,
  ChevronRight,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';


function formatChartDate(date: Date) {
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function StockOverview({ products }: { products: any[] }) {
  const [range, setRange] = useState<'month' | 'lastMonth' | 'year'>('month');

  const points = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    if (range === 'month') start.setDate(1);
    else if (range === 'lastMonth') {
      start.setMonth(start.getMonth() - 1, 1);
      end.setMonth(end.getMonth() - 1, new Date(end.getFullYear(), end.getMonth(), 0).getDate());
    } else start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);

    const pointCount = range === 'year' ? 6 : 5;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const step = Math.max(1, Math.floor((totalDays - 1) / Math.max(1, pointCount - 1)));
    const currentTotal = products.reduce((sum, product) => sum + (product.archived ? 0 : Number(product.quantity) || 0), 0);
    return Array.from({ length: pointCount }, (_, index) => {
      const offset = index === pointCount - 1 ? totalDays - 1 : Math.min(index * step, totalDays - 1);
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      date.setHours(23, 59, 59, 999);
      return { date, value: currentTotal };
    });
  }, [products, range]);

  const max = Math.max(1, ...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const span = Math.max(1, max - min);
  const width = 320;
  const height = 116;
  const line = points.map((point, index) => {
    const x = 6 + (index * (width - 12)) / Math.max(1, points.length - 1);
    const y = height - 8 - ((point.value - min) / span) * (height - 16);
    return `${x},${y}`;
  }).join(' ');

  return (
    <section className="page-section">
      <div className="rounded-2xl border bg-white p-3.5 shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--color-ink)]">Stock Overview</h2>
          <select
            aria-label="Stock overview period"
            value={range}
            onChange={(event) => setRange(event.target.value as typeof range)}
            className="rounded-lg border bg-white px-2 py-1 text-xs text-[var(--color-ink-muted)] outline-none"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="mt-3 overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[118px] w-full" role="img" aria-label="Stock level trend" preserveAspectRatio="none">
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="var(--color-line)" strokeWidth="1" />
            ))}
            <polyline points={line} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-1 flex items-center justify-between px-1 text-[0.65rem] text-[var(--color-ink-muted)]">
            {points.map((point) => <span key={point.date.toISOString()}>{formatChartDate(point.date)}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopCategories({ products }: { products: any[] }) {
  const [range, setRange] = useState<'month' | 'lastMonth' | 'year'>('month');
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.archived) continue;
      const category = ((product as { category?: string }).category || 'Other').trim() || 'Other';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  }, [products, range]);

  const total = categories.reduce((sum, [, count]) => sum + count, 0);
  const first = categories[0]?.[1] ?? 0;
  const firstPercent = total ? Math.round((first / total) * 100) : 0;
  const firstAngle = firstPercent * 3.6;
  const donut = total === 0
    ? 'var(--color-line)'
    : categories.length === 1
      ? 'conic-gradient(var(--color-brand) 0deg 360deg)'
      : `conic-gradient(var(--color-brand) 0deg ${firstAngle}deg, #10b981 ${firstAngle}deg 360deg)`;

  return (
    <section className="page-section">
      <div className="rounded-2xl border bg-white p-3.5 shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--color-ink)]">Top Categories</h2>
          <select
            aria-label="Top categories period"
            value={range}
            onChange={(event) => setRange(event.target.value as typeof range)}
            className="rounded-lg border bg-white px-2 py-1 text-xs text-[var(--color-ink-muted)] outline-none"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        {total === 0 ? (
          <div className="flex min-h-[132px] items-center justify-center text-xs text-[var(--color-ink-muted)]">No products yet</div>
        ) : (
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-[112px] w-[112px] shrink-0">
              <div className="h-full w-full rounded-full" style={{ background: donut }} />
              <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-bold text-[var(--color-ink)]">{total}</span>
                <span className="text-[0.65rem] text-[var(--color-ink-muted)]">Total</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {categories.map(([category, count], index) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={category} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: index === 0 ? 'var(--color-brand)' : index === 1 ? '#10b981' : 'var(--color-ink-muted)' }} />
                    <span className="min-w-0 flex-1 truncate text-[var(--color-ink-muted)]">{category}</span>
                    <span className="font-semibold text-[var(--color-ink)]">{percent}% ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const role = useInventoryStore((s) => s.role);
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const sales = useInventoryStore((s) => s.sales);

  const stats = useMemo(() => {
    let out = 0;
    let low = 0;
    let expiring = 0;

    const attentionItems: Array<{
      id: string;
      name: string;
      quantity: number;
      kind: 'OUT' | 'LOW' | 'EXPIRING';
      expiryDate: string | null;
    }> = [];

    for (const p of products) {
      if (p.archived) continue;
      const stock = getStockStatus(p);
      const expiry = getExpiryStatus(p.expiryDate, expiryWarningDays);

      if (stock === 'OUT_OF_STOCK') {
        out++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'OUT',
          expiryDate: p.expiryDate,
        });
      } else if (stock === 'LOW_STOCK') {
        low++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'LOW',
          expiryDate: p.expiryDate,
        });
      } else if (expiry === 'EXPIRING_SOON') {
        expiring++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'EXPIRING',
          expiryDate: p.expiryDate,
        });
      }
    }

    // Priority: OUT → LOW → EXPIRING, then by name
    attentionItems.sort((a, b) => {
      const order = { OUT: 0, LOW: 1, EXPIRING: 2 };
      if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
      return a.name.localeCompare(b.name);
    });

    const today = new Date().toDateString();
    const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
    const todayTotal = todaySales.reduce((sum, x) => sum + x.total, 0);

    return {
      out,
      low,
      expiring,
      alertCount: out + low + expiring,
      todayTotal,
      todayCount: todaySales.length,
      attentionItems: attentionItems.slice(0, 6),
      hasMoreAttention: attentionItems.length > 6,
    };
  }, [products, sales, expiryWarningDays]);

  const isOwner = role === 'owner';

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={isOwner ? 'What needs attention today' : "Today's activity & stock alerts"}
      />

      {/* 1. TODAY STRIP — one glance performance */}
      <section className="page-section">
        <div className="today-strip">
          <div className="today-cell">
            <span className="today-label">Today’s sales</span>
            <span className="today-value today-value-accent">
              {formatNaira(stats.todayTotal)}
            </span>
          </div>
          <div className="today-cell">
            <span className="today-label">Sales</span>
            <span className="today-value">{stats.todayCount}</span>
          </div>
          <div className="today-cell">
            <span className="today-label">Alerts</span>
            <span className="today-value">{stats.alertCount}</span>
          </div>
        </div>
      </section>

      {/* 2. NEEDS ATTENTION CHIPS — fast filters into problems */}
      <section className="page-section">
        <div className="section-head">
          <h2 className="section-title">Needs attention</h2>
        </div>
        <div className="attention-row">
          <Link
            to="/alerts?filter=out"
            className="attention-chip attention-chip-danger"
          >
            <PackageX size={15} strokeWidth={2.25} />
            Out of stock
            <span className="attention-chip-count">{stats.out}</span>
          </Link>
          <Link
            to="/alerts?filter=low"
            className="attention-chip attention-chip-warn"
          >
            <AlertTriangle size={15} strokeWidth={2.25} />
            Low stock
            <span className="attention-chip-count">{stats.low}</span>
          </Link>
          <Link
            to="/alerts?filter=expiring"
            className="attention-chip attention-chip-warn"
          >
            <Clock size={15} strokeWidth={2.25} />
            Expiring
            <span className="attention-chip-count">{stats.expiring}</span>
          </Link>
        </div>
      </section>

      {/* 3. ACTION LIST — actual products to deal with */}
      <section className="page-section">
        <div className="section-head">
          <h2 className="section-title">Action list</h2>
          {stats.alertCount > 0 && (
            <Link to="/alerts" className="section-link flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="action-list">
          {stats.attentionItems.length === 0 ? (
            <div className="empty-block">
              <p className="empty-title">Nothing needs attention</p>
              <p className="empty-sub">Stock levels and expiry look fine right now</p>
            </div>
          ) : (
            stats.attentionItems.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="action-row">
                <div className="action-row-main">
                  <p className="action-row-title">{item.name}</p>
                  <p className="action-row-meta">
                    Qty: {item.quantity}
                    {item.kind === 'EXPIRING' && item.expiryDate
                      ? ` · Exp ${new Date(item.expiryDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="action-row-badge">
                  <StatusBadge
                    status={
                      item.kind === 'OUT'
                        ? 'OUT_OF_STOCK'
                        : item.kind === 'LOW'
                          ? 'LOW_STOCK'
                          : 'LOW_STOCK'
                    }
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. PRIMARY ACTIONS — only the high-value ones */}
      <section className="page-section">
        <div className="cta-row">
          <Link to="/sell" className="cta-btn cta-btn-primary">
            <ShoppingCart size={16} strokeWidth={2.25} />
            Sell
          </Link>
          {isOwner ? (
            <Link to="/stock/receive" className="cta-btn cta-btn-secondary">
              <PackagePlus size={16} strokeWidth={2.25} />
              Receive stock
            </Link>
          ) : (
            <Link to="/inventory" className="cta-btn cta-btn-secondary">
              <PackageX size={16} strokeWidth={2.25} />
              Check stock
            </Link>
          )}
        </div>
      </section>

      {/* Restored analytics section from the team's reference design. */}
      <StockOverview products={products} />
      <TopCategories products={products} />
    </div>
  );
}
