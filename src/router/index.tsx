import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from '@/App';
import RequireAuth from '@/components/auth/RequireAuth';
import MainLayout from '@/components/layout/MainLayout';

import Dashboard from '@/pages/Dashboard/Dashboard';
import Flights from '@/pages/Flights/Flights';
import FlightDetail from '@/pages/Flights/FlightDetail/FlightDetail';
import MapExplorer from '@/pages/MapExplorer/MapExplorer';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';

/**
 * Centralized router config (React Router Data APIs).
 * - App is the root element (bootstraps auth session, then renders <Outlet/>)
 * - Private routes are nested under RequireAuth + MainLayout
 */
export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      {
        element: (
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: '/home', element: <Dashboard /> },
          { path: '/flights', element: <Flights /> },
          { path: '/flights/:id', element: <FlightDetail /> },
          { path: '/map', element: <MapExplorer /> },
        ],
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
]);

export default router;
