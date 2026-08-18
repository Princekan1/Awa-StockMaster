import { useState } from 'react';
import { ShoppingBag, User, Lock, Eye, EyeOff, Store, Loader2 } from 'lucide-react';
import { signInEmail, signUpEmail, signInGoogle, friendlyAuthError } from '../lib/authService';
import { isFirebaseConfigured } from '../lib/firebase';

export default function Login() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);

  // Navigation happens automatically: App.tsx listens for Firebase auth
  // state changes and routes signed-in users away from /login.

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy('email');
    try {
      if (mode === 'signUp') {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError('');
    setBusy('google');
    try {
      await signInGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — Windows / large screens */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 55%, #3b82f6 100%)' }}
      >
        <div className="flex items-center gap-2.5 relative z-10">
          <ShoppingBag size={28} strokeWidth={2} />
          <span className="font-display font-bold text-lg">Shop Inventory System</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Welcome Back,<br />Owner!
          </h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Sign in to manage your shop inventory with ease.
          </p>
        </div>

        <div className="relative z-10 text-sm text-blue-200/80">
          © 2026 Shop Inventory System · All rights reserved.
        </div>

        {/* Decorative shapes */}
        <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute right-20 top-1/3 w-40 h-40 rounded-full bg-white/5" />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg"
              style={{ background: 'var(--color-brand)' }}
            >
              <ShoppingBag size={28} />
            </div>
            <h1 className="font-display text-xl font-bold text-[var(--color-ink)]">
              Shop Inventory System
            </h1>
          </div>

          <div className="hidden lg:block text-center mb-8">
            <div
              className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-3 shadow-md"
              style={{ background: 'var(--color-brand)' }}
            >
              <ShoppingBag size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--color-ink)]">
              Shop Inventory System
            </h2>
          </div>

          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-50 border mb-6" style={{ borderColor: 'var(--color-line)' }}>
            <button
              type="button"
              onClick={() => { setMode('signIn'); setError(''); }}
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition"
              style={{
                background: mode === 'signIn' ? 'var(--color-brand)' : 'transparent',
                color: mode === 'signIn' ? 'white' : 'var(--color-ink-soft)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signUp'); setError(''); }}
              className="flex-1 rounded-lg py-2 text-sm font-semibold transition"
              style={{
                background: mode === 'signUp' ? 'var(--color-brand)' : 'transparent',
                color: mode === 'signUp' ? 'white' : 'var(--color-ink-soft)',
              }}
            >
              Create Account
            </button>
          </div>

          {!isFirebaseConfigured && (
            <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Firebase isn't configured yet. Copy <code>.env.example</code> to <code>.env</code> and
              add your project's keys before signing in.
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signUp' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]/25 focus:border-[var(--color-brand)]"
                    style={{ borderColor: 'var(--color-line)' }}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                Email
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border bg-white pl-10 pr-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]/25 focus:border-[var(--color-brand)]"
                  style={{ borderColor: 'var(--color-line)' }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signUp' ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full rounded-lg border bg-white pl-10 pr-11 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-brand)]/25 focus:border-[var(--color-brand)]"
                  style={{ borderColor: 'var(--color-line)' }}
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] p-0.5"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--color-red)] font-medium">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3 text-[15px] gap-2" disabled={busy !== null}>
              {busy === 'email' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Store size={18} />
              )}
              {mode === 'signUp' ? 'Create Account' : 'Login'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-line)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--color-paper)] px-3 text-[var(--color-ink-muted)]">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy !== null}
            className="btn-secondary w-full py-3 text-[15px] gap-2"
          >
            {busy === 'google' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-[var(--color-ink-muted)] mt-8">
            New accounts create a new shop as Owner. Staff should use an email invited by the shop owner.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.7 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
