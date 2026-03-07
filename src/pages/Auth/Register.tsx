import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import { register } from '@/lib/api/auth.api';
import './Auth.scss';

export default function Register() {
  const { dispatch } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
      const me = await register({ email: normalized, password });
      dispatch({ type: 'SET_AUTH_USER', user: me });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.body?.message ?? 'Registration failed.');
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
            Create account
          </h1>
          <div className="auth-subtitle mt-1 text-sm text-[var(--muted)]">
            Create an account to sync your flights across devices.
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
            placeholder="Password (min 8 chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            className="input h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />

          {error && <div className="error text-sm text-red-400">{error}</div>}

          <div className="auth-actions flex items-center justify-between pt-2">
            <button
              className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loading}>
              {loading ? 'Creating…' : 'Create'}
            </button>
            <Link
              className="auth-link text-sm font-semibold text-[var(--accent)] hover:underline"
              to="/login">
              Back to login
            </Link>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
