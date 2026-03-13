import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useStore } from '@/store/store';
import * as FlightApi from '@/lib/api/flight.api';
import Sidebar from '../sidebar/Sidebar';
import './PrivateLayout.scss';

export default function MainLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {state, dispatch} = useStore();
  const isMapPage = location.pathname === '/map';
  
  const gridTemplateColumns = sidebarCollapsed && isMapPage ? '0px 1fr' : '280px 1fr';
  
  useEffect(() => {
    if (state.auth.status !== 'authed' || !state.auth.user) return;
    if (state.flights.flightIds.length) return;
    
    let cancelled = false;
    FlightApi.getFlights().then((flights) => {
      if (cancelled) return;
      dispatch({type: 'SET_FLIGHTS', flights});
    })
    
    return () => { cancelled = true; };
  }, [dispatch, state.auth.status, state.auth.user?.id, state.flights.flightIds.length]);
  
  return (
    <div
      className="private-layout min-h-screen lg:grid"
      style={{gridTemplateColumns}}>
      <div
        className={['private-sidebar lg:sticky lg:top-0 lg:h-[100svh]', sidebarCollapsed && isMapPage ? 'lg:w-0 lg:overflow-hidden lg:pointer-events-none lg:opacity-0' : ''].join(' ')}
        aria-hidden={sidebarCollapsed && isMapPage}>
        <Sidebar/>
      </div>
      <main className={['private-main', isMapPage ? 'relative h-[100svh] overflow-hidden p-0' : 'p-4 sm:p-6 lg:p-8'].join(' ')}>
        {isMapPage && (
          <button
            className="absolute left-4 bottom-4 z-[5000] inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgba(10,16,28,0.78)] text-[color:rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-[color:rgba(10,16,28,0.86)]"
            type="button"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            onClick={() => setSidebarCollapsed((v) => !v)}>
            <Menu size={18} aria-hidden="true"/>
          </button>
        )}
        <div className={['private-inner w-full', isMapPage ? 'h-full max-w-none' : 'mx-auto max-w-6xl'].join(' ')}>
          <Outlet/>
        </div>
      </main>
    </div>
  );
}
