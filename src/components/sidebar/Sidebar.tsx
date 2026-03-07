import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import { logout as apiLogout } from '@/lib/api/auth.api';
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

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    dispatch({ type: 'SET_AUTH_USER', user: null });
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">✈</div>
        <div className="brand-text">
          <div className="brand-title">Flight Log</div>
          <div className="brand-sub">personal logbook</div>
        </div>
      </div>

      <nav className="nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
            end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              Signed in as{' '}
              <span style={{ color: 'rgba(255,255,255,0.86)' }}>
                {user.email}
              </span>
            </div>
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <div className="muted">MVP demo</div>
        )}
      </div>
    </aside>
  );
}
