import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from '@/store/store'
import { getMe } from '@/lib/api/auth'

export default function App() {
  const { dispatch } = useStore()

  // Bootstrap auth session from HttpOnly cookies.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const me = await getMe()
        if (!alive) return
        dispatch({ type: 'SET_AUTH_USER', user: me })
      } catch {
        if (!alive) return
        dispatch({ type: 'SET_AUTH_STATUS', status: 'anon' })
      }
    })()
    return () => {
      alive = false
    }
  }, [dispatch])

  // Routing lives in src/router (createBrowserRouter). App is just the root outlet.
  return <Outlet />
}
