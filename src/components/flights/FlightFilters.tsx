import { useMemo } from 'react';
import { useStore } from '@/store/store';
import './FlightFilters.scss';

export default function FlightFilters() {
  const { state, dispatch } = useStore();

  const aircraftOptions = useMemo(() => {
    const set = new Set<string>();
    for (const id of state.flights.flightIds)
      set.add(state.flights.flightsById[id].aircraftTail);
    return ['ALL', ...Array.from(set).sort()];
  }, [state.flights.flightIds, state.flights.flightsById]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    for (const id of state.flights.flightIds)
      for (const t of state.flights.flightsById[id].tags) set.add(t);
    return ['ALL', ...Array.from(set).sort()];
  }, [state.flights.flightIds, state.flights.flightsById]);

  return (
    <div className="flightFilters mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        className="input h-11 w-full flex-1 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        placeholder="Search (airport, tail, tag)"
        value={state.ui.filters.q}
        onChange={(e) =>
          dispatch({ type: 'SET_FILTERS', filters: { q: e.target.value } })
        }
      />

      <select
        className="select flightFilters-select h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-56"
        value={state.ui.filters.aircraft}
        onChange={(e) =>
          dispatch({
            type: 'SET_FILTERS',
            filters: { aircraft: e.target.value as any },
          })
        }>
        {aircraftOptions.map((a) => (
          <option key={a} value={a}>
            {a === 'ALL' ? 'All Aircraft' : a}
          </option>
        ))}
      </select>

      <select
        className="select flightFilters-select h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-56"
        value={state.ui.filters.tag}
        onChange={(e) =>
          dispatch({
            type: 'SET_FILTERS',
            filters: { tag: e.target.value as any },
          })
        }>
        {tagOptions.map((t) => (
          <option key={t} value={t}>
            {t === 'ALL' ? 'All Tags' : t}
          </option>
        ))}
      </select>
    </div>
  );
}
