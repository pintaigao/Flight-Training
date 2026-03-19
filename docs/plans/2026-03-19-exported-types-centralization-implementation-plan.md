# Named Types Centralization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move every current named `type` alias out of feature, API, component, page, and store files and centralize those definitions under a smaller set of domain-oriented modules in `src/lib/types`.

**Architecture:** Keep `src/lib/types` compact instead of creating one file per former location. Group types by domain and usage:
- `auth.ts` for auth payloads and auth store types
- `flight.ts` for flights, map-track, import-flow, and chart-related types
- `note.ts` for note entities and note-page save state
- `ui.ts` for shared UI, theme, and modal types
- `store.ts` for app-level composed store types
- `api.ts` for generic API client response/token helpers

Anonymous inline object types stay next to their implementation.

**Tech Stack:** React 18, TypeScript, Vite, Axios, React Router, GeoJSON, Lexical

---

### Task 1: Create centralized type modules

**Files:**
- Create: `src/lib/types/auth.ts`
- Create: `src/lib/types/flight.ts`
- Create: `src/lib/types/note.ts`
- Create: `src/lib/types/ui.ts`
- Create: `src/lib/types/store.ts`
- Create: `src/lib/types/api.ts`
- Create: `src/lib/types/index.ts`

**Step 1: Add auth types**

Move these definitions into `src/lib/types/auth.ts`:
- `AuthUser`
- `AuthState`
- `AuthAction`
- `LoginDto`
- `RegisterDto`
- `AuthPayload`

**Step 2: Add flight types**

Move these definitions into `src/lib/types/flight.ts`:
- `Flight`
- `FlightsState`
- `FlightsAction`
- `FlightTrackSource`
- `FlightTrackMeta`
- `FlightListItem`
- `GetFlightTrackResponse`
- `TrackSample`
- `TrackItem`
- `MapViewProps`
- `SeedItem`
- `BatchItem`
- `ItemConfig`
- `TrackChartProps`

**Step 3: Add note and UI types**

Add:
- `NoteCategory`, `NoteContentFormat`, `Note`, `SaveState` to `src/lib/types/note.ts`
- `Filters`, `UIState`, `UiAction`, `Theme`, `ThemeContextValue`, `ModalProps` to `src/lib/types/ui.ts`
- `AppState`, `Action`, `Store` to `src/lib/types/store.ts`
- `TokenPayload`, `GraphqlResponse` to `src/lib/types/api.ts`

**Step 4: Add barrel exports**

Create `src/lib/types/index.ts` that re-exports the consolidated domain modules for convenience. Prefer direct module imports during migration if that keeps cycles clearer.

---

### Task 2: Remove named type definitions from source files

**Files:**
- Modify or delete legacy type-holder files in `src/store/**`
- Modify: `src/lib/api/auth.api.ts`
- Modify: `src/lib/api/flight.api.ts`
- Modify: `src/lib/api/note.api.ts`
- Modify: `src/lib/api/client.ts`
- Modify: `src/lib/api/graphql.client.ts`
- Modify: `src/lib/theme/theme.ts`
- Modify: `src/lib/theme/ThemeProvider.tsx`
- Modify: `src/components/Modal/Modal.tsx`
- Modify: `src/components/map/MapView.tsx`
- Modify: `src/components/flights/ImportFlightDataModal.tsx`
- Modify: `src/components/track/TrackChart.tsx`
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`
- Modify: `src/pages/Notes/Notes.tsx`

**Step 1: Remove legacy store type files**

After consumers are updated, delete:
- `src/store/auth/types.ts`
- `src/store/flights/types.ts`
- `src/store/ui/types.ts`
- `src/store/types.ts`

Preferred end state: no named `type` definitions remain in `src/store/**`.

**Step 2: Replace inline named types with centralized imports**

Move all named `type` aliases out of the source files above and import the centralized versions from `src/lib/types/*`.

**Step 3: Merge over-fragmented type modules**

Avoid creating one type file per former component/page. Merge small specialized files back into domain modules:
- `theme` and `modal` into `ui`
- `map`, `import-flight`, and `track-chart` into `flight`
- `notes-page` into `note`

---

### Task 3: Rewrite consumers to import centralized types

**Files:**
- Modify consumers across `src/components/**`, `src/pages/**`, `src/lib/**`, and `src/store/**`

**Step 1: Replace legacy store type imports**

Update all files importing from:
- `@/store/types`
- `@/store/auth/types`
- `@/store/flights/types`
- `@/store/ui/types`

to instead import from the new `@/lib/types/*` modules.

**Step 2: Replace old fragmented lib type imports**

Update consumers of former small type files to use the merged modules:
- note-related imports from `@/lib/types/note`
- UI/theme/modal imports from `@/lib/types/ui`
- flight/map/import/chart imports from `@/lib/types/flight`

**Step 3: Clean up import surfaces**

After rewrites:
- remove dead imports created during the migration
- keep runtime imports separate from `import type` where practical
- delete obsolete `src/lib/types/*` files that were merged away

---

### Task 4: Verify the centralization is complete

**Files:**
- Verify only

**Step 1: Verify there are no remaining local named type definitions outside `src/lib/types`**

Run:

```bash
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 rg -n "^\s*(export\s+)?type\s+[A-Za-z0-9_]+"
```

Expected:
- local named `type` definitions appear only under `src/lib/types`
- imported aliases such as `import { type Foo as Bar }` do not count

**Step 2: Verify TypeScript/build**

Run:

```bash
npm run build
```

Expected:
- TypeScript passes
- Vite build succeeds

**Step 3: Spot-check app flows**

Manually sanity check:
- auth login/register
- flights list/detail
- map page
- notes page

Expected:
- no import/runtime regressions after the type move
