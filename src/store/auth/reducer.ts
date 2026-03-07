import type { Action } from '../types';
import type { AuthState } from './types';

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
