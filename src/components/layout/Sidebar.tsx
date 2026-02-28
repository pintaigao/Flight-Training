import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/map', label: 'Map' }
]

export default function Sidebar() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const user = state.auth.userId ? state.usersById[state.auth.userId] : null

  function logout() {
    dispatch({ type: 'SET_AUTH', userId: null })
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">✈</div>
        <div className="brandText">
          <div className="brandTitle">Flight Log</div>
          <div className="brandSub">personal logbook</div>
        </div>
      </div>

      <nav className="nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebarFooter">
        {user ? (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              Signed in as <span style={{ color: 'rgba(255,255,255,0.86)' }}>{user.email}</span>
            </div>
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <div className="muted">MVP demo</div>
        )}
      </div>
    </aside>
  )
}
