# Map Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/map` a full-bleed map view with in-map overlay panels and a button to collapse/expand the global sidebar.

**Architecture:** Add a small `LayoutContext` provided by `PrivateLayout` and consumed by `MapExplorer`. Keep UI changes localized to `PrivateLayout` and `MapExplorer`, using Tailwind utilities in TSX.

**Tech Stack:** React, TypeScript, React Router, Tailwind utilities.

---

### Task 1: Add layout context for sidebar collapse

**Files:**
- Create: `src/components/layout/LayoutContext.tsx`
- Modify: `src/components/layout/PrivateLayout.tsx`

**Step 1: Create `LayoutContext`**
- Export provider and a `useLayout()` hook.
- Context values: `sidebarCollapsed`, `toggleSidebarCollapsed`, `setSidebarCollapsed`.

**Step 2: Wire context into `PrivateLayout`**
- Wrap layout with provider.
- Ensure default is `sidebarCollapsed=false`.

**Step 3: Manual verify**
- Run: `npm run dev`
- Expected: App behaves the same (no visual change yet).

---

### Task 2: Make `/map` full-bleed and support collapsing sidebar

**Files:**
- Modify: `src/components/layout/PrivateLayout.tsx`

**Step 1: Detect `/map` route**
- Use `useLocation()` to detect `/map`.
- On `/map`, remove main padding and max-width container.

**Step 2: Collapse sidebar on `/map`**
- Apply dynamic `gridTemplateColumns` on large screens based on `sidebarCollapsed`.
- Ensure sidebar content is visually hidden when collapsed.

**Step 3: Manual verify**
- Run: `npm run dev`
- Expected: `/map` content fills the viewport; sidebar can be collapsed/expanded (even if no toggle button yet).

---

### Task 3: Redesign `MapExplorer` to overlay panels + toggle button

**Files:**
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`

**Step 1: Convert to full-screen map container**
- Render `MapView` as the base full-height element.

**Step 2: Add overlays**
- Top-left button calls `toggleSidebarCollapsed()`.
- Left flight list overlay: scrollable list, click to set local `selectedFlightId`.
- Right details overlay: render only when `selectedFlightId != null`, include “X” button to clear selection and a “View Details” link.

**Step 3: Manual verify**
- Run: `npm run dev`
- Expected:
  - No flight selected → right panel hidden.
  - Clicking list item selects → right panel appears.
  - Clicking X clears selection → right panel hides.
  - Toggle button collapses global sidebar.

---

### Task 4: Build + commit

**Files:**
- Modify: `src/components/layout/LayoutContext.tsx`
- Modify: `src/components/layout/PrivateLayout.tsx`
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`

**Step 1: Build**
- Run: `npm run build`
- Expected: Build succeeds.

**Step 2: Commit**
```bash
git add src/components/layout/LayoutContext.tsx
git add src/components/layout/PrivateLayout.tsx
git add src/pages/MapExplorer/MapExplorer.tsx
git add docs/plans/2026-03-08-map-page-redesign-implementation-plan.md
git commit -m "ui: redesign map page layout"
```

