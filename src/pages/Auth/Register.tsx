import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { findUserByEmail, makeUserId, normalizeEmail } from '@/lib/auth/user'
import { hashPassword } from '@/lib/auth/password'
import type { User } from '@/store/types'

export default function Register() {
  const { state, dispatch } = useStore()
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
      const normalized = normalizeEmail(email)
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
      if (findUserByEmail(state, normalized)) {
        setError('An account with that email already exists. Try logging in.')
        return
      }

      const passwordHash = await hashPassword(password)
      const user: User = {
        id: makeUserId(normalized),
        email: normalized,
        passwordHash,
        createdAtISO: new Date().toISOString()
      }
      dispatch({ type: 'ADD_USER', user })
      dispatch({ type: 'SET_AUTH', userId: user.id })
      navigate('/', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard">
        <div className="cardTitle">Create account</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          This is a local-only demo login (saved in your browser).
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(normalizeEmail(e.target.value))}
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
