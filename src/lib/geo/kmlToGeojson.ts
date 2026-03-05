import { kml } from '@tmcw/togeojson'
import type { Feature, FeatureCollection, LineString } from 'geojson'

export async function readKmlAsLineString(file: File): Promise<Feature<LineString>> {
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  const geo = kml(doc) as FeatureCollection

  for (const f of geo.features) {
    if (f.geometry?.type === 'LineString') {
      return f as Feature<LineString>
    }
    if (f.geometry?.type === 'MultiLineString') {
      const coords = (f.geometry.coordinates as any[][][])[0] || []
      return {
        type: 'Feature',
        properties: f.properties ?? {},
        geometry: { type: 'LineString', coordinates: coords }
      }
    }
  }

  throw new Error('No LineString track found in this KML file')
}

