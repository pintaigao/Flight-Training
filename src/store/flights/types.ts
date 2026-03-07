import type { Feature, LineString } from 'geojson';

export type Flight = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  startTimeISO?: string | null;
  endTimeISO?: string | null;
  aircraftTail: string;
  from: string;
  to: string;
  durationMin: number;
  description?: string | null;
  tags: string[];
  track?: Feature<LineString>;
  trackSource?: 'FORE_FLIGHT' | 'FLIGHTAWARE' | null;
  trackMeta?: any;
  comments: string;
};

export type FlightsState = {
  flightsById: Record<string, Flight>;
  flightIds: string[];
  selectedFlightId: string | null;
};

export type FlightsAction =
  | { type: 'SET_FLIGHTS'; flights: Flight[] }
  | { type: 'SELECT_FLIGHT'; id: string | null }
  | { type: 'UPSERT_FLIGHT'; flight: Flight }
  | { type: 'DELETE_FLIGHT'; id: string }
  | { type: 'UPDATE_COMMENTS'; id: string; comments: string }
  | { type: 'IMPORT_TRACK'; id: string; track: Feature<LineString> };

