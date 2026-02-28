import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/flights', label: 'Flights' },
  { to: '/map', label: 'Map' }
]

export default function Sidebar() {
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
        <div className="muted">MVP demo</div>
      </div>
    </aside>
  )
}
