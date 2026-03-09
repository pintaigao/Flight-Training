# Import ForeFlight KML Modal Redesign

**Date:** 2026-03-09

## Goal

Make the “Import ForeFlight KML” modal look and feel consistent with the modern modal style used elsewhere (e.g. Edit Comments / Edit Description), by reusing the shared `Modal` component and replacing ad-hoc overlay/card markup and inline styles.

## Non-goals

- No backend changes.
- No new modal framework; reuse existing `src/components/ui/Modal.tsx`.
- Do not change parsing logic for ForeFlight KML.

## Approach (Recommended)

Use the shared `Modal` component:

- Replace `modal-overlay`/`modal-card` wrapper in `ImportFlightDataModal` with `<Modal open title width disabled onClose>`.
- Move the previous header “subtitle” info (filename + time range + duration) into a small summary strip at the top of modal body.
- Replace radio controls with a modern segmented toggle (two button states):
  - Attach to existing
  - Create new flight
- Rework layout with Tailwind and theme variables:
  - In “Attach” mode, use a two-column layout (candidates list on the left; flight picker + action on the right).
  - In “New” mode, use a compact form grid with consistent input styling.
- Replace `MapList.scss` usage (hard-coded dark colors) with theme-aware Tailwind classes using `var(--panel2)`, `var(--border)`, and `var(--accent)` for active state.

## Success Criteria

- Modal looks consistent with other modals (spacing, header, close button, max height).
- UI is theme-aware (no hard-coded black/white backgrounds for list items).
- Existing flows still work:
  - Attach track to existing flight.
  - Create a new flight and attach track.
  - Error state displays clearly.
