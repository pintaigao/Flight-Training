# Action/State Centralization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate reducer/store `Action` and `State` types into `src/lib/types/actions.ts` and `src/lib/types/state.ts` without moving page-local state such as `SaveState`.

**Architecture:** Introduce two cross-cutting type modules for store contracts, keep domain/entity types in their existing domain modules, and shrink `store.ts` to the `Store` wrapper type only. Update all reducers, initial-state files, and store wiring imports to point to the new modules.

**Tech Stack:** React 18, TypeScript, Vite

---

### Task 1: Add centralized action/state modules

**Files:**
- Create: `src/lib/types/actions.ts`
- Create: `src/lib/types/state.ts`
- Modify: `src/lib/types/store.ts`
- Modify: `src/lib/types/index.ts`

**Step 1: Add `state.ts`**

Move:
- `AuthState`
- `FlightsState`
- `UIState`
- `AppState`

Also add `AuthStatus` so auth state and auth actions can share the same status union without reintroducing local duplication.

**Step 2: Add `actions.ts`**

Move:
- `AuthAction`
- `FlightsAction`
- `UiAction`
- `Action`

Import supporting entity/helper types from `auth.ts`, `flight.ts`, `ui.ts`, and `state.ts`.

**Step 3: Shrink `store.ts`**

Keep only:
- `Store`

Import `Action` from `actions.ts` and `AppState` from `state.ts`.

**Step 4: Update barrel exports**

Export the new modules from `src/lib/types/index.ts`.

---

### Task 2: Remove moved action/state types from domain modules

**Files:**
- Modify: `src/lib/types/auth.ts`
- Modify: `src/lib/types/flight.ts`
- Modify: `src/lib/types/ui.ts`

**Step 1: Remove store state/action types**

Delete:
- `AuthState`, `AuthAction` from `auth.ts`
- `FlightsState`, `FlightsAction` from `flight.ts`
- `UIState`, `UiAction` from `ui.ts`

**Step 2: Keep only domain/page types**

Preserve:
- auth payload/user DTO types in `auth.ts`
- flight/map/import/chart types in `flight.ts`
- filters/theme/modal types in `ui.ts`
- `SaveState` in `note.ts`

---

### Task 3: Rewrite imports and verify

**Files:**
- Modify: `src/store/store.tsx`
- Modify: `src/store/rootReducer.ts`
- Modify: `src/store/initialState.ts`
- Modify: `src/store/auth/reducer.ts`
- Modify: `src/store/auth/initial.ts`
- Modify: `src/store/flights/reducer.ts`
- Modify: `src/store/flights/initial.ts`
- Modify: `src/store/ui/reducer.ts`
- Modify: `src/store/ui/initial.ts`

**Step 1: Point store wiring to the new modules**

Use:
- `@/lib/types/actions` for `Action`
- `@/lib/types/state` for `AuthState`, `FlightsState`, `UIState`, `AppState`
- `@/lib/types/app` for `Store`

**Step 2: Verify no stale imports remain**

Search for:
- `@/lib/types/app` imports of `Action` or `AppState`
- state/action imports from `@/lib/types/auth`, `@/lib/types/flight`, `@/lib/types/ui`

Expected:
- none

**Step 3: Build**

Run:

```bash
npm run build
```

Expected:
- TypeScript passes
- Vite build succeeds
