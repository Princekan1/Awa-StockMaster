import type { ExpiryStatus } from '../types';
import { formatExpiryLabel } from '../lib/logic';

const CONFIG: Record<
  ExpiryStatus,
  { bg: string; fg: string; dot: string }
> = {
  EXPIRED: {
    bg: 'var(--color-red-soft)',
    fg: 'var(--color-red)',
    dot: 'var(--color-red)',
  },
  EXPIRING_SOON: {
    bg: 'var(--color-amber-soft)',
    fg: '#b45309',
    dot: 'var(--color-amber)',
  },
  SAFE: {
    bg: 'var(--color-green-soft)',
    fg: 'var(--color-green)',
    dot: 'var(--color-green)',
  },
  NONE: {
    bg: '#f1f0ec',
    fg: 'var(--color-ink-muted)',
    dot: '#94a3b8',
  },
};

export default function ExpiryBadge({
  status,
  expiryDate,
}: {
  status: ExpiryStatus;
  expiryDate: string | null;
}) {
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
      {formatExpiryLabel(expiryDate)}
    </span>
  );
}
