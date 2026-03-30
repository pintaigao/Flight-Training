import { http } from './client';
import type { LiveAircraftResponse } from '@/lib/types/liveAircraft';

export function getLiveAircraft() {
  return http
    .get<LiveAircraftResponse>('/flights/live-aircraft')
    .then((res) => res.data);
}
