import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MapView from '@/components/map/MapView'
import { useStore } from '@/store/store'
import type { TrackItem } from '@/components/map/MapView'
import { getRecentTrackByTail } from '@/lib/api/track'

export default function MapExplorer() {
  const { state, dispatch } = useStore()
  const [tail, setTail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteTrack, setRemoteTrack] = useState<TrackItem | null>(null)
  const [remoteSelectedId, setRemoteSelectedId] = useState<string | null>(null)

  const flights = useMemo(() => state.flightIds.map((id) => state.flightsById[id]), [state])

  const tracks = useMemo(
    () =>
      flights
        .filter((f) => f.track)
        .map((f) => {
          const feature = f.track!
          feature.properties = { ...(feature.properties ?? {}), id: f.id }
          return {
            id: f.id,
            title: `${f.from} → ${f.to}`,
            subtitle: `${f.dateISO} — ${(f.durationMin / 60).toFixed(1)} hrs`,
            feature
          }
        }),
    [flights]
  )

  const selected = state.selectedFlightId ? state.flightsById[state.selectedFlightId] : null
  const mergedTracks = useMemo(() => (remoteTrack ? [remoteTrack, ...tracks] : tracks), [remoteTrack, tracks])
  const selectedId = remoteSelectedId ?? state.selectedFlightId

  return (
    <div className="mapLayout">
      <div className="mapSide">
        <div className="mapSideHeader">
          <div className="title">Recent Flights</div>
          <div className="muted">Click to focus on the map</div>
        </div>
        <div className="mapList">
          {flights.slice(0, 10).map((f) => (
            <button
              key={f.id}
              className={state.selectedFlightId === f.id ? 'mapListItem active' : 'mapListItem'}
              onClick={() => {
                setRemoteSelectedId(null)
                dispatch({ type: 'SELECT_FLIGHT', id: f.id })
              }}
            >
              <div className="mapListMain">{f.from} → {f.to}</div>
              <div className="muted">{f.dateISO} · {(f.durationMin / 60).toFixed(1)} hrs</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mapMain">
        <div className="mapTopbar">
          <div className="title">Map Explorer</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="input"
              style={{ width: 220, flex: '0 0 auto' }}
              placeholder="Tail number (e.g. N77GX)"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
            />
            <button
              className="btnPrimary"
              disabled={loading}
              onClick={async () => {
                const normalized = tail.trim().toUpperCase()
                if (!normalized) return
                setError(null)
                setLoading(true)
                try {
                  const res = await getRecentTrackByTail(normalized)
                  const id = `${res.tail}:${res.faFlightId}`
                  const feature = res.track
                  feature.properties = { ...(feature.properties ?? {}), id }
                  const item: TrackItem = {
                    id,
                    title: res.tail,
                    subtitle: new Date(res.departureTimeISO).toLocaleString('en-US', { timeZone: 'America/Chicago' }),
                    feature
                  }
                  setRemoteTrack(item)
                  setRemoteSelectedId(item.id)
                } catch (e: any) {
                  setRemoteTrack(null)
                  setRemoteSelectedId(null)
                  setError(e?.body?.message || e?.message || 'Failed to fetch track')
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Fetching…' : 'Get Recent Track'}
            </button>
            <div className="muted">All tracks</div>
          </div>
        </div>
        {error && <div className="error">{error}</div>}

        <div className="mapStage">
          <MapView
            tracks={mergedTracks}
            selectedId={selectedId}
            onSelect={(id) => {
              if (remoteTrack && id === remoteTrack.id) {
                setRemoteSelectedId(id)
                return
              }
              setRemoteSelectedId(null)
              dispatch({ type: 'SELECT_FLIGHT', id })
            }}
          />

          {selected && (
            <div className="floatingCard">
              <div className="floatingTitle">{selected.from} → {selected.to}</div>
              <div className="muted">{selected.dateISO} · {(selected.durationMin / 60).toFixed(1)} hrs</div>
              <div style={{ height: 10 }} />
              <Link className="btnPrimary" to={`/flights/${selected.id}`}>View Details</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
