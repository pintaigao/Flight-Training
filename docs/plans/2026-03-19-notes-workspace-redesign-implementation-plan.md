# Notes Workspace Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `/notes` into a full-bleed workspace and make notes directly editable with autosave.

**Architecture:** Extend the existing Notes page instead of creating a parallel route. Update `MainLayout` so `/notes` opts into the same full-bleed content treatment as `/map`, then refactor `Notes.tsx` into a productivity-style two-pane layout. Add a frontend `patchNote` API and local draft/autosave state so the selected note edits in place.

**Tech Stack:** React 18, React Router, Tailwind utility classes, Axios API client, Lexical editor.

---

### Task 1: Make `/notes` full-bleed

**Files:**
- Modify: `src/components/layout/MainLayout.tsx`

**Step 1: Treat `/notes` like another full-bleed workspace**
- Add route-aware layout logic so `/notes` removes the centered `max-w-6xl` wrapper and large page padding.

**Step 2: Verify behavior**
- Build the app and confirm `/notes` can span the full content width to the right of the global sidebar.

---

### Task 2: Add note patch API

**Files:**
- Modify: `src/lib/api/note.api.ts`

**Step 1: Add `patchNote()`**
- Create a typed helper for `PATCH /note/:id` with partial updates for `title`, `content`, `categoryId`, and `contentFormat`.

**Step 2: Keep existing Notes types aligned**
- Reuse current `Note` / `NoteCategory` types and avoid duplicate shape definitions elsewhere.

---

### Task 3: Rebuild Notes workspace

**Files:**
- Modify: `src/pages/Notes/Notes.tsx`

**Step 1: Replace current card-heavy layout**
- Build a cleaner two-pane workspace closer to the provided reference, while keeping current folder drill-down behavior.

**Step 2: Add direct editing state**
- Track selected note draft state locally for `title` and `content`.
- Update the right pane so the selected note is editable by default.

**Step 3: Add debounced autosave**
- Patch note changes after a short delay and surface `Saving...`, `Saved`, and save errors in the editor area.

**Step 4: Keep folder navigation behavior**
- Selecting a folder clears the active note and leaves the right pane empty/minimal.

---

### Task 4: Verify

**Files:**
- Modify: none

**Step 1: Run build**
- Run: `npm run build`
- Expected: exits `0`

**Step 2: Manual sanity checks**
- Confirm note selection opens editable content.
- Confirm typing updates the note and survives a refresh.

