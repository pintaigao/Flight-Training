import type { Feature, LineString } from 'geojson';
import type { AuthUser } from './auth';
import type { Flight } from './flight';
import type { AuthStatus } from './state';
import type { Filters } from './ui';

export type AuthAction =
  | { type: 'SET_AUTH_USER'; user: AuthUser | null }
  | { type: 'SET_AUTH_STATUS'; status: AuthStatus };

export type FlightsAction =
  | { type: 'SET_FLIGHTS'; flights: Flight[] }
  | { type: 'SELECT_FLIGHT'; id: string | null }
  | { type: 'UPSERT_FLIGHT'; flight: Flight }
  | { type: 'DELETE_FLIGHT'; id: string }
  | { type: 'UPDATE_COMMENTS'; id: string; comments: string }
  | { type: 'IMPORT_TRACK'; id: string; track: Feature<LineString> };

export type UiAction = { type: 'SET_FILTERS'; filters: Partial<Filters> };

export type Action = AuthAction | FlightsAction | UiAction;
