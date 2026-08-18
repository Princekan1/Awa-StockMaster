import { useEffect, useState } from 'react';
import { Truck, Users, Store, RefreshCw, Plus, Trash2, ShieldCheck, Power, Save, Download, Upload } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatNaira } from '../lib/logic';
import { downloadBackup, parseBackupFile } from '../lib/backup';

const OWNER_TABS = [
  { key: 'suppliers', label: 'Suppliers', icon: Truck },
  { key: 'users', label: 'Staff', icon: Users },
  { key: 'business', label: 'Business', icon: Store },
  { key: 'sync', label: 'Sync', icon: RefreshCw },
  { key: 'data', label: 'Data', icon: Download },
] as const;
const STAFF_TABS = [{ key: 'sync', label: 'Sync', icon: RefreshCw }] as const;

type Tab = (typeof OWNER_TABS)[number]['key'] | 'profile';

export default function Settings() {
  const role = useInventoryStore((s) => s.role);
  const settings = useInventoryStore((s) => s.settings);
  const suppliers = useInventoryStore((s) => s.suppliers);
  const staff = useInventoryStore((s) => s.staff);
  const isOnline = useInventoryStore((s) => s.isOnline);
  const syncStatus = useInventoryStore((s) => s.syncStatus);
  const syncError = useInventoryStore((s) => s.syncError);
  const lastSyncedAt = useInventoryStore((s) => s.lastSyncedAt);
  const pendingSyncCount = useInventoryStore((s) => s.pendingSyncCount);
  const userName = useInventoryStore((s) => s.userName);
  const email = useInventoryStore((s) => s.email);
  const updateBusinessSettings = useInventoryStore((s) => s.updateBusinessSettings);
  const addSupplier = useInventoryStore((s) => s.addSupplier);
  const deleteSupplier = useInventoryStore((s) => s.deleteSupplier);
  const inviteStaff = useInventoryStore((s) => s.inviteStaff);
  const setStaffStatus = useInventoryStore((s) => s.setStaffStatus);
  const syncCloud = useInventoryStore((s) => s.syncCloud);
  const restoreBackup = useInventoryStore((s) => s.restoreBackup);
  const products = useInventoryStore((s) => s.products);
  const sales = useInventoryStore((s) => s.sales);
  const movements = useInventoryStore((s) => s.movements);
  const shopId = useInventoryStore((s) => s.shopId);

  const tabs = role === 'owner' ? OWNER_TABS : STAFF_TABS;
  const [tab, setTab] = useState<Tab>(tabs[0].key);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState({ shopName: settings?.shopName ?? '', defaultMinimumStock: String(settings?.defaultMinimumStock ?? 5), expiryWarningDays: String(settings?.expiryWarningDays ?? 30) });
  const [supplier, setSupplier] = useState({ name: '', phone: '', leadTimeDays: '2' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => setBusiness({ shopName: settings?.shopName ?? '', defaultMinimumStock: String(settings?.defaultMinimumStock ?? 5), expiryWarningDays: String(settings?.expiryWarningDays ?? 30) }), [settings]);

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage('');
    try { await updateBusinessSettings({ shopName: business.shopName.trim() || 'My Shop', defaultMinimumStock: Math.max(0, Number(business.defaultMinimumStock) || 0), expiryWarningDays: Math.max(1, Number(business.expiryWarningDays) || 30) }); setMessage('Business settings saved.'); }
    finally { setSaving(false); }
  }

  async function handleStaff(e: React.FormEvent) {
    e.preventDefault(); setMessage('');
    const result = await inviteStaff(staffForm);
    setMessage(result.message);
    if (result.ok) { setStaffForm({ name: '', email: '' }); setStaffOpen(false); }
  }


  async function handleRestore(file: File) {
    if (!shopId || role !== 'owner') return;
    if (!confirm('Restore this backup? This will replace the shop data currently stored in Firestore. This cannot be undone.')) return;
    setRestoring(true);
    setMessage('');
    try {
      const backup = await parseBackupFile(file, shopId);
      const result = await restoreBackup(backup);
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not restore the backup.');
    } finally {
      setRestoring(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setMessage('');
    try {
      let status = syncStatus;
      if (isOnline && syncStatus !== 'syncing') {
        await syncCloud();
        status = useInventoryStore.getState().syncStatus;
      }
      const state = useInventoryStore.getState();
      if (isOnline && status !== 'synced') {
        throw new Error('Cloud sync did not complete successfully. Fix the sync issue before creating a cloud-backed backup.');
      }
      downloadBackup({
        schemaVersion: 2,
        app: 'Awa Stock',
        exportedAt: new Date().toISOString(),
        shopId: state.shopId!,
        shopName: state.settings?.shopName ?? 'My Shop',
        lastSyncedAt: state.lastSyncedAt,
        syncStatus: status,
        backupSource: isOnline ? 'synced-cloud' : 'local-offline',
        recordCounts: { products: state.products.length, sales: state.sales.length, movements: state.movements.length, suppliers: state.suppliers.length, staff: state.staff.length },
        products: state.products,
        sales: state.sales,
        movements: state.movements,
        suppliers: state.suppliers,
        staff: state.staff,
        settings: state.settings,
      });
      setMessage(isOnline ? 'Backup downloaded from successfully synced shop data.' : 'Offline backup downloaded from this device. Sync it when you reconnect.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create the backup.');
    } finally {
      setExporting(false);
    }
  }


  return (
    <div className="max-w-3xl">
      <Header title="Settings" subtitle="Manage your shop, staff, suppliers and synchronization" />
      <div className="flex gap-1 overflow-x-auto border-b mb-5" style={{ borderColor: 'var(--color-line)' }}>
        {tabs.map((t) => { const Icon = t.icon; return <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 ${tab === t.key ? 'text-[var(--color-brand)] border-[var(--color-brand)]' : 'text-[var(--color-ink-muted)] border-transparent'}`}><Icon size={14} className="inline mr-1.5"/>{t.label}</button>; })}
      </div>

      {message && <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: 'var(--color-blue-soft)', color: 'var(--color-blue)' }}>{message}</div>}

      {tab === 'business' && role === 'owner' && <section className="ui-card p-5"><div className="flex items-center gap-3 mb-5"><Store size={20}/><div><h2 className="font-display font-bold">Business information</h2><p className="text-xs text-[var(--color-ink-muted)]">These settings are stored with your shop.</p></div></div><form onSubmit={saveBusiness} className="space-y-4"><label className="block"><span className="label">Shop name</span><input value={business.shopName} onChange={(e) => setBusiness({ ...business, shopName: e.target.value })} className="field" placeholder="Awa Mini Mart"/></label><div className="grid sm:grid-cols-2 gap-3"><label><span className="label">Default minimum stock</span><input type="number" min="0" value={business.defaultMinimumStock} onChange={(e) => setBusiness({ ...business, defaultMinimumStock: e.target.value })} className="field"/></label><label><span className="label">Expiry warning (days)</span><input type="number" min="1" value={business.expiryWarningDays} onChange={(e) => setBusiness({ ...business, expiryWarningDays: e.target.value })} className="field"/></label></div><p className="text-xs text-[var(--color-ink-muted)]">Currency: <strong>NGN</strong> · Example: {formatNaira(10000)}</p><button disabled={saving} className="btn-primary"><Save size={15}/>{saving ? 'Saving…' : 'Save changes'}</button></form></section>}

      {tab === 'suppliers' && role === 'owner' && <section className="ui-card overflow-hidden"><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-line)' }}><div><h2 className="font-display font-bold">Suppliers</h2><p className="text-xs text-[var(--color-ink-muted)]">Stored in the shop database.</p></div><button className="btn-primary text-xs" onClick={() => setSupplierOpen(true)}><Plus size={15}/> Add supplier</button></div>{suppliers.length === 0 ? <EmptyState title="No suppliers yet" description="Add your regular suppliers here."/> : <div className="divide-y">{suppliers.map((s) => <div key={s.id} className="p-4 flex items-center justify-between gap-3"><div><p className="font-semibold text-sm">{s.name}</p><p className="text-xs text-[var(--color-ink-muted)]">{s.phone || 'No phone'} · {s.leadTimeDays} day lead time</p></div><button className="p-2 text-[var(--color-red)]" onClick={() => { if (confirm(`Remove ${s.name}?`)) deleteSupplier(s.id); }}><Trash2 size={16}/></button></div>)}</div>}</section>}

      {tab === 'users' && role === 'owner' && <section className="ui-card overflow-hidden"><div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-line)' }}><div><h2 className="font-display font-bold">Staff access</h2><p className="text-xs text-[var(--color-ink-muted)]">Staff sign in with the invited email.</p></div><button className="btn-primary text-xs" onClick={() => setStaffOpen(true)}><Plus size={15}/> Invite staff</button></div>{staff.length === 0 ? <EmptyState title="No staff yet" description="Invite a cashier by email."/> : <div className="divide-y">{staff.map((s) => <div key={s.id} className="p-4 flex items-center justify-between gap-3"><div><p className="font-semibold text-sm">{s.name}</p><p className="text-xs text-[var(--color-ink-muted)]">{s.email} · {s.status}</p></div><button className="btn-secondary text-xs" onClick={() => void setStaffStatus(s.id, s.status === 'active' ? 'inactive' : 'active')}><Power size={14}/>{s.status === 'active' ? 'Disable' : 'Enable'}</button></div>)}</div>}</section>}

      {tab === 'sync' && <section className="ui-card p-5"><div className="flex items-center gap-3 mb-5"><ShieldCheck size={20}/><div><h2 className="font-display font-bold">Cloud synchronization</h2><p className="text-xs text-[var(--color-ink-muted)]">Internet connection and cloud synchronization are tracked separately.</p></div></div><div className="space-y-3 text-sm"><Row label="Internet" value={isOnline ? 'Online' : 'Offline'}/><Row label="Cloud" value={syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Sync failed' : isOnline ? 'Waiting to sync' : 'Waiting for internet'}/><Row label="Changes waiting to sync" value={String(pendingSyncCount)}/><Row label="Last successful sync" value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('en-NG') : 'Not synced yet'}/>{syncError && <p className="rounded-lg p-3 text-xs" style={{ background: 'var(--color-red-soft)', color: 'var(--color-red)' }}>{syncError}</p>}<button type="button" disabled={!isOnline || syncStatus === 'syncing'} onClick={() => void syncCloud()} className="btn-primary"><RefreshCw size={15} className={syncStatus === 'syncing' ? 'animate-spin' : ''}/>{syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Retry sync' : 'Sync now'}</button></div></section>}

      {tab === 'data' && role === 'owner' && <section className="ui-card p-5"><div className="flex items-center gap-3 mb-5"><Download size={20}/><div><h2 className="font-display font-bold">Backup & data</h2><p className="text-xs text-[var(--color-ink-muted)]">Create a verified backup or restore a previous backup for this shop.</p></div></div><div className="space-y-4 text-sm"><div className="rounded-lg p-3" style={{ background: 'var(--color-blue-soft)', color: 'var(--color-ink)' }}><p className="font-semibold mb-1">Backup contents</p><p className="text-xs text-[var(--color-ink-muted)]">Products, sales, stock movements, suppliers, staff records and business settings.</p></div><div className="rounded-lg bg-slate-50 px-3 py-2.5"><Row label="Products" value={String(products.length)}/><Row label="Sales" value={String(sales.length)}/><Row label="Stock movements" value={String(movements.length)}/><Row label="Last sync" value={lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('en-NG') : 'Not synced yet'}/></div><button type="button" disabled={exporting || !shopId} onClick={() => void handleExport()} className="btn-primary"><Download size={15}/>{exporting ? 'Preparing backup…' : 'Download verified backup'}</button><label className={`btn-secondary justify-center ${restoring ? 'opacity-50 pointer-events-none' : ''}`}><Upload size={15}/>{restoring ? 'Restoring…' : 'Restore backup'}<input type="file" accept="application/json,.json" className="sr-only" disabled={restoring || !isOnline} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleRestore(file); e.currentTarget.value = ''; }}/></label><p className="text-xs text-[var(--color-ink-muted)]">Restore requires internet access and replaces the current cloud data for this shop. Always keep a separate backup before restoring.</p></div></section>}

      {role === 'staff' && <section className="ui-card p-5 mt-5"><h2 className="font-display font-bold mb-1">My account</h2><p className="text-sm">{userName}</p><p className="text-xs text-[var(--color-ink-muted)]">{email}</p><p className="text-xs text-[var(--color-ink-muted)] mt-2">Role: Staff / Cashier</p></section>}

      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title="Add supplier"><form onSubmit={(e) => { e.preventDefault(); if (!supplier.name.trim()) return; addSupplier({ name: supplier.name.trim(), phone: supplier.phone.trim(), leadTimeDays: Math.max(0, Number(supplier.leadTimeDays) || 0) }); setSupplier({ name: '', phone: '', leadTimeDays: '2' }); setSupplierOpen(false); }} className="space-y-3"><label><span className="label">Supplier name</span><input className="field" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}/></label><label><span className="label">Phone</span><input className="field" value={supplier.phone} onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}/></label><label><span className="label">Lead time (days)</span><input type="number" min="0" className="field" value={supplier.leadTimeDays} onChange={(e) => setSupplier({ ...supplier, leadTimeDays: e.target.value })}/></label><button className="btn-primary w-full">Save supplier</button></form></Modal>
      <Modal open={staffOpen} onClose={() => setStaffOpen(false)} title="Invite staff"><form onSubmit={(e) => void handleStaff(e)} className="space-y-3"><p className="text-xs text-[var(--color-ink-muted)]">The staff member must create or use a Firebase account with this exact email address.</p><label><span className="label">Staff name</span><input className="field" required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}/></label><label><span className="label">Email</span><input type="email" className="field" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}/></label><button className="btn-primary w-full">Create invitation</button></form></Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"><span className="text-[var(--color-ink-muted)]">{label}</span><strong className="capitalize">{value}</strong></div>; }
