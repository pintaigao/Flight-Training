import type { Action } from '../types';
import type { FlightsState, Flight } from './types';

export function flightsReducer(
  state: FlightsState,
  action: Action,
): FlightsState {
  switch (action.type) {
    case 'SET_FLIGHTS': {
      const flights = action.flights;
      const flightsById = Object.fromEntries(flights.map((f) => [f.id, f]));
      const flightIds = flights.map((f) => f.id);
      return {
        ...state,
        flightsById,
        flightIds,
        selectedFlightId: flightIds.includes(state.selectedFlightId ?? '')
          ? state.selectedFlightId
          : (flightIds[0] ?? null),
      };
    }
    case 'SELECT_FLIGHT':
      return { ...state, selectedFlightId: action.id };
    case 'UPSERT_FLIGHT': {
      const flight = action.flight;
      const flightsById = { ...state.flightsById, [flight.id]: flight };
      const flightIds = state.flightIds.includes(flight.id)
        ? state.flightIds
        : [flight.id, ...state.flightIds];
      return { ...state, flightsById, flightIds };
    }
    case 'DELETE_FLIGHT': {
      if (!state.flightsById[action.id]) return state;
      const flightsById = { ...state.flightsById };
      delete flightsById[action.id];
      const flightIds = state.flightIds.filter((id) => id !== action.id);
      const selectedFlightId =
        state.selectedFlightId === action.id
          ? (flightIds[0] ?? null)
          : state.selectedFlightId;
      return { ...state, flightsById, flightIds, selectedFlightId };
    }
    case 'UPDATE_COMMENTS': {
      const f = state.flightsById[action.id];
      if (!f) return state;
      const updated: Flight = {
        ...f,
        comments: action.comments,
      };
      return { ...state, flightsById: { ...state.flightsById, [f.id]: updated } };
    }
    case 'IMPORT_TRACK': {
      const f = state.flightsById[action.id];
      if (!f) return state;
      const updated: Flight = { ...f, track: action.track };
      return { ...state, flightsById: { ...state.flightsById, [f.id]: updated } };
    }
    default:
      return state;
  }
}
