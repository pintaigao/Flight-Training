import type { Feature, LineString } from 'geojson';
import { http } from './client';

export type RecentTrackResponse = {
  tail: string;
  faFlightId: string;
  departureTimeISO: string;
  track: Feature<LineString>;
};

export function getRecentTrackByTail(tail: string) {
  return http
    .get<RecentTrackResponse>(
      `/track/recent-by-tail?tail=${encodeURIComponent(tail)}`,
    )
    .then((res) => res.data);
}
