import OfflineIndicator from './OfflineIndicator';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      <OfflineIndicator />
    </header>
  );
}
