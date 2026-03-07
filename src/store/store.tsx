import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { AppState, Action } from './types';
import { reducer } from './reducer';
import { makeEmptyState } from './seed';
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
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      filters: (parsed as any)?.filters ?? base.filters,
      ui: (parsed as any)?.ui ?? base.ui,
    };
  } catch {
    return base;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ filters: state.filters, ui: state.ui }),
      );
    } catch {
      // ignore
    }
  }, [state]);

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
