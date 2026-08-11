import { useState, useMemo } from 'react';
import { useStock } from '../context/StockContext';
import { getEmoji, pluralize } from '../utils/format';
import './InventoryList.css';

export default function InventoryList({ onEdit }) {
  const { inv, fmtMoney, restockProduct } = useStock();
  const [term, setTerm] = useState('');
  const [activeCat, setActiveCat] = useState('All');

  const categories = useMemo(
    () => ['All', ...new Set(inv.map((i) => i.cat).filter(Boolean))],
    [inv]
  );

  const filtered = useMemo(() => {
    const t = term.toLowerCase();
    return inv.filter(
      (i) =>
        (activeCat === 'All' || i.cat === activeCat) &&
        (i.name.toLowerCase().includes(t) || (i.sku && i.sku.toLowerCase().includes(t)))
    );
  }, [inv, term, activeCat]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aLow = a.qty <= a.min;
      const bLow = b.qty <= b.min;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const handleRestock = (item) => {
    const raw = window.prompt(`Add how many ${item.unitInfo?.unit || 'units'} to "${item.name}"?`, '1');
    if (raw === null) return;
    const addQty = parseFloat(raw);
    if (isNaN(addQty) || addQty <= 0) return;
    restockProduct(item.id, addQty);
  };

  return (
    <div>
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass search-icon" />
        <input
          type="text"
          placeholder="Search products or SKU..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <div className="cat-chips">
        {categories.map((c) => (
          <div
            key={c}
            className={'cat-chip' + (c === activeCat ? ' active' : '')}
            onClick={() => setActiveCat(c)}
          >
            {c}
          </div>
        ))}
      </div>

      <div className="section-pad">
        <div className="sec-label">
          Inventory <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="section-pad">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              {term ? 'No products match your search.' : (
                <>No inventory yet.<br />Tap + Add to get started.</>
              )}
            </div>
          </div>
        ) : (
          sorted.map((item) => {
            const isLow = item.qty <= item.min;
            const margin = item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0;
            const emoji = getEmoji(item.name);
            const u = item.unitInfo || { unit: 'Piece', plural: 'Pieces', piece: 'Piece', packSize: 1 };
            const qtyDisplay = Math.floor(item.qty);
            const unitLabel = qtyDisplay === 1 ? u.unit : u.plural;
            const pieceCount =
              u.packSize > 1 ? ` (${Math.round(qtyDisplay * u.packSize)} ${pluralize(u.piece, Math.round(qtyDisplay * u.packSize))})` : '';
            const priceUnit = u.packSize > 1 ? `/${u.unit.toLowerCase()}` : '';

            return (
              <div key={item.id} className={'item-card' + (isLow ? ' low' : '')}>
                <div className={'item-icon' + (isLow ? ' low-icon' : '')}>{emoji}</div>
                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    {item.cat && <span className="item-cat-badge">{item.cat}</span>}
                    <span className="item-price">{fmtMoney(item.price)}{priceUnit}</span>
                    <span className="item-qty">
                      <b>{qtyDisplay} {unitLabel}</b>{pieceCount}
                    </span>
                    <span className={'margin-pill' + (margin <= 0 ? ' neg' : '')}>{margin}%</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-edit" title="Edit" onClick={() => onEdit(item)}>
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="btn-restock" title="Restock" onClick={() => handleRestock(item)}>
                    <i className="fa-solid fa-plus" />
                  </button>
                  <button className="btn-sell" disabled title="Coming with the Sales tab" style={{ opacity: 0.4 }}>
                    SELL
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
