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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="text-base font-bold">Flight not found</div>
        <div className="mt-4">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)]"
            type="button"
            onClick={() => nav('/flights')}>
            Back to Flights
          </button>
        </div>
      </div>
    );
  }

  const hrs = (flight.durationMin / 60).toFixed(1);
  const stats = (flight.trackMeta as any)?.stats as any;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-3">
        <div className="relative h-[60vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] lg:h-[calc(100vh-18rem)]">
          {flight.track ? (
            <MapView tracks={tracks} selectedId={tracks[0].id} cursor={cursor} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <div className="text-base font-extrabold">No track yet</div>
              <div className="text-sm text-[var(--muted)]">
                Import a GPX or KML file to draw your flight path.
              </div>
            </div>
          )}

          {chartPlacement === 'overlay' && samples && samples.length > 0 && (
            <div className="absolute inset-x-4 bottom-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[color:rgba(10,16,28,0.55)] shadow-[var(--shadow)] backdrop-blur">
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
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
            <TrackChart
              samples={samples}
              cursorIdx={cursorIdx}
              onCursorChange={(i) => setCursorIdx(i)}
              height={220}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-auto lg:pr-1">
        <div>
          <div className="text-sm font-semibold text-[var(--muted)]">
            {flight.dateISO}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            {flight.aircraftTail} — {flight.from} → {flight.to}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-base font-bold">Flight Details</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--muted)]">Route</span>
              <span className="font-semibold">
                {flight.from} → {flight.to}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--muted)]">Aircraft</span>
              <span className="font-semibold">{flight.aircraftTail}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--muted)]">Duration</span>
              <span className="font-semibold">{hrs} hrs</span>
            </div>
            {stats && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">AGL</span>
                  <span className="font-semibold">
                    {fmtNum(stats.altMinFt, 0)}–{fmtNum(stats.altMaxFt, 0)} ft
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--muted)]">GS</span>
                  <span className="font-semibold">
                    avg {fmtNum(stats.gsAvgKt, 1)} kt · max{' '}
                    {fmtNum(stats.gsMaxKt, 1)} kt
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <label className="inline-flex cursor-pointer">
              <span className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)]">
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

          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-base font-bold">Replay</div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loadingSamples}
              onClick={() => setPlaying((p) => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!samples || samples.length === 0}
              onClick={() => setCursorIdx(0)}>
              Reset
            </button>

            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-[var(--muted)]">Points/sec</div>
              <input
                className="h-11 w-28 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={String(pointsPerSec)}
                onChange={(e) =>
                  setPointsPerSec(
                    Math.max(1, Math.floor(Number(e.target.value) || 1)),
                  )
                }
              />
            </div>

            {loadingSamples && (
              <div className="text-sm text-[var(--muted)]">Loading…</div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="text-sm text-[var(--muted)]">Chart placement</div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="radio"
                checked={chartPlacement === 'below'}
                onChange={() => setChartPlacement('below')}
              />
              <span>Below map</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="radio"
                checked={chartPlacement === 'overlay'}
                onChange={() => setChartPlacement('overlay')}
              />
              <span>Overlay</span>
            </label>
          </div>

          <div className="mt-4">
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
                <div className="mt-3 space-y-2 text-sm">
                  {activeSample && (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">Index</span>
                        <span className="font-semibold">
                          {cursorIdx} / {samples.length - 1}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">Time</span>
                        <span className="font-semibold">
                          {new Date(activeSample.t).toLocaleString('en-US', {
                            timeZone: 'America/Chicago',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">AGL</span>
                        <span className="font-semibold">
                          {fmtNum(activeSample.altAglFt, 0)} ft
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">GS</span>
                        <span className="font-semibold">
                          {fmtNum(activeSample.gsKt, 1)} kt
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[var(--muted)]">Pos</span>
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
              <div className="text-sm text-[var(--muted)]">
                Load replay data to enable the slider and marker.
              </div>
            )}
          </div>

          {samplesError && (
            <div className="mt-2 text-sm text-red-400">{samplesError}</div>
          )}
        </div>

        <div className="rounded-2xl border border-[color:rgba(255,84,84,0.25)] bg-[color:rgba(255,84,84,0.08)] p-4 shadow-[var(--shadow)]">
          <div className="text-base font-bold">Danger Zone</div>
          <button
            className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] px-4 font-semibold text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}>
            Delete Flight
          </button>
          {deleteError && (
            <div className="mt-2 text-sm text-red-400">{deleteError}</div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-4">
            <div className="text-base font-bold">Comments</div>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold hover:bg-[color:var(--panel)]"
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
              <div className="text-sm text-[var(--muted)]">
                No comments yet.
              </div>
            )}
          </div>

          {lastSavedAt && (
            <div className="mt-3 text-sm text-[var(--muted)]">
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
        {saveError && <div className="text-sm text-red-400">{saveError}</div>}
        <div className="h-4" />
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={savingFlight}
            onClick={() => setCommentsOpen(false)}>
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
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

