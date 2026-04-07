# Map Style Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update all shared map surfaces to a lighter editorial map style with calmer dark route lines while preserving route selection, replay behavior, and existing page layouts.

**Architecture:** Keep the redesign centered in the shared `MapView` component so `MapExplorer`, `FlightDetail`, and `Dashboard` stay aligned automatically. Extract pure helper functions for tile configuration and route styling so the visual rules can be unit-tested without relying on full Leaflet DOM rendering. Limit page-level changes to only the places where replay labels, selected state, or compact dashboard rendering need a slight adjustment.

**Tech Stack:** Vite, React 18, TypeScript, react-leaflet, Leaflet, SCSS, Vitest (new unit-test tooling for pure map-style helpers)

---

### Task 1: Add minimal unit-test tooling for map style helpers

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Add the unit test command and dependencies**

Update `package.json` so it includes:

- script: `"test:unit": "vitest run"`
- devDependencies: `vitest`, `jsdom`

Do not add browser-heavy React testing libraries yet. The initial tests only need to execute pure helper code.

**Step 2: Add a minimal Vitest config**

Create `vitest.config.ts` with alias support inherited from Vite:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `src/test/setup.ts` with a minimal no-op setup file.

**Step 3: Verify the test runner starts**

Run: `npm run test:unit`

Expected: the command runs successfully with “No test files found” or equivalent zero-test output.

**Step 4: Commit**

```bash
git add package.json vitest.config.ts src/test/setup.ts
git commit -m "test: add unit test harness for map styling"
```

### Task 2: Extract pure map theme helpers and drive them with failing tests

**Files:**
- Create: `src/components/map/mapTheme.ts`
- Create: `src/components/map/mapTheme.test.ts`

**Step 1: Write the failing tests**

Create `src/components/map/mapTheme.test.ts` that defines the required shared visual rules:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIGHT_TILE_LAYER,
  getTrackLineStyle,
  getMarkerTone,
} from './mapTheme';

