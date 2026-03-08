# Modern Modal (Borderless + Theme-Aware) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all modals (including rich text editor modal) look modern and borderless, use a consistent X close control, and fully respect light/dark theme.

**Architecture:** Keep the existing `Modal.scss` `.modal-overlay/.modal-card` base so existing modals update together. Standardize “close” UI as a small X icon button in the modal header. Update `LexicalEditor.scss` to stop hardcoding dark colors and instead use existing theme CSS variables (`--panel/--panel2/--border/--text/--muted/--accent`).

**Tech Stack:** React, SCSS, Tailwind utility classes (in TSX), CSS variables theme (`data-theme`), Vite.

---

### Task 1: Standardize the modal “X” close control

**Files:**
- Modify: `Flight-Training/src/components/ui/Modal.tsx`
- Modify: `Flight-Training/src/components/ui/ConfirmModal.tsx`
- Modify: `Flight-Training/src/components/flights/ImportFlightDataModal.tsx`

**Step 1: Replace text close buttons with an X icon**
- In `Modal.tsx`, replace the current “Close” button with an icon-only button:
  - `aria-label="Close"`
  - Same sizing everywhere (e.g. `h-9 w-9`)
  - Uses theme vars for background/hover/border
  - Respect `disabled`
- In `ConfirmModal.tsx`, remove the header “Cancel” button and use the same X icon button to close.
- In `ImportFlightDataModal.tsx`, replace the header “Close” button with the same X icon button.

**Step 2: Verify keyboard/backdrop behavior**
- Keep backdrop click-to-close behavior where it exists today.
- Add `Escape` to close only if it doesn’t change product expectations (optional; can skip if risky).

**Step 3: Manual verify**
- Open each modal and confirm:
  - X renders in header right side
  - X hover/focus looks consistent in light/dark
  - Disabled state prevents closing while saving

---

### Task 2: Make modal visuals borderless and “glass” modern

**Files:**
- Modify: `Flight-Training/src/components/ui/Modal.scss`

**Step 1: Remove borders and header divider**
- Remove hard `border` on `.modal-card`.
- Remove `border-bottom` divider in `.modal-header`.
- Keep separation via shadow + background + subtle blur.

**Step 2: Improve modern feel**
- Keep using `var(--overlay)` and `var(--modal)` so theme drives colors.
- Consider a softer shadow and slightly tighter header spacing.

**Step 3: Manual verify**
- In light theme: modal card looks light, no border line, still readable.
- In dark theme: modal card looks dark, no border line, still readable.

---

### Task 3: Theme the rich text editor chrome (Lexical)

**Files:**
- Modify: `Flight-Training/src/components/richtext/LexicalEditor.scss`

**Step 1: Replace hardcoded dark RGBA colors**
- Replace `rgba(255,255,255,...)` and `rgba(0,0,0,...)` usages with theme variables:
  - Borders → `var(--border)`
  - Backgrounds → `var(--panel)` / `var(--panel2)` / `var(--modal)` (only if inside modal)
  - Text → `var(--text)` / `var(--muted)`
  - Accent for active states → `var(--accent)`

**Step 2: Keep existing layout**
- Do not change editor structure; only update styling tokens to be theme-aware and “modern”.

**Step 3: Manual verify**
- Read-only editor in flight detail looks correct in light/dark.
- Editable editor inside “Edit Comments” modal looks correct in light/dark.

---

### Task 4: Verification

**Files:**
- None

**Step 1: Production build**
Run: `cd Flight-Training && npm run build`
Expected: success (TS + Vite build).

**Step 2: Manual UI smoke test**
Run: `cd Flight-Training && npm run dev`
- Toggle light/dark theme and open:
  - Edit Comments (Lexical modal)
  - Edit Description (textarea modal)
  - Confirm delete modal
  - Import ForeFlight KML modal
- Confirm:
  - Modal visuals are borderless, modern
  - Close control is consistent X icon
  - Light theme is not “dark-styled” anywhere

