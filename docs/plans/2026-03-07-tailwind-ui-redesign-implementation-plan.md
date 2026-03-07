# Tailwind UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce Tailwind (coexisting with SCSS), add a light/dark theme toggle, and redesign the app’s layout + information architecture while keeping the left sidebar navigation and existing routes/behavior.

**Architecture:** Add Tailwind via PostCSS, keep existing SCSS imports initially, and migrate layout/IA page-by-page. Theme is driven by `data-theme` on `<html>` and CSS variables; Tailwind handles spacing/typography/layout.

**Tech Stack:** Vite + React 18 + TypeScript, Sass, Tailwind CSS, react-router-dom

---

### Task 1: Add Tailwind dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Install deps**

Run: `npm i -D tailwindcss postcss autoprefixer`  
Expected: packages installed, lockfile updated.

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(ui): add tailwind dependencies"
```

### Task 2: Add Tailwind config + CSS entrypoint

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.cjs`
- Create: `src/styles/tailwind.css`
- Modify: `src/main.tsx`

**Step 1: Add configs**

- Tailwind `content` includes `index.html` and `src/**/*.{ts,tsx}`.
- PostCSS config enables `tailwindcss` and `autoprefixer`.

**Step 2: Add CSS**

`src/styles/tailwind.css` contains:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Import CSS**

- In `src/main.tsx`, import `./styles/tailwind.css` before existing SCSS imports.

**Step 4: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add tailwind.config.ts postcss.config.cjs src/styles/tailwind.css src/main.tsx
git commit -m "chore(ui): add tailwind config and css entry"
```

### Task 3: Add theme tokens + theme persistence

**Files:**
- Create: `src/lib/theme/theme.ts`
- Create: `src/lib/theme/ThemeProvider.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles/Base.scss` (or create `src/styles/theme.css` if preferred)

**Step 1: Add theme module**

- `getInitialTheme()` reads `localStorage` key `flightlog.theme` (`'light'|'dark'`) or falls back to `prefers-color-scheme`.
- `applyTheme(theme)` sets `document.documentElement.dataset.theme`.
- `toggleTheme()` switches between light/dark and persists.

**Step 2: Add provider**

- `ThemeProvider` applies theme on mount and provides a `useTheme()` hook (`theme`, `toggleTheme`).

**Step 3: Define CSS variables**

- Add light and dark variable sets under `[data-theme="light"]` and `[data-theme="dark"]`.
- Keep existing variable names where possible (e.g. `--bg`, `--panel`, `--text`, `--muted`, `--border`, `--accent`).

**Step 4: Wire provider**

- Wrap app root in `src/main.tsx` with `<ThemeProvider>`.

**Step 5: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 6: Commit**

```bash
git add src/lib/theme src/main.tsx src/styles/Base.scss
git commit -m "feat(ui): add light/dark theme toggle infrastructure"
```

### Task 4: Add theme toggle button to Sidebar

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`
- Modify: `src/components/sidebar/Sidebar.scss` (optional; prefer Tailwind classes first)

**Step 1: Add button**

- Add a small icon-ish button in the sidebar footer.
- Use `useTheme()` to call `toggleTheme()`.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/sidebar/Sidebar.tsx src/components/sidebar/Sidebar.scss
git commit -m "feat(ui): add sidebar theme toggle"
```

### Task 5: Rebuild global shell layout using Tailwind (keep sidebar)

**Files:**
- Modify: `src/components/layout/PrivateLayout.tsx`
- Modify: `src/components/layout/PrivateLayout.scss` (optional)

**Step 1: Update layout**

- Use Tailwind for the shell grid/flex.
- Ensure main content area has consistent padding and max-width.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/layout/PrivateLayout.tsx src/components/layout/PrivateLayout.scss
git commit -m "refactor(ui): tailwind global shell layout"
```

### Task 6: Redesign Auth pages (layout + hierarchy)

**Files:**
- Modify: `src/pages/Auth/Login.tsx`
- Modify: `src/pages/Auth/Register.tsx`
- Modify: `src/pages/Auth/Auth.scss` (optional)

**Step 1: Update layout**

- Use Tailwind for centered container and form spacing.
- Keep existing inputs working; migrate visual structure.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/pages/Auth/Login.tsx src/pages/Auth/Register.tsx src/pages/Auth/Auth.scss
git commit -m "refactor(ui): redesign auth pages"
```

### Task 7: Redesign Dashboard page

**Files:**
- Modify: `src/pages/Dashboard/Dashboard.tsx`
- Modify: `src/pages/Dashboard/Dashboard.scss` (optional)

**Step 1: Update IA**

- Clear header, responsive stat cards, and better hierarchy between lists and map preview.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/pages/Dashboard/Dashboard.tsx src/pages/Dashboard/Dashboard.scss
git commit -m "refactor(ui): redesign dashboard layout"
```

### Task 8: Redesign Flights list page + filters

**Files:**
- Modify: `src/pages/Flights/Flights.tsx`
- Modify: `src/pages/Flights/Flights.scss` (optional)
- Modify: `src/components/flights/FlightFilters.tsx`
- Modify: `src/components/flights/FlightFilters.scss` (optional)
- Modify: `src/components/flights/FlightCard.tsx`
- Modify: `src/components/flights/FlightCard.scss` (optional)

**Step 1: Update IA**

- Header action area (import).
- Filters grouped and responsive.
- Flight cards visually consistent.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/pages/Flights/Flights.tsx src/pages/Flights/Flights.scss src/components/flights
git commit -m "refactor(ui): redesign flights list and filters"
```

### Task 9: Redesign Flight detail page (map/replay/details/comments)

**Files:**
- Modify: `src/pages/Flights/FlightDetail/FlightDetail.tsx`
- Modify: `src/pages/Flights/FlightDetail/FlightDetail.scss` (optional)

**Step 1: Update IA**

- Desktop 2-column layout, mobile single-column.
- Clear grouping for import/replay/comments.
- Keep Lexical/Leaflet components functional; only re-layout around them.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/pages/Flights/FlightDetail/FlightDetail.tsx src/pages/Flights/FlightDetail/FlightDetail.scss
git commit -m "refactor(ui): redesign flight detail layout"
```

### Task 10: Redesign Map explorer page

**Files:**
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`
- Modify: `src/pages/MapExplorer/MapExplorer.scss` (optional)

**Step 1: Update IA**

- Left list, right map with clear topbar action grouping.

**Step 2: Verify build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/pages/MapExplorer/MapExplorer.tsx src/pages/MapExplorer/MapExplorer.scss
git commit -m "refactor(ui): redesign map explorer"
```

### Task 11: Manual smoke-check (local)

**Step 1: Run dev**

Run: `npm run dev`

**Step 2: Verify**

- Theme toggle switches and persists after refresh
- Sidebar nav works
- Flights load and filters work
- Flight detail: import & comments modal still works
- Map explorer: select flight + recent tail fetch UI still works