describe('map theme', () => {
  it('uses a light neutral tile layer configuration', () => {
    expect(DEFAULT_LIGHT_TILE_LAYER.url).toContain('{z}');
    expect(DEFAULT_LIGHT_TILE_LAYER.attribution.length).toBeGreaterThan(0);
  });

  it('returns a darker style for selected tracks', () => {
    const idle = getTrackLineStyle(false);
    const active = getTrackLineStyle(true);

    expect(active.weight).toBeGreaterThan(idle.weight);
    expect(active.color).not.toBe(idle.color);
    expect(active.dashArray).toBeUndefined();
  });

  it('keeps start and end markers in restrained grayscale tones', () => {
    expect(getMarkerTone('start')).toBe('start');
    expect(getMarkerTone('end')).toBe('end');
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npm run test:unit -- src/components/map/mapTheme.test.ts`

Expected: FAIL because `src/components/map/mapTheme.ts` does not exist yet.

**Step 3: Write the minimal helper implementation**

Create `src/components/map/mapTheme.ts` with:

- `DEFAULT_LIGHT_TILE_LAYER`
- `getTrackLineStyle(isSelected: boolean)`
- `getMarkerTone(kind: 'start' | 'end')`

Use values in this direction:

- selected color: near-black or dark graphite
- idle color: slightly lighter graphite
- selected line slightly thicker than idle
- no `dashArray`

Keep the module pure and free of Leaflet DOM code.

**Step 4: Re-run the test**

Run: `npm run test:unit -- src/components/map/mapTheme.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/map/mapTheme.ts src/components/map/mapTheme.test.ts
git commit -m "feat: add shared map theme helpers"
```

### Task 3: Rebuild MapView around the shared light map style

**Files:**
- Modify: `src/components/map/MapView.tsx`
- Modify: `src/components/map/MapView.scss`
- Modify: `src/lib/types/flight.ts` (only if new `MapViewProps` style props are required)

**Step 1: Write the failing test for any new pure helper behavior**

If `MapView` needs new helper logic for marker class names or cursor tone variants, extend `src/components/map/mapTheme.test.ts` first with one focused failing test before changing runtime code.

Example:

```ts
it('exposes a restrained cursor tone for replay mode', () => {
  expect(getCursorTone()).toMatchObject({
    dot: expect.any(String),
    plane: expect.any(String),
  });
});
```

**Step 2: Run the focused unit test and verify the expected failure**

Run: `npm run test:unit -- src/components/map/mapTheme.test.ts`

Expected: FAIL only if a newly added helper is still missing.

**Step 3: Update `MapView.tsx`**

Change the shared map component so it:

- uses `DEFAULT_LIGHT_TILE_LAYER`
- styles GeoJSON tracks via `getTrackLineStyle`
- supports restrained start/end marker rendering if needed
- tones down the replay cursor visuals
- keeps `FitBounds`, `onSelect`, `cursor`, and `invalidateKey` behavior intact

Do not add page-specific one-off logic into `MapView`.

**Step 4: Update `MapView.scss`**

Refresh the shared map shell so it matches the approved visual system:

- lighter border
- less component-heavy framing
- calmer cursor dot
- calmer replay plane stroke
- quieter cursor label styling

Keep the map visually compatible with the already-light shell palette.

**Step 5: Run tests and build**

Run:

```bash
npm run test:unit -- src/components/map/mapTheme.test.ts
npm run build
```

Expected:

- unit tests pass
- build succeeds

**Step 6: Commit**

```bash
git add src/components/map/MapView.tsx src/components/map/MapView.scss src/components/map/mapTheme.ts src/components/map/mapTheme.test.ts src/lib/types/flight.ts
git commit -m "feat: apply shared light map style"
```

### Task 4: Apply minimal page-level adjustments in the three map consumers

**Files:**
- Modify: `src/pages/MapExplorer/MapExplorer.tsx`
- Modify: `src/pages/Flights/FlightDetail/FlightDetail.tsx`
- Modify: `src/pages/Dashboard/Dashboard.tsx`

**Step 1: Add one failing unit test if any new pure page-level helper is introduced**

Only add tests if a new helper function is extracted. If page-level work is just prop wiring, skip extra test creation and proceed with runtime integration.

**Step 2: Update `MapExplorer`**

Ensure the page benefits from the new map style without layout rewrites:

- keep side overlays as-is
- let selected route readability rely on the new shared map theme
- avoid page-local color overrides fighting the new map style

**Step 3: Update `FlightDetail`**

Align replay presentation with the calmer shared style:

- keep replay functionality intact
- preserve cursor readability
- remove any page-local assumptions that depend on the old bright map styling

**Step 4: Update `Dashboard`**

Let the mini map inherit the shared style without adding extra chrome or page-specific marker noise.

**Step 5: Run build**

Run: `npm run build`

Expected: PASS

**Step 6: Manual browser check**

Run: `npm run dev`

Check:

- `/home`: mini map reads as the same visual family
- `/map`: selected route remains obvious on the lighter base map
- `/flights/:id`: replay cursor and labels remain readable while scrubbing

**Step 7: Commit**

```bash
git add src/pages/MapExplorer/MapExplorer.tsx src/pages/Flights/FlightDetail/FlightDetail.tsx src/pages/Dashboard/Dashboard.tsx
git commit -m "feat: align map consumers with shared map style"
```

### Task 5: Final verification of the approved map refresh

**Files:**
- Verify only

**Step 1: Run the full verification commands**

Run:

```bash
npm run test:unit
npm run build
```

Expected:

- all unit tests pass
- production build succeeds

**Step 2: Manual acceptance check**

Run: `npm run dev`

Confirm all approved outcomes:

- all three maps use the same light visual family
- route lines are solid and calmer than before
- selection stays readable without bright accent overuse
- replay cursor is calmer but still understandable
- no page layout was rebuilt just to achieve map styling

**Step 3: Commit**

```bash
git commit --allow-empty -m "chore: verify map style refresh"
```
