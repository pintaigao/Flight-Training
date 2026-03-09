# Import ForeFlight KML Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the ForeFlight KML import modal UI by reusing the shared `Modal` component and modernizing layout/controls with Tailwind while keeping behavior unchanged.

**Architecture:** Keep existing data/parse/save logic intact; only refactor presentation and modal composition. Remove ad-hoc overlay markup and hard-coded dark list styles.

**Tech Stack:** React, Tailwind, SCSS variables (`var(--panel)`, `var(--panel2)`, `var(--border)`, `var(--accent)`), shared `Modal` component.

---

### Task 1: Refactor Import modal to use shared `Modal`

**Files:**
- Modify: `src/components/flights/ImportFlightDataModal.tsx`

**Step 1: Replace custom overlay/card with `<Modal>`**

- Remove the `modal-overlay` and `modal-card` wrapper markup in the component.
- Import `Modal` from `@/components/ui/Modal`.
- Remove `ModalCloseButton` usage inside this component (the shared Modal already provides it).

**Step 2: Add a summary strip in modal body**

- At the top of the modal body, show:
  - filename
  - start → end (Chicago-local formatting as currently implemented)
  - duration (~X hrs)

**Step 3: Replace radio controls with segmented buttons**

- Two buttons for mode switching:
  - “Attach to existing”
  - “Create new flight”
- Active state uses `bg-[var(--accent)] text-white`.

**Step 4: Update “Attach” mode layout**

- Use a 2-column grid:
  - Left: candidates list (scrollable; theme-aware active/hover)
  - Right: select dropdown + primary action button + helper text

**Step 5: Update “New” mode layout**

- Use consistent input styling via Tailwind (border, bg, focus ring).
- Keep current required validations and submit behavior unchanged.

**Step 6: Remove unused imports and old style dependencies**

- Remove `../ui/Modal.scss` and `../map/MapList.scss` imports from this component if no longer needed.
- Remove any now-unused class names related to `map-list-item`.

**Step 7: Verify build**

Run:

`cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training && npm run build`

Expected: `✓ built` with no TypeScript errors.
