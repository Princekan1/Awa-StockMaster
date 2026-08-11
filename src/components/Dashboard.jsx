import { useStock } from '../context/StockContext';
import { abbreviate } from '../utils/format';
import './Dashboard.css';

export default function Dashboard() {
  const { inv, sales, fmtMoney, curSym, today } = useStock();

  let revenue = 0;
  let profit = 0;
  let todayRevenue = 0;
  const td = today();
  sales.forEach((s) => {
    revenue += s.price;
    profit += s.profit;
    if (s.date === td) todayRevenue += s.price;
  });
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  let stockValue = 0;
  let lowCount = 0;
  inv.forEach((i) => {
    stockValue += (i.cost || 0) * (i.qty || 0);
    if (i.qty <= i.min) lowCount++;
  });

  return (
    <div className="dash">
      <div className="revenue-hero">
        <div className="revenue-label">Total Sales Revenue</div>
        <div className="revenue-amount">{fmtMoney(revenue)}</div>
        <div className="revenue-sub">
          <span>
            Profit <b className={profit < 0 ? 'neg' : ''}>{fmtMoney(profit)}</b>
          </span>
          <span>
            Margin <b>{margin}%</b>
          </span>
          <span>
            Today <b>{fmtMoney(todayRevenue)}</b>
          </span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-tile st-amber">
          <div className="stat-tile-lbl">Stock Val</div>
          <div className="stat-tile-val">{curSym()}{abbreviate(stockValue)}</div>
        </div>
        <div className="stat-tile st-green">
          <div className="stat-tile-lbl">Products</div>
          <div className="stat-tile-val">{inv.length}</div>
        </div>
        <div className="stat-tile st-red">
          <div className="stat-tile-lbl">Low Stock</div>
          <div className="stat-tile-val">{lowCount}</div>
        </div>
      </div>
    </div>
  );
}
