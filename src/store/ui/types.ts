 export type Filters = {
  q: string;
  aircraft: string | 'ALL';
  tag: string | 'ALL';
};

export type UIState = {
  filters: Filters;
  mapMode: 'ALL' | 'SELECTED';
};

export type UiAction = { type: 'SET_FILTERS'; filters: Partial<Filters> };

