import { NavLink } from 'react-router-dom';
import { useStore } from '@/store/store';
import { Activity, LayoutDashboard, Plane, Map as MapIcon, StickyNote, Radar, LogOut } from 'lucide-react';
import { useState } from "react";
import * as AuthApi from '@/lib/api/auth.api';
import './Sidebar.scss';

const nav = [
  {to: '/home', label: 'Dashboard', icon: LayoutDashboard},
  {to: '/flights', label: 'Flights', icon: Plane},
  {to: '/live-aircraft', label: 'Live Aircraft', icon: Activity},
  {to: '/track-schedules', label: 'Track Monitor', icon: Radar},
  {to: '/notes', label: 'Notes', icon: StickyNote},
  {to: '/map', label: 'Map', icon: MapIcon},
] as const;

export default function Sidebar() {
  const {state, dispatch} = useStore();
  const user = state.auth.user;
  const avatarInitial = user?.email.trim().slice(0, 1).toUpperCase() ?? '?';
  let [showProfileMenu, setShowProfileMenu] = useState(false);
  const profile = [
    {
      to: '/login', label: 'Login', icon: LogOut, onClick: async () => {
        await AuthApi.logout();
        
        dispatch({type: 'SET_AUTH_USER', user: null});
        dispatch({type: 'SET_AUTH_STATUS', status: 'anon'});
        dispatch({type: 'SET_FLIGHTS', flights: []});
      }
    },
  ] as const;
  
  let onClickProfile = () => {
    setShowProfileMenu(!showProfileMenu);
  }
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({isActive}) => ['sidebar-link', isActive ? 'sidebar-link--active' : ''].join(' ')}
            aria-label={item.label}
            title={item.label}
            end={item.to === '/home'}>
            <item.icon
              aria-hidden="true"
              className="sidebar-linkIcon"
              strokeWidth={2.2}/>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer flex flex-col items-center gap-4 absolute bottom-8">
        {showProfileMenu && profile.map((item) =>
          <NavLink
            key={item.to}
            to={item.to}
            className={({isActive}) => ['sidebar-link', isActive ? 'sidebar-link--active' : ''].join(' ')}
            aria-label={item.label}
            onClick={item.onClick}
            title={item.label}>
            <item.icon
              aria-hidden="true"
              className="sidebar-linkIcon"
              strokeWidth={2.2}/>
          </NavLink>
        )}
        <div
          onClick={onClickProfile}
          className="sidebar-avatar cursor-pointer"
          aria-label={user?.email ?? 'Profile'}
          title={user?.email ?? 'Profile'}>
          <span>{avatarInitial}</span>
        </div>
      </div>
    </aside>
  );
}
