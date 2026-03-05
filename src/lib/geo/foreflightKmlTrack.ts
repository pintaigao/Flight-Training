import type { Feature, LineString } from 'geojson'

const KML_NS = 'http://www.opengis.net/kml/2.2'
const GX_NS = 'http://www.google.com/kml/ext/2.2'

type Sample = {
  t: string
  lng: number
  lat: number
  altAglFt: number | null
  gsKt: number | null
}

export type ForeFlightKmlTrack = {
  feature: Feature<LineString>
  startTimeISO: string
  endTimeISO: string
  pointCount: number
  samples: Sample[]
  stats: {
    altMinFt: number | null
    altMaxFt: number | null
    gsMaxKt: number | null
    gsAvgKt: number | null
  }
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

function downsampleKeepEnds<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  if (max < 2) return [arr[0]]
  const out: T[] = []
  const step = (arr.length - 1) / (max - 1)
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * step)
    out.push(arr[idx])
  }
  // ensure last is last
  out[out.length - 1] = arr[arr.length - 1]
  out[0] = arr[0]
  return out
}

export async function readForeFlightKmlTrack(file: File): Promise<ForeFlightKmlTrack> {
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')

  const track = doc.getElementsByTagNameNS(GX_NS, 'Track')?.[0]
  if (!track) throw new Error('No gx:Track found in this KML file')

  const whens = Array.from(track.getElementsByTagNameNS(KML_NS, 'when')).map((n) => n.textContent?.trim()).filter(Boolean) as string[]
  const coords = Array.from(track.getElementsByTagNameNS(GX_NS, 'coord')).map((n) => n.textContent?.trim()).filter(Boolean) as string[]

  const count = Math.min(whens.length, coords.length)
  if (count < 2) throw new Error('Not enough track points in this KML file')

  const samplesRaw: Omit<Sample, 'gsKt'>[] = []
  const coordinates: [number, number][] = []
  for (let i = 0; i < count; i++) {
    const raw = coords[i]
    const parts = raw.split(/\s+/)
    if (parts.length < 2) continue
    const lng = Number(parts[0])
    const lat = Number(parts[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
    const alt = parts.length >= 3 ? Number(parts[2]) : null
    const altAglFt = alt != null && Number.isFinite(alt) ? alt : null
    const t = whens[i]
    if (!t) continue
    samplesRaw.push({ t: new Date(t).toISOString(), lng, lat, altAglFt })
    coordinates.push([lng, lat])
  }

  if (coordinates.length < 2) throw new Error('No valid coordinates found in this KML file')

  const start = samplesRaw[0]?.t
  const end = samplesRaw[samplesRaw.length - 1]?.t
  if (!start || !end) throw new Error('Missing timestamps in this KML file')

  const samplesFull: Sample[] = samplesRaw.map((s) => ({ ...s, gsKt: null }))
  for (let i = 1; i < samplesFull.length; i++) {
    const prev = samplesFull[i - 1]
    const cur = samplesFull[i]
    const dtSec = (new Date(cur.t).getTime() - new Date(prev.t).getTime()) / 1000
    if (!Number.isFinite(dtSec) || dtSec <= 0) continue
    const distM = haversineMeters({ lat: prev.lat, lng: prev.lng }, { lat: cur.lat, lng: cur.lng })
    const ms = distM / dtSec
    const kt = ms * 1.9438444924406
    cur.gsKt = Number.isFinite(kt) ? kt : null
  }

  const MAX_SAMPLES = 1500
  const MAX_COORDS = 10000
  const samples = downsampleKeepEnds(samplesFull, MAX_SAMPLES)
  const coordsForFeature = downsampleKeepEnds(coordinates, MAX_COORDS)
  const altVals = samples.map((s) => s.altAglFt).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  const gsVals = samples.map((s) => s.gsKt).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  const altMinFt = altVals.length ? Math.min(...altVals) : null
  const altMaxFt = altVals.length ? Math.max(...altVals) : null
  const gsMaxKt = gsVals.length ? Math.max(...gsVals) : null
  const gsAvgKt = gsVals.length ? gsVals.reduce((a, b) => a + b, 0) / gsVals.length : null

  return {
    feature: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coordsForFeature },
    },
    startTimeISO: start,
    endTimeISO: end,
    pointCount: coordinates.length,
    samples,
    stats: {
      altMinFt,
      altMaxFt,
      gsMaxKt,
      gsAvgKt,
    },
  }
}
