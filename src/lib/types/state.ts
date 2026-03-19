import type { AuthUser } from './auth';
import type { Flight } from './flight';
import type { Filters } from './ui';

export type AuthStatus = 'unknown' | 'authed' | 'anon' | 'checking';

export type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
};

export type FlightsState = {
  flightsById: Record<string, Flight>;
  flightIds: string[];
  selectedFlightId: string | null;
};

export type UIState = {
  filters: Filters;
  mapMode: 'ALL' | 'SELECTED';
};

export type AppState = {
  auth: AuthState;
  flights: FlightsState;
  ui: UIState;
};
