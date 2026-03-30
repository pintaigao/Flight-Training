export type LiveAircraftItem = {
  hex: string;
  flight?: string | null;
  squawk?: string | null;
  lat?: number | null;
  lon?: number | null;
  alt?: number | null;
  gs?: number | null;
  track?: number | null;
  seen?: number | null;
};

export type LiveAircraftResponse = {
  updatedAt: string;
  count: number;
  items: LiveAircraftItem[];
};
