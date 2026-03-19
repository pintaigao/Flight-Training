import type { Action } from '@/lib/types/actions';
import type { UIState } from '@/lib/types/state';

export function uiReducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    default:
      return state;
  }
}
