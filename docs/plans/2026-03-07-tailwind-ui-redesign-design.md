# Tailwind UI Redesign (Sidebar + Theme Toggle)

## Summary

Introduce Tailwind CSS (while keeping existing SCSS) and redesign the UI layout + information architecture across the app. Keep the existing left sidebar navigation and add a light/dark theme toggle (2-state button).

## Goals

- Add Tailwind to the Vite + React + TS project.
- Redesign page layout/IA and visual hierarchy across:
  - Dashboard
  - Flights list
  - Flight detail
  - Map explorer
  - Auth pages
- Keep the left sidebar navigation.
- Support light/dark themes with a single toggle button.
- Default theme follows `prefers-color-scheme` until user explicitly toggles; persist choice in `localStorage`.
- Tailwind and existing SCSS coexist during migration.

## Non-goals

- Changing routes, auth logic, API contracts, or store state shape.
- Replacing Lexical/Leaflet with different libraries.
- Full elimination of all SCSS in one pass.

## Information Architecture & Layout

### Global shell

- **Sidebar (left)**
  - Brand header (name + short subtitle)
  - Primary nav (Dashboard / Flights / Map)
  - Footer area:
    - Signed-in user email + logout button
    - Theme toggle button (light/dark)
- **Main content**
  - Consistent page container + spacing
  - Each page starts with a `PageHeader`:
    - Left: title + optional subtitle
    - Right: primary actions

### Page structure updates

- **Dashboard**
  - Top stat cards row (responsive)
  - “Recent flights” list + “Continue last flight” card
  - Map preview stays but gets clearer hierarchy and spacing
- **Flights**
  - Header actions right-aligned
  - Filters grouped as a single row/stack on mobile
  - Flight cards list uses consistent spacing and hover affordances
- **Flight detail**
  - Two-column on desktop: map/replay left, details/comments right
  - Clear primary actions (import track, edit comments) surfaced
  - Replay controls grouped with consistent form controls
- **Map explorer**
  - Two-pane layout: list left, map right
  - Topbar actions grouped (tail fetch + status)
- **Auth**
  - Centered card with consistent input/button styling

## Theming (Light/Dark)

### Mechanism

- Set `data-theme="light|dark"` on `document.documentElement`.
- Define theme tokens as CSS variables (e.g. `--bg`, `--panel`, `--text`, `--muted`, `--border`, `--accent`) for both themes.
- Tailwind classes handle spacing/layout/typography; colors are driven by CSS variables.

### Behavior

- On first load: choose theme based on `prefers-color-scheme`.
- Once user toggles: persist to `localStorage` (e.g. key `flightlog.theme`).
- Toggle is 2-state button (no “system” third state).

## Tailwind Integration (SCSS coexistence)

- Add Tailwind + PostCSS config.
- Add `src/styles/tailwind.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
- Keep importing existing SCSS (`src/styles/Base.scss`, `src/styles/Ui.scss`) initially.
- Incrementally replace layout/IA styling with Tailwind utility classes:
  - First: global shell + page layout + headers
  - Then: common UI elements (buttons/inputs/cards) via Tailwind + minimal custom CSS
  - Last: optional cleanup of legacy SCSS

## Migration Plan (High-level)

1. Add Tailwind scaffolding + `tailwind.css` import.
2. Add theme token definitions + toggle component logic.
3. Rebuild global shell (Sidebar + Main) with Tailwind layout.
4. Redesign each page’s layout/IA using Tailwind (retain complex component SCSS as needed).
5. Verify build and do quick manual smoke checks for key flows.

## Verification

- `npm run build` passes.
- Theme toggles correctly and persists across reload.
- Primary flows remain functional:
  - Auth gating + login/logout
  - Flights list and filters
  - Flight detail import + comments edit/save
  - Map explorer list selection + recent track fetch UI

