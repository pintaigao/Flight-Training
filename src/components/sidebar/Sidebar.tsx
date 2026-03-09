import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { LayoutDashboard, Plane, Map as MapIcon, Waves } from 'lucide-react';
import './Sidebar.scss';

const nav = [
  { to: '/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/map', label: 'Map', icon: MapIcon },
] as const;

export default function Sidebar() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const user = state.auth.user;
  const { theme, toggle } = useTheme();

  async function logout() {
    try {
      await AuthApi.logout();
    } catch {
      // ignore
    }
    dispatch({ type: 'SET_AUTH_USER', user: null });
    dispatch({ type: 'SET_FLIGHTS', flights: [] });
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar relative flex h-full flex-col gap-4 border-b border-[var(--border)] bg-[color:var(--panel)] p-4 shadow-[var(--shadow)] lg:border-b-0 lg:border-r">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_10%_10%,rgba(58,169,255,0.10),transparent_55%),radial-gradient(900px_circle_at_95%_15%,rgba(139,92,246,0.06),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 backdrop-blur-[10px]" />

      <div className="sidebar-brand relative flex items-center gap-3">
        <div className="sidebar-logo flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgba(99,102,241,0.14)] ring-1 ring-[color:rgba(99,102,241,0.22)]">
          <Waves
            aria-hidden="true"
            className="h-6 w-6 text-[color:rgba(129,140,248,0.95)]"
            strokeWidth={2.4}
          />
        </div>
        <div>
          <div className="sidebar-title text-sm font-extrabold tracking-tight">
            Flight Log
          </div>
          <div className="sidebar-subtitle text-xs text-[var(--muted)]">
            personal logbook
          </div>
        </div>
      </div>

      <nav className="sidebar-nav relative flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'sidebar-link group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'sidebar-link--active border border-[color:rgba(99,102,241,0.22)] bg-[color:rgba(99,102,241,0.14)] text-[var(--text)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
                  : 'text-[var(--muted)] hover:bg-[color:var(--panel2)] hover:text-[var(--text)]',
              ].join(' ')
            }
            end={item.to === '/home'}>
            <item.icon
              aria-hidden="true"
              className="h-5 w-5 text-[color:var(--muted)] transition group-hover:text-[color:var(--text)]"
              strokeWidth={2.2}
            />
            <span className="leading-5">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer relative mt-auto space-y-3">
        {user ? (
          <div className="sidebar-meta flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:rgba(255,255,255,0.10)] ring-1 ring-[var(--border)]">
              <span className="text-sm font-extrabold">
                {user.email.trim().slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-5">
                {user.email}
              </div>
              <div className="text-xs text-[var(--muted)]">Signed in</div>
            </div>
          </div>
        ) : (
          <div className="sidebar-meta text-xs text-[var(--muted)]">MVP demo</div>
        )}

        <div className="sidebar-actions flex items-center gap-2">
          <button
            className="btn inline-flex h-10 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold transition hover:bg-[color:var(--panel)]"
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggle}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {user && (
            <button
              className="btn inline-flex h-10 flex-1 items-center justify-center rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold transition hover:bg-[color:var(--panel)]"
              onClick={logout}
              type="button">
              Log out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
