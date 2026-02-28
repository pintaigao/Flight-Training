import { useMemo } from 'react'
import FlightFilters from '@/components/flights/FlightFilters'
import FlightCard from '@/components/flights/FlightCard'
import { useStore } from '@/store/store'

export default function Flights() {
  const { state } = useStore()

  const flights = useMemo(() => {
    const list = state.flightIds.map((id) => state.flightsById[id])
    const q = state.filters.q.trim().toLowerCase()

    return list.filter((f) => {
      if (state.filters.aircraft !== 'ALL' && f.aircraftTail !== state.filters.aircraft) return false
      if (state.filters.tag !== 'ALL' && !f.tags.includes(state.filters.tag)) return false
      if (!q) return true
      const hay = `${f.dateISO} ${f.from} ${f.to} ${f.aircraftTail} ${f.tags.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [state])

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Flights</h1>
          <div className="muted">Filter, browse, and open a flight to add notes</div>
        </div>
      </div>

      <FlightFilters />

      <div className="cards">
        {flights.map((f) => (
          <FlightCard key={f.id} flight={f} selected={state.selectedFlightId === f.id} />
        ))}
        {flights.length === 0 && <div className="muted">No results.</div>}
      </div>
    </div>
  )
}
