import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import StatusBadge from './StatusBadge';
import ExpiryBadge from './ExpiryBadge';
import { useInventoryStore } from '../store/useInventoryStore';

export default function ProductCard({ product }: { product: Product }) {
  const stockStatus = getStockStatus(product);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const expiryStatus = getExpiryStatus(product.expiryDate, expiryWarningDays);

  return (
    <Link
      to={`/products/${product.id}`}
      className="ui-card ui-card-interactive block p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-[15px] text-[var(--color-ink)] truncate leading-snug">
            {product.name}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            {product.category}
          </p>
        </div>
        <p className="font-display font-bold text-[15px] whitespace-nowrap text-[var(--color-ink)]">
          {formatNaira(product.price)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-sm text-[var(--color-ink-soft)]">
          <span className="font-semibold text-[var(--color-ink)]">{product.quantity}</span>{' '}
          in stock
        </span>
        <StatusBadge status={stockStatus} />
      </div>

      {product.expiryDate && (
        <div className="flex justify-end pt-1 border-t" style={{ borderColor: 'var(--color-line)' }}>
          <ExpiryBadge status={expiryStatus} expiryDate={product.expiryDate} />
        </div>
      )}
    </Link>
  );
}
