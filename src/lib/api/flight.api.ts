import type { Feature, LineString } from 'geojson';
import { http } from './client';
import type { Flight } from '@/store/types';

export type FlightTrackSource = 'FORE_FLIGHT';

export type FlightListItem = Flight & {
  track?: Feature<LineString> | null;
  trackSource?: FlightTrackSource | null;
  trackMeta?: any | null;
};

export function getFlights() {
  return http.get<FlightListItem[]>('/flight').then((res) =>
    res.data.map((f) => ({
      ...f,
      track: f.track ?? undefined,
      trackSource: f.trackSource ?? undefined,
      trackMeta: f.trackMeta ?? undefined,
    })),
  );
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
  meta?: any,
) {
  return http
    .put(`/flight/${encodeURIComponent(id)}/track`, { source, feature, meta })
    .then((res) => res.data);
}

export type GetFlightTrackResponse = {
  id: number;
  flightId: string;
  source: FlightTrackSource;
  feature: Feature<LineString>;
  meta: any | null;
  rawText?: string | null;
  rawFormat?: string | null;
  rawFilename?: string | null;
  rawMime?: string | null;
  createdAt: string;
};

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

export type TrackSample = {
  t: string;
  lng: number;
  lat: number;
  altAglFt: number | null;
  gsKt: number | null;
};

export function getFlightTrackSamples(
  id: string,
  source: FlightTrackSource = 'FORE_FLIGHT',
) {
  return http
    .get<{
      flightId: string;
      source: FlightTrackSource;
      samples: TrackSample[];
      meta?: any;
    }>(
      `/flight/${encodeURIComponent(id)}/track/samples?source=${encodeURIComponent(source)}`,
    )
    .then((res) => res.data);
}
