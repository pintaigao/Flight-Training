import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { Feature, FeatureCollection, LineString } from 'geojson'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'

export type TrackItem = {
  id: string
  title: string
  subtitle?: string
  feature: Feature<LineString>
}

type Props = {
  tracks: TrackItem[]
  selectedId?: string | null
  height?: number | string
  onSelect?: (id: string) => void
  showTileAttribution?: boolean
}

function FitBounds({ feature }: { feature?: Feature<LineString> }) {
  const map = useMap()

  useEffect(() => {
    if (!feature) return
    const coords = feature.geometry.coordinates
    if (!coords.length) return
    const latlngs = coords.map(([lng, lat]) => L.latLng(lat, lng))
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds.pad(0.25))
  }, [feature, map])

  return null
}

export default function MapView({ tracks, selectedId, height = '100%', onSelect, showTileAttribution = true }: Props) {
  const selected = tracks.find((t) => t.id === selectedId)

  const collection: FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: tracks.map((t) => t.feature)
    }),
    [tracks]
  )

  return (
    <div className="mapWrap" style={{ height }}>
      <MapContainer center={[37.5, -122.1]} zoom={9} scrollWheelZoom className="map">
        <TileLayer
          attribution={showTileAttribution ? '&copy; OpenStreetMap contributors' : ''}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          data={collection}
          style={(feature) => {
            const id = (feature?.properties as any)?.id
            const isSelected = selectedId && id && id === selectedId
            return {
              weight: isSelected ? 4 : 3,
              opacity: isSelected ? 1 : 0.65
            }
          }}
          eventHandlers={{
            click: (e) => {
              const id = (e.propagatedFrom?.feature?.properties as any)?.id
              if (id && onSelect) onSelect(id)
            }
          }}
        />

        <FitBounds feature={selected?.feature} />
      </MapContainer>
    </div>
  )
}
