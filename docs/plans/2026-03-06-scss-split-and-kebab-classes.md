# SCSS Split + Kebab-Case Classes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single large `globals.css` with SCSS, split styles by component/page, and rename CSS classes to `kebab-case` (no camelCase).

**Architecture:** Keep truly global styling (tokens + reset + base typography/background) in one SCSS file imported once from `src/main.tsx`. Keep shared “UI primitives” (buttons/cards/inputs/grids) in a separate SCSS file imported once from `src/main.tsx`. Move layout/page/component-specific styles into colocated `*.scss` files that are imported by their corresponding TSX modules.

**Tech Stack:** Vite, React, TypeScript, `sass` (SCSS compiler)

---

### Task 1: Install SCSS compiler

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Install `sass`**

Run: `npm install -D sass`
Expected: package files update; install succeeds.

**Step 2: Verify TypeScript + build still works**

Run: `npm run build`
Expected: exits 0.

---

### Task 2: Create global base + shared UI SCSS entrypoints

**Files:**

- Create: `src/styles/base.scss`
- Create: `src/styles/ui.scss`
- Delete: `src/styles/globals.css`
- Modify: `src/main.tsx`

**Step 1: Move global tokens/reset into `base.scss`**

- Keep: `:root` CSS variables, `*{ box-sizing }`, `html/body`, `body` background/font, global `a`, global `h1`.
- Remove: all component/page class rules from the old file.

**Step 2: Move shared primitives into `ui.scss`**

- Keep (shared): `.page`, `.page-header`, `.title`, `.muted`, `.card`, `.card-title`, `.grid-4`, `.grid-2`, `.list`, `.row`, `.btn`, `.btn-primary`, `.btn-danger`, `.filters`, `.input`, `.select`, `.chip`, `.chip-soft`, `.textarea`, `.error`.
- Include responsive rules for `.grid-4` and `.grid-2` at the existing breakpoint.

**Step 3: Update `src/main.tsx` imports**

- Replace `./styles/globals.css` with:
  - `./styles/base.scss`
  - `./styles/ui.scss`

**Step 4: Verify build**
Run: `npm run build`
Expected: exits 0.

---

### Task 3: Split layout + sidebar styles and rename classes to kebab-case

**Files:**

- Create: `src/components/layout/private-layout.scss`
- Modify: `src/components/layout/PrivateLayout.tsx`
- Create: `src/components/sidebar/sidebar.scss`
- Modify: `src/components/sidebar/Sidebar.tsx`

**Step 1: Rename layout classes and import SCSS**

- Change `className="app"` → `className="app-layout"`
- Change `className="main"` → `className="app-main"`
- Add `import './private-layout.scss'` to `PrivateLayout.tsx`
- Move `.app`/`.main` styles (and their responsive rules) into `private-layout.scss`, renamed to `.app-layout`/`.app-main`.

**Step 2: Rename sidebar classes and import SCSS**

- Rename:
  - `brandMark` → `brand-mark`
  - `brandTitle` → `brand-title`
  - `brandSub` → `brand-sub`
  - `navItem` → `nav-item`
  - `sidebarFooter` → `sidebar-footer`
- Add `import './sidebar.scss'` to `Sidebar.tsx`
- Move `.sidebar` and related sidebar rules into `sidebar.scss`, with renamed selectors.
- Keep “active” state using `.nav-item.active`.

**Step 3: Verify build**
Run: `npm run build`
Expected: exits 0.

---

### Task 4: Split component styles (map, flights, modals, chart) and rename classes

**Files:**

- Create: `src/components/map/map-view.scss`
- Modify: `src/components/map/MapView.tsx`
- Create: `src/components/flights/flight-card.scss`
- Modify: `src/components/flights/FlightCard.tsx`
- Create: `src/components/ui/modal.scss`
- Modify: `src/components/ui/ConfirmModal.tsx`
- Modify: `src/components/flights/ImportFlightDataModal.tsx`
- Create: `src/components/track/track-chart.scss`
- Modify: `src/components/track/TrackChart.tsx`

**Step 1: MapView**

- Rename `.mapWrap` → `.map-wrap`
- Add `import './map-view.scss'`
- Move `.mapWrap` + `.map` rules into `map-view.scss` (rename selectors).

**Step 2: FlightCard**

