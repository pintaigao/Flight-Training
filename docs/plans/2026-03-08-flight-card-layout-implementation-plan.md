# Flight Card Layout Redesign (Flights Page) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the Flights list `FlightCard` layout to match the agreed header/timeline/footer structure (route+tail left, description right; timeline row with duration above the track and date below it).

**Architecture:** Keep changes localized to the `FlightCard` component; use Tailwind utilities in TSX. Avoid adding new dependencies. Keep SCSS file/class names but do not rely on SCSS for styling.

**Tech Stack:** React, TypeScript, Tailwind (utility classes), React Router.

---

### Task 1: Restructure `FlightCard` header row

**Files:**
- Modify: `src/components/flights/FlightCard.tsx`

**Step 1: Implement header row layout**
- Create a 2-column layout with ~16px gap:
  - Left: `From → To` and `TAIL #`
  - Right: `Description` (max 2 lines)

**Step 2: Manual verify**
- Run: `npm run dev`
- Expected: Each flight card shows route+tail on the left, description on the right; description truncates after 2 lines.

### Task 2: Implement timeline row (start/end + duration + date)

**Files:**
- Modify: `src/components/flights/FlightCard.tsx`

**Step 1: Implement timeline row**
- Keep a 3-column row:
  - Left: local start time + tz abbrev; zulu below
  - Center: duration label above track; track with endpoints; date centered below track
  - Right: local end time + tz abbrev; zulu below

**Step 2: Manual verify**
- Run: `npm run dev`
- Expected: Duration appears above the track; date appears under the track; start/end blocks stay aligned on one row.

### Task 3: Build + commit

**Files:**
- Modify: `src/components/flights/FlightCard.tsx`

**Step 1: Build**
- Run: `npm run build`
- Expected: Build succeeds.

**Step 2: Commit**
```bash
git add src/components/flights/FlightCard.tsx
git add docs/plans/2026-03-08-flight-card-layout-implementation-plan.md
git commit -m "ui: refine flights list card layout"
```

