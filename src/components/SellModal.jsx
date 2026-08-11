import { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import './Modal.css';
import './SellModal.css';

const PAY_METHODS = [
  { id: 'Cash', icon: 'fa-money-bill-wave' },
  { id: 'Transfer', icon: 'fa-building-columns' },
  { id: 'POS', icon: 'fa-credit-card' },
];

export default function SellModal({ product, onClose, onSold }) {
  const { fmtMoney } = useStock();
  const u = product.unitInfo || { unit: 'Piece', plural: 'Pieces', piece: 'Piece', packSize: 1 };
  const hasPieceOption = u.packSize > 1;

  const [unitMode, setUnitMode] = useState('pack');
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');

  const maxQty = unitMode === 'piece' ? Math.floor(product.qty * u.packSize) : Math.floor(product.qty);

  useEffect(() => {
    setQty(1);
  }, [unitMode]);

  const margin = product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0;
  const belowCost = product.price < product.cost;

  const unitPrice = unitMode === 'piece' && u.packSize > 1 ? product.price / u.packSize : product.price;
  const total = unitPrice * qty;

  const changeText = (() => {
    if (payMethod !== 'Cash') return null;
    const amt = parseFloat(tendered);
    if (!amt) return null;
    const change = amt - total;
    return change < 0
      ? { text: `Short by ${fmtMoney(Math.abs(change))}`, over: true }
      : { text: `Change to give: ${fmtMoney(change)}`, over: false };
  })();

  const adjustQty = (delta) => setQty((q) => Math.max(1, Math.min(maxQty, q + delta)));

  const handleQtyInput = (e) => {
    const typed = parseInt(e.target.value, 10);
    if (isNaN(typed) || typed < 1) return setQty(1);
    if (typed > maxQty) return setQty(maxQty);
    setQty(typed);
  };

  const handleConfirm = () => {
    onSold({ qty, unitMode, payMethod });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Sell Item</div>
        <div className="modal-sub">Record a sale and update stock</div>

        <div className="modal-product">
          <div className="modal-product-name">{product.name}</div>
          <div className="modal-product-detail">
            <b>{fmtMoney(product.price)}</b> per {u.unit.toLowerCase()} · {Math.floor(product.qty)} {u.plural} in stock
            {hasPieceOption ? ` · ${Math.floor(product.qty) * u.packSize} ${u.piece}s` : ''} · {margin}% margin
          </div>
        </div>

        {belowCost && (
          <div className="cost-warning show">
            <i className="fa-solid fa-triangle-exclamation" />
            Selling {fmtMoney(product.cost - product.price)} below cost — you'll make a loss!
          </div>
        )}

        {hasPieceOption && (
          <div className="sell-unit-toggle">
            <button
              className={'sut-btn' + (unitMode === 'pack' ? ' active' : '')}
              onClick={() => setUnitMode('pack')}
            >
              Full {u.unit}
            </button>
            <button
              className={'sut-btn' + (unitMode === 'piece' ? ' active' : '')}
              onClick={() => setUnitMode('piece')}
            >
              Per {u.piece}
            </button>
          </div>
        )}

        <div className="qty-input-wrap">
          <button className="qty-btn" onClick={() => adjustQty(-1)}>−</button>
          <input
            className="qty-manual"
            type="number"
            value={qty}
            onChange={handleQtyInput}
          />
          <button className="qty-btn" onClick={() => adjustQty(1)}>+</button>
        </div>
        <div className="qty-unit-hint">
          {qty > 1 || hasPieceOption ? `Total: ${fmtMoney(total)}` : ''}
        </div>

        <div className="pay-method-row">
          {PAY_METHODS.map(({ id, icon }) => (
            <button
              key={id}
              className={'pay-btn' + (payMethod === id ? ' active' : '')}
              onClick={() => setPayMethod(id)}
            >
              <i className={`fa-solid ${icon}`} />
              {id}
            </button>
          ))}
        </div>

        {payMethod === 'Cash' && (
          <div className="change-calc show">
            <div className="change-calc-label"><i className="fa-solid fa-coins" /> Change Calculator</div>
            <input
              className="finput"
              type="number"
              placeholder="Amount tendered"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
            />
            {changeText && (
              <div className="change-result">
                <b className={changeText.over ? 'over' : ''}>{changeText.text}</b>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className={'btn-confirm' + (belowCost ? ' warn' : '')} onClick={handleConfirm}>
            CONFIRM SALE
          </button>
        </div>
      </div>
    </div>
  );
}
