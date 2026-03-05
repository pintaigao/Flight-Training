import type { Feature, LineString } from 'geojson'
import { apiFetchWithRefresh } from './client'

export type RecentTrackResponse = {
  tail: string
  faFlightId: string
  departureTimeISO: string
  track: Feature<LineString>
}

export function getRecentTrackByTail(tail: string) {
  return apiFetchWithRefresh<RecentTrackResponse>(`/track/recent-by-tail?tail=${encodeURIComponent(tail)}`)
}

