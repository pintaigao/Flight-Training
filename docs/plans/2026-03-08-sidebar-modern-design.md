# Sidebar — Modern Theme-Aware Design

**Date:** 2026-03-08

## Goal

Refresh the app Sidebar to a more modern look (like the provided reference), while:

- keeping existing layout/behavior (including map page sidebar collapse)
- staying theme-aware (light/dark)
- not adding numeric badges
- not introducing new icon libraries

## Visual Changes

- Background: keep `var(--panel)` but add subtle glass/gradient via Tailwind utilities.
- Nav items: add left icons (inline SVG) and a pill-like active state.
- Hover states: gentle background highlight and text color lift.
- Footer: show a mini profile row (avatar circle + email) and unify button styling.

## Accessibility

- Icons are decorative (`aria-hidden`).
- Buttons keep `aria-label` where needed.

