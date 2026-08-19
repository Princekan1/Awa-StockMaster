import OfflineIndicator from './OfflineIndicator';

interface HeaderProps {
  title: string;
  subtitle?: string;
  sticky?: boolean;
}

export default function Header({ title, subtitle, sticky = true }: HeaderProps) {
  return (
    <header className={`flex items-start justify-between gap-3 mb-3.5 ${sticky ? 'page-header' : ''}`}>
      <div className="min-w-0">
        <h1 className="page-title truncate">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="pt-0.5 shrink-0">
        <OfflineIndicator />
      </div>
    </header>
  );
}
