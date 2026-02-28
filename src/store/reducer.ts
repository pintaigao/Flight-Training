import type { AppState, Action, Flight } from './types'
import { makeDemoState } from './seed'

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_USER': {
      const u = action.user
      const usersById = { ...state.usersById, [u.id]: u }
      const userIds = state.userIds.includes(u.id) ? state.userIds : [u.id, ...state.userIds]
      return { ...state, usersById, userIds }
    }
    case 'SET_AUTH': {
      return { ...state, auth: { userId: action.userId } }
    }
    case 'SELECT_FLIGHT': {
      return { ...state, selectedFlightId: action.id }
    }
    case 'SET_FILTERS': {
      return { ...state, filters: { ...state.filters, ...action.filters } }
    }
    case 'UPSERT_FLIGHT': {
      const flight = action.flight
      const flightsById = { ...state.flightsById, [flight.id]: flight }
      const flightIds = state.flightIds.includes(flight.id)
        ? state.flightIds
        : [flight.id, ...state.flightIds]
      return { ...state, flightsById, flightIds }
    }
    case 'UPDATE_COMMENTS': {
      const f = state.flightsById[action.id]
      if (!f) return state
      const updated: Flight = { ...f, comments: { ...f.comments, ...action.comments } }
      return { ...state, flightsById: { ...state.flightsById, [action.id]: updated } }
    }
    case 'IMPORT_TRACK': {
      const f = state.flightsById[action.id]
      if (!f) return state
      const updated: Flight = { ...f, track: action.track }
      return { ...state, flightsById: { ...state.flightsById, [action.id]: updated } }
    }
    case 'RESET_DEMO_DATA': {
      return makeDemoState()
    }
    default:
      return state
  }
}
