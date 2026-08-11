import './NavTabs.css';

const TABS = [
  { id: 'inventory', label: 'Stock', icon: 'fa-box-open' },
  { id: 'add', label: 'Add', icon: 'fa-plus' },
  { id: 'reports', label: 'Reports', icon: 'fa-chart-bar' },
  { id: 'debtors', label: 'Debtors', icon: 'fa-users' },
  { id: 'expenses', label: 'Expenses', icon: 'fa-receipt' },
  { id: 'more', label: 'More', icon: 'fa-ellipsis' },
];

export default function NavTabs({ activeTab, onTabChange, lowStockCount = 0 }) {
  return (
    <div className="nav-tabs">
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          className={'nav-tab' + (activeTab === id ? ' active' : '')}
          onClick={() => onTabChange(id)}
        >
          <i className={`fa-solid ${icon}`} />
          {label}
          {id === 'inventory' && lowStockCount > 0 && (
            <span className="low-badge">{lowStockCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
