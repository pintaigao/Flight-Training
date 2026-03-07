import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { AppState, Action } from './types';
import { rootReducer } from './rootReducer';
import { makeEmptyState } from './initialState';
import { getFlights } from '@/lib/api/flight.api';

const STORAGE_KEY = 'flightlog.ui.v1';

type Store = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const StoreContext = createContext<Store | null>(null);

function loadInitialState(): AppState {
  const base = makeEmptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as any;
    // Migrate older persisted shape: { filters, ui: { mapMode } } → { ui: { filters, mapMode } }.
    const migratedUi =
      parsed?.ui?.filters != null
        ? parsed.ui
        : {
            filters: parsed?.filters ?? base.ui.filters,
            mapMode: parsed?.ui?.mapMode ?? base.ui.mapMode,
          };
    return {
      ...base,
      ui: migratedUi ?? base.ui,
    };
  } catch {
    return base;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ui: state.ui }),
      );
    } catch {
      // ignore
    }
  }, [state.ui]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const flights = await getFlights();
        if (cancelled) return;
        dispatch({ type: 'SET_FLIGHTS', flights });
      } catch {
        // ignore for now; UI will show empty state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
