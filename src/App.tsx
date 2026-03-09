import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';

export default function App() {
  const { dispatch } = useStore();

  // Bootstrap auth session from HttpOnly cookies.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await AuthApi.getMe();
        if (!alive) return;
        dispatch({ type: 'SET_AUTH_USER', user: me });
      } catch {
        if (!alive) return;
        dispatch({ type: 'SET_AUTH_STATUS', status: 'anon' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    const onUnauthorized = () => {
      dispatch({ type: 'SET_AUTH_USER', user: null });
      dispatch({ type: 'SET_AUTH_STATUS', status: 'anon' });
      dispatch({ type: 'SET_FLIGHTS', flights: [] });
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [dispatch]);

  // Routing lives in src/router (createBrowserRouter). App is just the root outlet.
  return <Outlet />;
}
