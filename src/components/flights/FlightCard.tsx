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
        'card flightCard block rounded-2xl border bg-[var(--panel)] p-4 shadow-[var(--shadow)] transition-colors',
        selected ? 'flightCard--selected' : '',
        selected
          ? 'border-[color:rgba(58,169,255,0.45)]'
          : 'border-[var(--border)] hover:bg-[color:var(--panel2)]',
      ].join(' ')}>
      <div className="flightCard-top flex items-start justify-between gap-4">
        <div className="flightCard-main min-w-0">
          <div className="flightCard-titleRow flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="flightCard-date text-sm font-semibold text-[var(--muted)]">
              {flight.dateISO}
            </div>
            <div className="flightCard-route truncate text-base font-extrabold tracking-tight">
              {flight.from} → {flight.to}
            </div>
          </div>

          <div className="mt-2 text-sm font-semibold text-[var(--muted)]">
            {fmtFlightTimeRange(
              flight.startTimeISO ?? null,
              flight.endTimeISO ?? null,
              departureTimeZone,
            )}
          </div>

          <div className="flightCard-badges mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-1 text-sm font-semibold">
              {flight.aircraftTail}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-1 text-sm font-semibold">
              {hrs} hrs
            </span>
            {flight.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.12)] px-3 py-1 text-sm font-semibold">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-3 text-sm font-semibold text-[color:var(--text)]">
            {flight.description?.trim() ? flight.description : '—'}
          </div>
        </div>

        <div className="flightCard-side flex shrink-0 flex-col items-end gap-2">
          <span
            className={[
              'flightCard-trackBadge inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
              flight.track
                ? 'flightCard-trackBadge--ok border-[color:rgba(46,255,176,0.30)] bg-[color:rgba(46,255,176,0.12)] text-[color:rgba(46,255,176,0.95)]'
                : 'border-[var(--border)] bg-[color:var(--panel2)] text-[var(--muted)]',
            ].join(' ')}>
            {flight.track ? 'Track' : 'No track'}
          </span>

          {onDelete && (
            <button
              className="btn-danger flightCard-deleteBtn inline-flex h-9 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] px-3 text-sm font-semibold text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.18)]"
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
