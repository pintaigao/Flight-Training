import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useStore } from '@/store/store'
import MapView from '@/components/map/MapView'

export default function Dashboard() {
  const { state, dispatch } = useStore()

  const flights = useMemo(() => state.flightIds.map((id) => state.flightsById[id]), [state])
  const totalMin = flights.reduce((s, f) => s + f.durationMin, 0)
  const totalHours = (totalMin / 60).toFixed(1)
  const last30Hours = (flights.slice(0, 3).reduce((s, f) => s + f.durationMin, 0) / 60).toFixed(1)

  const selected = state.selectedFlightId ? state.flightsById[state.selectedFlightId] : null

  const tracks = useMemo(
    () =>
      flights
        .filter((f) => f.track)
        .map((f) => ({
          id: f.track!.properties?.id || f.id,
          title: `${f.from} → ${f.to}`,
          subtitle: f.dateISO,
          feature: f.track!
        })),
    [flights]
  )

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <div className="muted">Overview of your recent flying</div>
        </div>
      </div>

      <div className="grid4">
        <div className="card stat">
          <div className="muted">Total Hours</div>
          <div className="statValue">{totalHours}</div>
        </div>
        <div className="card stat">
          <div className="muted">Last 30 Days</div>
          <div className="statValue">{last30Hours} <span className="statUnit">hrs</span></div>
        </div>
        <div className="card stat">
          <div className="muted">Landings</div>
          <div className="statValue">{flights.length * 2}</div>
        </div>
        <div className="card stat">
          <div className="muted">Night Flights</div>
          <div className="statValue">{Math.min(5, flights.length)}</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Recent Flights</div>
          <div className="list">
            {flights.slice(0, 5).map((f) => (
              <Link
                key={f.id}
                to={`/flights/${f.id}`}
                className="row"
                onClick={() => dispatch({ type: 'SELECT_FLIGHT', id: f.id })}
              >
                <span className="rowLeft">{f.dateISO} <span className="muted">{f.from} → {f.to}</span></span>
                <span className="rowRight">{(f.durationMin / 60).toFixed(1)} hrs</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Continue Writing Your Last Flight</div>
          {selected ? (
            <>
              <div className="muted">{selected.dateISO} — {selected.from} → {selected.to}</div>
              <div style={{ height: 8 }} />
              <Link className="btnPrimary" to={`/flights/${selected.id}`}>Resume Entry</Link>
              <div style={{ height: 12 }} />
              <MapView
                tracks={tracks}
                selectedId={selected.track?.properties?.id || selected.id}
                height={240}
                onSelect={(trackId) => {
                  // match to flight
                  const flight = flights.find((x) => (x.track?.properties as any)?.id === trackId || x.id === trackId)
                  if (flight) dispatch({ type: 'SELECT_FLIGHT', id: flight.id })
                }}
                showTileAttribution={false}
              />
            </>
          ) : (
            <div className="muted">No flights yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
