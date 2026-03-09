import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import type { Flight } from '@/store/types';
import * as FlightApi from '@/lib/api/flight.api';
import Modal from '@/components/Modal/Modal';

const CHICAGO_TZ = 'America/Chicago';
const BUFFER_MINUTES = 60;

function dateISOInChicago(iso: string) {
  const d = new Date(iso);
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHICAGO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function fmtChicago(iso: string) {
  return new Date(iso).toLocaleString('en-US', {timeZone: CHICAGO_TZ});
}

function minutesBetween(aISO: string, bISO: string) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  
  return Math.max(0, Math.round((b - a) / 60000));
}

type ParsedKml = {
  originalFilename: string;
  startTimeISO: string;
  endTimeISO: string;
  file: File;
};

export default function ImportFlightDataModal({open, parsed, onClose}: { open: boolean; parsed: ParsedKml | null; onClose: () => void; }) {
  const nav = useNavigate();
  const {state, dispatch} = useStore();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newTail, setNewTail] = useState('');
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  
  const allFlights = useMemo(
    () =>
      state.flights.flightIds.map((id) => state.flights.flightsById[id]),
    [state.flights.flightIds, state.flights.flightsById],
  );
  
  const candidates = useMemo(() => {
    if (!parsed) return [];
    const bufferMs = BUFFER_MINUTES * 60 * 1000;
    const kStart = new Date(parsed.startTimeISO).getTime();
    const kEnd = new Date(parsed.endTimeISO).getTime();
    if (!Number.isFinite(kStart) || !Number.isFinite(kEnd)) return [];
    
    const scored: { flight: Flight; score: number }[] = [];
    for (const f of allFlights) {
      if (!f?.startTimeISO || !f?.endTimeISO) continue;
      const fStart = new Date(f.startTimeISO).getTime();
      const fEnd = new Date(f.endTimeISO).getTime();
      if (!Number.isFinite(fStart) || !Number.isFinite(fEnd)) continue;
      const overlaps = fStart <= kEnd + bufferMs && fEnd >= kStart - bufferMs;
      if (!overlaps) continue;
      const score = Math.abs(fStart - kStart) + Math.abs(fEnd - kEnd);
      scored.push({flight: f, score});
    }
    return scored.sort((a, b) => a.score - b.score).map((x) => x.flight);
  }, [allFlights, parsed]);
  
  if (!open || !parsed) return null;
  const p = parsed;
  
  async function attachToFlight(flight: Flight) {
    setError(null);
    setSaving(true);
    try {
      const updated: Flight = {
        ...flight,
        startTimeISO: p.startTimeISO,
        endTimeISO: p.endTimeISO,
      };
      
      await FlightApi.upsertFlight(updated.id, {
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
      
      const saved = await FlightApi.uploadFlightTrackFile(
        updated.id,
        'FORE_FLIGHT',
        p.file,
      );
      const baseFeature = saved.feature;
      const feature = {
        ...baseFeature,
        properties: { ...(baseFeature.properties ?? {}), id: updated.id },
      } as any;
      
      dispatch({
        type: 'UPSERT_FLIGHT',
        flight: {
          ...updated,
          trackMeta: saved.meta ?? null,
          trackSource: saved.source,
        },
      });
      dispatch({type: 'IMPORT_TRACK', id: updated.id, track: feature});
      onClose();
      nav(`/flights/${updated.id}`);
    } catch (e: any) {
      setError(e?.body?.message || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }
  
  async function createAndAttach() {
    setError(null);
    setSaving(true);
    try {
      const dateISO = dateISOInChicago(p.startTimeISO);
      const from = newFrom.trim().toUpperCase();
      const to = newTo.trim().toUpperCase();
      const aircraftTail = newTail.trim().toUpperCase();
      if (!aircraftTail) throw new Error('Tail is required');
      if (!from) throw new Error('From is required');
      if (!to) throw new Error('To is required');
      
      const baseId = `f-${dateISO}-${from.toLowerCase()}-${to.toLowerCase()}-${p.startTimeISO.slice(11, 16).replace(':', '')}`;
      const exists = state.flights.flightsById[baseId];
      const id = exists
        ? `${baseId}-${Math.random().toString(36).slice(2, 6)}`
        : baseId;
      
      const durationMin = minutesBetween(p.startTimeISO, p.endTimeISO);
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      
      const flight: Flight = {
        id,
        dateISO,
        startTimeISO: p.startTimeISO,
        endTimeISO: p.endTimeISO,
        aircraftTail,
        from,
        to,
        durationMin,
        description: newDescription.trim() || null,
        tags,
        comments: '',
      };
      
      await FlightApi.upsertFlight(flight.id, {
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
      });
      
      const saved = await FlightApi.uploadFlightTrackFile(
        flight.id,
        'FORE_FLIGHT',
        p.file,
      );
      const baseFeature = saved.feature;
      const feature = {
        ...baseFeature,
        properties: { ...(baseFeature.properties ?? {}), id: flight.id },
      } as any;
      
      dispatch({
        type: 'UPSERT_FLIGHT',
        flight: {
          ...flight,
          trackMeta: saved.meta ?? null,
          trackSource: saved.source,
        },
      });
      dispatch({type: 'IMPORT_TRACK', id: flight.id, track: feature});
      onClose();
      nav(`/flights/${flight.id}`);
    } catch (e: any) {
      setError(e?.body?.message || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }
  
  const durationMin = minutesBetween(p.startTimeISO, p.endTimeISO);
  
  return (
    <Modal
      open
      title="Import ForeFlight KML"
      width="min(920px, 100%)"
      disabled={saving}
      onClose={() => {
        if (saving) return;
        onClose();
      }}>
      <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 py-3">
        <div className="text-sm font-semibold text-[color:var(--text)]">
          {p.originalFilename}
        </div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          {fmtChicago(p.startTimeISO)} → {fmtChicago(p.endTimeISO)} · ~
          {(durationMin / 60).toFixed(1)} hrs · Candidates matched by time overlap
          (±{BUFFER_MINUTES} min)
        </div>
      </div>

      <div className="h-4"/>

      <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] p-1">
        <button
          className={[
            'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
            mode === 'existing'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[color:var(--muted)] hover:text-[color:var(--text)]',
          ].join(' ')}
          type="button"
          onClick={() => setMode('existing')}
          disabled={saving}>
          Attach to existing
        </button>
        <button
          className={[
            'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
            mode === 'new'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[color:var(--muted)] hover:text-[color:var(--text)]',
          ].join(' ')}
          type="button"
          onClick={() => setMode('new')}
          disabled={saving}>
          Create new flight
        </button>
      </div>

      {mode === 'existing' ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
            <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
              Candidates
            </div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              Closest matches by time overlap.
            </div>

            <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
              {candidates.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">
                  No time-matched flights found.
                </div>
              ) : (
                candidates.slice(0, 8).map((f) => {
                  const active = selectedExistingId === f.id;
                  return (
                    <button
                      key={f.id}
                      className={[
                        'w-full rounded-2xl border px-3 py-2 text-left transition-colors',
                        active
                          ? 'border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] ring-2 ring-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]'
                          : 'border-[var(--border)] bg-[color:var(--panel2)] hover:bg-[color:var(--panel)]',
                      ].join(' ')}
                      type="button"
                      onClick={() => setSelectedExistingId(f.id)}
                      disabled={saving}>
                      <div className="text-base font-extrabold tracking-tight text-[color:var(--text)]">
                        {f.from} → {f.to}
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--muted)]">
                        {f.dateISO} · TAIL #{' '}
                        <span className="text-[color:var(--text)]">
                          {f.aircraftTail}
                        </span>
                        {f.startTimeISO && f.endTimeISO
                          ? ` · ${fmtChicago(f.startTimeISO)} → ${fmtChicago(f.endTimeISO)}`
                          : ''}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
            <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
              Pick any flight
            </div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              Attach the track to any flight in your list.
            </div>

            <select
              className="mt-3 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold text-[color:var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={selectedExistingId}
              onChange={(e) => setSelectedExistingId(e.target.value)}
              disabled={saving}>
              <option value="">Select a flight…</option>
              {allFlights.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.dateISO} {f.aircraftTail} {f.from}→{f.to}
                </option>
              ))}
            </select>

            <div className="h-3"/>

            <button
              className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={saving || !selectedExistingId}
              onClick={() => {
                const f = state.flights.flightsById[selectedExistingId];
                if (f) attachToFlight(f);
              }}>
              {saving ? 'Saving…' : 'Attach track'}
            </button>

            <div className="mt-3 text-sm text-[color:var(--muted)]">
              This sets the flight start/end time to the KML range.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
            New flight details
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">
                Tail
              </div>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={newTail}
                onChange={(e) => setNewTail(e.target.value)}
                placeholder="N77GX"
                disabled={saving}
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">
                Date
              </div>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] outline-none"
                value={dateISOInChicago(p.startTimeISO)}
                disabled
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">
                From
              </div>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                placeholder="KPAO"
                disabled={saving}
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">
                To
              </div>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                placeholder="KMRY"
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-[color:var(--muted)]">
              Description
            </div>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. Steep turns + soft-field landing"
              disabled={saving}
            />
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-[color:var(--muted)]">
              Tags (comma separated)
            </div>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Training, Dual"
              disabled={saving}
            />
          </div>

          <div className="h-4"/>

          <button
            className="btn-primary inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={saving}
            onClick={createAndAttach}>
            {saving ? 'Saving…' : 'Create & attach track'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
    </Modal>
  );
}
