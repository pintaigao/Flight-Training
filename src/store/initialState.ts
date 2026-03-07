import type { AppState } from './types';
import { initialAuthState } from './auth/initial';
import { initialFlightsState } from './flights/initial';
import { initialUiState } from './ui/initial';

export function makeEmptyState(): AppState {
  return {
    auth: initialAuthState,
    flights: initialFlightsState,
    ui: initialUiState,
  };
}

