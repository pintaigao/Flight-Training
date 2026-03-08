import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '@/components/map/MapView';
import { useStore } from '@/store/store';
import type { TrackItem } from '@/components/map/MapView';
import * as TrackApi from '@/lib/api/track.api';
import { useLayout } from '@/components/layout/LayoutContext';
import { fmtFlightTimeRange } from '@/lib/utils/flightTimeFormat';
import './MapExplorer.scss';

export default function MapExplorer() {
  const { toggleSidebarCollapsed } = useLayout();
  const { state } = useStore();
  const [tail, setTail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<TrackItem | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

  const flights = useMemo(
    () =>
      state.flights.flightIds.map((id) => state.flights.flightsById[id]),
    [state.flights.flightIds, state.flights.flightsById],
  );

  const tracks = useMemo(() => {
    const localTracks: TrackItem[] = flights
      .filter((f) => f.track)
      .map((f) => {
        const feature = f.track!;
        feature.properties = { ...(feature.properties ?? {}), id: f.id };
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

  return (
    <div className="mapExplorer relative h-full w-full overflow-hidden">
      <MapView
        tracks={tracks}
        selectedId={selectedFlightId}
        onSelect={(id) => setSelectedFlightId(id)}
        showTileAttribution={false}
      />

      <button
        className="absolute left-4 top-4 z-[5000] inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:rgba(10,16,28,0.78)] text-[color:rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-[color:rgba(10,16,28,0.86)]"
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
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-16 top-4 z-[4000] w-[280px] overflow-hidden rounded-3xl border border-[color:rgba(255,255,255,0.08)] bg-[color:rgba(10,16,28,0.72)] shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur sm:w-[320px]">
        <div className="flex items-start justify-between gap-3 border-b border-[color:rgba(255,255,255,0.08)] px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight text-[color:rgba(255,255,255,0.92)]">
              Flights
            </div>
            <div className="mt-0.5 text-xs font-semibold text-[color:rgba(255,255,255,0.62)]">
              Click a flight to view details
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              className="h-10 w-full rounded-2xl border border-[color:rgba(255,255,255,0.10)] bg-[color:rgba(255,255,255,0.06)] px-3 text-sm font-semibold text-[color:rgba(255,255,255,0.92)] placeholder:text-[color:rgba(255,255,255,0.48)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(58,169,255,0.45)]"
              placeholder="Tail number (e.g. N77GX)"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
            />
            <button
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-[color:rgba(58,169,255,0.92)] px-3 text-sm font-extrabold text-white hover:bg-[color:rgba(58,169,255,1)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={async () => {
                const normalized = tail.trim().toUpperCase();
                if (!normalized) return;
                setError(null);
                setLoading(true);
                try {
                  const res = await TrackApi.getRecentTrackByTail(normalized);
                  const id = `${res.tail}:${res.faFlightId}`;
                  const feature = res.track;
                  feature.properties = { ...(feature.properties ?? {}), id };
                  const item: TrackItem = { id, title: res.tail, feature };
                  setRemoteTrack(item);
                  setSelectedFlightId(null);
                } catch (e: any) {
                  setRemoteTrack(null);
                  setError(
                    e?.body?.message || e?.message || 'Failed to fetch track',
                  );
                } finally {
                  setLoading(false);
                }
              }}>
              {loading ? '…' : 'Go'}
            </button>
          </div>

          {error && <div className="text-xs font-semibold text-red-300">{error}</div>}
        </div>

        <div className="max-h-[calc(100%-8.5rem)] space-y-2 overflow-auto px-3 pb-3">
          {flights.map((f) => {
            const active = selectedFlightId === f.id;
            return (
              <button
                key={f.id}
                className={[
                  'w-full rounded-2xl px-3 py-3 text-left transition-colors',
                  active
                    ? 'bg-[color:rgba(58,169,255,0.16)]'
                    : 'bg-[color:rgba(255,255,255,0.04)] hover:bg-[color:rgba(255,255,255,0.06)]',
                ].join(' ')}
                type="button"
                onClick={() => setSelectedFlightId(f.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold tracking-tight text-[color:rgba(255,255,255,0.92)]">
                      {f.from} → {f.to}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-[color:rgba(255,255,255,0.62)]">
                      TAIL # {f.aircraftTail}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs font-semibold text-[color:rgba(255,255,255,0.62)]">
                    {f.dateISO}
                  </div>
                </div>
                <div className="mt-2 text-xs font-semibold text-[color:rgba(255,255,255,0.70)]">
                  {(f.durationMin / 60).toFixed(1)} hrs
                </div>
              </button>
            );
          })}
          {flights.length === 0 && (
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
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
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
                  (selectedFlight as any)?.trackMeta?.departureTimeZone ?? null,
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
