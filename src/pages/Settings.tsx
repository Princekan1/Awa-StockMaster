import { useEffect, useState } from 'react';
import {
  LogOut,
  Users,
  Truck,
  Building2,
  RefreshCw,
  Plus,
  User,
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import Header from '../components/Header';
import Modal from '../components/Modal';

type Tab = 'suppliers' | 'staff' | 'business' | 'sync';

export default function Settings() {
  const role = useInventoryStore((s) => s.role);
  const userName = useInventoryStore((s) => s.userName);
  const email = useInventoryStore((s) => s.email);
  const logout = useInventoryStore((s) => s.logout);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const staff = useInventoryStore((s) => s.staff);
  const settings = useInventoryStore((s) => s.settings);
  const isOnline = useInventoryStore((s) => s.isOnline);
  const syncStatus = useInventoryStore((s) => s.syncStatus);
  const lastSyncedAt = useInventoryStore((s) => s.lastSyncedAt);
  const pendingSyncCount = useInventoryStore((s) => s.pendingSyncCount);
  const syncCloud = useInventoryStore((s) => s.syncCloud);
  const addSupplier = useInventoryStore((s) => s.addSupplier);
  const inviteStaff = useInventoryStore((s) => s.inviteStaff);
  const updateBusinessSettings = useInventoryStore((s) => s.updateBusinessSettings);

  const [tab, setTab] = useState<Tab>('suppliers');
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierLeadTime, setSupplierLeadTime] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [expiryWarningDays, setExpiryWarningDays] = useState('30');
  const [businessMessage, setBusinessMessage] = useState('');

  const isOwner = role === 'owner';

  useEffect(() => {
    setShopName(settings?.shopName ?? '');
    setMinimumStock(String(settings?.defaultMinimumStock ?? 5));
    setExpiryWarningDays(String(settings?.expiryWarningDays ?? 30));
  }, [settings]);

  async function handleLogout() {
    if (!window.confirm('Log out of Awa Stock on this device?')) return;
    await logout();
    window.location.assign('/login');
  }

  function openSupplierModal() {
    setFormError('');
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierLeadTime('');
    setSupplierOpen(true);
  }

  function openStaffModal() {
    setFormError('');
    setStaffName('');
    setStaffEmail('');
    setStaffOpen(true);
  }

  function handleAddSupplier(event: React.FormEvent) {
    event.preventDefault();
    const name = supplierName.trim();
    if (!name) {
      setFormError('Enter the supplier name.');
      return;
    }
    const leadTimeDays = supplierLeadTime.trim() ? Number(supplierLeadTime) : 0;
    if (!Number.isInteger(leadTimeDays) || leadTimeDays < 0) {
      setFormError('Lead time must be a whole number of days.');
      return;
    }
    addSupplier({
      name,
      phone: supplierPhone.trim(),
      email: supplierEmail.trim() || undefined,
      leadTimeDays,
    });
    setSupplierOpen(false);
  }

  async function handleInviteStaff(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    const name = staffName.trim();
    const normalizedEmail = staffEmail.trim();
    if (!name) {
      setFormError('Enter the staff member name.');
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setFormError('Enter a valid staff email.');
      return;
    }

    setSaving(true);
    try {
      const result = await inviteStaff({ name, email: normalizedEmail });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setStaffOpen(false);
      window.alert(result.message);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not invite this staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBusiness(event: React.FormEvent) {
    event.preventDefault();
    setBusinessMessage('');
    const min = Number(minimumStock);
    const expiry = Number(expiryWarningDays);
    if (!shopName.trim()) {
      setBusinessMessage('Enter a shop name.');
      return;
    }
    if (!Number.isInteger(min) || min < 0 || !Number.isInteger(expiry) || expiry < 0) {
      setBusinessMessage('Minimum stock and expiry warning must be whole numbers.');
      return;
    }
    try {
      await updateBusinessSettings({
        shopName: shopName.trim(),
        defaultMinimumStock: min,
        expiryWarningDays: expiry,
      });
      setBusinessMessage('Business settings saved.');
    } catch (error) {
      setBusinessMessage(error instanceof Error ? error.message : 'Could not save business settings.');
    }
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Truck; ownerOnly?: boolean }> = [
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'staff', label: 'Staff', icon: Users, ownerOnly: true },
    { id: 'business', label: 'Business', icon: Building2, ownerOnly: true },
    { id: 'sync', label: 'Sync', icon: RefreshCw },
  ];

  const visibleTabs = tabs.filter((t) => !t.ownerOnly || isOwner);

  return (
    <div>
      <Header title="Settings" subtitle="Shop, staff, suppliers and sync" />

      <section className="page-section">
        <div
          className="rounded-2xl border bg-white p-3.5 shadow-sm"
          style={{ borderColor: 'var(--color-line)' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-muted)] text-sm font-bold text-[var(--color-brand)]">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{userName || 'User'}</p>
              <p className="text-xs text-[var(--color-ink-muted)] truncate">{email || '—'}</p>
              <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                {isOwner ? 'Owner' : 'Staff'}
              </p>
            </div>
          </div>

          {/* Mobile only: desktop logout lives in the sidebar. */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="md:hidden mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 active:scale-[0.99]"
          >
            <LogOut size={15} strokeWidth={2.25} />
            Log out
          </button>
        </div>
      </section>

      <section className="page-section">
        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm scrollbar-none" style={{ borderColor: 'var(--color-line)' }}>
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  active ? 'bg-[var(--color-brand-muted)] text-[var(--color-brand)]' : 'text-[var(--color-ink-muted)]'
                }`}
              >
                <Icon size={14} strokeWidth={2.25} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="page-section">
        {tab === 'suppliers' && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            <div className="flex items-center justify-between border-b px-3.5 py-3" style={{ borderColor: 'var(--color-line)' }}>
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">Suppliers</p>
                <p className="text-xs text-[var(--color-ink-muted)]">Stored in this shop</p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={openSupplierModal}
                  className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Add
                </button>
              )}
            </div>

            {suppliers.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Truck size={24} className="mx-auto mb-2 text-[var(--color-ink-muted)]" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-[var(--color-ink)]">No suppliers yet</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Add suppliers to track who you buy from</p>
              </div>
            ) : (
              suppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 border-b px-3.5 py-3 last:border-b-0" style={{ borderColor: 'var(--color-line)' }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{s.name}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {s.phone || 'No phone'}{s.leadTimeDays ? ` · ${s.leadTimeDays}d lead` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'staff' && isOwner && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            <div className="flex items-center justify-between border-b px-3.5 py-3" style={{ borderColor: 'var(--color-line)' }}>
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">Staff</p>
                <p className="text-xs text-[var(--color-ink-muted)]">Invite by exact email</p>
              </div>
              <button
                type="button"
                onClick={openStaffModal}
                className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white active:scale-[0.98]"
              >
                <Plus size={14} strokeWidth={2.5} />
                Invite
              </button>
            </div>

            {staff.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <User size={24} className="mx-auto mb-2 text-[var(--color-ink-muted)]" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-[var(--color-ink)]">No staff yet</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Invite cashiers with their email address</p>
              </div>
            ) : (
              staff.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 border-b px-3.5 py-3 last:border-b-0" style={{ borderColor: 'var(--color-line)' }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{m.name || m.email}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] truncate">{m.email}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'business' && isOwner && (
          <form onSubmit={handleSaveBusiness} className="rounded-2xl border bg-white p-3.5 shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-sm font-bold text-[var(--color-ink)] mb-3">Business settings</p>
            <div className="space-y-3">
              <div>
                <label className="label">Shop name</label>
                <input className="field" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="My Shop" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label">Currency</label>
                  <input className="field" value="NGN" readOnly />
                </div>
                <div>
                  <label className="label">Min stock default</label>
                  <input className="field" type="number" min="0" step="1" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Expiry warning (days)</label>
                <input className="field" type="number" min="0" step="1" value={expiryWarningDays} onChange={(e) => setExpiryWarningDays(e.target.value)} />
              </div>
              {businessMessage && <p className="rounded-lg bg-slate-50 p-3 text-sm text-[var(--color-ink-muted)]">{businessMessage}</p>}
              <button type="submit" className="btn-primary w-full">Save business settings</button>
            </div>
          </form>
        )}

        {tab === 'sync' && (
          <div className="rounded-2xl border bg-white p-3.5 shadow-sm" style={{ borderColor: 'var(--color-line)' }}>
            <p className="text-sm font-bold text-[var(--color-ink)] mb-3">Synchronization</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between"><span className="text-[var(--color-ink-muted)]">Connection</span><span className={`font-semibold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>{isOnline ? 'Online' : 'Offline'}</span></div>
              <div className="flex items-center justify-between"><span className="text-[var(--color-ink-muted)]">Status</span><span className="font-semibold text-[var(--color-ink)] capitalize">{syncStatus}</span></div>
              <div className="flex items-center justify-between"><span className="text-[var(--color-ink-muted)]">Pending</span><span className="font-semibold text-[var(--color-ink)]">{pendingSyncCount}</span></div>
              <div className="flex items-center justify-between"><span className="text-[var(--color-ink-muted)]">Last sync</span><span className="font-semibold text-[var(--color-ink)]">{lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
            </div>
            <button type="button" onClick={() => void syncCloud()} disabled={!isOnline || syncStatus === 'syncing'} className="btn-primary mt-4 w-full">
              <RefreshCw size={15} strokeWidth={2.25} />
              {syncStatus === 'syncing' ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        )}
      </section>

      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title="Add Supplier">
        <form onSubmit={handleAddSupplier} className="space-y-4">
          <label><span className="label">Supplier name</span><input autoFocus className="field" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. ABC Distributors" /></label>
          <label><span className="label">Phone</span><input className="field" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="080…" /></label>
          <label><span className="label">Email (optional)</span><input type="email" className="field" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="supplier@example.com" /></label>
          <label><span className="label">Lead time (days)</span><input type="number" min="0" step="1" className="field" value={supplierLeadTime} onChange={(e) => setSupplierLeadTime(e.target.value)} placeholder="0" /></label>
          {formError && <p className="text-sm font-medium text-[var(--color-red)]">{formError}</p>}
          <button type="submit" className="btn-primary w-full">Add supplier</button>
        </form>
      </Modal>

      <Modal open={staffOpen} onClose={() => !saving && setStaffOpen(false)} title="Invite Staff">
        <form onSubmit={handleInviteStaff} className="space-y-4">
          <label><span className="label">Staff name</span><input autoFocus className="field" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. Ada Cashier" /></label>
          <label><span className="label">Email address</span><input type="email" className="field" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="cashier@example.com" /></label>
          {formError && <p className="text-sm font-medium text-[var(--color-red)]">{formError}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Inviting…' : 'Invite staff'}</button>
        </form>
      </Modal>
    </div>
  );
}
