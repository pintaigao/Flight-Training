import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import './PrivateLayout.scss';

export default function PrivateLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
