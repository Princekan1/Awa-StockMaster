import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'purple';
  icon?: ReactNode;
}

const TONE: Record<string, { bg: string; fg: string; iconBg: string }> = {
  neutral: { bg: '#ffffff', fg: 'var(--color-ink)', iconBg: '#f1f5f9' },
  green: { bg: '#ecfdf5', fg: '#059669', iconBg: 'rgba(5,150,105,0.12)' },
  amber: { bg: '#fffbeb', fg: '#d97706', iconBg: 'rgba(217,119,6,0.12)' },
  red: { bg: '#fef2f2', fg: '#dc2626', iconBg: 'rgba(220,38,38,0.12)' },
  blue: { bg: '#eff6ff', fg: '#2563eb', iconBg: 'rgba(37,99,235,0.12)' },
  purple: { bg: '#f5f3ff', fg: '#7c3aed', iconBg: 'rgba(124,58,237,0.12)' },
};

export default function DashboardCard({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
}: Props) {
  const t = TONE[tone] || TONE.neutral;

  return (
    <div className="ui-card p-4 flex flex-col gap-2 min-w-0" style={{ background: t.bg }}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide truncate">
          {label}
        </span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ background: t.iconBg, color: t.fg }}
          >
            {icon}
          </span>
        )}
      </div>
      <span className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-none" style={{ color: t.fg }}>
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-[var(--color-ink-muted)] leading-snug">{sub}</span>
      )}
    </div>
  );
}
