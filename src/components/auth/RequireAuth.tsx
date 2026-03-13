import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from '@/store/store';
import * as AuthApi from '@/lib/api/auth.api';

export default function RequireAuth({children}: { children: React.ReactNode; }) {
  const {state, dispatch} = useStore();
  const location = useLocation();
  
  // Bootstrap auth only when entering protected routes.
  useEffect(() => {
    if (state.auth.user || state.auth.status === 'anon') return;
    
    let alive = true;
    
    if (state.auth.status === 'unknown')
      dispatch({type: 'SET_AUTH_STATUS', status: 'checking'});
    
    AuthApi.getProfile().then((me) => {
      if (!alive) return;
      dispatch({type: 'SET_AUTH_USER', user: me});
    }).catch(() => {
      if (!alive) return;
      dispatch({type: 'SET_AUTH_STATUS', status: 'anon'});
    });
    
    return () => { alive = false; };
  }, [dispatch, state.auth.user]);
  
  // 正常逻辑
  if (state.auth.status === 'checking' || state.auth.status === 'unknown') return null;
  if (!state.auth.user) return <Navigate to="/login" replace state={{from: location}}/>;
  return <>{children}</>;
}
