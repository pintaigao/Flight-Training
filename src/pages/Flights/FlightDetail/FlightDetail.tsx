import MapView from '@/components/map/MapView';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/store';
import { readGpxAsLineString } from '@/lib/utils/gpxToGeojson';
import {
  deleteFlight,
  getFlightTrackSamples,
  uploadFlightTrackFile,
  upsertFlight,
  upsertFlightTrack,
} from '@/lib/api/flight.api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { TrackSample } from '@/lib/api/flight.api';
import TrackChart from '@/components/track/TrackChart';
import Modal from '@/components/ui/Modal';
import LexicalEditor from '@/components/richtext/LexicalEditor';
import './FlightDetail.scss';

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

export default function FlightDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, dispatch } = useStore();
  const flight = id ? state.flights.flightsById[id] : undefined;
  const flightId = flight?.id ?? null;

  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [savingFlight, setSavingFlight] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsDraft, setCommentsDraft] = useState('');

  const [samples, setSamples] = useState<TrackSample[] | null>(null);
  const [samplesError, setSamplesError] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [cursorIdx, setCursorIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pointsPerSec, setPointsPerSec] = useState(10);
  const timerRef = useRef<number | null>(null);
  const [chartPlacement, setChartPlacement] = useState<'below' | 'overlay'>('overlay',);

  const tracks = useMemo(() => {
    if (!flight?.track) return [];

    return [
      {
        id: (flight.track.properties as any)?.id || flight.id,
        title: `${flight.from} → ${flight.to}`,
        subtitle: flight.dateISO,
        feature: flight.track,
      },
    ];
  }, [flight]);

  const activeSample =
    samples && samples.length
      ? samples[Math.min(cursorIdx, samples.length - 1)]
      : null;
  const cursor = activeSample
    ? { lat: activeSample.lat, lng: activeSample.lng }
    : null;

  useEffect(() => {
    if (!playing) return;
    if (!samples || samples.length === 0) return;

    timerRef.current = window.setInterval(() => {
      setCursorIdx((idx) => {
        const next = idx + Math.max(1, Math.floor(pointsPerSec || 1));

        if (next >= samples.length - 1) {
          window.clearInterval(timerRef.current ?? undefined);
          timerRef.current = null;
          setPlaying(false);
          return samples.length - 1;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);

      timerRef.current = null;
    };
  }, [playing, pointsPerSec, samples]);

  useEffect(() => {
    if (!flightId) return;
    // stop playback when flight changes + auto-load replay data

    let cancelled = false;
    setPlaying(false);
    setCursorIdx(0);
    setSamples(null);
    setSamplesError(null);
    setLoadingSamples(true);
    (async () => {
      try {
        const res = await getFlightTrackSamples(flightId, 'FORE_FLIGHT');
        if (cancelled) return;
        setSamples(res.samples);
        setCursorIdx(0);
      } catch (e: any) {
        if (cancelled) return;
        setSamples(null);
        setSamplesError(
          e?.body?.message || e?.message || 'Failed to load samples',
        );
      } finally {
        if (cancelled) return;

        setLoadingSamples(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flightId]);

  async function saveToDb(nextComments?: string) {
    if (!flight) return;

    setSaveError(null);
    setSavingFlight(true);

    try {
      const comments = nextComments ?? flight.comments ?? '';
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
        comments,
      });

      if (nextComments != null) {
        dispatch({ type: 'UPDATE_COMMENTS', id: flight.id, comments });
      }
      setLastSavedAt(new Date().toISOString());
      return true;
    } catch (e: any) {
      setSaveError(e?.body?.message || e?.message || 'Failed to save');
      return false;
    } finally {
      setSavingFlight(false);
    }
  }

  if (!flight) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-title">Flight not found</div>
          <button className="btn" onClick={() => nav('/flights')}>
            Back to Flights
          </button>
        </div>
      </div>
    );
  }

  const hrs = (flight.durationMin / 60).toFixed(1);
  const stats = (flight.trackMeta as any)?.stats as any;

  return (
    <div className="detail-layout">
      <div className="detail-map detail-map-stack">
        <div
          className={
            chartPlacement === 'overlay' && samples && samples.length > 0
              ? 'detail-map-stage detail-map-stage-overlay'
              : 'detail-map-stage'
          }>
          {flight.track ? (
            <MapView
              tracks={tracks}
              selectedId={tracks[0].id}
              cursor={cursor}
            />
          ) : (
            <div className="empty-map">
              <div className="empty-title">No track yet</div>
              <div className="muted">
                Import a GPX or KML file to draw your flight path.
              </div>
            </div>
          )}

          {chartPlacement === 'overlay' && samples && samples.length > 0 && (
            <div className="detail-chart-overlay">
              <TrackChart
                samples={samples}
                cursorIdx={cursorIdx}
                onCursorChange={(i) => setCursorIdx(i)}
                height={210}
              />
            </div>
          )}
        </div>

        {chartPlacement === 'below' && samples && samples.length > 0 && (
          <div className="detail-chart-panel">
            <TrackChart
              samples={samples}
              cursorIdx={cursorIdx}
              onCursorChange={(i) => setCursorIdx(i)}
              height={220}
            />
          </div>
        )}
      </div>

      <div className="detail-side">
        <div className="side-header">
          <div className="muted">{flight.dateISO}</div>
          <div className="side-title">
            {flight.aircraftTail} — {flight.from} → {flight.to}
          </div>
          <div className="chip-row">
            <span className="chip">{hrs} hrs</span>
            {flight.tags.map((t) => (
              <span key={t} className="chip chip-soft">
                {' '}
                {t}{' '}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Flight Details</div>
          <div className="kv">
            <div className="kv-row">
              <span className="muted">Route</span>
              <span>
                {' '}
                {flight.from} → {flight.to}{' '}
              </span>
            </div>
            <div className="kv-row">
              <span className="muted">Aircraft</span>
              <span>{flight.aircraftTail}</span>
            </div>
            <div className="kv-row">
              <span className="muted">Duration</span>
              <span>{hrs} hrs</span>
            </div>
            {stats && (
              <>
                <div className="kv-row">
                  <span className="muted">AGL</span>
                  <span>
                    {' '}
                    {fmtNum(stats.altMinFt, 0)}–{fmtNum(stats.altMaxFt, 0)}{' '}
                    ft{' '}
                  </span>
                </div>
                <div className="kv-row">
                  <span className="muted">GS</span>
                  <span>
                    avg {fmtNum(stats.gsAvgKt, 1)} kt · max{' '}
                    {fmtNum(stats.gsMaxKt, 1)} kt
                  </span>
                </div>
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
                const file = e.target.files?.[0];
                if (!file) return;
                setError(null);
                setImporting(true);
                try {
                  const name = file.name.toLowerCase();
                  const isKml = name.endsWith('.kml');
                  if (isKml) {
                    const saved = await uploadFlightTrackFile(
                      flight.id,
                      'FORE_FLIGHT',
                      file,
                    );
                    const track = saved.feature;
                    track.properties = {
                      ...(track.properties ?? {}),
                      id: flight.id,
                    };
                    const meta = saved.meta ?? null;
                    const startTimeISO =
                      (meta as any)?.startTimeISO ??
                      flight.startTimeISO ??
                      null;
                    const endTimeISO =
                      (meta as any)?.endTimeISO ?? flight.endTimeISO ?? null;

                    const updated = {
                      ...flight,
                      startTimeISO,
                      endTimeISO,
                      trackMeta: meta,
                      trackSource: saved.source,
                    };
                    dispatch({ type: 'UPSERT_FLIGHT', flight: updated });
                    dispatch({ type: 'IMPORT_TRACK', id: flight.id, track });
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
                    });
                    return;
                  }

                  const track = await readGpxAsLineString(file);
                  // ensure we have an id for styling/select
                  track.properties = {
                    ...(track.properties ?? {}),
                    id: flight.id,
                  };
                  await upsertFlightTrack(flight.id, 'FORE_FLIGHT', track, {
                    originalFilename: file.name,
                  });
                  dispatch({ type: 'IMPORT_TRACK', id: flight.id, track });
                } catch (err: any) {
                  setError(err?.message ?? 'Failed to import track');
                } finally {
                  setImporting(false);
                  e.currentTarget.value = '';
                }
              }}
            />
          </label>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <div className="card-title">Replay</div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
            <button
              className="btn-primary"
              disabled={loadingSamples}
              onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn"
              disabled={!samples || samples.length === 0}
              onClick={() => setCursorIdx(0)}>
              Reset
            </button>
            <div className="muted">Points/sec</div>
            {/* prettier-ignore */}
            <input
              className="input"
              style={{width: 110, flex: '0 0 auto'}}
              value={String(pointsPerSec)}
              onChange={(e) =>
                setPointsPerSec(
                  Math.max(1, Math.floor(Number(e.target.value) || 1)),
                )
              }/>
            {loadingSamples && <div className="muted">Loading…</div>}
          </div>

          <div style={{ height: 12 }} />

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
            <div className="muted">Chart placement</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* prettier-ignore */}
              <input
                type="radio"
                checked={chartPlacement === 'below'}
                onChange={() => setChartPlacement('below')}/>
              <span>Below map</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* prettier-ignore */}
              <input
                type="radio"
                checked={chartPlacement === 'overlay'}
                onChange={() => setChartPlacement('overlay')}/>
              <span>Overlay</span>
            </label>
          </div>

          <div style={{ height: 12 }} />

          {samples && samples.length > 0 ? (
            <>
              {/* prettier-ignore */}
              <input
                type="range"
                min={0}
                max={samples.length - 1}
                value={Math.min(cursorIdx, samples.length - 1)}
                onChange={(e) => setCursorIdx(Number(e.target.value))}
                style={{width: '100%'}}/>
              <div style={{ height: 10 }} />
              {activeSample && (
                <div className="kv">
                  <div className="kv-row">
                    <span className="muted">Index</span>
                    <span>
                      {cursorIdx} / {samples.length - 1}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">Time</span>
                    <span>
                      {new Date(activeSample.t).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                      })}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">AGL</span>
                    <span>{fmtNum(activeSample.altAglFt, 0)} ft</span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">GS</span>
                    <span>{fmtNum(activeSample.gsKt, 1)} kt</span>
                  </div>
                  <div className="kv-row">
                    <span className="muted">Pos</span>
                    <span>
                      {activeSample.lat.toFixed(5)},{' '}
                      {activeSample.lng.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="muted">
              Load replay data to enable the slider and marker.
            </div>
          )}

          {samplesError && <div className="error">{samplesError}</div>}
        </div>

        <div className="card">
          <div className="card-title">Danger Zone</div>
          <button
            className="btn-danger"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}>
            Delete Flight
          </button>
          {deleteError && <div className="error">{deleteError}</div>}
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8,
            }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              Comments
            </div>
            <button
              className="btn"
              onClick={() => {
                setSaveError(null);
                setCommentsDraft(flight.comments || '');
                setCommentsOpen(true);
              }}>
              Edit
            </button>
          </div>

          {flight.comments ? (
            <LexicalEditor
              value={flight.comments}
              placeholder="No comments yet."
              disabled
              showToolbar={false}
            />
          ) : (
            <div className="muted">No comments yet.</div>
          )}

          {lastSavedAt && (
            <div className="muted" style={{ marginTop: 10 }}>
              Saved:{' '}
              {new Date(lastSavedAt).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={commentsOpen}
        title="Edit Comments"
        disabled={savingFlight}
        onClose={() => {
          if (savingFlight) return;
          setCommentsOpen(false);
        }}>
        <LexicalEditor
          value={commentsDraft}
          onChange={(json) => setCommentsDraft(json)}
          placeholder="Debrief, notes, what to improve next time…"
          disabled={savingFlight}
        />
        {saveError && <div className="error">{saveError}</div>}
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            className="btn"
            disabled={savingFlight}
            onClick={() => setCommentsOpen(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={savingFlight}
            onClick={async () => {
              const ok = await saveToDb(commentsDraft);
              if (ok) setCommentsOpen(false);
            }}>
            {savingFlight ? 'Saving…' : 'Save to Database'}
          </button>
        </div>
      </Modal>

      {/* prettier-ignore */}
      <ConfirmModal
        open={confirmDelete}
        title="Delete flight?"
        message="This permanently deletes the flight and any saved tracks from the database."
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        danger
        disabled={deleting}
        onCancel={() => {
          if (deleting) return;
          setConfirmDelete(false);
        }}
        onConfirm={async () => {
          setDeleteError(null);
          setDeleting(true);
          try {
            await deleteFlight(flight.id);
            dispatch({type: 'DELETE_FLIGHT', id: flight.id});
            setConfirmDelete(false);
            nav('/flights');
          } catch (e: any) {
            setDeleteError(
              e?.body?.message || e?.message || 'Failed to delete flight',
            );
          } finally {
            setDeleting(false);
          }
        }}/>
    </div>
  );
}
