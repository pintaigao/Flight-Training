import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import './PrivateLayout.scss';

export default function PrivateLayout() {
  return (
    <div className="private-layout min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <div className="private-sidebar lg:sticky lg:top-0 lg:h-screen">
        <Sidebar />
      </div>
      <main className="private-main p-4 sm:p-6 lg:p-8">
        <div className="private-inner mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
