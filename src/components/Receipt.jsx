import { useStock } from '../context/StockContext';
import './Receipt.css';

export default function Receipt({ sale, onClose }) {
  const { fmtMoney, bizProfile } = useStock();

  const now = new Date();
  const dateLine =
    now.toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' + sale.time;
  const bizMeta = [bizProfile.phone, bizProfile.address].filter(Boolean).join(' · ');

  const shareToWhatsApp = () => {
    const biz = bizProfile.name || 'AWA StockMaster';
    const meta = [bizProfile.phone, bizProfile.address].filter(Boolean).join(' | ');
    const invLine = sale.invNo ? `Receipt #${sale.invNo}\n` : '';
    const discLine = sale.discount > 0 ? `Discount: -${fmtMoney(sale.discount)}\n` : '';
    const txt =
      `*RECEIPT — ${biz}*\n${meta ? meta + '\n' : ''}${invLine}${sale.date} ${sale.time}\n\n` +
      `Item: ${sale.name}\nQty: ${sale.unitLabel}\n` +
      `Payment: ${sale.payMethod}\n${discLine}\n` +
      `*TOTAL: ${fmtMoney(sale.price)}*\n\n_Thank you for your patronage!_`;
    window.open('https://wa.me/?text=' + encodeURIComponent(txt));
  };

  return (
    <div className="modal-overlay receipt-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="receipt-modal">
        <div className="receipt-header">
          <div className="receipt-brand">{bizProfile.name || 'StockMaster'}</div>
          {bizMeta && <div className="receipt-date">{bizMeta}</div>}
          {sale.invNo && <div className="receipt-date">Receipt #{sale.invNo}</div>}
          <div className="receipt-date">{dateLine}</div>
        </div>

        <hr className="receipt-divider" />

        <div className="receipt-row"><span>{sale.unitLabel}</span><b>{sale.name}</b></div>
        <div className="receipt-row"><span>Unit Price</span><b>{fmtMoney(sale.unitPrice)}</b></div>
        <div className="receipt-row"><span>Payment</span><b>{sale.payMethod}</b></div>
        {sale.discount > 0 && (
          <div className="receipt-row"><span>Discount</span><b style={{ color: 'var(--red)' }}>-{fmtMoney(sale.discount)}</b></div>
        )}

        <hr className="receipt-divider" />

        <div className="receipt-row total"><span>TOTAL</span><b>{fmtMoney(sale.price)}</b></div>

        <div className="receipt-footer">{bizProfile.name || 'AWA Inventory Pro'} · Thank you!</div>

        <div className="receipt-actions">
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button className="btn-confirm" onClick={shareToWhatsApp}>
            <i className="fa-brands fa-whatsapp" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
