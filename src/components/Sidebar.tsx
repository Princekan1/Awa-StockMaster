import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, AlertTriangle, Clock, BarChart3, ScanBarcode, Settings, LogOut, PackagePlus } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';

const OWNER_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Products', icon: Package },
  { to: '/sales-history', label: 'Sales', icon: ShoppingCart },
  { to: '/alerts?filter=low', label: 'Low Stock', icon: AlertTriangle },
  { to: '/alerts?filter=expiring', label: 'Expiry', icon: Clock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/stock/receive', label: 'Receive Stock', icon: PackagePlus },
  { to: '/settings', label: 'Settings', icon: Settings },
];
const STAFF_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sell', label: 'Sell Item', icon: ShoppingCart },
  { to: '/inventory', label: 'Products', icon: Package },
  { to: '/alerts?filter=low', label: 'Low Stock', icon: AlertTriangle },
  { to: '/alerts?filter=expiring', label: 'Expiring Soon', icon: Clock },
  { to: '/sales-history', label: 'Sales History', icon: BarChart3 },
  { to: '/sell', label: 'Scan Barcode', icon: ScanBarcode },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const role = useInventoryStore((s) => s.role);
  const userName = useInventoryStore((s) => s.userName);
  const isOnline = useInventoryStore((s) => s.isOnline);
  const syncStatus = useInventoryStore((s) => s.syncStatus);
  const lastSyncedAt = useInventoryStore((s) => s.lastSyncedAt);
  const pendingSyncCount = useInventoryStore((s) => s.pendingSyncCount);
  const syncError = useInventoryStore((s) => s.syncError);
  const logout = useInventoryStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const links = role === 'owner' ? OWNER_LINKS : STAFF_LINKS;
  const syncLabel = !isOnline ? 'Offline' : syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Sync failed' : syncStatus === 'synced' ? 'Synced' : 'Waiting to sync';
  const syncDot = !isOnline ? 'bg-amber-400' : syncStatus === 'error' ? 'bg-red-400' : syncStatus === 'syncing' ? 'bg-blue-400' : 'bg-emerald-400';

  function isActive(to: string, end = false) {
    const [path, query] = to.split('?');
    const pathMatch = end ? location.pathname === path : location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
    return pathMatch && (!query || location.search === `?${query}`);
  }
  async function handleLogout() { await logout(); navigate('/login'); }

  return <aside className="hidden md:flex md:flex-col w-[240px] shrink-0 h-screen sticky top-0" style={{ background: role === 'owner' ? '#0f172a' : 'var(--color-paper-raised)', borderRight: role === 'owner' ? 'none' : '1px solid var(--color-line)' }}>
    <div className={`flex items-center gap-3 px-4 py-5 border-b ${role === 'owner' ? 'border-white/10' : ''}`} style={{ borderColor: role === 'staff' ? 'var(--color-line)' : undefined }}><div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${role === 'owner' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{(userName || 'U').charAt(0).toUpperCase()}</div><div className="min-w-0"><p className={`text-sm font-semibold truncate ${role === 'owner' ? 'text-white' : 'text-[var(--color-ink)]'}`}>Welcome, {userName || (role === 'owner' ? 'Owner' : 'Staff')}</p><p className={`text-[11px] truncate ${role === 'owner' ? 'text-slate-400' : 'text-[var(--color-ink-muted)]'}`}>{role === 'owner' ? 'Owner' : 'Cashier'}</p></div></div>
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">{links.map((link) => { const Icon = link.icon; const active = isActive(link.to, 'end' in link ? link.end : false); return <NavLink key={link.to + link.label} to={link.to} end={'end' in link ? link.end : false} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${role === 'owner' ? (active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white') : (active ? 'bg-slate-100 text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)] hover:bg-slate-50')}`}><Icon size={17} strokeWidth={2} className="shrink-0 opacity-90"/><span className="truncate">{link.label}</span></NavLink>; })}</nav>
    <div className={`px-3 py-3 border-t space-y-2 ${role === 'owner' ? 'border-white/10' : ''}`} style={{ borderColor: role === 'staff' ? 'var(--color-line)' : undefined }}>
      <div className={`rounded-lg px-3 py-2.5 text-[11px] ${role === 'owner' ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-[var(--color-ink-muted)]'}`} title={syncError || undefined}><div className="flex items-center gap-1.5 mb-0.5"><span className={`h-1.5 w-1.5 rounded-full ${syncDot}`}/><span className="font-semibold">{syncLabel}</span>{pendingSyncCount > 0 && <span className="ml-auto">{pendingSyncCount} pending</span>}</div><p className={role === 'owner' ? 'text-slate-500' : 'text-slate-400'}>{!isOnline ? 'Changes stay on this device until online' : lastSyncedAt ? `Last sync: ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No successful sync yet'}</p></div>
      <button type="button" onClick={() => void handleLogout()} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium ${role === 'owner' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-[var(--color-ink-muted)] hover:bg-slate-50'}`}><LogOut size={17}/>Logout</button>
      <p className={`text-[10px] px-1 ${role === 'owner' ? 'text-slate-600' : 'text-slate-400'}`}>Awa Stock · v1.1.0</p>
    </div>
  </aside>;
}
