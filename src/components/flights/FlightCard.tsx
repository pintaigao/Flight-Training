import type { Flight } from '@/store/types';
import { Link } from 'react-router-dom';
import { fmtTimeInZone, fmtTzAbbrev, fmtZuluTime } from '@/lib/utils/flightTimeFormat';
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
  const startLocal = fmtTimeInZone(flight.startTimeISO ?? null, departureTimeZone);
  const endLocal = fmtTimeInZone(flight.endTimeISO ?? null, departureTimeZone);
  const startZulu = fmtZuluTime(flight.startTimeISO ?? null);
  const endZulu = fmtZuluTime(flight.endTimeISO ?? null);
  const tzStart = fmtTzAbbrev(flight.startTimeISO ?? null, departureTimeZone);
  const tzEnd = fmtTzAbbrev(flight.endTimeISO ?? null, departureTimeZone);

  return (
    <div
      className={[
        'card flightCard group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow)] transition-colors hover:bg-[color:var(--panel2)]',
        selected ? 'flightCard--selected ring-2 ring-[color:rgba(58,169,255,0.35)]' : '',
      ].join(' ')}>
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] items-start gap-4">
        <div className="min-w-0">
          <div className="text-base font-extrabold tracking-tight text-[color:var(--text)]">
            {flight.from} → {flight.to}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
            TAIL # <span className="text-[color:var(--text)]">{flight.aircraftTail}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-extrabold text-[color:var(--text)]">
            {startLocal}{' '}
            <span className="text-xs font-bold text-[var(--muted)]">{tzStart}</span>
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">{startZulu}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--muted)]">{flight.dateISO}</div>
        </div>

        <div className="text-right">
          <div className="text-lg font-extrabold text-[color:var(--text)]">
            {endLocal}{' '}
            <span className="text-xs font-bold text-[var(--muted)]">{tzEnd}</span>
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">{endZulu}</div>
          <div className="mt-2 text-xs font-semibold text-[var(--muted)]">{hrs} hrs</div>
        </div>
      </div>

      <div className="mt-3 truncate text-sm font-semibold text-[color:var(--text)]">
        {flight.description?.trim() ? flight.description : '—'}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap gap-2">
          {flight.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.12)] px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {t}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.30)] bg-[color:rgba(255,84,84,0.10)] text-[color:rgba(255,84,84,0.95)] opacity-0 transition-opacity hover:bg-[color:rgba(255,84,84,0.14)] group-hover:opacity-100"
              type="button"
              aria-label="Delete flight"
              title="Delete flight"
              onClick={() => onDelete(flight.id)}>
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
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          )}
          <Link
            to={`/flights/${flight.id}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-2 text-sm font-semibold hover:bg-[color:var(--panel)]">
            View Detail
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
