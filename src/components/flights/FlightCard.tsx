import { Link } from 'react-router-dom';
import type { Flight } from '@/store/types';
import { fmtFlightTimeRange } from '@/lib/utils/flightTimeFormat';
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
  const departureTimeZone = (flight as any)?.trackMeta?.departureTimeZone ?? null;

  return (
    <Link
      to={`/flights/${flight.id}`}
      className={[
        'card flightCard group block rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] transition-colors hover:bg-[color:var(--panel2)]',
        selected ? 'flightCard--selected' : '',
        selected ? 'ring-2 ring-[color:rgba(58,169,255,0.35)]' : '',
      ].join(' ')}>
      <div className="flightCard-top flex items-start justify-between gap-4">
        <div className="flightCard-main min-w-0">
          <div className="text-sm font-semibold text-[var(--muted)]">
            <span>{flight.dateISO}</span>
            <span className="mx-2 opacity-60">·</span>
            <span className="font-extrabold text-[color:var(--text)]">
              {flight.from} → {flight.to}
            </span>
            <span className="mx-2 opacity-60">·</span>
            <span className="truncate">
              {fmtFlightTimeRange(
                flight.startTimeISO ?? null,
                flight.endTimeISO ?? null,
                departureTimeZone,
              )}
            </span>
          </div>

          <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
            <span className="text-[color:var(--text)]">{flight.aircraftTail}</span>
            <span className="mx-2 opacity-60">·</span>
            <span>{hrs} hrs</span>
          </div>

          <div className="mt-2 truncate text-sm font-semibold text-[color:var(--text)]">
            {flight.description?.trim() ? flight.description : '—'}
          </div>
        </div>

        <div className="flightCard-side flex shrink-0 flex-col items-end gap-2 pt-0.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--panel2)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
            <span
              className={[
                'h-2 w-2 rounded-full',
                flight.track ? 'bg-[rgba(46,255,176,0.95)]' : 'bg-[var(--border)]',
              ].join(' ')}
            />
            <span>{flight.track ? 'Track' : 'No track'}</span>
          </span>

          {onDelete && (
            <button
              className="btn-danger flightCard-deleteBtn inline-flex h-9 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] px-3 text-sm font-semibold text-[color:rgba(255,84,84,0.95)] opacity-0 transition-opacity hover:bg-[color:rgba(255,84,84,0.18)] group-hover:opacity-100"
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
      </div>
    </Link>
  );
}
