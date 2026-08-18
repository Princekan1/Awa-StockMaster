import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Clock, PackageX, CheckCircle2 } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatExpiryLabel, daysUntil } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

export default function Alerts() {
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const [params] = useSearchParams();
  const filter = params.get('filter'); // 'low' | 'expiring' | null

  const outOfStock = useMemo(
    () => products.filter((p) => !p.archived && getStockStatus(p) === 'OUT_OF_STOCK'),
    [products],
  );
  const lowStock = useMemo(
    () => products.filter((p) => !p.archived && getStockStatus(p) === 'LOW_STOCK'),
    [products],
  );
  const expiring = useMemo(
    () =>
      products.filter((p) => !p.archived && ['EXPIRED', 'EXPIRING_SOON'].includes(getExpiryStatus(p.expiryDate, expiryWarningDays))),
    [products, expiryWarningDays],
  );

  const showLow = !filter || filter === 'low' || filter === 'out';
  const showExpiring = !filter || filter === 'expiring';

  const totalAlerts =
    (showLow ? outOfStock.length + lowStock.length : 0) +
    (showExpiring ? expiring.length : 0);

  return (
    <div>
      <Header
        title={
          filter === 'low'
            ? 'Low Stock Items'
            : filter === 'expiring'
              ? 'Expiring Soon'
              : 'Alerts'
        }
        subtitle={
          totalAlerts === 0
            ? 'Everything looks good'
            : `${totalAlerts} item${totalAlerts === 1 ? '' : 's'} need attention`
        }
      />

      {totalAlerts === 0 && (
        <EmptyState
          icon={<CheckCircle2 size={28} strokeWidth={1.75} />}
          title="No alerts right now"
          description="You'll see stock and expiry warnings here."
        />
      )}

      {showLow && outOfStock.length > 0 && (
        <AlertGroup
          title="Out of Stock"
          icon={<PackageX size={16} />}
          tone="red"
          count={outOfStock.length}
        >
          {outOfStock.map((p) => (
            <AlertRow key={p.id} id={p.id} name={p.name} category={p.category}>
              <StatusBadge status="OUT_OF_STOCK" />
            </AlertRow>
          ))}
        </AlertGroup>
      )}

      {showLow && lowStock.length > 0 && (
        <AlertGroup
          title="Low Stock"
          icon={<AlertTriangle size={16} />}
          tone="amber"
          count={lowStock.length}
        >
          {lowStock.map((p) => (
            <AlertRow
              key={p.id}
              id={p.id}
              name={p.name}
              category={p.category}
              meta={`${p.quantity} left · Min ${p.minimumStock}`}
            >
              <StatusBadge status="LOW_STOCK" />
            </AlertRow>
          ))}
        </AlertGroup>
      )}

      {showExpiring && expiring.length > 0 && (
        <AlertGroup
          title="Expiring / Expired"
          icon={<Clock size={16} />}
          tone="amber"
          count={expiring.length}
        >
          {expiring.map((p) => {
            const days = p.expiryDate ? daysUntil(p.expiryDate) : null;
            return (
              <AlertRow
                key={p.id}
                id={p.id}
                name={p.name}
                category={p.category}
                meta={formatExpiryLabel(p.expiryDate)}
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    days !== null && days < 0
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {days !== null ? `${days} days` : '—'}
                </span>
              </AlertRow>
            );
          })}
        </AlertGroup>
      )}
    </div>
  );
}

function AlertGroup({
  title,
  icon,
  tone,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'red' | 'amber';
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-card overflow-hidden mb-4">
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-line)' }}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          {icon}
        </span>
        <h2 className="font-display font-bold text-sm flex-1">{title}</h2>
        <span className="text-xs font-semibold text-[var(--color-ink-muted)]">{count}</span>
      </div>
      <ul className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
        {children}
      </ul>
    </section>
  );
}

function AlertRow({
  id,
  name,
  category,
  meta,
  children,
}: {
  id: string;
  name: string;
  category: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={`/products/${id}`}
        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition"
      >
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {category}
            {meta ? ` · ${meta}` : ''}
          </p>
        </div>
        {children}
      </Link>
    </li>
  );
}
