import { Outlet } from 'react-router-dom'
import Shell from './Shell'

export default function PrivateLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
