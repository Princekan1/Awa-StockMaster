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

  // ── Sales / debtor / expense actions get added the same way as you port each tab ──

  const value = useMemo(
    () => ({
      inv, setInv, addProduct, updateProduct, deleteProduct, restockProduct,
      sales, setSales,
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
