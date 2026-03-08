function inBox(
  lat: number,
  lng: number,
  box: { latMin: number; latMax: number; lngMin: number; lngMax: number },
) {
  return (
    lat >= box.latMin &&
    lat <= box.latMax &&
    lng >= box.lngMin &&
    lng <= box.lngMax
  );
}

// Heuristic mapping for US time zones based on lat/lng.
// Goal: provide a reasonable "departure time zone" for typical US GA flights
// without shipping a full tz-boundary dataset.
export function guessUsTimeZoneFromLatLng(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Continental US + AK/HI rough bounds.
  const US_BOUNDS = { latMin: 18, latMax: 72, lngMin: -171, lngMax: -50 };
  if (!inBox(lat, lng, US_BOUNDS)) return null;

  // Hawaii
  if (inBox(lat, lng, { latMin: 18, latMax: 23.5, lngMin: -161, lngMax: -154 }))
    return 'Pacific/Honolulu';

  // Alaska (very rough, excludes Aleutians edge cases)
  if (inBox(lat, lng, { latMin: 51, latMax: 72, lngMin: -170, lngMax: -129 }))
    return 'America/Anchorage';

  // Phoenix keeps MST year-round; rough AZ box (also includes parts of NM/UT if you're right on edges).
  if (inBox(lat, lng, { latMin: 31, latMax: 37.5, lngMin: -115, lngMax: -108.8 }))
    return 'America/Phoenix';

  // Longitude-based fallback across the lower 48.
  // Boundaries are approximate; Intl formatting will provide the correct DST abbreviation for the time.
  if (lng <= -114) return 'America/Los_Angeles'; // Pacific
  if (lng <= -101) return 'America/Denver'; // Mountain
  if (lng <= -87) return 'America/Chicago'; // Central
  return 'America/New_York'; // Eastern
}

