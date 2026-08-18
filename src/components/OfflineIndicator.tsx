import { useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';

export default function OfflineIndicator() {
  const isOnline = useInventoryStore((s) => s.isOnline);
  const setOnline = useInventoryStore((s) => s.setOnline);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [setOnline]);

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold shrink-0"
      style={{
        background: isOnline ? 'var(--color-green-soft)' : 'var(--color-amber-soft)',
        color: isOnline ? 'var(--color-green)' : '#b45309',
      }}
      title={
        isOnline
          ? 'Connected to the internet'
          : 'Working offline — data is saved on this device'
      }
    >
      {isOnline ? (
        <Wifi size={13} strokeWidth={2.5} />
      ) : (
        <WifiOff size={13} strokeWidth={2.5} />
      )}
      <span className="hidden sm:inline">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
