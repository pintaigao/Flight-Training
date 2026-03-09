import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Waves } from 'lucide-react';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';
import './Auth.scss';

export default function Login() {
  const {dispatch} = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const me = await AuthApi.login({email: email.trim().toLowerCase(), password});
      dispatch({type: 'SET_AUTH_USER', user: me});
      navigate(from, {replace: true});
    } catch (err: any) {
      setError(err?.body?.message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="auth-wrap min-h-screen bg-[#0b1220]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_30%_20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(900px_circle_at_80%_70%,rgba(58,169,255,0.16),transparent_55%)]"/>
          
          <div className="auth-card relative w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <Waves size={20} strokeWidth={2.3} className="text-indigo-400" aria-hidden="true"/>
              </div>
              <div className="text-sm font-semibold text-white/70">
                Flight Log
              </div>
            </div>
            
            <div className="auth-head">
              <h1 className="auth-title text-3xl font-extrabold tracking-tight text-white"> Sign in to your account </h1>
              <div className="auth-subtitle mt-2 text-sm text-white/55">
                Not a member?{' '}
                <Link
                  className="auth-link font-semibold text-indigo-300 hover:text-indigo-200 hover:underline"
                  to="/register">
                  Create an account
                </Link>
              </div>
            </div>
            
            <form onSubmit={onSubmit} className="auth-form mt-10 space-y-6">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-white/80"
                  htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  className="input h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/35 outline-none transition focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"/>
              </div>
              
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-white/80"
                  htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className="input h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-white/35 outline-none transition focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"/>
              </div>
              
              {error && (
                <div className="error rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              
              <button
                className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-500 px-4 font-semibold text-white shadow-[0_14px_45px_rgba(99,102,241,0.30)] transition hover:bg-indigo-400 active:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-[url('/auth-hero.svg')] bg-cover bg-center"/>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#0b1220]/25"/>
        </div>
      </div>
    </div>
  );
}
