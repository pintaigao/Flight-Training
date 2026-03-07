# Store Slices Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the React store from a flat `AppState` into nested slices `auth` / `flights` / `ui` without changing app behavior.

**Architecture:** Keep a single Context + `useReducer` store, but reorganize state shape and split reducer/types by slice. Update call sites to new state paths and keep action names/payloads stable.

**Tech Stack:** React 18, TypeScript, Vite, react-router-dom, Context + useReducer

---

### Task 1: Create new slice types

**Files:**
- Create: `src/store/rootTypes.ts`
- Create: `src/store/auth/types.ts`
- Create: `src/store/flights/types.ts`
- Create: `src/store/ui/types.ts`
- Modify: `src/store/types.ts`

**Step 1: Define new `AppState` shape**

- `AppState.auth` stays as-is (`user`, `status`)
- `AppState.flights` owns: `flightsById`, `flightIds`, `selectedFlightId`
- `AppState.ui` owns: `filters`, `mapMode`

**Step 2: Re-export from `src/store/types.ts`**

- Keep external imports stable where possible (`Flight`, `AuthUser`, etc.)
- Update `Action` to be a union of slice actions: `AuthAction | FlightsAction | UiAction`

**Step 3: Run typecheck**

Run: `npm run build`  
Expected: may fail until reducers are updated (acceptable at this step).

**Step 4: Commit**

Run:
```bash
git add src/store
git commit -m "refactor(store): add slice types"
```

### Task 2: Split reducers and compose root reducer

**Files:**
- Create: `src/store/auth/reducer.ts`
- Create: `src/store/flights/reducer.ts`
- Create: `src/store/ui/reducer.ts`
- Create: `src/store/rootReducer.ts`
- Modify: `src/store/reducer.ts`

**Step 1: Move auth cases**

- `SET_AUTH_USER`
- `SET_AUTH_STATUS`

**Step 2: Move flights cases**

- `SET_FLIGHTS`
- `SELECT_FLIGHT`
- `UPSERT_FLIGHT`
- `DELETE_FLIGHT`
- `UPDATE_COMMENTS`
- `IMPORT_TRACK`

**Step 3: Move UI cases**

- `SET_FILTERS`
- (and any future UI-only actions)

**Step 4: Root reducer composition**

- `rootReducer(state, action)` returns `{ auth: ..., flights: ..., ui: ... }`
- `src/store/reducer.ts` can re-export `rootReducer` to keep imports stable

**Step 5: Run build**

Run: `npm run build`  
Expected: may still fail until seed/store/provider are updated.

**Step 6: Commit**

```bash
git add src/store
git commit -m "refactor(store): split reducers by slice"
```

### Task 3: Update seed + StoreProvider persistence

**Files:**
- Modify: `src/store/seed.ts`
- Modify: `src/store/store.tsx`

**Step 1: Update `makeEmptyState` / `makeDemoState`**

- Return the new nested state shape

**Step 2: Update `loadInitialState`**

- Read persisted UI state from localStorage
- Merge into base state as `state.ui` (not `filters` + `ui` separately)

**Step 3: Update persistence**

- Persist only `state.ui` under the same key (`flightlog.ui.v1`)
- Wrap localStorage operations in try/catch (ignore errors)

**Step 4: Run build**

Run: `npm run build`  
Expected: now only component call sites should fail.

**Step 5: Commit**

```bash
git add src/store
git commit -m "refactor(store): update seed and provider for slices"
```

### Task 4: Update all call sites to new state paths

**Files (likely):**
- Modify: `src/pages/**`
- Modify: `src/components/**`

**Step 1: Mechanical path updates**

- `state.flightIds` → `state.flights.flightIds`
- `state.flightsById` → `state.flights.flightsById`
- `state.selectedFlightId` → `state.flights.selectedFlightId`
- `state.filters` → `state.ui.filters`
- `state.ui.mapMode` stays `state.ui.mapMode`

**Step 2: Fix any type errors**

- Places that build arrays from `flightIds` should reference `state.flights.*`

**Step 3: Run build**

Run: `npm run build`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/pages src/components src/router src/App.tsx
git commit -m "refactor(store): migrate components to slice state paths"
```

### Task 5: Smoke-check locally (manual)

**Step 1: Run dev server**

Run: `npm run dev`

**Step 2: Quick checks**

- Auth bootstrap still runs (`/auth/me`)
- Flights list loads
- Selecting flights works
- Filters persist after refresh
- Flight detail comments save still works

