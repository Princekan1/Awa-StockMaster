import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { signOutUser, ensureUserProfile } from './lib/authService';
import * as db from './lib/db';
import { useInventoryStore } from './store/useInventoryStore';
import Sidebar from './components/Sidebar';
import MobileNavigation from './components/MobileNavigation';
import LoadingState from './components/LoadingState';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ProductNew from './pages/ProductNew';
import ReceiveStock from './pages/ReceiveStock';
import ProductDetail from './pages/ProductDetail';
import Sell from './pages/Sell';
import Alerts from './pages/Alerts';
import SalesHistory from './pages/SalesHistory';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

function OwnerOnly({ children }: { children: React.ReactNode }) {
  const role = useInventoryStore((s) => s.role);
  return role === 'owner' ? <>{children}</> : <Navigate to="/" replace />;
}

function ProtectedLayout() {
  const isAuthenticated = useInventoryStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products/new" element={<OwnerOnly><ProductNew /></OwnerOnly>} />
          <Route path="/stock/receive" element={<OwnerOnly><ReceiveStock /></OwnerOnly>} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/sales-history" element={<SalesHistory />} />
          <Route path="/reports" element={<OwnerOnly><Reports /></OwnerOnly>} />
          <Route path="/settings" element={<Settings />} />
          {/* Old bottom-nav "More" link — keep redirecting so bookmarks/PWA shortcuts don't break */}
          <Route path="/more" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileNavigation />
    </div>
  );
}

export default function App() {
  const hydrate = useInventoryStore((s) => s.hydrate);
  const hydrated = useInventoryStore((s) => s.hydrated);
  const hydrationError = useInventoryStore((s) => s.hydrationError);
  const isAuthenticated = useInventoryStore((s) => s.isAuthenticated);
  const authLoading = useInventoryStore((s) => s.authLoading);
  const setAuthUser = useInventoryStore((s) => s.setAuthUser);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleOnline = () => useInventoryStore.getState().setOnline(true);
    const handleOffline = () => useInventoryStore.getState().setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Fires once immediately with the current user (or null), then again on
    // every sign-in/sign-out. Firestore is queried for the user's role so we
    // know whether to route them as Owner or Staff.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        return;
      }
      try {
        const profile = await ensureUserProfile(user);
        setAuthUser(profile);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // A previously authenticated user must still be able to open the app
        // with cached shop data when the device is offline. We only fall back
        // to the cached profile while offline; online failures remain fail-safe
        // so disabled staff cannot bypass the server-side authorization check.
        if (!navigator.onLine) {
          const cached = await db.getCachedAuthProfile();
          if (cached && cached.uid === user.uid) {
            await setAuthUser(cached);
            return;
          }
        }
        await signOutUser().catch(() => undefined);
        setAuthUser(null);
      }
    });
    return unsubscribe;
  }, [setAuthUser]);

  if (authLoading) {
    return <LoadingState label="Signing you in…" />;
  }

  if (hydrationError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen py-24 px-6 text-center">
        <div className="text-sm font-semibold text-[var(--color-red)]">
          Couldn't load your shop data
        </div>
        <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">{hydrationError}</p>
        <button type="button" onClick={() => hydrate()} className="btn-primary mt-2">
          Try again
        </button>
      </div>
    );
  }

  if (!hydrated) {
    return <LoadingState label="Loading your shop data…" />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
