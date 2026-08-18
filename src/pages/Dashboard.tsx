import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  Package,
  PackageCheck,
  AlertTriangle,
  Clock,
  ShoppingCart,
  ScanBarcode,
  Search,
  History,
  ChevronRight,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import type { Product, StockMovement } from '../types';
import {
  getStockStatus,
  getExpiryStatus,
  formatNaira,
  daysUntil,
} from '../lib/logic';
import Header from '../components/Header';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const role = useInventoryStore((s) => s.role);
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const sales = useInventoryStore((s) => s.sales);
  const movements = useInventoryStore((s) => s.movements);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let low = 0;
    let out = 0;
    let expiring = 0;
    const categoryMap: Record<string, number> = {};
    for (const p of products) {
      if (p.archived) continue;
      totalUnits += p.quantity;
      const stockStatus = getStockStatus(p);
      if (stockStatus === 'LOW_STOCK') low++;
      if (stockStatus === 'OUT_OF_STOCK') out++;
      if (getExpiryStatus(p.expiryDate, expiryWarningDays) === 'EXPIRING_SOON') expiring++;
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    }
    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const totalCat = categories.reduce((s, [, n]) => s + n, 0) || 1;

    // Today's sales
    const today = new Date().toDateString();
    const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);

    return {
      totalProducts: products.filter((p) => !p.archived).length,
      totalUnits,
      low,
      out,
      expiring,
      inStockPct: products.filter(p => !p.archived).length ? Math.round((totalUnits > 0 ? (products.filter(p => !p.archived && p.quantity > 0).length / products.filter(p => !p.archived).length) * 100 : 0)) : 0,
      categories,
      totalCat,
      todayTotal,
      todayCount: todaySales.length,
    };
  }, [products, sales]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => !p.archived && (getStockStatus(p) === 'LOW_STOCK' || getStockStatus(p) === 'OUT_OF_STOCK'))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5),
    [products],
  );

  const expiringProducts = useMemo(
    () =>
      products
        .filter(
          (p) => !p.archived && (
            getExpiryStatus(p.expiryDate, expiryWarningDays) === 'EXPIRING_SOON' ||
            getExpiryStatus(p.expiryDate, expiryWarningDays) === 'EXPIRED'
          ),
        )
        .sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        })
        .slice(0, 5),
    [products],
  );

  const recentSales = useMemo(
    () => [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [sales],
  );

  const stockTrend = useMemo(() => buildStockTrend(products, movements), [products, movements]);

  const isStaff = role === 'staff';

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={
          isStaff
            ? "Quick overview of today's activity"
            : 'Overview of your inventory and business'
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <DashboardCard
          label="Products"
          value={stats.totalProducts.toLocaleString()}
          sub="Total products"
          icon={<Package size={18} />}
        />
        <DashboardCard
          label="In Stock"
          value={stats.totalUnits.toLocaleString()}
          sub={`${stats.inStockPct}% of total products`}
          icon={<PackageCheck size={18} />}
          tone="green"
        />
        <DashboardCard
          label="Low Stock Items"
          value={stats.low}
          sub="Need restocking soon"
          icon={<AlertTriangle size={18} />}
          tone="amber"
        />
        <DashboardCard
          label="Expiring Soon"
          value={stats.expiring}
          sub="In next 2–4 months"
          icon={<Clock size={18} />}
          tone="amber"
        />
        <DashboardCard
          label="Today's Sales"
          value={formatNaira(stats.todayTotal)}
          sub={`${stats.todayCount} Transactions`}
          icon={<ShoppingCart size={18} />}
          tone="purple"
        />
      </div>

      {/* Staff: Quick Actions */}
      {isStaff && (
        <section className="mb-6">
          <h2 className="font-display font-bold text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/sell', label: 'Sell Item', desc: 'Start a new sale', icon: ScanBarcode },
              { to: '/sell', label: 'Scan Barcode', desc: 'Find product quickly', icon: ScanBarcode },
              { to: '/inventory', label: 'Stock Check', desc: 'Check product quantity', icon: Search },
              { to: '/sales-history', label: 'Sales History', desc: 'View recent sales', icon: History },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className="ui-card ui-card-interactive p-4 flex flex-col gap-2"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-brand-muted)', color: 'var(--color-brand)' }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{a.label}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">{a.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Owner: Chart + Categories row */}
      {!isStaff && (
        <div className="grid lg:grid-cols-5 gap-4 mb-6">
          <section className="ui-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm">Stock Overview</h2>
              <span className="text-xs text-[var(--color-ink-muted)] border rounded-md px-2 py-1">
                This Month
              </span>
            </div>
            {/* Real 30-day stock-level trend, built from actual stock movements */}
            <StockChart data={stockTrend} />
          </section>

          <section className="ui-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm">Top Categories</h2>
              <span className="text-xs text-[var(--color-ink-muted)] border rounded-md px-2 py-1">
                This Month
              </span>
            </div>
            <CategoryDonut categories={stats.categories} total={stats.totalCat} />
          </section>
        </div>
      )}

      {/* Staff Alerts strip */}
      {isStaff && (
        <section className="mb-6 space-y-2">
          <h2 className="font-display font-bold text-sm mb-2">Alerts</h2>
          <Link
            to="/alerts?filter=low"
            className="ui-card ui-card-interactive flex items-center gap-3 p-4"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{stats.low} Low Stock Items</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Some items are below minimum stock level.
              </p>
            </div>
            <ChevronRight size={18} className="text-[var(--color-ink-muted)]" />
          </Link>
          <Link
            to="/alerts?filter=expiring"
            className="ui-card ui-card-interactive flex items-center gap-3 p-4"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600">
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{stats.expiring} Items Expiring Soon</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Items expiring in the next 2–4 months.
              </p>
            </div>
            <ChevronRight size={18} className="text-[var(--color-ink-muted)]" />
          </Link>
        </section>
      )}

      {/* Bottom tables */}
      <div className={`grid gap-4 ${isStaff ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {/* Low stock table */}
        <section className="ui-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="font-display font-bold text-sm">Low Stock Items {isStaff ? '(Top 5)' : ''}</h2>
            <Link to="/alerts?filter=low" className="text-xs font-semibold text-[var(--color-brand)]">
              View All
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <EmptyState title="All stocked up" description="No low-stock products." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)] bg-slate-50">
                    <th className="px-4 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">Category</th>
                    <th className="px-3 py-2.5 font-semibold">Qty</th>
                    <th className="px-3 py-2.5 font-semibold hidden md:table-cell">Min</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-slate-50/80" style={{ borderColor: 'var(--color-line)' }}>
                      <td className="px-4 py-2.5">
                        <Link to={`/products/${p.id}`} className="font-medium hover:text-[var(--color-brand)]">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--color-ink-muted)] hidden sm:table-cell">{p.category}</td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums">{p.quantity}</td>
                      <td className="px-3 py-2.5 text-[var(--color-ink-muted)] hidden md:table-cell">{p.minimumStock}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={getStockStatus(p)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Expiring */}
        <section className="ui-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h2 className="font-display font-bold text-sm">Expiring Soon {isStaff ? '(Top 5)' : '(2–4 Months)'}</h2>
            <Link to="/alerts?filter=expiring" className="text-xs font-semibold text-[var(--color-brand)]">
              View All
            </Link>
          </div>
          {expiringProducts.length === 0 ? (
            <EmptyState title="Nothing expiring soon" description="No near-expiry products." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)] bg-slate-50">
                    <th className="px-4 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold">Expiry</th>
                    <th className="px-3 py-2.5 font-semibold">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringProducts.map((p) => {
                    const days = p.expiryDate ? daysUntil(p.expiryDate) : null;
                    return (
                      <tr key={p.id} className="border-t hover:bg-slate-50/80" style={{ borderColor: 'var(--color-line)' }}>
                        <td className="px-4 py-2.5">
                          <Link to={`/products/${p.id}`} className="font-medium hover:text-[var(--color-brand)]">
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-[var(--color-ink-muted)] whitespace-nowrap">
                          {p.expiryDate
                            ? new Date(p.expiryDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              days !== null && days < 60
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {days !== null ? `${days} days` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent sales — owner only in 3-col layout */}
        {!isStaff && (
          <section className="ui-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
              <h2 className="font-display font-bold text-sm">Recent Sales</h2>
              <Link to="/sales-history" className="text-xs font-semibold text-[var(--color-brand)]">
                View All
              </Link>
            </div>
            {recentSales.length === 0 ? (
              <EmptyState title="No sales yet" description="Sales will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)] bg-slate-50">
                      <th className="px-4 py-2.5 font-semibold">Product</th>
                      <th className="px-3 py-2.5 font-semibold">Time</th>
                      <th className="px-3 py-2.5 font-semibold">Qty</th>
                      <th className="px-3 py-2.5 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((s) => (
                      <tr key={s.id} className="border-t hover:bg-slate-50/80" style={{ borderColor: 'var(--color-line)' }}>
                        <td className="px-4 py-2.5 font-medium truncate max-w-[120px]">{s.productName}</td>
                        <td className="px-3 py-2.5 text-[var(--color-ink-muted)] whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{s.quantity}</td>
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          {formatNaira(s.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

interface TrendPoint {
  date: string; // ISO yyyy-mm-dd
  total: number;
}

/**
 * Reconstructs approximate total-units-in-stock for each of the last 30
 * days by walking backward from today's real total and undoing each day's
 * net stock movements. This is real (if approximate) history, not a
 * decorative shape — days before any movements existed will trail off to 0.
 */
function buildStockTrend(products: Product[], movements: StockMovement[]): TrendPoint[] {
  const DAYS = 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayKeys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const netByDay: Record<string, number> = {};
  for (const m of movements) {
    const key = m.createdAt.slice(0, 10);
    netByDay[key] = (netByDay[key] || 0) + m.quantity;
  }

  const currentTotal = products.reduce((sum, p) => sum + p.quantity, 0);

  const totals = new Array<number>(DAYS);
  let running = currentTotal;
  for (let i = DAYS - 1; i >= 0; i--) {
    totals[i] = running;
    running -= netByDay[dayKeys[i]] || 0;
  }

  return dayKeys.map((date, i) => ({ date, total: Math.max(0, totals[i]) }));
}

function StockChart({ data }: { data: TrendPoint[] }) {
  const hasMovement = data.some((d) => d.total !== data[0].total);

  if (!hasMovement) {
    return (
      <div className="h-48 w-full flex flex-col items-center justify-center text-center gap-1">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">
          No stock activity in the last 30 days
        </p>
        <p className="text-xs text-[var(--color-ink-muted)] max-w-xs">
          Once you add or sell stock, this chart will show real trends over time.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const min = Math.min(...data.map((d) => d.total));
  const range = max - min || 1;
  const w = 400;
  const h = 140; // leave room below for the date labels
  const stepX = w / (data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = h - ((d.total - min) / range) * (h - 10) - 5;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  const formatShort = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="h-48 w-full relative">
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, h / 3, (2 * h) / 3, h].map((y) => (
          <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-[var(--color-ink-muted)] px-1">
        <span>{formatShort(data[0].date)}</span>
        <span>{formatShort(data[Math.floor((data.length - 1) / 2)].date)}</span>
        <span>{formatShort(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

const CAT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

function CategoryDonut({
  categories,
  total,
}: {
  categories: [string, number][];
  total: number;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] text-center py-8">No categories yet</p>
    );
  }

  let cumulative = 0;
  const segments = categories.map(([name, count], i) => {
    const pct = count / total;
    const start = cumulative;
    cumulative += pct;
    return { name, count, pct, start, color: CAT_COLORS[i % CAT_COLORS.length] };
  });

  // Build conic-gradient
  const gradientStops = segments
    .map((s) => `${s.color} ${s.start * 100}% ${(s.start + s.pct) * 100}%`)
    .join(', ');

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="font-display font-bold text-lg text-[var(--color-ink)]">{total}</span>
          <span className="text-[10px] text-[var(--color-ink-muted)]">Total</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="truncate flex-1 text-[var(--color-ink-soft)]">{s.name}</span>
            <span className="font-semibold tabular-nums text-[var(--color-ink)]">
              {Math.round(s.pct * 100)}% ({s.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
