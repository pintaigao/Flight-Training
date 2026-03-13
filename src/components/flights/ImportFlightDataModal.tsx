import { useEffect, useMemo, useState } from 'react';
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

async function sha256Hex(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

type SeedItem = {
  id: string;
  originalFilename: string;
  file: File;
  parse:
    | { ok: true; startTimeISO: string; endTimeISO: string }
    | { ok: false; error: string };
  enabled: boolean;
};

type BatchItem = SeedItem & {
  mode: 'existing' | 'new';
  selectedExistingId: string;
  newTail: string;
  newFrom: string;
  newTo: string;
  newDescription: string;
  newTags: string;
  validationError: string | null;
  run:
    | { status: 'pending' }
    | { status: 'running' }
    | { status: 'success'; flightId: string }
    | { status: 'error'; message: string }
    | { status: 'skipped' };
};

type ItemConfig = Pick<
  BatchItem,
  | 'enabled'
  | 'mode'
  | 'selectedExistingId'
  | 'newTail'
  | 'newFrom'
  | 'newTo'
  | 'newDescription'
  | 'newTags'
>;

function statusBadge(status: BatchItem['run']['status']) {
  switch (status) {
    case 'running':
      return 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[color:var(--text)]';
    case 'success':
      return 'bg-emerald-500/15 text-emerald-200';
    case 'error':
      return 'bg-red-500/15 text-red-200';
    case 'skipped':
      return 'bg-[color:color-mix(in_srgb,var(--muted)_25%,transparent)] text-[color:var(--muted)]';
    default:
      return 'bg-[color:color-mix(in_srgb,var(--muted)_25%,transparent)] text-[color:var(--muted)]';
  }
}

function initItems(seed: SeedItem[]): BatchItem[] {
  return seed.map((s) => ({
    ...s,
    mode: 'existing',
    selectedExistingId: '',
    newTail: '',
    newFrom: '',
    newTo: '',
    newDescription: '',
    newTags: '',
    validationError: null,
    run: s.enabled && s.parse.ok ? {status: 'pending'} : {status: 'skipped'},
  }));
}

function pickConfig(it: BatchItem): ItemConfig {
  return {
    enabled: it.enabled,
    mode: it.mode,
    selectedExistingId: it.selectedExistingId,
    newTail: it.newTail,
    newFrom: it.newFrom,
    newTo: it.newTo,
    newDescription: it.newDescription,
    newTags: it.newTags,
  };
}

function isConfigDirty(current: BatchItem, initial: ItemConfig | undefined) {
  if (!initial) return false;
  const cur = pickConfig(current);
  return (
    cur.enabled !== initial.enabled ||
    cur.mode !== initial.mode ||
    cur.selectedExistingId !== initial.selectedExistingId ||
    cur.newTail !== initial.newTail ||
    cur.newFrom !== initial.newFrom ||
    cur.newTo !== initial.newTo ||
    cur.newDescription !== initial.newDescription ||
    cur.newTags !== initial.newTags
  );
}

function isSameConfig(a: ItemConfig, b: ItemConfig) {
  return (
    a.enabled === b.enabled &&
    a.mode === b.mode &&
    a.selectedExistingId === b.selectedExistingId &&
    a.newTail === b.newTail &&
    a.newFrom === b.newFrom &&
    a.newTo === b.newTo &&
    a.newDescription === b.newDescription &&
    a.newTags === b.newTags
  );
}

function computeCandidates(
  allFlights: Flight[],
  startTimeISO: string,
  endTimeISO: string,
) {
  const bufferMs = BUFFER_MINUTES * 60 * 1000;
  const kStart = new Date(startTimeISO).getTime();
  const kEnd = new Date(endTimeISO).getTime();
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
}

export default function ImportFlightDataModal({open, items, onClose}: { open: boolean; items: SeedItem[] | null; onClose: () => void; }) {
  const nav = useNavigate();
  const {state, dispatch} = useStore();
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialConfigById, setInitialConfigById] = useState<Record<string, ItemConfig>>({});
  const [shaByItemId, setShaByItemId] = useState<Record<string, string>>({});
  
  const allFlights = useMemo(() => state.flights.flightIds.map((id) => state.flights.flightsById[id]), [state.flights.flightIds, state.flights.flightsById]);
  
  useEffect(() => {
    if (!open) return;
    if (!items) return;
    setGlobalError(null);
    setRunning(false);
    setShaByItemId({});
    const next = initItems(items);
    setBatchItems(next);
    setSelectedId(next[0]?.id ?? null);
    setInitialConfigById(
      Object.fromEntries(next.map((it) => [it.id, pickConfig(it)])),
    );
  }, [open, items]);
  
  function updateItem(id: string, patch: Partial<BatchItem>) {
    setBatchItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = {...it, ...patch};
        
        const prevCfg = pickConfig(it);
        const nextCfg = pickConfig(next);
        const cfgChanged = !isSameConfig(prevCfg, nextCfg);
        
        if (cfgChanged) {
          // If user changes any config, force the item back into a re-runnable state.
          // (Run status changes themselves do NOT count as config changes.)
          if (!next.enabled || !next.parse.ok) {
            next.run = {status: 'skipped'};
          } else {
            next.run = {status: 'pending'};
          }
        }
        
        return next;
      }),
    );
  }
  
  function updateItemRun(id: string, run: BatchItem['run']) {
    setBatchItems((prev) => prev.map((it) => (it.id === id ? {...it, run} : it)));
  }
  
  function updateItemEnabled(id: string, enabled: boolean) {
    updateItem(id, {enabled, validationError: null});
  }
  
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return batchItems.find((x) => x.id === selectedId) ?? null;
  }, [batchItems, selectedId]);
  
  const selectedMeta = useMemo(() => {
    if (!selected || !selected.parse.ok) return null;
    const durationMin = minutesBetween(
      selected.parse.startTimeISO,
      selected.parse.endTimeISO,
    );
    const candidates = computeCandidates(
      allFlights,
      selected.parse.startTimeISO,
      selected.parse.endTimeISO,
    );
    return {durationMin, candidates};
  }, [allFlights, selected]);
  
  const selectedSuccessFlightId =
    selected && selected.run.status === 'success' ? selected.run.flightId : null;
  
  if (!open || !items) return null;

  async function validateAll(current: BatchItem[]) {
    let ok = true;
    const next = current.map((it) => {
      if (!it.enabled) return {...it, validationError: null};
      if (!it.parse.ok) return {...it, validationError: null};
      // Already-success items are not revalidated unless user changes config (which resets to pending).
      if (it.run.status === 'success') return {...it, validationError: null};
      if (it.mode === 'existing') {
        if (!it.selectedExistingId) {
          ok = false;
          return {...it, validationError: 'Select a flight to attach to'};
        }
      } else {
        const tail = it.newTail.trim();
        const from = it.newFrom.trim();
        const to = it.newTo.trim();
        if (!tail || !from || !to) {
          ok = false;
          return {...it, validationError: 'Tail, From, and To are required'};
        }
      }
      return {...it, validationError: null};
    });

    const updated: BatchItem[] = [];
    for (const it of next) {
      if (!it.enabled || !it.parse.ok || it.run.status === 'success') {
        updated.push(it);
        continue;
      }

      const candidate = allFlights.find(
        (f) => (f.trackMeta as any)?.originalFilename === it.originalFilename,
      );
      if (!candidate) {
        updated.push(it);
        continue;
      }

      // If attaching to the same flight that already has the file, allow it.
      if (it.mode === 'existing' && it.selectedExistingId === candidate.id) {
        updated.push(it);
        continue;
      }

      const existingSha = (candidate.trackMeta as any)?.rawSha256;
      if (typeof existingSha === 'string' && existingSha) {
        let sha = shaByItemId[it.id];
        if (!sha) {
          sha = await sha256Hex(it.file);
          setShaByItemId((prev) => ({...prev, [it.id]: sha}));
        }
        if (sha !== existingSha) {
          // Same filename but different content; treat as non-duplicate.
          updated.push(it);
          continue;
        }
      }

      ok = false;
      updated.push({
        ...it,
        validationError: `Duplicate KML: already imported to flight ${candidate.id}`,
      });
    }

    return {ok, items: updated};
  }
  
  function buildUpsertDto(f: Flight) {
    return {
      dateISO: f.dateISO,
      startTimeISO: f.startTimeISO ?? null,
      endTimeISO: f.endTimeISO ?? null,
      aircraftTail: f.aircraftTail,
      from: f.from,
      to: f.to,
      durationMin: f.durationMin,
      description: f.description ?? null,
      tags: f.tags,
      comments: f.comments,
    };
  }
  
  function makeUniqueFlightId(
    reserved: Set<string>,
    baseId: string,
  ) {
    let id = baseId;
    while (reserved.has(id)) {
      id = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
    }
    reserved.add(id);
    return id;
  }
  
  async function importAll() {
    setGlobalError(null);
    const {ok, items: validated} = await validateAll(batchItems);
    setBatchItems(validated);
    if (!ok) return;
    
    setRunning(true);
    let shouldClose = false;
    try {
      const reservedIds = new Set<string>(Object.keys(state.flights.flightsById));
      const finalStatusById = new Map<string, BatchItem['run']['status']>(
        validated.map((it) => [it.id, it.run.status]),
      );
      const requiredIds = validated
        .filter((x) => x.enabled && x.parse.ok)
        .map((x) => x.id);
      
      for (const it of validated) {
        if (!it.enabled) {
          updateItemRun(it.id, {status: 'skipped'});
          finalStatusById.set(it.id, 'skipped');
          continue;
        }
        if (!it.parse.ok) {
          updateItemRun(it.id, {status: 'skipped'});
          finalStatusById.set(it.id, 'skipped');
          continue;
        }
        if (it.run.status === 'success') {
          // Do not re-submit already successful imports.
          continue;
        }
        
        const p = it.parse;
        updateItemRun(it.id, {status: 'running'});
        finalStatusById.set(it.id, 'running');
        
        try {
          if (it.mode === 'existing') {
            const flight = state.flights.flightsById[it.selectedExistingId];
            if (!flight) throw new Error('Selected flight not found');
            
            const updated: Flight = {
              ...flight,
              startTimeISO: p.startTimeISO,
              endTimeISO: p.endTimeISO,
            };
            
            await FlightApi.upsertFlight(updated.id, buildUpsertDto(updated));
            const saved = await FlightApi.uploadFlightTrackFile(
              updated.id,
              'FORE_FLIGHT',
              it.file,
            );
            
            const baseFeature = saved.feature;
            const feature = {
              ...baseFeature,
              properties: {...(baseFeature.properties ?? {}), id: updated.id},
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
            updateItemRun(it.id, {status: 'success', flightId: updated.id});
            finalStatusById.set(it.id, 'success');
          } else {
            const dateISO = dateISOInChicago(p.startTimeISO);
            const from = it.newFrom.trim().toUpperCase();
            const to = it.newTo.trim().toUpperCase();
            const aircraftTail = it.newTail.trim().toUpperCase();
            
            const baseId = `f-${dateISO}-${from.toLowerCase()}-${to.toLowerCase()}-${p.startTimeISO.slice(11, 16).replace(':', '')}`;
            const id = makeUniqueFlightId(reservedIds, baseId);
            
            const durationMin = minutesBetween(p.startTimeISO, p.endTimeISO);
            const tags = it.newTags
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
              description: it.newDescription.trim() || null,
              tags,
              comments: '',
            };
            
            await FlightApi.upsertFlight(flight.id, buildUpsertDto(flight));
            const saved = await FlightApi.uploadFlightTrackFile(
              flight.id,
              'FORE_FLIGHT',
              it.file,
            );
            
            const baseFeature = saved.feature;
            const feature = {
              ...baseFeature,
              properties: {...(baseFeature.properties ?? {}), id: flight.id},
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
            updateItemRun(it.id, {status: 'success', flightId: flight.id});
            finalStatusById.set(it.id, 'success');
          }
        } catch (e: any) {
          updateItemRun(it.id, {
            status: 'error',
            message: e?.body?.message || e?.message || 'Failed to import',
          });
          finalStatusById.set(it.id, 'error');
        }
      }
      
      // Auto-close if all enabled + parse-ok items are successful.
      shouldClose =
        requiredIds.length > 0 &&
        requiredIds.every((id) => finalStatusById.get(id) === 'success');
    } catch (e: any) {
      setGlobalError(e?.message || 'Import failed');
    } finally {
      setRunning(false);
      if (shouldClose) onClose();
    }
  }
  
  return (
    <Modal
      open
      title="Import ForeFlight KML (Batch)"
      width="min(920px, 100%)"
      scroll="none"
      disabled={running}
      onClose={() => {
        if (running) return;
        onClose();
      }}>
      <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 py-3">
        <div className="text-sm font-semibold text-[color:var(--text)]">
          {batchItems.length} file{batchItems.length === 1 ? '' : 's'} selected
        </div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Candidates are matched by time overlap (±{BUFFER_MINUTES} min). Parse
          failures are shown in red and default unchecked.
        </div>
      </div>
      
      <div className="h-4"/>
      
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {batchItems.map((it) => {
          const parseOk = it.parse.ok;
          const disabled = running;
          const isSelected = it.id === selected?.id;
          const dirty = parseOk
            ? isConfigDirty(it, initialConfigById[it.id])
            : false;
          const hasValidationError = !!it.validationError;
          
          const baseCls = 'rounded-2xl border px-3 py-3 text-left transition-colors';
          const stateCls = !parseOk || hasValidationError
            ? 'border-red-500/30 bg-red-500/10'
            : dirty
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-[var(--border)] bg-[color:var(--panel2)] hover:bg-[color:var(--panel)]';
          const selectedCls = isSelected
            ? 'ring-2 ring-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]'
            : '';
          
          return (
            <button
              key={it.id}
              className={[baseCls, stateCls, selectedCls].join(' ')}
              type="button"
              onClick={() => setSelectedId(it.id)}
              disabled={disabled}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    checked={it.enabled}
                    onChange={(e) => updateItemEnabled(it.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disabled || !parseOk}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold tracking-tight text-[color:var(--text)]">
                      {it.originalFilename}
                    </div>
                    {parseOk ? (
                      <div className="mt-1 truncate text-xs text-[color:var(--muted)]">
                        {fmtChicago(it.parse.startTimeISO)} → {fmtChicago(it.parse.endTimeISO)}
                      </div>
                    ) : (
                      <div className="mt-1 truncate text-xs text-red-200">
                        {it.parse.error}
                      </div>
                    )}
                  </div>
                </div>
                
                <div
                  className={[
                    'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold',
                    statusBadge(it.run.status),
                  ].join(' ')}>
                  {parseOk ? it.run.status.toUpperCase() : 'ERROR'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="h-4"/>
      
      {selected ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold tracking-tight text-[color:var(--text)]">
                {selected.originalFilename}
              </div>
              {selected.parse.ok ? (
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  {fmtChicago(selected.parse.startTimeISO)} → {fmtChicago(selected.parse.endTimeISO)} · ~
                  {selectedMeta ? (selectedMeta.durationMin / 60).toFixed(1) : '—'} hrs
                </div>
              ) : (
                <div className="mt-1 text-sm text-red-200">
                  {selected.parse.error}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {selectedSuccessFlightId && (
                <button
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-sm font-semibold text-[color:var(--text)] hover:bg-[color:var(--panel)]"
                  type="button"
                  onClick={() => nav(`/flights/${selectedSuccessFlightId}`)}
                  disabled={running}>
                  Open
                </button>
              )}
              <div
                className={[
                  'rounded-full px-2 py-1 text-xs font-semibold',
                  statusBadge(selected.run.status),
                ].join(' ')}>
                {selected.run.status.toUpperCase()}
              </div>
            </div>
          </div>
          
          {selected.parse.ok ? (
            <>
              <div className="h-3"/>
              
              <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] p-1">
                <button
                  className={[
                    'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
                    selected.mode === 'existing'
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[color:var(--muted)] hover:text-[color:var(--text)]',
                  ].join(' ')}
                  type="button"
                  onClick={() =>
                    updateItem(selected.id, {mode: 'existing', validationError: null})
                  }
                  disabled={running}>
                  Attach to existing
                </button>
                <button
                  className={[
                    'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
                    selected.mode === 'new'
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[color:var(--muted)] hover:text-[color:var(--text)]',
                  ].join(' ')}
                  type="button"
                  onClick={() =>
                    updateItem(selected.id, {mode: 'new', validationError: null})
                  }
                  disabled={running}>
                  Create new flight
                </button>
              </div>
              
              {selected.mode === 'existing' ? (
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] p-4">
                    <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
                      Candidates
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">
                      Closest matches by time overlap.
                    </div>
                    
                    <div className="mt-3 max-h-[240px] space-y-2 overflow-auto pr-1">
                      {!selectedMeta || selectedMeta.candidates.length === 0 ? (
                        <div className="text-sm text-[color:var(--muted)]">
                          No time-matched flights found.
                        </div>
                      ) : (
                        selectedMeta.candidates.slice(0, 8).map((f) => {
                          const active = selected.selectedExistingId === f.id;
                          return (
                            <button
                              key={f.id}
                              className={[
                                'w-full rounded-2xl border px-3 py-2 text-left transition-colors',
                                active
                                  ? 'border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] ring-2 ring-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]'
                                  : 'border-[var(--border)] bg-[color:var(--panel)] hover:bg-[color:var(--panel2)]',
                              ].join(' ')}
                              type="button"
                              onClick={() =>
                                updateItem(selected.id, {
                                  selectedExistingId: f.id,
                                  validationError: null,
                                })
                              }
                              disabled={running}>
                              <div className="text-base font-extrabold tracking-tight text-[color:var(--text)]">
                                {f.from} → {f.to}
                              </div>
                              <div className="mt-1 text-sm text-[color:var(--muted)]">
                                {f.dateISO} · TAIL{' '}
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
                  
                  <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] p-4">
                    <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
                      Pick any flight
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">
                      Attach the track to any flight in your list.
                    </div>
                    
                    <select
                      className="mt-3 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-sm font-semibold text-[color:var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      value={selected.selectedExistingId}
                      onChange={(e) =>
                        updateItem(selected.id, {
                          selectedExistingId: e.target.value,
                          validationError: null,
                        })
                      }
                      disabled={running}>
                      <option value="">Select a flight…</option>
                      {allFlights.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.dateISO} {f.aircraftTail} {f.from}→{f.to}
                        </option>
                      ))}
                    </select>
                    
                    <div className="mt-3 text-sm text-[color:var(--muted)]">
                      This sets the flight start/end time to the KML range.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] p-4">
                  <div className="text-sm font-extrabold tracking-tight text-[color:var(--text)]">
                    New flight details
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-[color:var(--muted)]">
                        Tail
                      </div>
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={selected.newTail}
                        onChange={(e) =>
                          updateItem(selected.id, {
                            newTail: e.target.value,
                            validationError: null,
                          })
                        }
                        placeholder="N77GX"
                        disabled={running}
                      />
                    </div>
                    
                    <div>
                      <div className="text-xs font-semibold text-[color:var(--muted)]">
                        Date
                      </div>
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] outline-none"
                        value={dateISOInChicago(selected.parse.startTimeISO)}
                        disabled
                      />
                    </div>
                    
                    <div>
                      <div className="text-xs font-semibold text-[color:var(--muted)]">
                        From
                      </div>
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={selected.newFrom}
                        onChange={(e) =>
                          updateItem(selected.id, {
                            newFrom: e.target.value,
                            validationError: null,
                          })
                        }
                        placeholder="KPAO"
                        disabled={running}
                      />
                    </div>
                    
                    <div>
                      <div className="text-xs font-semibold text-[color:var(--muted)]">
                        To
                      </div>
                      <input
                        className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={selected.newTo}
                        onChange={(e) =>
                          updateItem(selected.id, {
                            newTo: e.target.value,
                            validationError: null,
                          })
                        }
                        placeholder="KMRY"
                        disabled={running}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">
                      Description
                    </div>
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      value={selected.newDescription}
                      onChange={(e) =>
                        updateItem(selected.id, {newDescription: e.target.value})
                      }
                      placeholder="e.g. Steep turns + soft-field landing"
                      disabled={running}
                    />
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">
                      Tags (comma separated)
                    </div>
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      value={selected.newTags}
                      onChange={(e) =>
                        updateItem(selected.id, {newTags: e.target.value})
                      }
                      placeholder="Training, Dual"
                      disabled={running}
                    />
                  </div>
                </div>
              )}
              
              {selected.validationError && (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {selected.validationError}
                </div>
              )}
            </>
          ) : null}
          
          {selected.run.status === 'error' && (
            <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {selected.run.message}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 py-3 text-sm text-[color:var(--muted)]">
          Select a file above to configure its import.
        </div>
      )}
      
      {globalError && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {globalError}
        </div>
      )}
      
      <div className="h-4"/>
      
      <div className="flex items-center justify-end gap-3">
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 font-semibold text-[color:var(--text)] hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onClose}
          disabled={running}>
          Close
        </button>
        <button
          className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={importAll}
          disabled={running}>
          {running ? 'Importing…' : 'Import all'}
        </button>
      </div>
    </Modal>
  );
}
