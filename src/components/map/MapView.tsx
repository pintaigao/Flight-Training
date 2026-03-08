import React, { useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker } from 'react-leaflet';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import L from 'leaflet';
import './MapView.scss';

export type TrackItem = {
  id: string;
  title: string;
  subtitle?: string;
  feature: Feature<LineString>;
};

type Props = {
  tracks: TrackItem[];
  selectedId?: string | null;
  height?: number | string;
  onSelect?: (id: string) => void;
  showTileAttribution?: boolean;
  showZoomControl?: boolean;
  cursor?: { lat: number; lng: number } | null;
  invalidateKey?: unknown;
  cursorLabelLines?: string[] | null;
  cursorHeadingDeg?: number | null;
};

function FitBounds({feature}: { feature?: Feature<LineString> }) {
  const map = useMap();
  
  useEffect(() => {
    if (!feature) return;
    const coords = feature.geometry.coordinates;
    if (!coords.length) return;
    const latlngs = coords.map(([lng, lat]) => L.latLng(lat, lng));
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds.pad(0.25));
  }, [feature, map]);
  
  return null;
}

function InvalidateSize({invalidateKey}: { invalidateKey?: unknown }) {
  const map = useMap();

  useEffect(() => {
    // Leaflet needs an explicit size invalidation when the container changes
    // height due to layout (e.g. chart toggles below/overlay).
    const t = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(t);
  }, [map, invalidateKey]);

  return null;
}

function CursorMarker({
  cursor,
  lines,
  headingDeg,
}: {
  cursor: { lat: number; lng: number };
  lines: string[];
  headingDeg?: number | null;
}) {
  const icon = useMemo(() => {
    const safeLines = (lines ?? []).filter(Boolean).slice(0, 4);
    const heading = Number.isFinite(headingDeg as any) ? Number(headingDeg) : 0;
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const labelHtml = safeLines
      .map((l) => `<div class="cursor-label-line">${esc(l)}</div>`)
      .join('');

    const svg = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5L21 16z"></path>
      </svg>
    `;

    const html = `
      <div class="cursor-marker" style="--heading:${heading}deg">
        <div class="cursor-dot"></div>
        <div class="cursor-plane">${svg}</div>
        <div class="cursor-label">${labelHtml}</div>
      </div>
    `;

    return L.divIcon({
      className: '',
      html,
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    });
  }, [headingDeg, lines]);

  return <Marker position={[cursor.lat, cursor.lng]} icon={icon} />;
}

function MapView({
  tracks,
  selectedId,
  height = '100%',
  onSelect,
  showTileAttribution = true,
  showZoomControl = true,
  cursor = null,
  invalidateKey,
  cursorLabelLines = null,
  cursorHeadingDeg = null,
}: Props) {
  const selected = tracks.find((t) => t.id === selectedId);
  
  const collection: FeatureCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: tracks.map((t) => t.feature) }),
    [tracks],
  );

  const geoJsonStyle = useCallback(
    (feature: any) => {
      const id = feature?.properties?.id;
      const isSelected = selectedId && id && id === selectedId;
      return { weight: isSelected ? 4 : 3, opacity: isSelected ? 1 : 0.65 };
    },
    [selectedId],
  );

  const geoJsonEvents = useMemo(
    () => ({
      click: (e: any) => {
        const id = (e.propagatedFrom?.feature?.properties as any)?.id;
        if (id && onSelect) onSelect(id);
      },
    }),
    [onSelect],
  );
  
  return (
    <div className="map-wrap" style={{height}}>
      <MapContainer
        center={[37.5, -122.1]}
        zoom={9}
        scrollWheelZoom
        preferCanvas
        zoomControl={showZoomControl}
        className="map">
        <InvalidateSize invalidateKey={invalidateKey} />
        <TileLayer
          attribution={showTileAttribution ? '&copy; OpenStreetMap contributors' : ''}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        
        <GeoJSON
          data={collection}
          style={geoJsonStyle}
          eventHandlers={geoJsonEvents}
        />
        
        {cursor && cursorLabelLines && cursorLabelLines.length > 0 ? (
          <CursorMarker
            cursor={cursor}
            lines={cursorLabelLines}
            headingDeg={cursorHeadingDeg}
          />
        ) : null}
        
        <FitBounds feature={selected?.feature}/>
      </MapContainer>
    </div>
  );
}

export default React.memo(MapView);
