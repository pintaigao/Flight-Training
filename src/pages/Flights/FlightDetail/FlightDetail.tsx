import MapView from '@/components/map/MapView';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/store';
import { readGpxAsLineString } from '@/lib/utils/gpxToGeojson';
import {
  deleteFlight,
  getFlightTrackSamples,
  patchFlightDescription,
  uploadFlightTrackFile,
  upsertFlight,
  upsertFlightTrack,
} from '@/lib/api/flight.api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { TrackSample } from '@/lib/api/flight.api';
import TrackChart from '@/components/track/TrackChart';
import Modal from '@/components/ui/Modal';
import LexicalEditor from '@/components/richtext/LexicalEditor';
import { fmtFlightTimeRange } from '@/lib/utils/flightTimeFormat';
import './FlightDetail.scss';

function fmtNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function fmtInt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

function bearingDeg(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lng - from.lng);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return brng;
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
  const [descOpen, setDescOpen] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);

  const [samples, setSamples] = useState<TrackSample[] | null>(null);
  const [samplesError, setSamplesError] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [cursorIdx, setCursorIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pointsPerSec, setPointsPerSec] = useState(10);
  const timerRef = useRef<number | null>(null);
  const [chartPlacement, setChartPlacement] = useState<'below' | 'overlay'>(
    'overlay',
  );

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

  const departureTimeZone = (flight as any)?.trackMeta?.departureTimeZone ?? null;

  const activeSample =
    samples && samples.length
      ? samples[Math.min(cursorIdx, samples.length - 1)]
      : null;
  const cursor = activeSample
    ? { lat: activeSample.lat, lng: activeSample.lng }
    : null;
  const cursorHeadingDeg =
    activeSample && samples && samples.length > 1
      ? (() => {
          const idx = Math.min(cursorIdx, samples.length - 1);
          const prev = idx > 0 ? samples[idx - 1] : samples[idx + 1];
          if (!prev) return null;
          return bearingDeg(
            { lat: prev.lat, lng: prev.lng },
            { lat: activeSample.lat, lng: activeSample.lng },
          );
        })()
      : null;
  const cursorLabelLines =
    activeSample && flight
      ? [
          flight.aircraftTail,
          `${fmtInt(activeSample.altAglFt)} ft  ${fmtInt(activeSample.gsKt)} kts`,
          new Date(activeSample.t).toLocaleTimeString('en-US', {
            timeZone: 'America/Chicago',
            hour: 'numeric',
            minute: '2-digit',
          }),
          `${flight.from}  ${flight.to}`,
        ]
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
      <div className="card flightDetail-notFound rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="flightDetail-notFoundTitle text-base font-bold">
          Flight not found
        </div>
        <div className="flightDetail-notFoundActions mt-4">
          <button
            className="btn inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)]"
            type="button"
            onClick={() => nav('/flights')}>
            Back to Flights
          </button>
        </div>
      </div>
    );
  }

  const hrs = (flight.durationMin / 60).toFixed(1);
  const hasChart = !!(samples && samples.length > 0);

  return (
    <div className="flightDetail grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
      <div className="flightDetail-main min-w-0 space-y-3 lg:flex lg:h-[calc(100vh-12rem)] lg:flex-col lg:gap-3 lg:space-y-0">
        <div
          className={[
            'flightDetail-mapShell relative h-[60vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]',
            'lg:h-auto lg:flex-1',
          ].join(' ')}>
          {flight.track ? (
            <MapView
              tracks={tracks}
              selectedId={tracks[0].id}
              cursor={cursor}
              invalidateKey={`${chartPlacement}:${hasChart ? 'chart' : 'nochart'}`}
              cursorLabelLines={cursorLabelLines}
              cursorHeadingDeg={cursorHeadingDeg}
            />
          ) : (
            <div className="flightDetail-emptyMap flex h-full flex-col items-center justify-center gap-1 text-center">
              <div className="flightDetail-emptyTitle text-base font-extrabold">
                No track yet
              </div>
              <div className="flightDetail-emptySubtitle text-sm text-[var(--muted)]">
                Import a GPX or KML file to draw your flight path.
              </div>
            </div>
          )}

          {chartPlacement === 'overlay' && hasChart && (
            <div className="flightDetail-chartOverlay pointer-events-none absolute inset-x-4 bottom-4 z-[2000] overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:rgba(10,16,28,0.55)] shadow-[var(--shadow)] backdrop-blur">
              <div className="flightDetail-chartOverlayInner pointer-events-auto">
                <TrackChart
                  samples={samples}
                  cursorIdx={cursorIdx}
                  onCursorChange={(i) => setCursorIdx(i)}
                  height={210}
                />
              </div>
            </div>
          )}
        </div>

        {chartPlacement === 'below' && hasChart && (
          <div className="flightDetail-chartBelow overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] lg:h-[220px] lg:shrink-0">
            <TrackChart
              samples={samples}
              cursorIdx={cursorIdx}
              onCursorChange={(i) => setCursorIdx(i)}
              height={220}
            />
          </div>
        )}
      </div>

      <div
        className="flightDetail-side min-w-0 space-y-4 lg:h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1"
        style={{ scrollbarGutter: 'stable' }}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flightDetail-date text-sm font-semibold text-[var(--muted)]">
                {flight.dateISO}
              </div>
              <h1 className="flightDetail-title mt-1 text-2xl font-extrabold tracking-tight">
                {flight.aircraftTail} — {flight.from} → {flight.to}
              </h1>
              <div className="flightDetail-tags mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-1 text-sm font-semibold">
                  {hrs} hrs
                </span>
                {flight.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.12)] px-3 py-1 text-sm font-semibold">
                    {t}
                  </span>
                ))}
              </div>
              {deleteError && (
                <div className="error mt-2 text-sm text-red-400">
                  {deleteError}
                </div>
              )}
            </div>

            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.25)] bg-[color:rgba(255,84,84,0.08)] text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              aria-label="Delete flight"
              title="Delete flight"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="flex items-start justify-between gap-3">
            <div className="card-title text-base font-bold">Flight Details</div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] hover:bg-[color:var(--panel)]"
              type="button"
              aria-label="Edit description"
              title="Edit description"
              onClick={() => {
                setDescError(null);
                setDescDraft(flight.description ?? '');
                setDescOpen(true);
              }}>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
          <div className="flightDetail-kvList mt-3 space-y-2 text-sm">
            <div className="flightDetail-kv flex justify-between gap-4">
              <span className="muted text-[var(--muted)]">Route</span>
              <span className="font-semibold">
                {flight.from} → {flight.to}
              </span>
            </div>
            <div className="flightDetail-kv flex justify-between gap-4">
              <span className="muted text-[var(--muted)]">Time</span>
              <span className="font-semibold">
                {fmtFlightTimeRange(
                  flight.startTimeISO,
                  flight.endTimeISO,
                  departureTimeZone,
                )}
              </span>
            </div>
            <div className="flightDetail-kv flex justify-between gap-4">
              <span className="muted text-[var(--muted)]">Duration</span>
              <span className="font-semibold">{hrs} hrs</span>
            </div>
            <div className="flightDetail-kv flex flex-col gap-1">
              <span className="muted text-[var(--muted)]">Description</span>
              <span className="font-semibold text-[color:var(--text)]">
                {flight.description?.trim() ? flight.description : '—'}
              </span>
            </div>
          </div>

          <div className="flightDetail-mtMd mt-4">
            <label className="inline-flex cursor-pointer">
              <span className="btn inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)]">
                {importing ? 'Importing…' : 'Import Track (GPX/KML)'}
              </span>
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
                        description: updated.description ?? null,
                      });
                      return;
                    }

                    const track = await readGpxAsLineString(file);
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
          </div>

          {error && (
            <div className="error flightDetail-mtSm mt-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="card-title text-base font-bold">Replay</div>

          <div className="flightDetail-actions mt-3 flex flex-wrap items-center gap-2">
            <button
              className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loadingSamples}
              onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!samples || samples.length === 0}
              onClick={() => setCursorIdx(0)}>
              Reset
            </button>

            <div className="flightDetail-actionsRight ml-auto flex items-center gap-2">
              <div className="flightDetail-pointsLabel text-sm text-[var(--muted)]">
                Points/sec
              </div>
              <input
                className="input flightDetail-pointsInput h-11 w-28 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={String(pointsPerSec)}
                onChange={(e) =>
                  setPointsPerSec(
                    Math.max(1, Math.floor(Number(e.target.value) || 1)),
                  )
                }
              />
            </div>

            {loadingSamples && (
              <div className="muted text-sm text-[var(--muted)]">Loading…</div>
            )}
          </div>

          <div className="flightDetail-radioRow mt-4 flex flex-wrap items-center gap-4">
            <div className="muted text-sm text-[var(--muted)]">Chart placement</div>
            <label className="flightDetail-radioLabel flex items-center gap-2 text-sm font-semibold">
              <input
                type="radio"
                checked={chartPlacement === 'below'}
                onChange={() => setChartPlacement('below')}
              />
              <span>Below map</span>
            </label>
            <label className="flightDetail-radioLabel flex items-center gap-2 text-sm font-semibold">
              <input
                type="radio"
                checked={chartPlacement === 'overlay'}
                onChange={() => setChartPlacement('overlay')}
              />
              <span>Overlay</span>
            </label>
          </div>

          <div className="flightDetail-mtMd mt-4">
            {samples && samples.length > 0 ? (
              <>
                <input
                  className="flightDetail-range w-full"
                  type="range"
                  min={0}
                  max={samples.length - 1}
                  value={Math.min(cursorIdx, samples.length - 1)}
                  onChange={(e) => setCursorIdx(Number(e.target.value))}
                />
                <div className="flightDetail-kvList mt-3 space-y-2 text-sm">
                  {activeSample && (
                    <>
                      <div className="flightDetail-kv flex justify-between gap-4">
                        <span className="muted text-[var(--muted)]">Index</span>
                        <span className="font-semibold">
                          {cursorIdx} / {samples.length - 1}
                        </span>
                      </div>
                      <div className="flightDetail-kv flex justify-between gap-4">
                        <span className="muted text-[var(--muted)]">Time</span>
                        <span className="font-semibold">
                          {new Date(activeSample.t).toLocaleString('en-US', {
                            timeZone: 'America/Chicago',
                          })}
                        </span>
                      </div>
                      <div className="flightDetail-kv flex justify-between gap-4">
                        <span className="muted text-[var(--muted)]">MSL</span>
                        <span className="font-semibold">
                          {fmtNum(activeSample.altAglFt, 0)} ft
                        </span>
                      </div>
                      <div className="flightDetail-kv flex justify-between gap-4">
                        <span className="muted text-[var(--muted)]">GS</span>
                        <span className="font-semibold">
                          {fmtNum(activeSample.gsKt, 1)} kt
                        </span>
                      </div>
                      <div className="flightDetail-kv flex justify-between gap-4">
                        <span className="muted text-[var(--muted)]">Pos</span>
                        <span className="font-semibold">
                          {activeSample.lat.toFixed(5)},{' '}
                          {activeSample.lng.toFixed(5)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="muted text-sm text-[var(--muted)]">
                Load replay data to enable the slider and marker.
              </div>
            )}
          </div>

          {samplesError && (
            <div className="error flightDetail-mtSm mt-2 text-sm text-red-400">
              {samplesError}
            </div>
          )}
        </div>

        <div className="card rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="flightDetail-cardHead flex items-center justify-between gap-4">
            <div className="card-title flightDetail-cardTitle">Comments</div>
            <button
              className="btn inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)]"
              type="button"
              onClick={() => {
                setSaveError(null);
                setCommentsDraft(flight.comments || '');
                setCommentsOpen(true);
              }}>
              Edit
            </button>
          </div>

          <div className="mt-3">
            {flight.comments ? (
              <LexicalEditor
                value={flight.comments}
                placeholder="No comments yet."
                disabled
                showToolbar={false}
              />
            ) : (
              <div className="muted text-sm text-[var(--muted)]">No comments yet.</div>
            )}
          </div>

          {lastSavedAt && (
            <div className="muted flightDetail-mtMd mt-3 text-sm text-[var(--muted)]">
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
        {saveError && <div className="error text-sm text-red-400">{saveError}</div>}
        <div className="h-4" />
        <div className="flightDetail-actions flightDetail-actionsEnd flex justify-end gap-2">
          <button
            className="btn inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={savingFlight}
            onClick={() => setCommentsOpen(false)}>
            Cancel
          </button>
          <button
            className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={savingFlight}
            onClick={async () => {
              const ok = await saveToDb(commentsDraft);
              if (ok) setCommentsOpen(false);
            }}>
            {savingFlight ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

      <Modal
        open={descOpen}
        title="Edit Description"
        disabled={savingDesc}
        onClose={() => {
          if (savingDesc) return;
          setDescOpen(false);
        }}>
        <textarea
          className="h-28 w-full resize-y rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-2 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={descDraft}
          placeholder="Short summary (optional)"
          disabled={savingDesc}
          maxLength={280}
          onChange={(e) => setDescDraft(e.target.value)}
        />
        {descError && <div className="mt-2 text-sm text-red-400">{descError}</div>}
        <div className="h-4" />
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={savingDesc}
            onClick={() => setDescOpen(false)}>
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={savingDesc}
            onClick={async () => {
              setDescError(null);
              setSavingDesc(true);
              try {
                const res = await patchFlightDescription(flight.id, descDraft);
                dispatch({
                  type: 'UPSERT_FLIGHT',
                  flight: { ...flight, description: res.description },
                });
                setDescOpen(false);
              } catch (e: any) {
                setDescError(
                  e?.body?.message || e?.message || 'Failed to save description',
                );
              } finally {
                setSavingDesc(false);
              }
            }}>
            {savingDesc ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Modal>

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
            dispatch({ type: 'DELETE_FLIGHT', id: flight.id });
            setConfirmDelete(false);
            nav('/flights');
          } catch (e: any) {
            setDeleteError(
              e?.body?.message || e?.message || 'Failed to delete flight',
            );
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
