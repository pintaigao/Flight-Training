import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '@/components/map/MapView';
import { useStore } from '@/store/store';
import type { TrackItem } from '@/components/map/MapView';
import { useLayout } from '@/components/layout/LayoutContext';
import { fmtFlightTimeRange } from '@/lib/utils/flightTimeFormat';
import { fmtTimeInZone, fmtTzAbbrev } from '@/lib/utils/flightTimeFormat';
import LexicalEditor from '@/components/richtext/LexicalEditor';
import './MapExplorer.scss';

export default function MapExplorer() {
  const {toggleSidebarCollapsed} = useLayout();
  const {state} = useStore();
  const [remoteTrack, setRemoteTrack] = useState<TrackItem | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  
  const flights = useMemo(() => state.flights.flightIds.map((id) => state.flights.flightsById[id]), [state.flights.flightIds, state.flights.flightsById]);
  
  const flightsWithTracks = useMemo(() => flights.filter((f) => !!f.track), [flights]);
  
  const tracks = useMemo(() => {
    const localTracks: TrackItem[] = flights
      .filter((f) => f.track)
      .map((f) => {
        const baseFeature = f.track!;
        const feature = {
          ...baseFeature,
          properties: {...(baseFeature.properties ?? {}), id: f.id},
        } as any;
        return {
          id: f.id,
          title: `${f.from} → ${f.to}`,
          subtitle: `${f.dateISO} — ${(f.durationMin / 60).toFixed(1)} hrs`,
          feature,
        };
      });
    return remoteTrack ? [remoteTrack, ...localTracks] : localTracks;
  }, [flights, remoteTrack]);
  
  const selectedFlight = selectedFlightId
    ? state.flights.flightsById[selectedFlightId] ?? null
    : null;
  
  const selectedDepartureTimeZone =
    (selectedFlight as any)?.trackMeta?.departureTimeZone ?? null;
  
  function fmtLocalTimeRange(
    startISO: string | null | undefined,
    endISO: string | null | undefined,
    timeZone?: string | null,
  ) {
    const startLocal = fmtTimeInZone(startISO ?? null, timeZone);
    const endLocal = fmtTimeInZone(endISO ?? null, timeZone);
    const tzStart = fmtTzAbbrev(startISO ?? null, timeZone);
    const tzEnd = fmtTzAbbrev(endISO ?? null, timeZone);
    if (tzStart !== '—' && tzStart === tzEnd) return `${startLocal} → ${endLocal} ${tzStart}`;
    return `${startLocal} ${tzStart} → ${endLocal} ${tzEnd}`;
  }
  
  return (
    <div className="mapExplorer relative h-full w-full overflow-hidden">
      <MapView
        tracks={tracks}
        selectedId={selectedFlightId}
        onSelect={(id) => setSelectedFlightId(id)}
        showTileAttribution={false}
        showZoomControl={false}
      />
      
      <button
        className="absolute left-4 bottom-4 z-[5000] inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgba(10,16,28,0.78)] text-[color:rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-[color:rgba(10,16,28,0.86)]"
        type="button"
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        onClick={toggleSidebarCollapsed}>
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
          <path d="M4 6h16"/>
          <path d="M4 12h16"/>
          <path d="M4 18h16"/>
        </svg>
      </button>
      
      <div className="absolute bottom-4 left-4 top-4 z-[4000] flex w-[280px] flex-col sm:w-[320px]">
        <div className="flex-1 space-y-2 overflow-auto px-1 py-2">
          {flightsWithTracks.map((f) => {
            const active = selectedFlightId === f.id;
            const departureTimeZone = (f as any)?.trackMeta?.departureTimeZone ?? null;
            const localRange = fmtLocalTimeRange(f.startTimeISO ?? null, f.endTimeISO ?? null, departureTimeZone);
            return (
              <button
                key={f.id}
                className={['w-full rounded-3xl px-4 py-3 text-left backdrop-blur transition-colors', active ? 'border-2 border-[color:rgba(255,140,70,0.95)] bg-[color:rgba(10,16,28,0.72)]' : 'border border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(10,16,28,0.60)] hover:bg-[color:rgba(10,16,28,0.68)]'].join(' ')}
                type="button"
                onClick={() => setSelectedFlightId(f.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-extrabold tracking-wide text-[color:rgba(255,255,255,0.82)]">
                      TAIL # {f.aircraftTail}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs font-semibold text-[color:rgba(255,255,255,0.62)]">
                    {f.dateISO}
                  </div>
                </div>
                
                <div className="mt-2 text-2xl font-black tracking-tight text-[color:rgba(255,255,255,0.94)]">
                  <span>{f.from}</span>
                  <span className="mx-2 text-[color:rgba(255,255,255,0.55)]">→</span>
                  <span>{f.to}</span>
                </div>
                
                <div className="relative my-2 h-4">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-[color:rgba(255,255,255,0.14)]"/>
                  <div className="absolute left-0 top-1/2 h-[2px] w-[56%] -translate-y-1/2 bg-[color:rgba(255,140,70,0.95)]"/>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[color:rgba(255,255,255,0.92)]">
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
                      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5L21 16z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="text-xs font-semibold text-[color:rgba(255,255,255,0.72)]">
                  {localRange}
                </div>
              </button>
            );
          })}
          {flightsWithTracks.length === 0 && (
            <div className="px-3 py-2 text-sm text-[color:rgba(255,255,255,0.62)]">
              No flights yet.
            </div>
          )}
        </div>
      </div>
      
      {selectedFlight && (
        <div className="absolute bottom-4 right-4 top-4 z-[4000] w-[360px] overflow-hidden rounded-3xl border border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(10,16,28,0.74)] shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex items-start justify-between gap-3 border-b border-[color:rgba(255,255,255,0.08)] px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-[color:rgba(58,169,255,0.95)]">
                TAIL # {selectedFlight.aircraftTail}
              </div>
              <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-[color:rgba(255,255,255,0.92)]">
                {selectedFlight.from} → {selectedFlight.to}
              </div>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:rgba(255,255,255,0.06)] text-[color:rgba(255,255,255,0.88)] hover:bg-[color:rgba(255,255,255,0.10)]"
              type="button"
              aria-label="Close"
              title="Close"
              onClick={() => setSelectedFlightId(null)}>
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
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 px-4 py-4">
            <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <div className="text-[color:rgba(255,255,255,0.62)]">Date</div>
              <div className="font-semibold text-[color:rgba(255,255,255,0.92)]">
                {selectedFlight.dateISO}
              </div>
              
              <div className="text-[color:rgba(255,255,255,0.62)]">Time</div>
              <div className="font-semibold text-[color:rgba(255,255,255,0.92)]">
                {fmtFlightTimeRange(
                  selectedFlight.startTimeISO,
                  selectedFlight.endTimeISO,
                  selectedDepartureTimeZone,
                )}
              </div>
              
              <div className="text-[color:rgba(255,255,255,0.62)]">Duration</div>
              <div className="font-semibold text-[color:rgba(255,255,255,0.92)]">
                {(selectedFlight.durationMin / 60).toFixed(1)} hrs
              </div>
            </div>
            
            <div>
              <div className="text-sm font-bold text-[color:rgba(255,255,255,0.78)]">
                Description
              </div>
              <div className="mt-1 text-sm font-semibold leading-snug text-[color:rgba(255,255,255,0.92)]">
                {selectedFlight.description?.trim()
                  ? selectedFlight.description
                  : '—'}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-[color:rgba(255,255,255,0.78)]">
                Comments
              </div>
              <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(255,255,255,0.04)] p-3">
                {selectedFlight.comments?.trim() ? (
                  <LexicalEditor
                    value={selectedFlight.comments}
                    placeholder="No comments yet."
                    disabled
                    showToolbar={false}
                  />
                ) : (
                  <div className="text-sm font-semibold text-[color:rgba(255,255,255,0.62)]">
                    —
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[color:rgba(58,169,255,0.92)] px-4 text-sm font-extrabold text-white hover:bg-[color:rgba(58,169,255,1)]"
                to={`/flights/${selectedFlight.id}`}>
                View Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
