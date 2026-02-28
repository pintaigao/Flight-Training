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
    // lightweight migration for older stored state
    return {
      ...makeDemoState(),
      ...parsed,
      usersById: (parsed as any).usersById ?? {},
      userIds: (parsed as any).userIds ?? [],
      auth: (parsed as any).auth ?? { userId: null }
    }
  } catch {
    return makeDemoState()
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
