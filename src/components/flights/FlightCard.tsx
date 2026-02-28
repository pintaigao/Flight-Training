import { Link } from 'react-router-dom'
import type { Flight } from '@/store/types'

export default function FlightCard({ flight, selected }: { flight: Flight; selected?: boolean }) {
  const hrs = (flight.durationMin / 60).toFixed(1)
  return (
    <Link to={`/flights/${flight.id}`} className={selected ? 'flightCard selected' : 'flightCard'}>
      <div className="flightCardMain">
        <div className="flightCardTitle">
          <span className="flightDate">{flight.dateISO}</span>
          <span className="flightArrow">{flight.from} → {flight.to}</span>
        </div>
        <div className="flightCardMeta">
          <span className="chip">{flight.aircraftTail}</span>
          <span className="chip">{hrs} hrs</span>
          {flight.tags.slice(0, 2).map((t) => (
            <span key={t} className="chip chipSoft">{t}</span>
          ))}
        </div>
      </div>
      <div className="flightThumb">
        <div className="thumbLabel">track</div>
      </div>
    </Link>
  )
}