- Rename:
  - `flightCard` → `flight-card`
  - `flightCardMain` → `flight-card-main`
  - `flightCardTitle` → `flight-card-title`
  - `flightCardMeta` → `flight-card-meta`
  - `flightDate` → `flight-date`
  - `flightThumb` → `flight-thumb`
  - `thumbLabel` → `thumb-label`
  - `chipSoft` → `chip-soft`
  - `btnDanger` → `btn-danger`
- Add `import './flight-card.scss'`
- Move the corresponding rules into `flight-card.scss` (rename selectors).
- Keep “selected” state using `.flight-card.selected`.

**Step 3: Modals**

- Create `src/components/ui/modal.scss` and move:
  - `.modalOverlay` → `.modal-overlay`
  - `.modalCard` → `.modal-card`
  - `.modalHeader` → `.modal-header`
  - `.modalBody` → `.modal-body`
- Import `../ui/modal.scss` from `ImportFlightDataModal.tsx`
- Import `./modal.scss` from `ConfirmModal.tsx`

**Step 4: TrackChart**

- Rename:
  - `trackChart` → `track-chart`
  - `trackChartReadout` → `track-chart-readout`
- Add `import './track-chart.scss'`
- Move chart rules into `track-chart.scss`.

**Step 5: Verify build**
Run: `npm run build`
Expected: exits 0.

---

### Task 5: Split page styles (auth, map explorer, flight detail) and rename classes

**Files:**

- Create: `src/pages/Auth/auth.scss`
- Modify: `src/pages/Auth/Login.tsx`
- Modify: `src/pages/Auth/Register.tsx`
- Create: `src/pages/MapExplorer/map-explorer.scss`
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`
- Create: `src/pages/FlightDetail/flight-detail.scss`
- Modify: `src/pages/FlightDetail/FlightDetail.tsx`
- Create: `src/pages/Flights/flights.scss`
- Modify: `src/pages/Flights/Flights.tsx`
- Create: `src/pages/Dashboard/dashboard.scss`
- Modify: `src/pages/Dashboard/Dashboard.tsx`

**Step 1: Auth**

- Rename:
  - `authWrap` → `auth-wrap`
  - `authCard` → `auth-card`
  - `authActions` → `auth-actions`
  - `authLink` → `auth-link`
  - `btnPrimary` → `btn-primary`
- Add `import './auth.scss'` to both Login/Register.
- Move auth rules into `auth.scss`.

**Step 2: MapExplorer**

- Rename:
  - `mapLayout` → `map-layout`
  - `mapSide` → `map-side`
  - `mapSideHeader` → `map-side-header`
  - `mapList` → `map-list`
  - `mapListItem` → `map-list-item`
  - `mapListMain` → `map-list-main`
  - `mapMain` → `map-main`
  - `mapTopbar` → `map-topbar`
  - `mapStage` → `map-stage`
  - `floatingCard` → `floating-card`
  - `floatingTitle` → `floating-title`
  - `btnPrimary` → `btn-primary`
- Add `import './map-explorer.scss'`.
- Move map-explorer rules (including responsive layout rule) into `map-explorer.scss`.
- Keep “active” state using `.map-list-item.active`.

**Step 3: FlightDetail**

- Rename:
  - `detailLayout` → `detail-layout`
  - `detailMap` → `detail-map`
  - `detailMapStack` → `detail-map-stack`
  - `detailMapStage` → `detail-map-stage`
  - `detailMapStageOverlay` → `detail-map-stage-overlay`
  - `detailChartPanel` → `detail-chart-panel`
  - `detailChartOverlay` → `detail-chart-overlay`
  - `detailSide` → `detail-side`
  - `sideHeader` → `side-header`
  - `sideTitle` → `side-title`
  - `chipRow` → `chip-row`
  - `kvRow` → `kv-row`
  - `emptyMap` → `empty-map`
  - `emptyTitle` → `empty-title`
  - `btnPrimary` → `btn-primary`
  - `btnDanger` → `btn-danger`
- Add `import './flight-detail.scss'`.
- Move flight-detail rules (including responsive layout rule) into `flight-detail.scss`.

**Step 4: Flights + Dashboard**

- Add `import './flights.scss'` and `import './dashboard.scss'` (even if empty today) to establish the per-page style pattern.

**Step 5: Verify build**
Run: `npm run build`
Expected: exits 0.
