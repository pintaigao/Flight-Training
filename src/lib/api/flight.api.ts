import type { Feature, LineString } from 'geojson';
import { http } from './client';
import { graphql } from './graphql.client';
import type { Flight, FlightListItem, FlightTrackSource, GetFlightTrackResponse, TrackSample } from '@/lib/types/flight';

function normalizeFlightListItem(flight: FlightListItem): FlightListItem {
  return {
    ...flight,
    track: flight.track ?? undefined,
    trackSource: flight.trackSource ?? undefined,
    trackMeta: flight.trackMeta ?? undefined,
  };
}

export function getFlights() {
  const transport = import.meta.env.VITE_API_TRANSPORT ?? 'rest';
  if (transport === 'graphql') {
    return graphql<{ flights: FlightListItem[] }>(
      `query {
        flights {
          id
          dateISO
          startTimeISO
          endTimeISO
          aircraftTail
          from
          to
          durationMin
          description
          tags
          comments
          track
          trackSource
          trackMeta
        }
      }`,
    ).then((data) =>
      data.flights.map(normalizeFlightListItem),
    );
  }

  return http
    .get<FlightListItem[]>('/flight')
    .then((res) => res.data.map(normalizeFlightListItem));
}

export function upsertFlight(id: string, flight: Omit<Flight, 'id'>) {
  return http
    .put<Flight>(`/flight/${encodeURIComponent(id)}`, flight)
    .then((res) => res.data);
}

export function patchFlightDescription(id: string, description: string) {
  return http
    .patch<{ id: string; description: string }>(
      `/flight/${encodeURIComponent(id)}/description`,
      { description },
    )
    .then((res) => res.data);
}

export function patchFlightComment(id: string, comment: string) {
  return http
    .patch<{ id: string; comments: string }>(
      `/flight/${encodeURIComponent(id)}/comment`,
      { comment },
    )
    .then((res) => res.data);
}

export function upsertFlightTrack(
  id: string,
  source: FlightTrackSource,
  feature: Feature<LineString>,
  meta?: unknown,
) {
  return http
    .put(`/flight/${encodeURIComponent(id)}/track`, { source, feature, meta })
    .then((res) => res.data);
}

export function getFlightTrack(
  id: string,
  prefer: FlightTrackSource = 'FORE_FLIGHT',
) {
  return http
    .get<GetFlightTrackResponse>(
      `/flight/${encodeURIComponent(id)}/track?prefer=${encodeURIComponent(prefer)}`,
    )
    .then((res) => res.data);
}

export function deleteFlight(id: string) {
  return http
    .delete<{ deleted: boolean }>(`/flight/${encodeURIComponent(id)}`)
    .then((res) => res.data);
}

export function uploadFlightTrackFile(
  id: string,
  source: FlightTrackSource,
  file: File,
) {
  const fd = new FormData();
  fd.append('file', file);
  return http
    .post<GetFlightTrackResponse>(
      `/flight/${encodeURIComponent(id)}/track/upload?source=${encodeURIComponent(source)}`,
      fd,
    )
    .then((res) => res.data);
}

export function getFlightTrackSamples(
  id: string,
  source: FlightTrackSource = 'FORE_FLIGHT',
) {
  return http
    .get<{
      flightId: string;
      source: FlightTrackSource;
      samples: TrackSample[];
      meta?: unknown;
    }>(
      `/flight/${encodeURIComponent(id)}/track/samples?source=${encodeURIComponent(source)}`,
    )
    .then((res) => res.data);
}
