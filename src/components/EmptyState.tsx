import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2.5 py-16 px-6">
      {icon && (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl mb-1 text-[var(--color-ink-muted)]"
          style={{ background: '#f1f0ec' }}
        >
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</p>
      {description && (
        <p className="text-sm text-[var(--color-ink-muted)] max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
