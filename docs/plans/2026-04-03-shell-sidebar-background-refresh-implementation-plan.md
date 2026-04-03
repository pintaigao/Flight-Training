# Shell Sidebar Background Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the shared application shell to match the approved light reference by replacing the wide text sidebar with a narrow icon rail, reducing the footer profile to an avatar, and changing the app's global base background to a light neutral tone without disturbing page-level layouts.

**Architecture:** Keep all route behavior and page-level business logic intact. Limit implementation to `MainLayout`, `Sidebar`, and global base SCSS so the shell changes read across the whole app while leaving the existing route components functionally unchanged. Because this repo currently has no frontend test harness, verification will use `npm run build` plus focused manual browser checks.

**Tech Stack:** Vite, React 18, TypeScript, React Router, SCSS, Tailwind utility classes, lucide-react

---

### Task 1: Establish the light shell palette and background

**Files:**
- Modify: `src/styles/Base.scss`
- Verify: `npm run build`

**Step 1: Replace the shared shell palette with the approved light neutral direction**

Update the shared CSS variables so both the default root palette and explicit theme roots render the shell with a light neutral base. Use a palette in this range:

- `--bg: #e6e5e2`
- `--panel: rgba(255, 255, 255, 0.58)`
- `--panel2: rgba(255, 255, 255, 0.82)`
- `--border: rgba(15, 23, 42, 0.08)`
- `--text: rgba(18, 26, 44, 0.92)`
- `--muted: rgba(18, 26, 44, 0.48)`
- `--shell-rail: #f4f3ef`
- `--shell-icon: rgba(18, 26, 44, 0.42)`
- `--shell-icon-active: #1f4aa8`
- `--shell-avatar-ring: rgba(18, 26, 44, 0.10)`

Keep the existing variable names that page components already depend on so route content does not need rewrites.

**Step 2: Remove the current dark radial-gradient page base**

Change `body` so the lowest layer uses a flat light neutral background:

```scss
body {
  margin: 0;
  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
}
```

Do not add imagery, clouds, or a large outer shell container in this pass.

**Step 3: Run the build to verify the shell token changes compile**

Run: `npm run build`

Expected: Vite build completes successfully with no TypeScript or SCSS errors.

**Step 4: Commit**

```bash
git add src/styles/Base.scss
git commit -m "feat: lighten shared shell palette"
```

### Task 2: Rebuild the shared sidebar as a narrow icon rail

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`
- Modify: `src/components/sidebar/Sidebar.scss`
- Verify: `npm run build`

**Step 1: Replace the current text-heavy sidebar markup with icon-only navigation**

Keep the existing `nav` config and `NavLink` routing behavior, but change the rendered structure so:

- the brand title/subtitle block is removed
- each nav item renders only the icon
- each nav item keeps `aria-label={item.label}` and `title={item.label}`
- the current theme and logout buttons are removed from the visible footer

Keep auth-derived user data only for avatar rendering.

**Step 2: Reduce the footer profile to a single avatar**

Render only one circular avatar at the bottom of the sidebar. Use the first character of the signed-in email when available; otherwise render a neutral fallback such as `?`.

Do not render:

- email text
- signed-in status
- button group

**Step 3: Add rail styling in `Sidebar.scss`**

Move the shell-specific presentation into `Sidebar.scss` and define the icon rail with these rules:

- narrow vertical layout
- pill-shaped rail surface using `var(--shell-rail)`
- centered icons with larger vertical gaps
- inactive icon color from `var(--shell-icon)`
- active icon color from `var(--shell-icon-active)`
- no active background plate
- footer avatar centered below the rail

Keep the file focused on shell layout and avoid restyling route content here.

**Step 4: Run the build**

Run: `npm run build`

Expected: build succeeds and `Sidebar.tsx` has no invalid imports or JSX errors.

**Step 5: Manual browser check**

Run: `npm run dev`

Check:

- sidebar shows icons only
- hover and active states remain usable
- bottom area shows only the avatar
- navigation still changes routes

**Step 6: Commit**

```bash
git add src/components/sidebar/Sidebar.tsx src/components/sidebar/Sidebar.scss
git commit -m "feat: convert sidebar to icon rail"
```

### Task 3: Resize the shared layout to fit the new rail without breaking pages

**Files:**
- Modify: `src/components/layout/MainLayout.tsx`
- Verify: `npm run build`

**Step 1: Shrink the shell sidebar column to the new rail width**

Update the shared layout grid so the non-collapsed sidebar column uses a narrow shell width instead of the current wide value. Target a width in the `88px` to `112px` range so the rail has breathing room while leaving more room for page content.

Keep the map-page collapse behavior intact:

- collapsed map layout still uses `0px 1fr`
- expanded layout uses the new narrow rail width

**Step 2: Preserve page content spacing**

Leave the main page padding and route outlet structure intact unless the new rail width causes overlap. If adjustment is needed, make the smallest possible change in `MainLayout.tsx`.

**Step 3: Run the build**

Run: `npm run build`

Expected: build succeeds and layout code still compiles cleanly.

**Step 4: Manual browser check across core routes**

Run: `npm run dev`

Check these routes:

- `/home`
- `/flights`
- `/map`
- `/notes`

Expected:

- the narrow rail does not overlap page content
- the map collapse button still behaves correctly
- route content remains readable

**Step 5: Commit**

```bash
git add src/components/layout/MainLayout.tsx
git commit -m "feat: fit layout to icon rail shell"
```

### Task 4: Final verification for the approved shell-only pass

**Files:**
- Verify only

**Step 1: Run the final production build**

Run: `npm run build`

Expected: successful production build.

**Step 2: Perform final manual acceptance check**

Run: `npm run dev`

Confirm the approved design outcomes:

- lowest background layer is light neutral gray
- left shell is a pill-shaped icon rail
- active nav state is icon color only
- footer profile is avatar only
- page-level layouts remain functionally unchanged

**Step 3: Commit the completed shell pass**

```bash
git add src/styles/Base.scss src/components/sidebar/Sidebar.tsx src/components/sidebar/Sidebar.scss src/components/layout/MainLayout.tsx
git commit -m "feat: refresh shared shell sidebar and background"
```
