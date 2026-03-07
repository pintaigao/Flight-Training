import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '@/store/store';
import MapView from '@/components/map/MapView';

export default function Dashboard() {
  const { state, dispatch } = useStore();

  const flights = useMemo(
    () =>
      state.flights.flightIds.map((id) => state.flights.flightsById[id]),
    [state.flights.flightIds, state.flights.flightsById],
  );
  const totalMin = flights.reduce((s, f) => s + f.durationMin, 0);
  const totalHours = (totalMin / 60).toFixed(1);
  const last30Hours = (
    flights.slice(0, 3).reduce((s, f) => s + f.durationMin, 0) / 60
  ).toFixed(1);

  const selected = state.flights.selectedFlightId
    ? state.flights.flightsById[state.flights.selectedFlightId]
    : null;

  const tracks = useMemo(
    () =>
      flights
        .filter((f) => f.track)
        .map((f) => ({
          id: f.track!.properties?.id || f.id,
          title: `${f.from} → ${f.to}`,
          subtitle: f.dateISO,
          feature: f.track!,
        })),
    [flights],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Overview of your recent flying
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-[var(--muted)]">Total Hours</div>
          <div className="mt-1 text-2xl font-extrabold">{totalHours}</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-[var(--muted)]">Last 30 Days</div>
          <div className="mt-1 text-2xl font-extrabold">
            {last30Hours}{' '}
            <span className="text-base font-semibold text-[var(--muted)]">
              hrs
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-[var(--muted)]">Landings</div>
          <div className="mt-1 text-2xl font-extrabold">
            {flights.length * 2}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-sm text-[var(--muted)]">Night Flights</div>
          <div className="mt-1 text-2xl font-extrabold">
            {Math.min(5, flights.length)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-base font-bold">Recent Flights</div>
          <div className="mt-3 space-y-2">
            {flights.slice(0, 5).map((f) => (
              <Link
                key={f.id}
                to={`/flights/${f.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 hover:bg-[color:var(--panel)]"
                onClick={() => dispatch({ type: 'SELECT_FLIGHT', id: f.id })}>
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {f.from} → {f.to}
                  </div>
                  <div className="text-sm text-[var(--muted)]">{f.dateISO}</div>
                </div>
                <div className="shrink-0 pl-4 text-sm font-semibold text-[var(--muted)]">
                  {(f.durationMin / 60).toFixed(1)}h
                </div>
              </Link>
            ))}
            {flights.length === 0 && (
              <div className="text-sm text-[var(--muted)]">No flights yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
          <div className="text-base font-bold">Continue Your Last Flight</div>
          {selected ? (
            <>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {selected.dateISO} — {selected.from} → {selected.to}
              </div>
              <div className="mt-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)]"
                  to={`/flights/${selected.id}`}>
                  Resume Entry
                </Link>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
                <MapView
                  tracks={tracks}
                  selectedId={selected.track?.properties?.id || selected.id}
                  height={240}
                  onSelect={(trackId) => {
                    const flight = flights.find(
                      (x) =>
                        (x.track?.properties as any)?.id === trackId ||
                        x.id === trackId,
                    );
                    if (flight)
                      dispatch({ type: 'SELECT_FLIGHT', id: flight.id });
                  }}
                  showTileAttribution={false}
                />
              </div>
            </>
          ) : (
            <div className="mt-3 text-sm text-[var(--muted)]">
              No flights yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
