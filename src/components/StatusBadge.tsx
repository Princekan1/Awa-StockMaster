import type { StockStatus } from '../types';

const CONFIG: Record<
  StockStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  IN_STOCK: {
    label: 'In Stock',
    bg: 'var(--color-green-soft)',
    fg: 'var(--color-green)',
    dot: 'var(--color-green)',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    bg: 'var(--color-amber-soft)',
    fg: '#b45309',
    dot: 'var(--color-amber)',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    bg: 'var(--color-red-soft)',
    fg: 'var(--color-red)',
    dot: 'var(--color-red)',
  },
};

export default function StatusBadge({ status }: { status: StockStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: c.dot }}
        aria-hidden
      />
      {c.label}
    </span>
  );
}
