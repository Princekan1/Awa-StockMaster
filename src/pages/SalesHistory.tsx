import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatNaira } from '../lib/logic';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SalesHistory() {
  const sales = useInventoryStore((s) => s.sales);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sales>();
    // Sort sales newest first before grouping
    const sorted = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const sale of sorted) {
      const label = dayLabel(sale.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(sale);
    }
    return Array.from(map.entries());
  }, [sales]);

  const totalToday = useMemo(
    () => sales.filter((s) => dayLabel(s.createdAt) === 'Today').reduce((sum, s) => sum + s.total, 0),
    [sales],
  );

  return (
    <div className="max-w-2xl">
      <Header title="Sales History" subtitle={`${formatNaira(totalToday)} sold today`} />

      {sales.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} strokeWidth={1.75} />}
          title="No sales yet"
          description="Sales you record will show up here."
        />
      ) : (
        grouped.map(([label, daySales]) => {
          const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
          return (
            <section key={label} className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="font-display font-bold text-sm">{label}</h2>
                <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                  {formatNaira(dayTotal)} · {daySales.length} sale{daySales.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="ui-card divide-y" style={{ borderColor: 'var(--color-line)' }}>
                {daySales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-[var(--color-ink)]">{sale.productName}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                        {sale.quantity} × {formatNaira(sale.unitPrice)} · {sale.paymentMethod} ·{' '}
                        {new Date(sale.createdAt).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0"><p className="font-semibold whitespace-nowrap tabular-nums">{formatNaira(sale.total)}</p><p className="text-[10px] text-[var(--color-ink-muted)]">Profit {formatNaira(sale.profit)}</p></div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
