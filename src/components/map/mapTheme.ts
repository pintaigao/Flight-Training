export type MapTileLayerConfig = {
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
};

export type MapMarkerTone = 'start' | 'end';

export const DEFAULT_LIGHT_TILE_LAYER: MapTileLayerConfig = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 20,
};

export function getTrackLineStyle(isSelected: boolean) {
  return {
    color: isSelected ? '#1f232b' : '#4d5562',
    weight: isSelected ? 4 : 3,
    opacity: isSelected ? 0.92 : 0.64,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };
}

export function getMarkerTone(kind: MapMarkerTone): MapMarkerTone {
  return kind;
}
