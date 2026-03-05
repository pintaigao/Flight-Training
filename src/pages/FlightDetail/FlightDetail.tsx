import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MapView from '@/components/map/MapView'
import { useStore } from '@/store/store'
import { readGpxAsLineString } from '@/lib/geo/gpxToGeojson'
import { deleteFlight, getFlightTrackSamples, uploadFlightTrackFile, upsertFlight, upsertFlightTrack } from '@/lib/api/flight'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { TrackSample } from '@/lib/api/flight'
import TrackChart from '@/components/track/TrackChart'

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

export default function FlightDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, dispatch } = useStore()
  const flight = id ? state.flightsById[id] : undefined
  const flightId = flight?.id ?? null

  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [savingFlight, setSavingFlight] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const [samples, setSamples] = useState<TrackSample[] | null>(null)
  const [samplesError, setSamplesError] = useState<string | null>(null)
  const [loadingSamples, setLoadingSamples] = useState(false)
  const [cursorIdx, setCursorIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [pointsPerSec, setPointsPerSec] = useState(10)
  const timerRef = useRef<number | null>(null)
  const [chartPlacement, setChartPlacement] = useState<'below' | 'overlay'>('overlay')

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

  const activeSample = samples && samples.length ? samples[Math.min(cursorIdx, samples.length - 1)] : null
  const cursor = activeSample ? { lat: activeSample.lat, lng: activeSample.lng } : null

  useEffect(() => {
    if (!playing) return
    if (!samples || samples.length === 0) return

    timerRef.current = window.setInterval(() => {
      setCursorIdx((idx) => {
        const next = idx + Math.max(1, Math.floor(pointsPerSec || 1))
        if (next >= samples.length - 1) {
          window.clearInterval(timerRef.current ?? undefined)
          timerRef.current = null
          setPlaying(false)
          return samples.length - 1
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [playing, pointsPerSec, samples])

  useEffect(() => {
    if (!flightId) return
    // stop playback when flight changes + auto-load replay data
    let cancelled = false
    setPlaying(false)
    setCursorIdx(0)
    setSamples(null)
    setSamplesError(null)
    setLoadingSamples(true)
    ;(async () => {
      try {
        const res = await getFlightTrackSamples(flightId, 'FORE_FLIGHT')
        if (cancelled) return
        setSamples(res.samples)
        setCursorIdx(0)
      } catch (e: any) {
        if (cancelled) return
        setSamples(null)
        setSamplesError(e?.body?.message || e?.message || 'Failed to load samples')
      } finally {
        if (cancelled) return
        setLoadingSamples(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [flightId])

  async function saveToDb() {
    if (!flight) return
    setSaveError(null)
    setSavingFlight(true)
    try {
      await upsertFlight(flight.id, {
        dateISO: flight.dateISO,
        startTimeISO: flight.startTimeISO ?? null,
        endTimeISO: flight.endTimeISO ?? null,
        aircraftTail: flight.aircraftTail,
        from: flight.from,
        to: flight.to,
        durationMin: flight.durationMin,
        description: flight.description ?? null,
        tags: flight.tags,
        comments: flight.comments,
      })
      setLastSavedAt(new Date().toISOString())
    } catch (e: any) {
      setSaveError(e?.body?.message || e?.message || 'Failed to save')
    } finally {
      setSavingFlight(false)
    }
  }

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
  const stats = (flight.trackMeta as any)?.stats as
    | { altMinFt?: number | null; altMaxFt?: number | null; gsAvgKt?: number | null; gsMaxKt?: number | null }
    | undefined

  return (
    <div className="detailLayout">
      <div className="detailMap detailMapStack">
        <div
          className={
            chartPlacement === 'overlay' && samples && samples.length > 0
              ? 'detailMapStage detailMapStageOverlay'
              : 'detailMapStage'
          }
        >
          {flight.track ? (
            <MapView tracks={tracks} selectedId={tracks[0].id} cursor={cursor} />
          ) : (
            <div className="emptyMap">
              <div className="emptyTitle">No track yet</div>
              <div className="muted">Import a GPX or KML file to draw your flight path.</div>
            </div>
          )}

          {chartPlacement === 'overlay' && samples && samples.length > 0 && (
            <div className="detailChartOverlay">
              <TrackChart samples={samples} cursorIdx={cursorIdx} onCursorChange={(i) => setCursorIdx(i)} height={210} />
            </div>
          )}
        </div>

        {chartPlacement === 'below' && samples && samples.length > 0 && (
          <div className="detailChartPanel">
            <TrackChart samples={samples} cursorIdx={cursorIdx} onCursorChange={(i) => setCursorIdx(i)} height={220} />
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
            {stats && (
              <>
                <div className="kvRow"><span className="muted">AGL</span><span>{fmtNum(stats.altMinFt, 0)}–{fmtNum(stats.altMaxFt, 0)} ft</span></div>
                <div className="kvRow"><span className="muted">GS</span><span>avg {fmtNum(stats.gsAvgKt, 1)} kt · max {fmtNum(stats.gsMaxKt, 1)} kt</span></div>
              </>
            )}
          </div>

          <div style={{ height: 12 }} />
          <label className="btn" style={{ display: 'inline-block' }}>
            {importing ? 'Importing…' : 'Import Track (GPX/KML)'}
            <input
              type="file"
              accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml,text/xml"
              style={{ display: 'none' }}
              disabled={importing}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setError(null)
                setImporting(true)
                try {
                  const name = file.name.toLowerCase()
                  const isKml = name.endsWith('.kml')
                  if (isKml) {
                    const saved = await uploadFlightTrackFile(flight.id, 'FORE_FLIGHT', file)
                    const track = saved.feature
                    track.properties = { ...(track.properties ?? {}), id: flight.id }
                    const meta = saved.meta ?? null
                    const startTimeISO = (meta as any)?.startTimeISO ?? flight.startTimeISO ?? null
                    const endTimeISO = (meta as any)?.endTimeISO ?? flight.endTimeISO ?? null

                    const updated = { ...flight, startTimeISO, endTimeISO, trackMeta: meta, trackSource: saved.source }
                    dispatch({ type: 'UPSERT_FLIGHT', flight: updated })
                    dispatch({ type: 'IMPORT_TRACK', id: flight.id, track })
                    await upsertFlight(flight.id, {
                      dateISO: updated.dateISO,
                      startTimeISO: updated.startTimeISO ?? null,
                      endTimeISO: updated.endTimeISO ?? null,
                      aircraftTail: updated.aircraftTail,
                      from: updated.from,
                      to: updated.to,
                      durationMin: updated.durationMin,
                      tags: updated.tags,
                      comments: updated.comments,
                    })
                    return
                  }

                  const track = await readGpxAsLineString(file)
                  // ensure we have an id for styling/select
                  track.properties = { ...(track.properties ?? {}), id: flight.id }
                  await upsertFlightTrack(flight.id, 'FORE_FLIGHT', track, { originalFilename: file.name })
                  dispatch({ type: 'IMPORT_TRACK', id: flight.id, track })
                } catch (err: any) {
                  setError(err?.message ?? 'Failed to import track')
                } finally {
                  setImporting(false)
                  e.currentTarget.value = ''
                }
              }}
            />
          </label>
          {error && <div className="error">{error}</div>}

          <div style={{ height: 10 }} />
          <button className="btnPrimary" disabled={savingFlight} onClick={saveToDb}>
            {savingFlight ? 'Saving…' : 'Save to Database'}
          </button>
          {lastSavedAt && (
            <div className="muted" style={{ marginTop: 8 }}>
              Saved: {new Date(lastSavedAt).toLocaleString('en-US', { timeZone: 'America/Chicago' })}
            </div>
          )}
          {saveError && <div className="error">{saveError}</div>}
        </div>

        <div className="card">
          <div className="cardTitle">Replay</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btnPrimary" disabled={loadingSamples} onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn"
              disabled={!samples || samples.length === 0}
              onClick={() => setCursorIdx(0)}
            >
              Reset
            </button>
            <div className="muted">Points/sec</div>
            <input
              className="input"
              style={{ width: 110, flex: '0 0 auto' }}
              value={String(pointsPerSec)}
              onChange={(e) => setPointsPerSec(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            {loadingSamples && <div className="muted">Loading…</div>}
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="muted">Chart placement</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" checked={chartPlacement === 'below'} onChange={() => setChartPlacement('below')} />
              <span>Below map</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="radio" checked={chartPlacement === 'overlay'} onChange={() => setChartPlacement('overlay')} />
              <span>Overlay</span>
            </label>
          </div>

          <div style={{ height: 12 }} />

          {samples && samples.length > 0 ? (
            <>
              <input
                type="range"
                min={0}
                max={samples.length - 1}
                value={Math.min(cursorIdx, samples.length - 1)}
                onChange={(e) => setCursorIdx(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ height: 10 }} />
              {activeSample && (
                <div className="kv">
                  <div className="kvRow"><span className="muted">Index</span><span>{cursorIdx} / {samples.length - 1}</span></div>
                  <div className="kvRow"><span className="muted">Time</span><span>{new Date(activeSample.t).toLocaleString('en-US', { timeZone: 'America/Chicago' })}</span></div>
                  <div className="kvRow"><span className="muted">AGL</span><span>{fmtNum(activeSample.altAglFt, 0)} ft</span></div>
                  <div className="kvRow"><span className="muted">GS</span><span>{fmtNum(activeSample.gsKt, 1)} kt</span></div>
                  <div className="kvRow"><span className="muted">Pos</span><span>{activeSample.lat.toFixed(5)}, {activeSample.lng.toFixed(5)}</span></div>
                </div>
              )}
            </>
          ) : (
            <div className="muted">Load replay data to enable the slider and marker.</div>
          )}

          {samplesError && <div className="error">{samplesError}</div>}
        </div>

        <div className="card">
          <div className="cardTitle">Danger Zone</div>
          <button className="btnDanger" onClick={() => setConfirmDelete(true)} disabled={deleting}>
            Delete Flight
          </button>
          {deleteError && <div className="error">{deleteError}</div>}
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

      <ConfirmModal
        open={confirmDelete}
        title="Delete flight?"
        message="This permanently deletes the flight and any saved tracks from the database."
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        danger
        disabled={deleting}
        onCancel={() => {
          if (deleting) return
          setConfirmDelete(false)
        }}
        onConfirm={async () => {
          setDeleteError(null)
          setDeleting(true)
          try {
            await deleteFlight(flight.id)
            dispatch({ type: 'DELETE_FLIGHT', id: flight.id })
            setConfirmDelete(false)
            nav('/flights')
          } catch (e: any) {
            setDeleteError(e?.body?.message || e?.message || 'Failed to delete flight')
          } finally {
            setDeleting(false)
          }
        }}
      />
    </div>
  )
}
