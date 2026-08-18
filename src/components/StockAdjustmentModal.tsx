import { useState } from 'react';
import Modal from './Modal';
import type { Product } from '../types';

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onAdjust: (delta: number, reason: string) => { ok: boolean; message?: string };
}

const REASONS = ['New delivery', 'Damaged item', 'Missing item', 'Stock count correction', 'Other'];

export default function StockAdjustmentModal({ open, product, onClose, onAdjust }: Props) {
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const parsedAmount = Number(amount) || 0;
  const newQuantity = direction === 'add' ? product.quantity + parsedAmount : product.quantity - parsedAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parsedAmount <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    const delta = direction === 'add' ? parsedAmount : -parsedAmount;
    const result = onAdjust(delta, reason);
    if (!result.ok) {
      setError(result.message ?? 'Could not adjust stock.');
      return;
    }
    setAmount('');
    setError(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Adjust Stock — ${product.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ background: 'var(--color-paper)' }}>
          <span className="opacity-60">Current quantity</span>
          <span className="font-display font-bold text-lg">{product.quantity}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('add')}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
            style={{
              background: direction === 'add' ? 'var(--color-green)' : 'transparent',
              color: direction === 'add' ? 'white' : 'inherit',
              borderColor: direction === 'add' ? 'var(--color-green)' : 'var(--color-line)',
            }}
          >
            + Add Stock
          </button>
          <button
            type="button"
            onClick={() => setDirection('remove')}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
            style={{
              background: direction === 'remove' ? 'var(--color-red)' : 'transparent',
              color: direction === 'remove' ? 'white' : 'inherit',
              borderColor: direction === 'remove' ? 'var(--color-red)' : 'var(--color-line)',
            }}
          >
            − Remove Stock
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-60">Quantity</span>
          <input
            type="number"
            min="1"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none border-[var(--color-line)]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-60">Reason</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none border-[var(--color-line)] bg-white"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {amount && parsedAmount > 0 && (
          <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ background: 'var(--color-blue-soft)', color: 'var(--color-blue)' }}>
            <span>New quantity</span>
            <span className="font-display font-bold text-lg">{Math.max(newQuantity, 0)}</span>
          </div>
        )}

        {error && (
          <p className="text-sm font-medium rounded-xl p-3" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3">
          Save Adjustment
        </button>
      </form>
    </Modal>
  );
}
