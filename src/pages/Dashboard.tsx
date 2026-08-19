import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  PackageX,
  ShoppingCart,
  PackagePlus,
  ChevronRight,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const role = useInventoryStore((s) => s.role);
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const sales = useInventoryStore((s) => s.sales);

  const stats = useMemo(() => {
    let out = 0;
    let low = 0;
    let expiring = 0;

    const attentionItems: Array<{
      id: string;
      name: string;
      quantity: number;
      kind: 'OUT' | 'LOW' | 'EXPIRING';
      expiryDate: string | null;
    }> = [];

    for (const p of products) {
      if (p.archived) continue;
      const stock = getStockStatus(p);
      const expiry = getExpiryStatus(p.expiryDate, expiryWarningDays);

      if (stock === 'OUT_OF_STOCK') {
        out++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'OUT',
          expiryDate: p.expiryDate,
        });
      } else if (stock === 'LOW_STOCK') {
        low++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'LOW',
          expiryDate: p.expiryDate,
        });
      } else if (expiry === 'EXPIRING_SOON') {
        expiring++;
        attentionItems.push({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          kind: 'EXPIRING',
          expiryDate: p.expiryDate,
        });
      }
    }

    // Priority: OUT → LOW → EXPIRING, then by name
    attentionItems.sort((a, b) => {
      const order = { OUT: 0, LOW: 1, EXPIRING: 2 };
      if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
      return a.name.localeCompare(b.name);
    });

    const today = new Date().toDateString();
    const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
    const todayTotal = todaySales.reduce((sum, x) => sum + x.total, 0);

    return {
      out,
      low,
      expiring,
      alertCount: out + low + expiring,
      todayTotal,
      todayCount: todaySales.length,
      attentionItems: attentionItems.slice(0, 6),
      hasMoreAttention: attentionItems.length > 6,
    };
  }, [products, sales, expiryWarningDays]);

  const isOwner = role === 'owner';

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={isOwner ? 'What needs attention today' : "Today's activity & stock alerts"}
      />

      {/* 1. TODAY STRIP — one glance performance */}
      <section className="page-section">
        <div className="today-strip">
          <div className="today-cell">
            <span className="today-label">Today’s sales</span>
            <span className="today-value today-value-accent">
              {formatNaira(stats.todayTotal)}
            </span>
          </div>
          <div className="today-cell">
            <span className="today-label">Sales</span>
            <span className="today-value">{stats.todayCount}</span>
          </div>
          <div className="today-cell">
            <span className="today-label">Alerts</span>
            <span className="today-value">{stats.alertCount}</span>
          </div>
        </div>
      </section>

      {/* 2. NEEDS ATTENTION CHIPS — fast filters into problems */}
      <section className="page-section">
        <div className="section-head">
          <h2 className="section-title">Needs attention</h2>
        </div>
        <div className="attention-row">
          <Link
            to="/alerts?filter=out"
            className="attention-chip attention-chip-danger"
          >
            <PackageX size={15} strokeWidth={2.25} />
            Out of stock
            <span className="attention-chip-count">{stats.out}</span>
          </Link>
          <Link
            to="/alerts?filter=low"
            className="attention-chip attention-chip-warn"
          >
            <AlertTriangle size={15} strokeWidth={2.25} />
            Low stock
            <span className="attention-chip-count">{stats.low}</span>
          </Link>
          <Link
            to="/alerts?filter=expiring"
            className="attention-chip attention-chip-warn"
          >
            <Clock size={15} strokeWidth={2.25} />
            Expiring
            <span className="attention-chip-count">{stats.expiring}</span>
          </Link>
        </div>
      </section>

      {/* 3. ACTION LIST — actual products to deal with */}
      <section className="page-section">
        <div className="section-head">
          <h2 className="section-title">Action list</h2>
          {stats.alertCount > 0 && (
            <Link to="/alerts" className="section-link flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="action-list">
          {stats.attentionItems.length === 0 ? (
            <div className="empty-block">
              <p className="empty-title">Nothing needs attention</p>
              <p className="empty-sub">Stock levels and expiry look fine right now</p>
            </div>
          ) : (
            stats.attentionItems.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`} className="action-row">
                <div className="action-row-main">
                  <p className="action-row-title">{item.name}</p>
                  <p className="action-row-meta">
                    Qty: {item.quantity}
                    {item.kind === 'EXPIRING' && item.expiryDate
                      ? ` · Exp ${new Date(item.expiryDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                <div className="action-row-badge">
                  <StatusBadge
                    status={
                      item.kind === 'OUT'
                        ? 'OUT_OF_STOCK'
                        : item.kind === 'LOW'
                          ? 'LOW_STOCK'
                          : 'LOW_STOCK'
                    }
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. PRIMARY ACTIONS — only the high-value ones */}
      <section className="page-section">
        <div className="cta-row">
          <Link to="/sell" className="cta-btn cta-btn-primary">
            <ShoppingCart size={16} strokeWidth={2.25} />
            Sell
          </Link>
          {isOwner ? (
            <Link to="/stock/receive" className="cta-btn cta-btn-secondary">
              <PackagePlus size={16} strokeWidth={2.25} />
              Receive stock
            </Link>
          ) : (
            <Link to="/inventory" className="cta-btn cta-btn-secondary">
              <PackageX size={16} strokeWidth={2.25} />
              Check stock
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
