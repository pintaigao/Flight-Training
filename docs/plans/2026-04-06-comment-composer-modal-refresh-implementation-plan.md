# Comment Composer Modal Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the shared comment-editing modal into a headerless writing surface with a floating dark right-aligned action tray while preserving current comment save behavior.

**Architecture:** Keep the redesign centered in shared primitives rather than page-local overrides. Add an explicit comment-composer variant to `Modal`, add a composition presentation mode to `LexicalEditor`, and let `FlightDetail` only wire those pieces together. Preserve the existing default modal and Lexical paths so unrelated dialogs remain stable.

**Tech Stack:** Vite, React 18, TypeScript, Lexical, SCSS, existing modal primitives

---

### Task 1: Extend shared modal types for a dedicated comment-composer variant

**Files:**
- Modify: `src/lib/types/ui.ts`
- Modify: `src/components/Modal/Modal.tsx`

**Step 1: Add the new modal variant typing**

Update `ModalProps` so the shared modal can express a dedicated presentation mode.

Add:

```ts
variant?: 'default' | 'comment-composer';
hideHeader?: boolean;
bodyClassName?: string;
```

Keep existing props backward-compatible so current call sites do not break.

**Step 2: Update the shared modal signature**

Teach `Modal.tsx` to:

- keep existing default behavior untouched
- support a headerless variant
- apply variant-specific wrapper/body classes

Use the existing `title` prop only when the header is visible.

**Step 3: Run build to verify type compatibility**

Run: `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/types/ui.ts src/components/Modal/Modal.tsx
git commit -m "feat: add comment composer modal variant"
```

### Task 2: Implement the shared comment-composer modal shell styling

**Files:**
- Modify: `src/components/Modal/Modal.scss`

**Step 1: Add a new modal-card variant**

Create a new `.modal-card--comment-composer` style branch that:

- removes visible header chrome
- uses a lighter, calmer body shell
- increases roundness and body padding
- avoids obvious borders

Keep the existing default modal styles unchanged.

**Step 2: Add support for a floating action region**

Define layout rules so the modal body can host a bottom floating tray:

- body remains spacious
- lower area has enough padding for the tray
- tray appears visually detached from the main writing surface

Keep this styling scoped to the new variant only.

**Step 3: Run build**

Run: `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/Modal/Modal.scss
git commit -m "feat: style comment composer modal shell"
```

### Task 3: Add a composition mode to LexicalEditor

**Files:**
- Modify: `src/components/richtext/LexicalEditor.tsx`
- Modify: `src/components/richtext/LexicalEditor.scss`

**Step 1: Extend the editor API**

Add a presentational prop that can express the new comment-composer mode without disturbing current read-only and toolbar behavior.

Recommended shape:

```ts
mode?: 'default' | 'plain' | 'composer';
```

Keep `showToolbar` support intact for other use cases.

**Step 2: Update runtime class composition**

When `mode === 'composer'`, apply a dedicated class path that:

- removes framed input appearance
- keeps the content area open and spacious
- makes the placeholder read like writing guidance
- preserves the current Lexical serialization and `onChange` flow

Do not add a replacement toolbar.

**Step 3: Update SCSS for the composer mode**

Add a `.lx-editor--composer` branch that:

- removes the card-like editor shell
- gives the content area larger breathing room
- softens placeholder tone
- keeps readonly and editing output in the same visual family

**Step 4: Run build**

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/richtext/LexicalEditor.tsx src/components/richtext/LexicalEditor.scss
git commit -m "feat: add lexical composer mode"
```

### Task 4: Rebuild FlightDetail comment editing around the shared variant

**Files:**
- Modify: `src/pages/Flights/FlightDetail/FlightDetail.tsx`

**Step 1: Switch the comment modal to the new modal variant**

Update the comment-editing `Modal` call site so it uses:

- the `comment-composer` modal variant
- no header
- the editor in `composer` mode

Do not change comment loading, draft state, or save logic.

**Step 2: Replace the traditional footer with the floating right-aligned action tray**

Move the current action buttons into the modal body layout so they render as:

- dark floating tray
- both actions on the right
- `Cancel` secondary
- `Save` primary

Keep existing disabled/saving states exactly as they are.

**Step 3: Run build**

Run: `npm run build`

Expected: PASS

**Step 4: Manual browser check**

Run: `npm run dev`

Check:

- `/flights/:id` comment modal opens without a header
- no top toolbar is visible
- content area feels open and borderless
- `Cancel` and `Save` sit together on the right in the dark floating tray
- save and cancel still behave normally

**Step 5: Commit**

```bash
git add src/pages/Flights/FlightDetail/FlightDetail.tsx
git commit -m "feat: refresh comment composer modal"
```

### Task 5: Final verification of the approved comment-composer refresh

**Files:**
- Verify only

**Step 1: Run verification**

Run:

```bash
npm run test:unit
npm run build
```

Expected:

- existing unit tests still pass
- application builds successfully

**Step 2: Manual regression check**

Open the flows that still use the generic modal and confirm they did not inherit the comment-composer presentation accidentally:

- `FlightDetail` description modal
- notes create-folder modal
- notes create-note modal
- import modal

**Step 3: Commit if final tweaks were needed**

```bash
git add src/components/Modal/Modal.tsx src/components/Modal/Modal.scss src/components/richtext/LexicalEditor.tsx src/components/richtext/LexicalEditor.scss src/pages/Flights/FlightDetail/FlightDetail.tsx src/lib/types/ui.ts
git commit -m "chore: finalize comment composer modal refresh"
```
