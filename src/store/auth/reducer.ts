import type { Action } from '@/lib/types/actions';
import type { AuthState } from '@/lib/types/state';

export function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'SET_AUTH_USER':
      return {
        ...state,
        user: action.user,
        status: action.user ? 'authed' : 'anon',
      };
    case 'SET_AUTH_STATUS':
      return { ...state, status: action.status };
    default:
      return state;
  }
}
