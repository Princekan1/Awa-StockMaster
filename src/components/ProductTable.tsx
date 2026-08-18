import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import StatusBadge from './StatusBadge';
import ExpiryBadge from './ExpiryBadge';
import { useInventoryStore } from '../store/useInventoryStore';

export default function ProductTable({ products }: { products: Product[] }) {
  const navigate = useNavigate();
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);

  return (
    <div
      className="ui-card overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left border-b"
              style={{ borderColor: 'var(--color-line)', background: '#faf9f6' }}
            >
              {['Product', 'Category', 'Price', 'Stock', 'Minimum', 'Expiry', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stockStatus = getStockStatus(p);
              const expiryStatus = getExpiryStatus(p.expiryDate, expiryWarningDays);
              return (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="border-b last:border-0 cursor-pointer transition-colors duration-100 hover:bg-black/[0.025]"
                  style={{ borderColor: 'var(--color-line)' }}
                >
                  <td className="px-4 py-3.5 font-medium text-[var(--color-ink)]">
                    {p.name}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--color-ink-muted)]">
                    {p.category}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                    {formatNaira(p.price)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums">
                    {p.quantity}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--color-ink-muted)] tabular-nums">
                    {p.minimumStock}
                  </td>
                  <td className="px-4 py-3.5">
                    <ExpiryBadge status={expiryStatus} expiryDate={p.expiryDate} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={stockStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
