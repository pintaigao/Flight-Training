# Map Page Redesign — Design

**Goal:** Redesign `/map` to a full-bleed map view with in-map overlay panels (left flight list, right selected flight details) and a top-left button that can collapse/expand the global app sidebar.

## Constraints

- Keep existing global left `Sidebar` for the app.
- On `/map`, add a top-left button to hide/show the global `Sidebar`.
- Right-side details panel appears **only when a flight is selected**; if nothing is selected, it is hidden.
- Prefer Tailwind utilities in TSX; keep existing `.scss` files and class names (SCSS can remain minimal/empty).

## Layout

### Private Layout behavior on `/map`

- `/map` renders **full-bleed** content (no max-width container, no page padding).
- The layout provides a `LayoutContext` with:
  - `sidebarCollapsed: boolean`
  - `toggleSidebarCollapsed(): void`

On large screens, the private layout grid columns switch between:

- Expanded: `280px 1fr`
- Collapsed: `0px 1fr` (sidebar hidden)

### Map page (`MapExplorer`)

- Base: a full-viewport map container.
- Map overlays (positioned absolutely inside the map container):
  - **Top-left:** a small “toggle sidebar” button.
  - **Left panel:** flight list panel (scrollable).
  - **Right panel:** selected flight details panel (with close “X” to clear selection).

## Interaction / State

- Map page maintains its own `selectedFlightId` (local state), default `null`.
  - Clicking a flight in the left list sets selection.
  - Selecting in the map (via `MapView` `onSelect`) sets selection.
  - Closing the right panel sets selection back to `null`.
- This avoids auto-selection behavior from the global store and ensures “no selection → no right panel”.

## Selected Flight Details Panel

Display (compact):
- `TAIL #`
- `From → To`
- `Date`
- `Time range` (Zulu + local, uses existing formatter where possible)
- `Duration`
- `Description`
- `View Details` link to `/flights/:id`

