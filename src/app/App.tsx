import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from '@/components/auth/RequireAuth'
import PrivateLayout from '@/components/layout/PrivateLayout'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Flights from '@/pages/Flights/Flights'
import FlightDetail from '@/pages/FlightDetail/FlightDetail'
import MapExplorer from '@/pages/MapExplorer/MapExplorer'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <RequireAuth>
            <PrivateLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/flights/:id" element={<FlightDetail />} />
        <Route path="/map" element={<MapExplorer />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
