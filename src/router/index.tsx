import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from '@/app/App'
import RequireAuth from '@/components/auth/RequireAuth'
import PrivateLayout from '@/components/layout/PrivateLayout'

import Dashboard from '@/pages/Dashboard/Dashboard'
import Flights from '@/pages/Flights/Flights'
import FlightDetail from '@/pages/FlightDetail/FlightDetail'
import MapExplorer from '@/pages/MapExplorer/MapExplorer'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'

/**
 * Centralized router config (React Router Data APIs).
 * - App is the root element (bootstraps auth session, then renders <Outlet/>)
 * - Private routes are nested under RequireAuth + PrivateLayout
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
            <PrivateLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: '/flights', element: <Flights /> },
          { path: '/flights/:id', element: <FlightDetail /> },
          { path: '/map', element: <MapExplorer /> },
        ],
      },

      { path: '*', element: <Navigate to='/' replace /> },
    ],
  },
])

export default router
