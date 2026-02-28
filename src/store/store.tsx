import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { AppState, Action } from './types'
import { reducer } from './reducer'
import { makeDemoState } from './seed'

const STORAGE_KEY = 'flightlog.state.v1'

type Store = {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Store | null>(null)

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeDemoState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !parsed.flightsById || !parsed.flightIds) return makeDemoState()
    // lightweight migration + do not trust persisted auth
    return {
      ...makeDemoState(),
      ...parsed,
      auth: { user: null, status: 'unknown' }
    }
  } catch {
    return makeDemoState()
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      // Persist app data, but NOT auth (session is managed by HttpOnly cookies).
      const toPersist: AppState = { ...state, auth: { user: null, status: 'unknown' } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist))
    } catch {
      // ignore
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
