import type { Action, AppState } from './rootTypes';
import { authReducer } from './auth/reducer';
import { flightsReducer } from './flights/reducer';
import { uiReducer } from './ui/reducer';

export function rootReducer(state: AppState, action: Action): AppState {
  return {
    auth: authReducer(state.auth, action),
    flights: flightsReducer(state.flights, action),
    ui: uiReducer(state.ui, action),
  };
}
