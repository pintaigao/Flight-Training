import type { AuthAction, AuthState } from './auth/types';
import type { FlightsAction, FlightsState, Flight } from './flights/types';
import type { UiAction, UIState } from './ui/types';

export type AppState = {
  auth: AuthState;
  flights: FlightsState;
  ui: UIState;
};

export type Action = AuthAction | FlightsAction | UiAction;

export type { Flight };

