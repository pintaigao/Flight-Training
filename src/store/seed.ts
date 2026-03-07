import type { AppState, Flight } from './types';
import type { Feature, LineString } from 'geojson';

function line(coords: [number, number][], id: string): Feature<LineString> {
  // Leaflet expects [lat,lng] in Polyline; GeoJSON uses [lng,lat]. We'll keep GeoJSON standard: [lng,lat]
  return {
    type: 'Feature',
    properties: { id },
    geometry: {
      type: 'LineString',
      coordinates: coords.map(([lat, lng]) => [lng, lat]),
    },
  };
}

function demoFlights(): Flight[] {
  return [
    {
      id: 'f-2022-04-14-kpao-kmry',
      dateISO: '2022-04-14',
      aircraftTail: 'N123AB',
      from: 'KPAO',
      to: 'KMRY',
      durationMin: 90,
      tags: ['Cross-Country'],
      track: line(
        [
          [37.4611, -122.1157], // KPAO area
          [37.355, -121.93],
          [37.1, -122.05],
          [36.75, -121.85],
          [36.587, -121.843], // KMRY area
        ],
        'kpao-kmry',
      ),
      comments: '',
    },
    {
      id: 'f-2022-04-12-klvk-kpao',
      dateISO: '2022-04-12',
      aircraftTail: 'N123AB',
      from: 'KLVK',
      to: 'KPAO',
      durationMin: 72,
      tags: ['Training'],
      track: line(
        [
          [37.6934, -121.819],
          [37.55, -121.95],
          [37.48, -122.1],
          [37.4611, -122.1157],
        ],
        'klvk-kpao',
      ),
      comments: '',
    },
    {
      id: 'f-2022-03-28-ksns-kpao',
      dateISO: '2022-03-28',
      aircraftTail: 'N987ZX',
      from: 'KSNS',
      to: 'KPAO',
      durationMin: 108,
      tags: ['Cross-Country', 'Dual'],
      track: line(
        [
          [36.662, -121.605],
          [36.85, -121.75],
          [37.15, -121.95],
          [37.4611, -122.1157],
        ],
        'ksns-kpao',
      ),
      comments: '',
    },
  ];
}

export function makeDemoState(): AppState {
  const flights = demoFlights().sort((a, b) =>
    a.dateISO < b.dateISO ? 1 : -1,
  );
  const flightsById = Object.fromEntries(flights.map((f) => [f.id, f]));
  const flightIds = flights.map((f) => f.id);
  return {
    auth: { user: null, status: 'unknown' },
    flightsById,
    flightIds,
    selectedFlightId: flights[0]?.id ?? null,
    filters: { q: '', aircraft: 'ALL', tag: 'ALL' },
    ui: { mapMode: 'ALL' },
  };
}

export function makeEmptyState(): AppState {
  return {
    auth: { user: null, status: 'unknown' },
    flightsById: {},
    flightIds: [],
    selectedFlightId: null,
    filters: { q: '', aircraft: 'ALL', tag: 'ALL' },
    ui: { mapMode: 'ALL' },
  };
}
