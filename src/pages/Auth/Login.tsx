import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';
import './Auth.scss';

export default function Login() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const s = location.state as any;
    return s?.from?.pathname ?? '/';
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await AuthApi.login({ email: email.trim().toLowerCase(), password });
      dispatch({ type: 'SET_AUTH_USER', user: me });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.body?.message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
      <div className="auth-card card w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="auth-head">
          <h1 className="auth-title text-2xl font-extrabold tracking-tight">
            Log in
          </h1>
          <div className="auth-subtitle mt-1 text-sm text-[var(--muted)]">
            Sign in to access your flights and notes.
          </div>
        </div>

        <form onSubmit={onSubmit} className="auth-form space-y-3">
          <input
            className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="error text-sm text-red-400">{error}</div>}

          <div className="auth-actions flex items-center justify-between pt-2">
            <button
              className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </button>
            <Link
              className="auth-link text-sm font-semibold text-[var(--accent)] hover:underline"
              to="/register">
              Create account
            </Link>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
