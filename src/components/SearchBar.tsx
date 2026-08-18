import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search products, barcode, category…',
  autoFocus,
}: Props) {
  return (
    <div className="relative w-full">
      <Search
        size={17}
        strokeWidth={2}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none"
      />
      <input
        type="text"
        inputMode="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm outline-none transition-shadow duration-150 placeholder:text-[var(--color-ink-muted)]/70 focus:ring-2 focus:ring-[var(--color-brand-accent)]/30 focus:border-[var(--color-brand-accent)]"
        style={{ borderColor: 'var(--color-line)' }}
      />
    </div>
  );
}
