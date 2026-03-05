import type { Feature, LineString } from 'geojson'
import { apiFetchFormDataWithRefresh, apiFetchWithRefresh } from './client'
import type { Flight } from '@/store/types'

export type FlightTrackSource = 'FORE_FLIGHT' | 'FLIGHTAWARE'

export type FlightListItem = Flight & {
  track?: Feature<LineString> | null
  trackSource?: FlightTrackSource | null
  trackMeta?: any | null
}

export function getFlights() {
  return apiFetchWithRefresh<FlightListItem[]>('/flight', { method: 'GET' }).then((list) =>
    list.map((f) => ({
      ...f,
      track: f.track ?? undefined,
      trackSource: f.trackSource ?? undefined,
      trackMeta: f.trackMeta ?? undefined,
    }))
  )
}

export function upsertFlight(id: string, flight: Omit<Flight, 'id'>) {
  return apiFetchWithRefresh<Flight>(`/flight/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(flight),
  })
}

export function upsertFlightTrack(id: string, source: FlightTrackSource, feature: Feature<LineString>, meta?: any) {
  return apiFetchWithRefresh(`/flight/${encodeURIComponent(id)}/track`, {
    method: 'PUT',
    body: JSON.stringify({ source, feature, meta }),
  })
}

export type GetFlightTrackResponse = {
  id: number
  flightId: string
  source: FlightTrackSource
  feature: Feature<LineString>
  meta: any | null
  rawText?: string | null
  rawFormat?: string | null
  rawFilename?: string | null
  rawMime?: string | null
  createdAt: string
}

export function getFlightTrack(id: string, prefer: FlightTrackSource = 'FORE_FLIGHT') {
  return apiFetchWithRefresh<GetFlightTrackResponse>(
    `/flight/${encodeURIComponent(id)}/track?prefer=${encodeURIComponent(prefer)}`,
    { method: 'GET' }
  )
}

export function deleteFlight(id: string) {
  return apiFetchWithRefresh<{ deleted: boolean }>(`/flight/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function uploadFlightTrackFile(id: string, source: FlightTrackSource, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetchFormDataWithRefresh<GetFlightTrackResponse>(
    `/flight/${encodeURIComponent(id)}/track/upload?source=${encodeURIComponent(source)}`,
    fd,
    { method: 'POST' }
  )
}

export type TrackSample = {
  t: string
  lng: number
  lat: number
  altAglFt: number | null
  gsKt: number | null
}

export function getFlightTrackSamples(id: string, source: FlightTrackSource = 'FORE_FLIGHT') {
  return apiFetchWithRefresh<{ flightId: string; source: FlightTrackSource; samples: TrackSample[] }>(
    `/flight/${encodeURIComponent(id)}/track/samples?source=${encodeURIComponent(source)}`,
    { method: 'GET' }
  )
}
