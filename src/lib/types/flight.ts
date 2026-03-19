import type { Feature, LineString } from 'geojson';

export type FlightTrackSource = 'FORE_FLIGHT';
export type FlightTrackMeta = object;

export type Flight = {
  id: string;
  dateISO: string;
  startTimeISO?: string | null;
  endTimeISO?: string | null;
  aircraftTail: string;
  from: string;
  to: string;
  durationMin: number;
  description?: string | null;
  tags: string[];
  track?: Feature<LineString>;
  trackSource?: FlightTrackSource | null;
  trackMeta?: FlightTrackMeta | null;
  comments: string;
};

export type FlightListItem = Flight & {
  track?: Feature<LineString> | null;
  trackSource?: FlightTrackSource | null;
  trackMeta?: FlightTrackMeta | null;
};

export type GetFlightTrackResponse = {
  id: number;
  flightId: string;
  source: FlightTrackSource;
  feature: Feature<LineString>;
  meta: unknown | null;
  rawText?: string | null;
  rawFormat?: string | null;
  rawFilename?: string | null;
  rawMime?: string | null;
  createdAt: string;
};

export type TrackSample = {
  t: string;
  lng: number;
  lat: number;
  altAglFt: number | null;
  gsKt: number | null;
};

export type TrackItem = {
  id: string;
  title: string;
  subtitle?: string;
  feature: Feature<LineString>;
};

export type MapViewProps = {
  tracks: TrackItem[];
  selectedId?: string | null;
  height?: number | string;
  onSelect?: (id: string) => void;
  showTileAttribution?: boolean;
  showZoomControl?: boolean;
  cursor?: { lat: number; lng: number } | null;
  invalidateKey?: unknown;
  cursorLabelLines?: string[] | null;
  cursorHeadingDeg?: number | null;
};

export type SeedItem = {
  id: string;
  originalFilename: string;
  file: File;
  parse: { ok: true; startTimeISO: string; endTimeISO: string } | { ok: false; error: string };
  enabled: boolean;
};

export type BatchItem = SeedItem & {
  mode: 'existing' | 'new';
  selectedExistingId: string;
  newTail: string;
  newFrom: string;
  newTo: string;
  newDescription: string;
  newTags: string;
  validationError: string | null;
  run: { status: 'pending' } | { status: 'running' } | { status: 'success'; flightId: string } | { status: 'error'; message: string } | { status: 'skipped' };
};

export type ItemConfig = Pick<BatchItem, 'enabled' | 'mode' | 'selectedExistingId' | 'newTail' | 'newFrom' | 'newTo' | 'newDescription' | 'newTags'>;

export type TrackChartProps = {
  samples: TrackSample[];
  cursorIdx: number;
  onCursorChange: (idx: number) => void;
  height?: number;
  maxRenderPoints?: number;
};
