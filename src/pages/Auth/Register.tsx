import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { register } from '@/lib/api/auth'

export default function Register() {
  const { dispatch } = useStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const normalized = email.trim().toLowerCase()
      if (!normalized.includes('@')) {
        setError('Please enter a valid email.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }
      const me = await register({ email: normalized, password })
      dispatch({ type: 'SET_AUTH_USER', user: me })
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.body?.message ?? 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard">
        <div className="cardTitle">Create account</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          Create an account to sync your flights across devices.
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
              placeholder="Password (min 8 chars)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <input
              className="input"
              placeholder="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="authActions">
            <button className="btnPrimary" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create'}
            </button>
            <Link className="authLink" to="/login">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
