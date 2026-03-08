import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';
import { useTheme } from '@/lib/theme/ThemeProvider';
import './Sidebar.scss';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/map', label: 'Map' },
];

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
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar flex h-full flex-col gap-4 border-b border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] lg:border-b-0 lg:border-r">
      <div className="sidebar-brand flex items-center gap-3">
        <div className="sidebar-logo flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.14)] font-extrabold">
          FL
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

      <nav className="sidebar-nav flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'sidebar-link rounded-xl px-3 py-2 text-sm font-semibold',
                isActive
                  ? 'sidebar-link--active border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.14)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:bg-[color:var(--panel2)] hover:text-[var(--text)]',
              ].join(' ')
            }
            end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer mt-auto space-y-2">
        {user ? (
          <div className="sidebar-meta text-xs text-[var(--muted)]">
            Signed in as{' '}
            <b>{user.email}</b>
          </div>
        ) : (
          <div className="sidebar-meta text-xs text-[var(--muted)]">MVP demo</div>
        )}

        <div className="sidebar-actions flex items-center gap-2">
          <button
            className="btn inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)]"
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggle}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {user && (
            <button
              className="btn inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)]"
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
