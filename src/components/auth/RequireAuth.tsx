import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store/store'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  const location = useLocation()
  if (state.auth.status === 'unknown') {
    return <div style={{ padding: 24, color: '#c7d2fe' }}>Checking session…</div>
  }
  if (state.auth.status === 'anon' || !state.auth.user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
