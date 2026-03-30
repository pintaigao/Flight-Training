import { useEffect, useMemo, useState } from 'react';
import * as TrackScheduleApi from '@/lib/api/trackSchedule.api';
import type {
  CreateTrackScheduleInput,
  TrackSchedule,
  TrackTargetType,
} from '@/lib/types/trackSchedule';
import './TrackSchedules.scss';

const initialForm: CreateTrackScheduleInput = {
  displayName: '',
  targetType: 'tail',
  targetValue: '',
  watchDateUtc: '',
  startZulu: '',
  endZulu: '',
};

function statusTone(status: string) {
  switch (status) {
    case 'completed':
      return 'trackSchedulesStatus--completed';
    case 'running':
      return 'trackSchedulesStatus--running';
    case 'failed':
      return 'trackSchedulesStatus--failed';
    case 'no_data':
      return 'trackSchedulesStatus--noData';
    case 'cancelled':
      return 'trackSchedulesStatus--cancelled';
    default:
      return 'trackSchedulesStatus--scheduled';
  }
}

function formatZuluDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatZuluTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export default function TrackSchedules() {
  const [items, setItems] = useState<TrackSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateTrackScheduleInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [nowUtc, setNowUtc] = useState(() => new Date());

  async function loadSchedules() {
    setLoading(true);
    setError(null);
    try {
      setItems(await TrackScheduleApi.getTrackSchedules());
    } catch (err: any) {
      setError(err?.body?.detail || err?.body?.message || err?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowUtc(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
      ),
    [items],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await TrackScheduleApi.createTrackSchedule(form);
      setItems((current) => [created, ...current]);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.body?.detail || err?.body?.message || err?.message || 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSchedule(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await TrackScheduleApi.cancelTrackSchedule(id);
      await loadSchedules();
    } catch (err: any) {
      setError(err?.body?.detail || err?.body?.message || err?.message || 'Failed to cancel schedule');
    } finally {
      setBusyId(null);
    }
  }

  async function downloadExecution(executionId: number) {
    setBusyId(executionId);
    setError(null);
    try {
      const { blob, filename } =
        await TrackScheduleApi.downloadTrackScheduleExecution(executionId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.body?.detail || err?.body?.message || err?.message || 'Failed to download KML');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="trackSchedules space-y-6">
      <div className="trackSchedulesHero">
        <div>
          <h1 className="trackSchedulesTitle">Track Monitor</h1>
          <p className="trackSchedulesSubtitle">
            Schedule a UTC monitoring window, then download a KML generated from your ADS-B raw logs.
          </p>
        </div>
        <div className="trackSchedulesZuluClock" aria-label="Current Zulu time">
          <span className="trackSchedulesZuluLabel">Zulu</span>
          <strong className="trackSchedulesZuluTime">{formatZuluTime(nowUtc)}Z</strong>
          <span className="trackSchedulesZuluDate">{formatZuluDate(nowUtc)}</span>
        </div>
      </div>

      {error && <div className="trackSchedulesError">{error}</div>}

      <section className="trackSchedulesPanel">
        <div className="trackSchedulesPanelHeader">
          <h2>Create Track Schedule</h2>
          <span>UTC date + Zulu time</span>
        </div>

        <form className="trackSchedulesForm" onSubmit={submit}>
          <label>
            <span>Display Name</span>
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({ ...current, displayName: event.target.value }))
              }
              placeholder="N77GX"
              required
            />
          </label>

          <label>
            <span>Target Type</span>
            <select
              value={form.targetType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  targetType: event.target.value as TrackTargetType,
                }))
              }>
              <option value="tail">Tail</option>
              <option value="hex">Hex</option>
              <option value="flight">Flight</option>
            </select>
          </label>

          <label>
            <span>Target Value</span>
            <input
              value={form.targetValue}
              onChange={(event) =>
                setForm((current) => ({ ...current, targetValue: event.target.value }))
              }
              placeholder="N77GX"
              required
            />
          </label>

          <label>
            <span>Watch Date (UTC)</span>
            <input
              value={form.watchDateUtc}
              onChange={(event) =>
                setForm((current) => ({ ...current, watchDateUtc: event.target.value }))
              }
              placeholder="03/21/2026"
              required
            />
          </label>

          <label>
            <span>Start Zulu</span>
            <input
              value={form.startZulu}
              onChange={(event) =>
                setForm((current) => ({ ...current, startZulu: event.target.value }))
              }
              placeholder="13:00"
              required
            />
          </label>

          <label>
            <span>End Zulu</span>
            <input
              value={form.endZulu}
              onChange={(event) =>
                setForm((current) => ({ ...current, endZulu: event.target.value }))
              }
              placeholder="15:00"
              required
            />
          </label>

          <div className="trackSchedulesFormActions">
            <button className="trackSchedulesPrimary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </section>

      <section className="trackSchedulesPanel">
        <div className="trackSchedulesPanelHeader">
          <h2>Your Schedules</h2>
          <button className="trackSchedulesGhost" type="button" onClick={loadSchedules}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="trackSchedulesEmpty">Loading schedules…</div>
        ) : sortedItems.length === 0 ? (
          <div className="trackSchedulesEmpty">No track schedules yet.</div>
        ) : (
          <div className="trackSchedulesList">
            {sortedItems.map((item) => {
              const latest = item.latestExecution;
              return (
                <article key={item.id} className="trackSchedulesCard">
                  <div className="trackSchedulesCardTop">
                    <div>
                      <div className="trackSchedulesName">{item.displayName}</div>
                      <div className="trackSchedulesMeta">
                        {item.targetType.toUpperCase()} · {item.targetValue}
                      </div>
                    </div>
                    <span className={['trackSchedulesStatus', statusTone(item.status)].join(' ')}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="trackSchedulesGrid">
                    <div>
                      <span>Date</span>
                      <strong>{item.watchDateUtc}</strong>
                    </div>
                    <div>
                      <span>Zulu Window</span>
                      <strong>
                        {item.startZulu} → {item.endZulu}
                      </strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong>{new Date(item.createdAtUtc).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Latest Execution</span>
                      <strong>{latest ? latest.status.replace('_', ' ') : '—'}</strong>
                    </div>
                  </div>

                  {latest && (
                    <div className="trackSchedulesExecution">
                      <div>
                        <span>Matched Points</span>
                        <strong>{latest.matchedPointCount}</strong>
                      </div>
                      <div>
                        <span>Finished</span>
                        <strong>
                          {latest.finishedAtUtc
                            ? new Date(latest.finishedAtUtc).toLocaleString()
                            : '—'}
                        </strong>
                      </div>
                      {latest.errorMessage && (
                        <div className="trackSchedulesExecutionError">
                          {latest.errorMessage}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="trackSchedulesActions">
                    {latest?.status === 'completed' && (
                      <button
                        className="trackSchedulesPrimary"
                        type="button"
                        onClick={() => downloadExecution(latest.id)}
                        disabled={busyId === latest.id}>
                        {busyId === latest.id ? 'Downloading…' : 'Download KML'}
                      </button>
                    )}
                    {item.status === 'scheduled' && (
                      <button
                        className="trackSchedulesGhost"
                        type="button"
                        onClick={() => cancelSchedule(item.id)}
                        disabled={busyId === item.id}>
                        {busyId === item.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
