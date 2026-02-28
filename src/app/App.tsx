import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Flights from '@/pages/Flights/Flights'
import FlightDetail from '@/pages/FlightDetail/FlightDetail'
import MapExplorer from '@/pages/MapExplorer/MapExplorer'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/flights/:id" element={<FlightDetail />} />
        <Route path="/map" element={<MapExplorer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
