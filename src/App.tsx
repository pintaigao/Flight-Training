import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useStore } from '@/store/store';

export default function App() {
  const {dispatch} = useStore();
  
  useEffect(() => {
    const onUnauthorized = () => {
      dispatch({type: 'SET_AUTH_USER', user: null});
      dispatch({type: 'SET_AUTH_STATUS', status: 'anon'});
      dispatch({type: 'SET_FLIGHTS', flights: []});
    };
    
    window.addEventListener('auth:unauthorized', onUnauthorized);
    
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [dispatch]);
  
  // Routing lives in src/router (createBrowserRouter). App is just the root outlet.
  return <Outlet/>;
}
