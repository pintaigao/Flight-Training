import type { FlightsState } from '@/lib/types/state';

export const initialFlightsState: FlightsState = {
  flightsById: {},
  flightIds: [],
  selectedFlightId: null,
};
