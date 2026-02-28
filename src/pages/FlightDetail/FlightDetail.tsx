import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MapView from '@/components/map/MapView'
import { useStore } from '@/store/store'
import { readGpxAsLineString } from '@/lib/geo/gpxToGeojson'

export default function FlightDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const flight = id ? state.flightsById[id] : undefined

  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const tracks = useMemo(() => {
    if (!flight?.track) return []
    return [
      {
        id: (flight.track.properties as any)?.id || flight.id,
        title: `${flight.from} → ${flight.to}`,
        subtitle: flight.dateISO,
        feature: flight.track
      }
    ]
  }, [flight])

  if (!flight) {
    return (
      <div className="page">
        <div className="card">
          <div className="cardTitle">Flight not found</div>
          <button className="btn" onClick={() => nav('/flights')}>Back to Flights</button>
        </div>
      </div>
    )
  }

  const hrs = (flight.durationMin / 60).toFixed(1)

  return (
    <div className="detailLayout">
      <div className="detailMap">
        {flight.track ? (
          <MapView tracks={tracks} selectedId={tracks[0].id} />
        ) : (
          <div className="emptyMap">
            <div className="emptyTitle">No track yet</div>
            <div className="muted">Import a GPX file to draw your flight path.</div>
          </div>
        )}
      </div>

      <div className="detailSide">
        <div className="sideHeader">
          <div className="muted">{flight.dateISO}</div>
          <div className="sideTitle">{flight.aircraftTail} — {flight.from} → {flight.to}</div>
          <div className="chipRow">
            <span className="chip">{hrs} hrs</span>
            {flight.tags.map((t) => (
              <span key={t} className="chip chipSoft">{t}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Flight Details</div>
          <div className="kv">
            <div className="kvRow"><span className="muted">Route</span><span>{flight.from} → {flight.to}</span></div>
            <div className="kvRow"><span className="muted">Aircraft</span><span>{flight.aircraftTail}</span></div>
            <div className="kvRow"><span className="muted">Duration</span><span>{hrs} hrs</span></div>
          </div>

          <div style={{ height: 12 }} />
          <label className="btn" style={{ display: 'inline-block' }}>
            {importing ? 'Importing…' : 'Import GPX Track'}
            <input
              type="file"
              accept=".gpx,application/gpx+xml,text/xml"
              style={{ display: 'none' }}
              disabled={importing}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setError(null)
                setImporting(true)
                try {
                  const track = await readGpxAsLineString(file)
                  // ensure we have an id for styling/select
                  track.properties = { ...(track.properties ?? {}), id: flight.id }
                  dispatch({ type: 'IMPORT_TRACK', id: flight.id, track })
                } catch (err: any) {
                  setError(err?.message ?? 'Failed to import GPX')
                } finally {
                  setImporting(false)
                  e.currentTarget.value = ''
                }
              }}
            />
          </label>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <div className="cardTitle">What Went Well</div>
          <textarea
            className="textarea"
            value={flight.comments.well}
            onChange={(e) => dispatch({ type: 'UPDATE_COMMENTS', id: flight.id, comments: { well: e.target.value } })}
            placeholder="Good calls, stable approaches, better scan…"
          />
        </div>

        <div className="card">
          <div className="cardTitle">Needs Improvement</div>
          <textarea
            className="textarea"
            value={flight.comments.improve}
            onChange={(e) => dispatch({ type: 'UPDATE_COMMENTS', id: flight.id, comments: { improve: e.target.value } })}
            placeholder="What to tighten up next time…"
          />
        </div>

        <div className="card">
          <div className="cardTitle">Notes</div>
          <textarea
            className="textarea"
            value={flight.comments.notes}
            onChange={(e) => dispatch({ type: 'UPDATE_COMMENTS', id: flight.id, comments: { notes: e.target.value } })}
            placeholder="Weather, ATC, traffic, personal notes…"
          />
        </div>
      </div>
    </div>
  )
}
