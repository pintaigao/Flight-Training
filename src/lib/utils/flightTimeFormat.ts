function toValidDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

export function fmtZuluTime(iso: string | null | undefined) {
  const d = toValidDate(iso);
  if (!d) return '—';
  const hhmm = d.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${hhmm}Z`;
}

export function fmtTimeInZone(
  iso: string | null | undefined,
  timeZone?: string | null,
) {
  const d = toValidDate(iso);
  if (!d) return '—';
  return d.toLocaleTimeString('en-US', {
    timeZone: timeZone || undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtTzAbbrev(
  iso: string | null | undefined,
  timeZone?: string | null,
) {
  const d = toValidDate(iso);
  if (!d) return '—';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || undefined,
    timeZoneName: 'short',
  }).formatToParts(d);
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? '—';
}

export function fmtFlightTimeRange(
  startISO: string | null | undefined,
  endISO: string | null | undefined,
  timeZone?: string | null,
) {
  const startZ = fmtZuluTime(startISO);
  const endZ = fmtZuluTime(endISO);
  const startLocal = fmtTimeInZone(startISO, timeZone);
  const endLocal = fmtTimeInZone(endISO, timeZone);
  const tzStart = fmtTzAbbrev(startISO, timeZone);
  const tzEnd = fmtTzAbbrev(endISO, timeZone);
  const local =
    tzStart !== '—' && tzStart === tzEnd
      ? `(${startLocal} → ${endLocal} ${tzStart})`
      : `(${startLocal} ${tzStart} → ${endLocal} ${tzEnd})`;
  return `${startZ} → ${endZ} ${local}`;
}
