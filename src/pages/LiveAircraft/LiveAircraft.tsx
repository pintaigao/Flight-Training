import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import * as LiveAircraftApi from '@/lib/api/liveAircraft.api';
import type { LiveAircraftItem } from '@/lib/types/liveAircraft';
import './LiveAircraft.scss';

const POLL_MS = 5000;

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatSeen(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value < 1) return `${value.toFixed(1)}s`;
  return `${Math.round(value)}s`;
}

function sortItems(items: LiveAircraftItem[]) {
  return [...items].sort((left, right) => {
    const seenDelta = (left.seen ?? Number.POSITIVE_INFINITY) - (right.seen ?? Number.POSITIVE_INFINITY);
    if (seenDelta !== 0) return seenDelta;

    const flightDelta = (left.flight ?? '~').localeCompare(right.flight ?? '~');
    if (flightDelta !== 0) return flightDelta;

    return left.hex.localeCompare(right.hex);
  });
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const bodyMessage = (error as { body?: { message?: unknown } }).body?.message;
    if (typeof bodyMessage === 'string') return bodyMessage;

    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return 'Failed to load live aircraft.';
}

export default function LiveAircraft() {
  const [items, setItems] = useState<LiveAircraftItem[]>([]);
  const [count, setCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(isBackground = false) {
      if (cancelled) return;
      if (isBackground) setRefreshing(true);
      else setLoading(true);

      try {
        const snapshot = await LiveAircraftApi.getLiveAircraft();
        if (cancelled) return;
        setItems(sortItems(snapshot.items));
        setCount(snapshot.count);
        setUpdatedAt(snapshot.updatedAt);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
      } finally {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      }
    }

    let timer: number | null = null;

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') {
          await load(true);
        }
        schedule();
      }, POLL_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    };

    void load(false);
    schedule();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="liveAircraft space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            <Activity className="h-3.5 w-3.5" />
            Live Traffic
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Live Aircraft
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Current aircraft snapshot from the ADS-B feeder.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Aircraft
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[var(--text)]">
              {formatNumber(count)}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Updated
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">
              {formatDateTime(updatedAt)}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Refresh
            </div>
            <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <RefreshCw className={['h-4 w-4', refreshing ? 'animate-spin' : ''].join(' ')} />
              {loading ? 'Loading' : refreshing ? 'Polling' : 'Every 5s'}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[color:rgba(239,68,68,0.22)] bg-[color:rgba(239,68,68,0.08)] px-4 py-3 text-sm font-semibold text-[color:rgb(185,28,28)]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--panel2)]/70 text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-3">Flight</th>
                <th className="px-4 py-3">Hex</th>
                <th className="px-4 py-3">Squawk</th>
                <th className="px-4 py-3">Alt</th>
                <th className="px-4 py-3">GS</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Seen</th>
                <th className="px-4 py-3">Lat</th>
                <th className="px-4 py-3">Lon</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.hex}
                  className="border-b border-[var(--border)]/70 text-sm text-[var(--text)] last:border-b-0 hover:bg-[var(--panel2)]/55"
                >
                  <td className="px-4 py-3 font-semibold">{item.flight?.trim() || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-[var(--muted)]">
                    {item.hex}
                  </td>
                  <td className="px-4 py-3">{item.squawk || '—'}</td>
                  <td className="px-4 py-3">{formatNumber(item.alt)}</td>
                  <td className="px-4 py-3">{formatNumber(item.gs, 1)}</td>
                  <td className="px-4 py-3">{formatNumber(item.track, 1)}</td>
                  <td className="px-4 py-3">{formatSeen(item.seen)}</td>
                  <td className="px-4 py-3">{formatNumber(item.lat, 4)}</td>
                  <td className="px-4 py-3">{formatNumber(item.lon, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm font-semibold text-[var(--muted)]">
            No aircraft in the latest snapshot.
          </div>
        ) : null}

        {loading ? (
          <div className="px-6 py-10 text-center text-sm font-semibold text-[var(--muted)]">
            Loading live aircraft...
          </div>
        ) : null}
      </div>
    </div>
  );
}
