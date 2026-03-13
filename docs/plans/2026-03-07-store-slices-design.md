# Store Refactor: Slice-based State (`auth` / `flights` / `ui`)

## Summary

Refactor the frontend store from a single flat `AppState` into a slice-based shape:

- `state.auth` — session/user state
- `state.flights` — flight entities + selection
- `state.ui` — UI-only state (filters, map mode, etc.)

The goal is to improve maintainability and code ownership boundaries as the app grows.

## Goals

- Make the store easier to navigate by grouping related state, actions, and reducer logic.
- Keep existing runtime behavior the same (data loading, persistence, routing/auth checks).
- Keep the current Context + `useReducer` architecture (no library migration).

## Non-goals

- Performance re-architecture (e.g., context selectors / multiple providers).
- Changing backend API contracts or feature behavior.
- Introducing new state management libraries.

## State Shape

### Before

Flat structure (example):

```ts
{
  auth: { user: null, status: 'unknown' },
  flightsById: {},
  flightIds: [],
  selectedFlightId: null,
  filters: { q: '', aircraft: 'ALL', tag: 'ALL' },
  ui: { mapMode: 'ALL' },
}
```

### After

Slice-based structure:

```ts
{
  auth: { user: null, status: 'unknown' },
  flights: {
    flightsById: {},
    flightIds: [],
    selectedFlightId: null,
  },
  ui: {
    filters: { q: '', aircraft: 'ALL', tag: 'ALL' },
    mapMode: 'ALL',
  },
}
```

## Module Layout

Create slice folders under `src/store/`:

- `src/store/auth/` — `types.ts`, `reducer.ts`, `initial.ts`
- `src/store/flights/` — `types.ts`, `reducer.ts`, `initial.ts`
- `src/store/ui/` — `types.ts`, `reducer.ts`, `initial.ts`
- Root composition:
  - `src/store/rootTypes.ts` — `AppState`, `Action` (union), shared types like `Flight`
  - `src/store/rootReducer.ts` — combines slices
  - `src/store/seed.ts` — demo/empty state helpers updated to the new shape
  - `src/store/store.tsx` — Provider/Context unchanged conceptually, updated persistence paths

## Actions & Reducers

- Each slice defines its own action union and reducer.
- The root `Action` is a union of slice actions.
- Root reducer delegates to slices and returns the combined next state.

Action names can remain the same (e.g. `SET_FLIGHTS`, `SET_AUTH_USER`) to reduce churn; they just become owned by a slice.

## Persistence

Keep the same storage key and persistence intent (persist UI-only preferences):

- Persist `state.ui` to `localStorage` (previously persisted `{filters, ui}`).
- Do not persist `auth` or `flights` in localStorage.

## Migration Plan

1. Add slice folders and new root types/reducer modules.
2. Update `StoreProvider` and seed functions for the new state shape.
3. Update all call sites that read/write state:
   - `state.flightIds` → `state.flights.flightIds`
   - `state.filters` → `state.ui.filters`
   - `state.ui.mapMode` remains `state.ui.mapMode`
4. Keep `dispatch` usage stable (same action types/payloads).

## Testing / Verification

- Typecheck/build succeeds (`tsc` + `vite build`).
- Smoke-check key flows:
  - App bootstraps `getProfile()` and auth gating still works.
  - Flights list loads and selection works.
  - Import flow and map explorer still work.
  - UI filter state persists across refresh (localStorage).
