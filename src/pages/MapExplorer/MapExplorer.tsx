import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import MapView from '@/components/map/MapView'
import { useStore } from '@/store/store'

export default function MapExplorer() {
  const { state, dispatch } = useStore()

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
              onClick={() => dispatch({ type: 'SELECT_FLIGHT', id: f.id })}
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
          <div className="muted">All tracks</div>
        </div>

        <div className="mapStage">
          <MapView
            tracks={tracks}
            selectedId={state.selectedFlightId}
            onSelect={(id) => dispatch({ type: 'SELECT_FLIGHT', id })}
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
