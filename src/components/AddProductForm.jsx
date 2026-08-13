import { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import './AddProductForm.css';

const emptyForm = { name: '', sku: '', cat: '', cost: '', price: '', qty: '', min: '' };

export default function AddProductForm({ editingItem, onDone }) {
  const { addProduct, updateProduct, deleteProduct, prefs, curSym } = useStock();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        sku: editingItem.sku || '',
        cat: editingItem.cat || '',
        cost: editingItem.cost ?? '',
        price: editingItem.price ?? '',
        qty: editingItem.qty ?? '',
        min: editingItem.min ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingItem]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const profitPreview = (() => {
    const cost = parseFloat(form.cost);
    const price = parseFloat(form.price);
    if (isNaN(cost) || isNaN(price) || price <= 0) return null;
    const profit = price - cost;
    const margin = Math.round((profit / price) * 100);
    return { profit, margin };
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const cost = parseFloat(form.cost);
    const price = parseFloat(form.price);
    const qty = parseFloat(form.qty);
    const min = form.min !== '' ? parseInt(form.min, 10) : prefs.defaultMin;

    const nextErrors = {};
    if (!name) nextErrors.name = 'Enter a product name';
    if (isNaN(cost) || cost < 0) nextErrors.cost = 'Enter a valid cost';
    if (isNaN(price) || price <= 0) nextErrors.price = 'Selling price must be greater than 0';
    if (!isNaN(qty) && qty < 0) nextErrors.qty = 'Quantity cannot be negative';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const safeQty = isNaN(qty) ? 0 : qty;
    const payload = {
      name,
      sku: form.sku.trim(),
      cat: form.cat.trim(),
      cost: cost || 0,
      price,
      qty: safeQty,
      min,
      // Unit auto-detection (crates, packs, per-piece breakdowns) isn't ported
      // yet — every product defaults to a plain "Piece" unit for now.
      unitInfo: editingItem?.unitInfo || { unit: 'Piece', plural: 'Pieces', piece: 'Piece', packSize: 1 },
    };

    if (editingItem) {
      updateProduct(editingItem.id, payload);
    } else {
      addProduct(payload);
    }
    onDone();
  };

  const handleDelete = () => {
    if (!editingItem) return;
    const ok = window.confirm(`Delete "${editingItem.name}" permanently? This cannot be undone.`);
    if (ok) {
      deleteProduct(editingItem.id);
      onDone();
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-title">
        <i className={`fa-solid ${editingItem ? 'fa-pen-to-square' : 'fa-plus'}`} />
        {editingItem ? 'EDIT PRODUCT' : 'ADD PRODUCT'}
      </div>

      <div className="fgrp">
        <label className="flbl">Product Name *</label>
        <input
          className="finput"
          placeholder="e.g. Peak Milk Tin"
          value={form.name}
          onChange={setField('name')}
        />
        {errors.name && (
          <div className="field-err">
            <i className="fa-solid fa-circle-exclamation" /> {errors.name}
          </div>
        )}
      </div>

      <div className="frow">
        <div className="fgrp">
          <label className="flbl">SKU / Barcode</label>
          <input
            className="finput"
            placeholder="Optional"
            value={form.sku}
            onChange={setField('sku')}
          />
        </div>
        <div className="fgrp">
          <label className="flbl">Category</label>
          <input
            className="finput"
            placeholder="e.g. Beverages"
            value={form.cat}
            onChange={setField('cat')}
          />
        </div>
      </div>

      <div className="frow">
        <div className="fgrp">
          <label className="flbl">Cost Price ({curSym()}) *</label>
          <input
            className="finput"
            type="number"
            placeholder="0"
            value={form.cost}
            onChange={setField('cost')}
          />
          {errors.cost && (
            <div className="field-err">
              <i className="fa-solid fa-circle-exclamation" /> {errors.cost}
            </div>
          )}
        </div>
        <div className="fgrp">
          <label className="flbl">Selling Price ({curSym()}) *</label>
          <input
            className="finput"
            type="number"
            placeholder="0"
            value={form.price}
            onChange={setField('price')}
          />
          {errors.price && (
            <div className="field-err">
              <i className="fa-solid fa-circle-exclamation" /> {errors.price}
            </div>
          )}
        </div>
      </div>

      <div className="frow">
        <div className="fgrp">
          <label className="flbl">Quantity in Stock</label>
          <input
            className="finput"
            type="number"
            placeholder="0"
            value={form.qty}
            onChange={setField('qty')}
          />
          {errors.qty && (
            <div className="field-err">
              <i className="fa-solid fa-circle-exclamation" /> {errors.qty}
            </div>
          )}
        </div>
        <div className="fgrp">
          <label className="flbl">Low Stock Alert</label>
          <input
            className="finput"
            type="number"
            placeholder={String(prefs.defaultMin)}
            value={form.min}
            onChange={setField('min')}
          />
        </div>
      </div>

      {profitPreview && (
        <div className={'form-profit-preview' + (profitPreview.profit < 0 ? ' loss' : '')}>
          <i className={`fa-solid ${profitPreview.profit < 0 ? 'fa-triangle-exclamation' : 'fa-chart-line'}`} />
          Profit per unit: {curSym()}{profitPreview.profit.toLocaleString()} ({profitPreview.margin}% margin)
        </div>
      )}

      <button type="submit" className="btn-primary">
        {editingItem ? 'SAVE CHANGES' : 'ADD PRODUCT'}
      </button>

      {editingItem && (
        <button type="button" className="btn-delete" onClick={handleDelete}>
          <i className="fa-solid fa-trash" /> Delete Product
        </button>
      )}
    </form>
  );
}