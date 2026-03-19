import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Store } from '@/lib/types/store';
import type { AppState } from '@/lib/types/state';
import { rootReducer } from './rootReducer';
import { initState } from './initialState';

const STORAGE_KEY = 'flightlog.Modal.v1';

const StoreContext = createContext<Store | null>(null);

function loadInitialState(): AppState {
  const base = initState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as any;
    // Migrate older persisted shape: { filters, Modal: { mapMode } } → { Modal: { filters, mapMode } }.
    const migratedUi = parsed?.ui?.filters != null ? parsed.ui : {filters: parsed?.filters ?? base.ui.filters, mapMode: parsed?.ui?.mapMode ?? base.ui.mapMode};
    return {
      ...base,
      ui: migratedUi ?? base.ui,
    };
  } catch {
    return base;
  }
}

export function StoreProvider({children}: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, loadInitialState);
  
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ui: state.ui}))}, [state.ui]);
  
  const value = useMemo(() => ({state, dispatch}), [state]);
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
