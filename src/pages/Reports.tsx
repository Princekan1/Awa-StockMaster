import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Clock,
  ShoppingCart,
  FileText,
  Download,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getStockStatus, getExpiryStatus, formatNaira } from '../lib/logic';
import Header from '../components/Header';

const REPORTS = [
  {
    to: '/inventory',
    title: 'Stock Summary',
    desc: 'View full inventory levels',
    icon: Package,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    to: '/alerts?filter=low',
    title: 'Low Stock Report',
    desc: 'Items below minimum stock',
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    to: '/alerts?filter=expiring',
    title: 'Expiry Report',
    desc: 'Items expiring soon',
    icon: Clock,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    to: '/sales-history',
    title: 'Sales Report',
    desc: 'View sales summary',
    icon: ShoppingCart,
    color: 'bg-emerald-50 text-emerald-600',
  },
];

type Range = 'week' | 'month' | 'year';


function rangeStart(range: Range): Date {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (range === 'month') {
    start.setDate(1);
  } else {
    start.setMonth(0, 1);
  }
  return start;
}

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default function Reports() {
  const products = useInventoryStore((s) => s.products);
  const expiryWarningDays = useInventoryStore((s) => s.settings?.expiryWarningDays ?? 30);
  const sales = useInventoryStore((s) => s.sales);
  const [range, setRange] = useState<Range>('month');

  const rangeLabel = { week: 'This Week', month: 'This Month', year: 'This Year' }[range];

  const salesInRange = useMemo(() => {
    const start = rangeStart(range);
    return sales.filter((s) => new Date(s.createdAt) >= start);
  }, [sales, range]);

  const summary = useMemo(() => {
    let low = 0;
    let out = 0;
    let expiring = 0;
    for (const p of products) {
      if (p.archived) continue;
      const status = getStockStatus(p);
      if (status === 'LOW_STOCK') low++;
      if (status === 'OUT_OF_STOCK') out++;
      if (getExpiryStatus(p.expiryDate, expiryWarningDays) === 'EXPIRING_SOON') expiring++;
    }
    const salesTotal = salesInRange.reduce((sum, s) => sum + s.total, 0);
    const costTotal = salesInRange.reduce((sum, s) => sum + s.unitCost * s.quantity, 0);
    const profitTotal = salesInRange.reduce((sum, s) => sum + s.profit, 0);
    return {
      totalProducts: products.filter((p) => !p.archived).length,
      totalUnits: products.filter((p) => !p.archived).reduce((sum, p) => sum + p.quantity, 0),
      low,
      out,
      expiring,
      salesTotal,
      salesCount: salesInRange.length,
      costTotal, profitTotal,
    };
  }, [products, salesInRange]);

  function handleExport() {
    const lines: string[] = [];
    const today = new Date().toLocaleDateString('en-GB');

    lines.push(csvCell(`Shop Inventory Report — ${rangeLabel} — Generated ${today}`));
    lines.push('');
    lines.push('Summary');
    lines.push(['Metric', 'Value'].map(csvCell).join(','));
    lines.push(['Total Products', summary.totalProducts].map(csvCell).join(','));
    lines.push(['Total Units In Stock', summary.totalUnits].map(csvCell).join(','));
    lines.push(['Low Stock Items', summary.low].map(csvCell).join(','));
    lines.push(['Out of Stock Items', summary.out].map(csvCell).join(','));
    lines.push(['Expiring Soon (≤4 months)', summary.expiring].map(csvCell).join(','));
    lines.push(
      [`Sales Total (${rangeLabel})`, formatNaira(summary.salesTotal)].map(csvCell).join(','),
    );
    lines.push([`Sales Count (${rangeLabel})`, summary.salesCount].map(csvCell).join(','));
    lines.push([`Cost of Goods Sold (${rangeLabel})`, formatNaira(summary.costTotal)].map(csvCell).join(','));
    lines.push([`Gross Profit (${rangeLabel})`, formatNaira(summary.profitTotal)].map(csvCell).join(','));
    lines.push('');

    lines.push('Products');
    lines.push(
      ['Name', 'Category', 'Barcode', 'Cost Price', 'Selling Price', 'Quantity', 'Minimum Stock', 'Expiry Date', 'Status']
        .map(csvCell)
        .join(','),
    );
    for (const p of products) {
      if (p.archived) continue;
      lines.push(
        [
          p.name,
          p.category,
          p.barcode || '',
          p.costPrice,
          p.price,
          p.quantity,
          p.minimumStock,
          p.expiryDate || '',
          getStockStatus(p).replace('_', ' '),
        ]
          .map(csvCell)
          .join(','),
      );
    }

    if (salesInRange.length > 0) {
      lines.push('');
      lines.push(`Sales (${rangeLabel})`);
      lines.push(['Product', 'Quantity', 'Unit Price', 'Total', 'Date'].map(csvCell).join(','));
      for (const s of salesInRange) {
        lines.push(
          [
            s.productName,
            s.quantity,
            s.unitPrice,
            s.total,
            new Date(s.createdAt).toLocaleString('en-GB'),
          ]
            .map(csvCell)
            .join(','),
        );
      }
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <Header title="Reports" subtitle="Inventory and sales summaries" />

      <div className="flex items-center justify-between mb-5">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--color-line)' }}
        >
          <option value="month">This Month</option>
          <option value="week">This Week</option>
          <option value="year">This Year</option>
        </select>
        <button type="button" onClick={handleExport} className="btn-secondary text-sm gap-1.5">
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.title}
              to={r.to}
              className="ui-card ui-card-interactive p-5 flex items-start gap-4"
            >
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold text-[15px]">{r.title}</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{r.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="ui-card p-5 mt-5 flex items-center gap-3 text-sm text-[var(--color-ink-muted)]">
        <FileText size={18} />
        <span>
          "Export CSV" downloads a spreadsheet with your current stock summary and{' '}
          {rangeLabel.toLowerCase()}'s sales — open it in Excel, Google Sheets, or Numbers.
        </span>
      </div>
    </div>
  );
}
