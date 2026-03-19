import { gpx } from '@tmcw/togeojson';
import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson';

function toFirstLineString(
  feature: Feature<LineString | MultiLineString>,
): Feature<LineString> {
  if (feature.geometry.type === 'LineString') {
    return feature as Feature<LineString>;
  }

  const coords = feature.geometry.coordinates[0] || [];
  return {
    type: 'Feature',
    properties: feature.properties ?? {},
    geometry: { type: 'LineString', coordinates: coords },
  };
}

export async function readGpxAsLineString(
  file: File,
): Promise<Feature<LineString>> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const geo = gpx(doc) as FeatureCollection;

  // Find the first LineString in the collection
  for (const f of geo.features) {
    if (f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString') {
      return toFirstLineString(f as Feature<LineString | MultiLineString>);
    }
  }

  throw new Error('No LineString track found in this GPX file');
}
