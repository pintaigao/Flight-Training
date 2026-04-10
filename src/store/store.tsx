import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState } from '@/lib/types/state';
import type { Action } from '@/lib/types/actions';
import type { Store } from '@/lib/types/store';
import { authReducer } from './auth/reducer';
import { flightsReducer } from './flights/reducer';
import { uiReducer } from './ui/reducer';
import { initialAuthState } from "@/store/auth/initial";
import { initialFlightsState } from "@/store/flights/initial";
import { initialUiState } from "@/store/ui/initial";

const STORAGE_KEY = 'flightlog.Modal.v1';

function rootReducer(state: AppState, action: Action): AppState {
  return {
    auth: authReducer(state.auth, action),
    flights: flightsReducer(state.flights, action),
    ui: uiReducer(state.ui, action),
  };
}

function loadInitialState(): AppState {
  // Initial State
  const base = {
    auth: initialAuthState,
    flights: initialFlightsState,
    ui: initialUiState,
  };
  
  
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

// 主体
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({children}: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, loadInitialState);
  
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ui: state.ui}))}, [state.ui]);
  
  const value = useMemo(() => ({state, dispatch}), [state, dispatch]);
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
