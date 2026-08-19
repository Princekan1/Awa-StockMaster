import { useMemo } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatNaira } from '../lib/logic';
import Header from '../components/Header';
import type { Sale } from '../types';

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function dayLabel(key: string) {
  const d = new Date(key);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function SalesHistory() {
  const sales = useInventoryStore((s) => s.sales);

  const { todayCount, groups } = useMemo(() => {
    const sorted = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const today = new Date().toDateString();
    let todayCount = 0;

    const map = new Map<string, Sale[]>();
    for (const sale of sorted) {
      const key = dayKey(sale.createdAt);
      if (key === today) todayCount++;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sale);
    }

    const groups = Array.from(map.entries()).map(([key, items]) => {
      const total = items.reduce((sum, s) => sum + s.total, 0);
      return { key, label: dayLabel(key), items, total, count: items.length };
    });

    return { todayCount, groups };
  }, [sales]);

  return (
    <div>
      <Header
        title="Sales History"
        subtitle={
          todayCount === 0
            ? 'No sales today'
            : `${todayCount} sale${todayCount === 1 ? '' : 's'} today`
        }
      />

      {groups.length === 0 ? (
        <section className="page-section">
          <div
            className="rounded-2xl border bg-white py-10 px-4 text-center shadow-sm"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <p className="text-sm font-semibold text-[var(--color-ink)]">No sales yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Completed sales will show up here by day
            </p>
          </div>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="page-section">
            <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
              <h2 className="text-sm font-bold text-[var(--color-ink)]">{group.label}</h2>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                {formatNaira(group.total)} · {group.count} sale{group.count === 1 ? '' : 's'}
              </p>
            </div>

            <div
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: 'var(--color-line)' }}
            >
              {group.items.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-start justify-between gap-3 border-b px-3.5 py-3 last:border-b-0"
                  style={{ borderColor: 'var(--color-line)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                      {sale.productName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                      {sale.quantity} × {formatNaira(sale.unitPrice)}
                      {' · '}
                      {sale.paymentMethod}
                      {' · '}
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-[var(--color-ink)]">
                      {formatNaira(sale.total)}
                    </p>
                    <p className="mt-0.5 text-[0.7rem] font-medium text-emerald-600">
                      Profit {formatNaira(sale.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
