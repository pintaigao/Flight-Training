import { Link } from 'react-router-dom';
import type { Flight } from '@/store/types';
import './FlightCard.scss';

export default function FlightCard({
  flight,
  selected,
  onDelete,
}: {
  flight: Flight;
  selected?: boolean;
  onDelete?: (id: string) => void;
}) {
  const hrs = (flight.durationMin / 60).toFixed(1);
  return (
    <Link
      to={`/flights/${flight.id}`}
      className={selected ? 'flight-card selected' : 'flight-card'}>
      <div className="flight-card-main">
        <div className="flight-card-title">
          <span className="flight-date">{flight.dateISO}</span>
          <span className="flight-arrow">
            {flight.from} → {flight.to}
          </span>
        </div>
        <div className="flight-card-meta">
          <span className="chip">{flight.aircraftTail}</span>
          <span className="chip">{hrs} hrs</span>
          {flight.tags.slice(0, 2).map((t) => (
            <span key={t} className="chip chip-soft">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flight-thumb">
        <div className="thumb-label">track</div>
        {onDelete && (
          <button
            className="btn-danger"
            style={{
              padding: '6px 10px',
              borderRadius: 12,
              fontSize: 12,
              marginTop: 10,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(flight.id);
            }}
            type="button">
            Delete
          </button>
        )}
      </div>
    </Link>
  );
}
