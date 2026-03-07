import type { Action } from '../types';
import type { UIState } from './types';

export function uiReducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    default:
      return state;
  }
}
