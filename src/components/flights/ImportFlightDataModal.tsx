import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/store';
import type { Flight } from '@/store/types';
import { uploadFlightTrackFile, upsertFlight } from '@/lib/api/flight.api';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import '../ui/Modal.scss';
import '../map/MapList.scss';

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
      
      await upsertFlight(updated.id, {
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
      
      const saved = await uploadFlightTrackFile(
        updated.id,
        'FORE_FLIGHT',
        p.file,
      );
      const feature = saved.feature;
      feature.properties = {...(feature.properties ?? {}), id: updated.id};
      
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
      });
      
      const saved = await uploadFlightTrackFile(
        flight.id,
        'FORE_FLIGHT',
        p.file,
      );
      const feature = saved.feature;
      feature.properties = {...(feature.properties ?? {}), id: flight.id};
      
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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <div style={{fontWeight: 900, fontSize: 16}}>
              Import ForeFlight KML
            </div>
            <div className="muted" style={{marginTop: 4}}>
              {p.originalFilename} · {fmtChicago(p.startTimeISO)} →{' '}
              {fmtChicago(p.endTimeISO)} · ~{(durationMin / 60).toFixed(1)} hrs
            </div>
          </div>
          <ModalCloseButton onClick={onClose} disabled={saving} />
        </div>
        
        <div className="modal-body">
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <label style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <input
                type="radio"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
              />
              <span>Attach to existing</span>
            </label>
            <label style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <input
                type="radio"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
              />
              <span>Create new flight</span>
            </label>
            <div className="muted">
              Candidates are matched by time overlap (±{BUFFER_MINUTES} min)
            </div>
          </div>
          
          {mode === 'existing' ? (
            <div
              style={{
                marginTop: 14,
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 10,
              }}>
              <div className="card" style={{margin: 0}}>
                <div className="card-title">Candidates</div>
                {candidates.length === 0 ? (
                  <div className="muted">No time-matched flights found.</div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                    {candidates.slice(0, 8).map((f) => (
                      <button
                        key={f.id}
                        className={
                          selectedExistingId === f.id
                            ? 'map-list-item active'
                            : 'map-list-item'
                        }
                        onClick={() => setSelectedExistingId(f.id)}
                        type="button">
                        <div className="map-list-main">
                          {f.from} → {f.to}
                        </div>
                        <div className="muted">
                          {f.dateISO} · {f.aircraftTail}
                          {f.startTimeISO && f.endTimeISO
                            ? ` · ${fmtChicago(f.startTimeISO)} → ${fmtChicago(f.endTimeISO)}`
                            : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="card" style={{margin: 0}}>
                <div className="card-title">Pick any flight</div>
                <select
                  className="select"
                  value={selectedExistingId}
                  onChange={(e) => setSelectedExistingId(e.target.value)}>
                  <option value="">Select a flight…</option>
                  {allFlights.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.dateISO} {f.aircraftTail} {f.from}→{f.to}
                    </option>
                  ))}
                </select>
                
                <div style={{height: 10}}/>
                <button
                  className="btn-primary"
                  disabled={saving || !selectedExistingId}
                  onClick={() => {
                    const f = state.flights.flightsById[selectedExistingId];
                    if (f) attachToFlight(f);
                  }}>
                  {saving ? 'Saving…' : 'Attach track'}
                </button>
                <div className="muted" style={{marginTop: 8}}>
                  This sets the flight start/end time to the KML range.
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{marginTop: 14}}>
              <div className="card-title">New flight details</div>
              <div className="grid-2">
                <div>
                  <div className="muted">Tail</div>
                  <input
                    className="input"
                    value={newTail}
                    onChange={(e) => setNewTail(e.target.value)}
                    placeholder="N77GX"
                  />
                </div>
                <div>
                  <div className="muted">Date</div>
                  <input
                    className="input"
                    value={dateISOInChicago(p.startTimeISO)}
                    disabled
                  />
                </div>
                <div>
                  <div className="muted">From</div>
                  <input
                    className="input"
                    value={newFrom}
                    onChange={(e) => setNewFrom(e.target.value)}
                    placeholder="KPAO"
                  />
                </div>
                <div>
                  <div className="muted">To</div>
                  <input
                    className="input"
                    value={newTo}
                    onChange={(e) => setNewTo(e.target.value)}
                    placeholder="KMRY"
                  />
                </div>
              </div>
              <div style={{height: 10}}/>
              <div className="muted">Description</div>
              <input
                className="input"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Steep turns + power-off stalls"
              />
              <div style={{height: 10}}/>
              <div className="muted">Tags (comma separated)</div>
              <input
                className="input"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Training, Dual"
              />
              <div style={{height: 12}}/>
              <button
                className="btn-primary"
                disabled={saving}
                onClick={createAndAttach}>
                {saving ? 'Saving…' : 'Create & attach track'}
              </button>
            </div>
          )}
          
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
