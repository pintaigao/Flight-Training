import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '@/components/map/MapView';
import { useStore } from '@/store/store';
import type { TrackItem } from '@/components/map/MapView';
import { getRecentTrackByTail } from '@/lib/api/track.api';

export default function MapExplorer() {
  const { state, dispatch } = useStore();
  const [tail, setTail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<TrackItem | null>(null);
  const [remoteSelectedId, setRemoteSelectedId] = useState<string | null>(null);

  const flights = useMemo(
    () =>
      state.flights.flightIds.map((id) => state.flights.flightsById[id]),
    [state.flights.flightIds, state.flights.flightsById],
  );

  const tracks = useMemo(
    () =>
      flights
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
        }),
    [flights],
  );

  const selected = state.flights.selectedFlightId
    ? state.flights.flightsById[state.flights.selectedFlightId]
    : null;
  const mergedTracks = useMemo(
    () => (remoteTrack ? [remoteTrack, ...tracks] : tracks),
    [remoteTrack, tracks],
  );
  const selectedId = remoteSelectedId ?? state.flights.selectedFlightId;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <div className="text-base font-bold">Recent Flights</div>
          <div className="mt-0.5 text-sm text-[var(--muted)]">
            Click to focus the map
          </div>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-auto p-3 lg:max-h-[calc(100vh-14rem)]">
          {flights.slice(0, 10).map((f) => {
            const active = state.flights.selectedFlightId === f.id;
            return (
              <button
                key={f.id}
                className={[
                  'w-full rounded-xl border px-3 py-2 text-left',
                  active
                    ? 'border-[color:rgba(58,169,255,0.35)] bg-[color:rgba(58,169,255,0.10)]'
                    : 'border-[var(--border)] bg-[color:var(--panel2)] hover:bg-[color:var(--panel)]',
                ].join(' ')}
                onClick={() => {
                  setRemoteSelectedId(null);
                  dispatch({ type: 'SELECT_FLIGHT', id: f.id });
                }}>
                <div className="font-extrabold">
                  {f.from} → {f.to}
                </div>
                <div className="mt-0.5 text-sm text-[var(--muted)]">
                  {f.dateISO} · {(f.durationMin / 60).toFixed(1)} hrs
                </div>
              </button>
            );
          })}
          {flights.length === 0 && (
            <div className="text-sm text-[var(--muted)]">No flights yet.</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Map Explorer
            </h1>
            <div className="mt-1 text-sm text-[var(--muted)]">All tracks</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-11 w-56 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Tail number (e.g. N77GX)"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
            />
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={async () => {
                const normalized = tail.trim().toUpperCase();
                if (!normalized) return;
                setError(null);
                setLoading(true);
                try {
                  const res = await getRecentTrackByTail(normalized);
                  const id = `${res.tail}:${res.faFlightId}`;
                  const feature = res.track;
                  feature.properties = { ...(feature.properties ?? {}), id };
                  const item: TrackItem = {
                    id,
                    title: res.tail,
                    subtitle: new Date(res.departureTimeISO).toLocaleString(
                      'en-US',
                      { timeZone: 'America/Chicago' },
                    ),
                    feature,
                  };
                  setRemoteTrack(item);
                  setRemoteSelectedId(item.id);
                } catch (e: any) {
                  setRemoteTrack(null);
                  setRemoteSelectedId(null);
                  setError(
                    e?.body?.message || e?.message || 'Failed to fetch track',
                  );
                } finally {
                  setLoading(false);
                }
              }}>
              {loading ? 'Fetching…' : 'Get Recent Track'}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="relative h-[60vh] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] lg:h-[calc(100vh-18rem)]">
          <MapView
            tracks={mergedTracks}
            selectedId={selectedId}
            onSelect={(id) => {
              if (remoteTrack && id === remoteTrack.id) {
                setRemoteSelectedId(id);
                return;
              }
              setRemoteSelectedId(null);
              dispatch({ type: 'SELECT_FLIGHT', id });
            }}
          />

          {selected && (
            <div className="absolute bottom-4 left-4 w-72 rounded-2xl border border-[var(--border)] bg-[color:rgba(10,16,28,0.72)] p-4 shadow-[var(--shadow)] backdrop-blur">
              <div className="font-extrabold">
                {selected.from} → {selected.to}
              </div>
              <div className="mt-0.5 text-sm text-[var(--muted)]">
                {selected.dateISO} · {(selected.durationMin / 60).toFixed(1)} hrs
              </div>
              <div className="mt-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)]"
                  to={`/flights/${selected.id}`}>
                  View Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
