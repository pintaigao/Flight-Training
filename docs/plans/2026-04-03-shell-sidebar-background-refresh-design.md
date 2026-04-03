# Shell Sidebar Background Refresh Design

**Status:** Approved

**Goal:** Restyle the shared React shell so the app immediately reads as a light, minimal interface inspired by the provided reference, while leaving page-level business layouts untouched.

## Scope

This design only covers the shared shell layer:

- global lowest-layer background color
- left sidebar presentation
- bottom profile presentation inside the sidebar

This design does not cover page-level layout changes inside `Flights`, `Dashboard`, `Notes`, `Map`, or any other route.

## Approved Decisions

### 1. Sidebar becomes an icon rail

The existing wide text sidebar will be replaced with a narrow vertical icon rail.

- keep the current route destinations and navigation logic
- remove visible nav labels
- keep each item accessible with `aria-label` and `title`
- keep the current icons unless a later pass changes the icon set

### 2. Sidebar uses a pill-shaped rail

The sidebar should visually match the reference image at the shell level:

- a standalone vertical rounded rail
- icons centered inside the rail
- generous vertical spacing between items
- no active-state background plate
- active state shown by icon color only

### 3. Bottom profile is reduced to avatar only

The footer profile area will be simplified to a single circular avatar.

- no email text
- no signed-in label
- no grouped footer buttons
- avatar can reuse the signed-in user initial

### 4. Global background changes only at the lowest layer

The current dark radial-gradient base background will be replaced with a light neutral gray close to the outermost background in the reference.

- no image background
- no large white application shell card in this pass
- no cloud overlays
- no page-level layout refactor

### 5. Theme controls are not part of this pass

The current visible theme toggle is not part of the approved shell design.

- remove the visible toggle from the sidebar UI
- do not redesign theme behavior in this pass
- keep changes focused on the approved shell look

## Visual Intent

The shell should feel lighter and quieter than the current app:

- soft neutral gray at the page base
- slightly lighter rail surface
- muted gray default icons
- deep blue active icon
- minimal chrome
- no extra copy in the shell

The shell should act as a quiet frame around the existing pages, not compete with them.

## Guardrails

- do not reformat already organized code just to match a different style
- do not change route structure
- do not change page business logic
- do not redesign page internals in this pass
- do not add new decorative background imagery

## Expected File Touches

- `src/components/sidebar/Sidebar.tsx`
- `src/components/sidebar/Sidebar.scss`
- `src/components/layout/MainLayout.tsx`
- `src/styles/Base.scss`

## Verification

The shell refresh is complete when:

- the app background is a light neutral gray
- the left navigation is a narrow icon-only rail
- the active nav item is indicated by icon color only
- the sidebar footer shows only a circular avatar
- existing routes still work
- page content still renders without layout breakage
