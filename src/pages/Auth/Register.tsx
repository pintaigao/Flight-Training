import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';
import './Auth.scss';

export default function Register() {
  const { dispatch } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes('@')) {
        setError('Please enter a valid email.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      const me = await AuthApi.register({ email: normalized, password });
      dispatch({ type: 'SET_AUTH_USER', user: me });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.body?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap relative min-h-screen overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(58,169,255,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_25%,rgba(139,92,246,0.14),transparent_55%),radial-gradient(900px_circle_at_35%_95%,rgba(34,197,94,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
      <div className="auth-card card relative w-full rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 shadow-[var(--shadow)]">
        <div className="auth-head">
          <h1 className="auth-title text-3xl font-extrabold tracking-tight">
            Create account
          </h1>
          <div className="auth-subtitle mt-1 text-sm text-[var(--muted)]">
            Create an account to sync your flights across devices.
          </div>
        </div>

        <form onSubmit={onSubmit} className="auth-form mt-6 space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-[color:var(--muted)]"
              htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <label
                className="text-sm font-semibold text-[color:var(--muted)]"
                htmlFor="register-password">
                Password
              </label>
              <div className="text-xs text-[color:var(--muted)]">min 8 chars</div>
            </div>
            <div className="relative">
              <input
                id="register-password"
                className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 pr-12 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-xl text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--text)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-[color:var(--muted)]"
              htmlFor="register-confirm">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="register-confirm"
                className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 pr-12 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="••••••••"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-xl text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--text)]"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((v) => !v)}>
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <span className="mt-[1px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-extrabold">
                !
              </span>
              <div className="leading-5">{error}</div>
            </div>
          )}

          <div className="auth-actions space-y-3 pt-1">
            <button
              className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white shadow-[0_10px_30px_rgba(58,169,255,0.18)] transition hover:-translate-y-[1px] hover:bg-[var(--accent2)] hover:shadow-[0_12px_34px_rgba(58,169,255,0.24)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              type="submit"
              disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
            <div className="text-center text-sm text-[color:var(--muted)]">
              Already have an account?{' '}
              <Link
                className="auth-link font-semibold text-[var(--accent)] hover:underline"
                to="/login">
                Back to login
              </Link>
            </div>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
