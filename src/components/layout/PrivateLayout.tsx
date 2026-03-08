import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import { LayoutProvider } from './LayoutContext';
import './PrivateLayout.scss';

export default function PrivateLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMapPage = location.pathname === '/map';

  const layoutValue = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed: () => setSidebarCollapsed((v) => !v),
    }),
    [sidebarCollapsed],
  );

  const gridTemplateColumns =
    sidebarCollapsed && isMapPage ? '0px 1fr' : '280px 1fr';

  return (
    <LayoutProvider value={layoutValue}>
      <div
        className="private-layout min-h-screen lg:grid"
        style={{ gridTemplateColumns }}>
        <div
          className={[
            'private-sidebar lg:sticky lg:top-0 lg:h-[100svh]',
            sidebarCollapsed && isMapPage
              ? 'lg:w-0 lg:overflow-hidden lg:pointer-events-none lg:opacity-0'
              : '',
          ].join(' ')}
          aria-hidden={sidebarCollapsed && isMapPage}>
          <Sidebar />
        </div>
        <main
          className={[
            'private-main',
            isMapPage ? 'h-[100svh] overflow-hidden p-0' : 'p-4 sm:p-6 lg:p-8',
          ].join(' ')}>
          <div
            className={[
              'private-inner w-full',
              isMapPage ? 'h-full max-w-none' : 'mx-auto max-w-6xl',
            ].join(' ')}>
            <Outlet />
          </div>
        </main>
      </div>
    </LayoutProvider>
  );
}
