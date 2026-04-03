import { NavLink } from 'react-router-dom';
import { useStore } from '@/store/store';
import {
  Activity,
  LayoutDashboard,
  Plane,
  Map as MapIcon,
  StickyNote,
  Radar,
} from 'lucide-react';
import './Sidebar.scss';

const nav = [
  { to: '/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/live-aircraft', label: 'Live Aircraft', icon: Activity },
  { to: '/track-schedules', label: 'Track Monitor', icon: Radar },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/map', label: 'Map', icon: MapIcon },
] as const;

export default function Sidebar() {
  const { state } = useStore();
  const user = state.auth.user;
  const avatarInitial = user?.email.trim().slice(0, 1).toUpperCase() ?? '?';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              ['sidebar-link', isActive ? 'sidebar-link--active' : ''].join(' ')
            }
            aria-label={item.label}
            title={item.label}
            end={item.to === '/home'}
          >
            <item.icon
              aria-hidden="true"
              className="sidebar-linkIcon"
              strokeWidth={2.2}
            />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-avatar"
          aria-label={user?.email ?? 'Profile'}
          title={user?.email ?? 'Profile'}
        >
          <span>{avatarInitial}</span>
        </div>
      </div>
    </aside>
  );
}
