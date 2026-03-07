const WHEN_OPEN = '<when>';
const WHEN_CLOSE = '</when>';

function extractBetween(text: string, startIdx: number) {
  const a = text.indexOf(WHEN_OPEN, startIdx);
  if (a === -1) return null;

  const b = text.indexOf(WHEN_CLOSE, a);
  if (b === -1) return null;

  const raw = text.slice(a + WHEN_OPEN.length, b).trim();
  if (!raw) return null;

  const iso = new Date(raw).toISOString();
  return { iso, endIdx: b + WHEN_CLOSE.length };
}

export async function readForeFlightKmlTimeRange(
  file: File,
): Promise<{ startTimeISO: string; endTimeISO: string }> {
  const text = await file.text();

  const first = extractBetween(text, 0);
  if (!first) throw new Error('No <when> found in this KML file');

  const lastOpen = text.lastIndexOf(WHEN_OPEN);
  if (lastOpen === -1) throw new Error('No <when> found in this KML file');

  const last = extractBetween(text, lastOpen);
  if (!last) throw new Error('No valid <when> found in this KML file');

  return { startTimeISO: first.iso, endTimeISO: last.iso };
}
