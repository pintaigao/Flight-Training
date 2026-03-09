# Auth Pages (Login/Register) — Modern UI Design

**Date:** 2026-03-08

## Goal

Make the Login and Create Account pages feel more modern while keeping:

- existing routing and auth logic
- Tailwind utilities in `className`
- existing `Auth.scss` file presence (can remain mostly empty)

## Layout

- Centered card layout (single column).
- Full-viewport background with subtle gradient + soft accent glow shapes (non-interactive).
- Card uses existing theme variables (`--panel`, `--border`, `--shadow`) for light/dark consistency.

## Form UX

- Field labels above inputs (placeholders become secondary).
- Password field includes a show/hide toggle button.
- Error message uses a compact inline alert row (icon + text), placed above the primary button.

## Actions

- Primary button is full-width.
- Secondary navigation link ("Create account" / "Back to login") sits below the button.

## Accessibility

- Labels use `htmlFor`.
- Toggle button has `aria-label` and does not submit the form.
- Inputs keep `autoComplete` attributes.

