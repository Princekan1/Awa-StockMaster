import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ShoppingCart,
  PackagePlus,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira, formatExpiryLabel } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import ExpiryBadge from '../components/ExpiryBadge';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import EmptyState from '../components/EmptyState';

const MOVEMENT_LABEL: Record<string, string> = {
  SALE: 'Sold',
  STOCK_IN: 'Stock in',
  ADJUSTMENT: 'Adjustment',
  DAMAGE: 'Damaged',
  LOSS: 'Missing / loss',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const movements = useInventoryStore((s) => s.movements);
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const updateProduct = useInventoryStore((s) => s.updateProduct);
  const deleteProduct = useInventoryStore((s) => s.deleteProduct);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const product = products.find((p) => p.id === id && !p.archived);
  const role = useInventoryStore((s) => s.role);
  const activity = useMemo(
    () => movements.filter((m) => m.productId === id).slice(0, 20),
    [movements, id],
  );

  if (!product) {
    return (
      <EmptyState
        icon={<Search size={28} strokeWidth={1.75} />}
        title="Product not found"
        description="This product may have been deleted."
        action={
          <Link to="/inventory" className="btn-primary text-sm">
            <ArrowLeft size={16} />
            Back to inventory
          </Link>
        }
      />
    );
  }

  const stockStatus = getStockStatus(product);
  const expiryStatus = getExpiryStatus(product.expiryDate, expiryWarningDays);

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] mb-3 hover:text-[var(--color-ink)]"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <Header title={product.name} subtitle={product.category} />

      <div className="ui-card p-5 mb-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge status={stockStatus} />
          <ExpiryBadge status={expiryStatus} expiryDate={product.expiryDate} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-5">
          <Detail label="Cost Price" value={formatNaira(product.costPrice)} />
          <Detail label="Selling Price" value={formatNaira(product.price)} />
          <Detail label="Current Stock" value={String(product.quantity)} />
          <Detail label="Minimum Stock" value={String(product.minimumStock)} />
          <Detail label="Barcode" value={product.barcode || '—'} />
          <Detail
            label="Expiry Date"
            value={
              product.expiryDate
                ? new Date(product.expiryDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <Detail label="Expiry Status" value={formatExpiryLabel(product.expiryDate)} />
        </dl>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ActionButton
            label="Sell"
            icon={<ShoppingCart size={18} />}
            onClick={() => navigate(`/sell?product=${product.id}`)}
            primary
          />
          {role === 'owner' && <ActionButton label="Add Stock" icon={<PackagePlus size={18} />} onClick={() => setAdjustOpen(true)} />}
          {role === 'owner' && <ActionButton label="Edit" icon={<Pencil size={18} />} onClick={() => setEditOpen(true)} />}
          {role === 'owner' && <ActionButton label="Archive" icon={<Trash2 size={18} />} onClick={() => setDeleteOpen(true)} danger />}
        </div>
      </div>

      <section className="ui-card p-5">
        <h2 className="font-display font-bold text-sm mb-4">Stock Activity</h2>
        {activity.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Sales and stock changes will appear here."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {activity.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 text-sm rounded-lg px-2 py-2.5 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {m.reason || MOVEMENT_LABEL[m.type] || m.type}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className="font-semibold whitespace-nowrap tabular-nums"
                  style={{ color: m.quantity < 0 ? 'var(--color-red)' : 'var(--color-green)' }}
                >
                  {m.quantity > 0 ? '+' : ''}
                  {m.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--color-ink-muted)] mt-4">
          Current stock: <strong className="text-[var(--color-ink)]">{product.quantity}</strong>
        </p>
      </section>

      <StockAdjustmentModal
        open={adjustOpen}
        product={product}
        onClose={() => setAdjustOpen(false)}
        onAdjust={(delta, reason) => adjustStock(product.id, delta, reason)}
      />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Product">
        <ProductForm
          initial={product}
          existingProducts={products}
          currentProductId={product.id}
          submitLabel="Save Changes"
          onSubmit={(data) => {
            updateProduct(product.id, data);
            setEditOpen(false);
          }}
        />
      </Modal>

      <ConfirmationModal
        open={deleteOpen}
        title="Archive Product"
        message={`Archive "${product.name}"? It will disappear from active inventory but its sales history will be preserved.`}
        confirmLabel="Archive"
        danger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteProduct(product.id);
          navigate('/inventory');
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)] mb-0.5">
        {label}
      </dt>
      <dd className="font-medium text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  primary,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold border transition active:scale-[0.98]"
      style={{
        background: primary ? 'var(--color-brand)' : 'transparent',
        color: primary ? 'white' : danger ? 'var(--color-red)' : 'var(--color-ink-soft)',
        borderColor: primary
          ? 'var(--color-brand)'
          : danger
            ? 'var(--color-red-soft)'
            : 'var(--color-line)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
