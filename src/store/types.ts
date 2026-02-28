import type { Feature, LineString } from 'geojson'

export type AuthUser = {
  id: string
  email: string
}

export type AuthState = {
  user: AuthUser | null
  status: 'unknown' | 'authed' | 'anon'
}

export type FlightComments = {
  well: string
  improve: string
  notes: string
}

export type Flight = {
  id: string
  dateISO: string // YYYY-MM-DD
  aircraftTail: string
  from: string
  to: string
  durationMin: number
  tags: string[]
  track?: Feature<LineString>
  comments: FlightComments
}

export type Filters = {
  q: string
  aircraft: string | 'ALL'
  tag: string | 'ALL'
}

export type UIState = {
  mapMode: 'ALL' | 'SELECTED'
}

export type AppState = {
  auth: AuthState
  flightsById: Record<string, Flight>
  flightIds: string[]
  selectedFlightId: string | null
  filters: Filters
  ui: UIState
}

export type Action =
  | { type: 'SET_AUTH_USER'; user: AuthUser | null }
  | { type: 'SET_AUTH_STATUS'; status: AuthState['status'] }
  | { type: 'SELECT_FLIGHT'; id: string | null }
  | { type: 'SET_FILTERS'; filters: Partial<Filters> }
  | { type: 'UPSERT_FLIGHT'; flight: Flight }
  | { type: 'UPDATE_COMMENTS'; id: string; comments: Partial<FlightComments> }
  | { type: 'IMPORT_TRACK'; id: string; track: Feature<LineString> }
  | { type: 'RESET_DEMO_DATA' }
