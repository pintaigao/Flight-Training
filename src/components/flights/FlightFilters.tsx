import { useMemo } from 'react'
import { useStore } from '@/store/store'

export default function FlightFilters() {
  const { state, dispatch } = useStore()

  const aircraftOptions = useMemo(() => {
    const set = new Set<string>()
    for (const id of state.flightIds) set.add(state.flightsById[id].aircraftTail)
    return ['ALL', ...Array.from(set).sort()]
  }, [state.flightIds, state.flightsById])

  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    for (const id of state.flightIds) for (const t of state.flightsById[id].tags) set.add(t)
    return ['ALL', ...Array.from(set).sort()]
  }, [state.flightIds, state.flightsById])

  return (
    <div className="filters">
      <input
        className="input"
        placeholder="Search (airport, tail, tag)"
        value={state.filters.q}
        onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { q: e.target.value } })}
      />

      <select
        className="select"
        value={state.filters.aircraft}
        onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { aircraft: e.target.value as any } })}
      >
        {aircraftOptions.map((a) => (
          <option key={a} value={a}>{a === 'ALL' ? 'All Aircraft' : a}</option>
        ))}
      </select>

      <select
        className="select"
        value={state.filters.tag}
        onChange={(e) => dispatch({ type: 'SET_FILTERS', filters: { tag: e.target.value as any } })}
      >
        {tagOptions.map((t) => (
          <option key={t} value={t}>{t === 'ALL' ? 'All Tags' : t}</option>
        ))}
      </select>

      <button className="btn" onClick={() => dispatch({ type: 'RESET_DEMO_DATA' })}>
        Reset demo
      </button>
    </div>
  )
}
