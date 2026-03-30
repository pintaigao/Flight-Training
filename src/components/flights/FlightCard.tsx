import type { Flight } from '@/lib/types/flight';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import { fmtTimeInZone, fmtTzAbbrev, fmtZuluTime } from '@/lib/utils/flightTimeFormat';
import './FlightCard.scss';

function formatTagLabel(tag: string) {
  return tag === 'PENDING_EDIT' ? 'Pending Edit' : tag;
}

function isPendingEditTag(tag: string) {
  return tag === 'PENDING_EDIT';
}

export default function FlightCard({flight, selected, onDelete}: { flight: Flight; selected?: boolean; onDelete?: (id: string) => void; }) {
  const hrs = (flight.durationMin / 60).toFixed(1);
  const departureTimeZone = (flight as any)?.trackMeta?.departureTimeZone ?? null;
  const startLocal = fmtTimeInZone(flight.startTimeISO ?? null, departureTimeZone);
  const endLocal = fmtTimeInZone(flight.endTimeISO ?? null, departureTimeZone);
  const startZulu = fmtZuluTime(flight.startTimeISO ?? null);
  const endZulu = fmtZuluTime(flight.endTimeISO ?? null);
  const tzStart = fmtTzAbbrev(flight.startTimeISO ?? null, departureTimeZone);
  const tzEnd = fmtTzAbbrev(flight.endTimeISO ?? null, departureTimeZone);
  const description = flight.description?.trim() ? flight.description.trim() : '—';
  
  return (
    <div
      className={['card flightCard group rounded-3xl bg-[color:var(--modal)] p-4 shadow-[0_14px_40px_color-mix(in_srgb,#000_22%,transparent)] transition-colors hover:bg-[color:var(--panel)]', selected ? 'flightCard--selected ring-2 ring-[color:rgba(58,169,255,0.35)]' : ''].join(' ')}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-4">
        <div className="min-w-0">
          <div className="text-base font-extrabold tracking-tight text-[color:var(--text)]">
            {flight.from} → {flight.to}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--muted)]">
            TAIL # <span className="text-[color:var(--text)]">{flight.aircraftTail}</span>
          </div>
        </div>
        
        <div
          className="min-w-0 text-right text-sm font-semibold leading-snug text-[color:var(--text)]"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}>
          {description}
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-[color:var(--text)]">
            {startLocal}{' '}
            <span className="text-xs font-bold text-[var(--muted)]">{tzStart}</span>
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">{startZulu}</div>
        </div>
        
        <div className="pt-1 w-2/5">
          <div className="text-center text-xs font-semibold text-[var(--muted)]">
            {hrs} hrs
          </div>
          <div className="mt-2 flex items-center">
            <div
              className="relative h-1 w-full rounded-full bg-[color:color-mix(in_srgb,var(--accent)_28%,transparent)]"
              aria-hidden="true">
              <div className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"/>
              <div className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]"/>
            </div>
          </div>
          <div className="mt-2 text-center text-xs font-semibold text-[var(--muted)]">
            {flight.dateISO}
          </div>
        </div>
        
        <div className="min-w-0 text-right">
          <div className="text-lg font-extrabold text-[color:var(--text)]">
            {endLocal}{' '}
            <span className="text-xs font-bold text-[var(--muted)]">{tzEnd}</span>
          </div>
          <div className="text-xs font-semibold text-[var(--muted)]">{endZulu}</div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap gap-2">
          {flight.tags.map((t) => (
            <span
              key={t}
              className={[
                'inline-flex items-center rounded-full border border-[color:rgba(58,169,255,0.25)] bg-[color:rgba(58,169,255,0.12)] px-3 py-1 text-xs font-bold tracking-wide',
                isPendingEditTag(t) ? '' : 'uppercase',
              ].join(' ')}>
              {formatTagLabel(t)}
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
              <Trash2 size={18} aria-hidden="true"/>
            </button>
          )}
          <Link
            to={`/flights/${flight.id}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 py-2 text-sm font-semibold hover:bg-[color:var(--panel)]">
            View Detail
            <ChevronRight size={16} aria-hidden="true"/>
          </Link>
        </div>
      </div>
    </div>
  );
}
