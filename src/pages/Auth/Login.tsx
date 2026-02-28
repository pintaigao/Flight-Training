import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { login } from '@/lib/api/auth'

export default function Login() {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = useMemo(() => {
    const s = location.state as any
    return s?.from?.pathname ?? '/'
  }, [location.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const me = await login({ email: email.trim().toLowerCase(), password })
      dispatch({ type: 'SET_AUTH_USER', user: me })
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.body?.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard">
        <div className="cardTitle">Log in</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Sign in to access your flights and notes.
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="authActions">
            <button className="btnPrimary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </button>
            <Link className="authLink" to="/register">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
