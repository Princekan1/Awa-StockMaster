import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Bell,
  Settings,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';

const OWNER_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Products', icon: Package },
  { to: '/sales-history', label: 'Sales', icon: ShoppingCart },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const STAFF_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sell', label: 'Sell Item', icon: ShoppingCart },
  { to: '/inventory', label: 'Products', icon: Package },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNavigation() {
  const role = useInventoryStore((s) => s.role);
  const links = role === 'owner' ? OWNER_LINKS : STAFF_LINKS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t safe-bottom"
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderColor: 'var(--color-line)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-stretch">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={'end' in link ? link.end : false}
              className={({ isActive }) =>
                `relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-ink-muted)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-1 h-0.5 w-6 rounded-full transition-all ${
                      isActive ? 'opacity-100 bg-[var(--color-brand)]' : 'opacity-0'
                    }`}
                  />
                  <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span>{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
