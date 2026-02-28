import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store/store'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  const location = useLocation()
  if (!state.auth.userId) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
