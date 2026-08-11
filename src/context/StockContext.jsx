import { createContext, useContext, useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const StockContext = createContext(null);

const DEFAULT_BIZ_PROFILE = { name: 'My Business', phone: '', address: '', emoji: '🏪' };
const DEFAULT_PREFS = { currency: '₦', defaultMin: 5 };

export function StockProvider({ children }) {
  const [inv, setInv] = useLocalStorageState('awa_inv', []);
  const [sales, setSales] = useLocalStorageState('awa_sales', []);
  const [restocks, setRestocks] = useLocalStorageState('awa_restocks', []);
  const [debtors, setDebtors] = useLocalStorageState('awa_debtors', []);
  const [expenses, setExpenses] = useLocalStorageState('awa_expenses', []);
  const [bizProfile, setBizProfile] = useLocalStorageState('awa_biz', DEFAULT_BIZ_PROFILE);
  const [prefs, setPrefs] = useLocalStorageState('awa_prefs', DEFAULT_PREFS);
  const [invoiceSeq, setInvoiceSeq] = useLocalStorageState('awa_inv_seq', 1);

  // ── Shared helpers (ported from the original file) ──
  const curSym = () => prefs.currency || '₦';
  const fmtMoney = (n) => curSym() + (n || 0).toLocaleString();
  const today = () => new Date().toLocaleDateString('en-NG');

  // ── Inventory actions ──
  const addProduct = (product) => {
    const id = crypto.randomUUID();
    setInv((prev) => [...prev, { ...product, id }]);
    if (product.qty > 0) logRestock(product.name, product.qty, product.unitInfo?.unit);
    return id;
  };
  const updateProduct = (id, updates) => {
    setInv((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && typeof updates.qty === 'number' && updates.qty > existing.qty) {
        logRestock(existing.name, updates.qty - existing.qty, (updates.unitInfo || existing.unitInfo)?.unit);
      }
      return prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
    });
  };
  const deleteProduct = (id) => {
    setInv((prev) => prev.filter((item) => item.id !== id));
  };
  const restockProduct = (id, addQty) => {
    const item = inv.find((i) => i.id === id);
    if (!item || !addQty) return;
    updateProduct(id, { qty: (item.qty || 0) + addQty });
  };
  const logRestock = (name, qty, unit) => {
    setRestocks((prev) => [
      {
        name,
        qty,
        unit: unit || 'pcs',
        time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
        date: today(),
      },
      ...prev,
    ]);
  };

  // ── Sales actions ──
  // Returns { sale } on success or { error } on failure — caller (SellModal) decides how to show it.
  const confirmSale = (product, { qty, unitMode, payMethod }) => {
    const u = product.unitInfo || { unit: 'Piece', plural: 'Pieces', piece: 'Piece', packSize: 1 };
    let newQty, revenue, profit, unitLabel;

    if (unitMode === 'piece' && u.packSize > 1) {
      const packFraction = qty / u.packSize;
      if (packFraction > product.qty + 0.001) return { error: 'Not enough stock!' };
      newQty = Math.max(0, product.qty - packFraction);
      const perPieceUnit = product.price / u.packSize;
      revenue = perPieceUnit * qty;
      profit = revenue - (product.cost / u.packSize) * qty;
      unitLabel = `${qty} ${u.piece}(s)`;
    } else {
      if (qty > product.qty + 0.001) return { error: 'Not enough stock!' };
      newQty = Math.max(0, product.qty - qty);
      revenue = product.price * qty;
      profit = revenue - product.cost * qty;
      unitLabel = `${qty} ${u.plural || u.unit}`;
    }

    const invNo = `INV-${String(invoiceSeq).padStart(5, '0')}`;
    setInvoiceSeq((n) => n + 1);

    const saleRecord = {
      id: crypto.randomUUID(),
      invNo,
      productId: product.id,
      name: product.name,
      price: revenue,
      unitPrice: product.price,
      qty,
      unitLabel,
      discount: 0,
      profit,
      payMethod,
      time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
      date: today(),
      unitMode,
      packSize: u.packSize,
    };

    setInv((prev) => prev.map((item) => (item.id === product.id ? { ...item, qty: newQty } : item)));
    setSales((prev) => [saleRecord, ...prev]);

    return { sale: saleRecord };
  };

  const voidSale = (saleId) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    setInv((prev) =>
      prev.map((item) => {
        if (item.id !== sale.productId) return item;
        const restored = sale.unitMode === 'piece' && sale.packSize > 1 ? sale.qty / sale.packSize : sale.qty;
        return { ...item, qty: item.qty + restored };
      })
    );
    setSales((prev) => prev.filter((s) => s.id !== saleId));
  };

  const value = useMemo(
    () => ({
      inv, setInv, addProduct, updateProduct, deleteProduct, restockProduct,
      sales, setSales, confirmSale, voidSale,
      restocks, setRestocks,
      debtors, setDebtors,
      expenses, setExpenses,
      bizProfile, setBizProfile,
      prefs, setPrefs,
      invoiceSeq, setInvoiceSeq,
      curSym, fmtMoney, today,
    }),
    [inv, sales, restocks, debtors, expenses, bizProfile, prefs, invoiceSeq]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) {
    throw new Error('useStock must be used inside a <StockProvider>');
  }
  return ctx;
}
