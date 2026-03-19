# Notes Delete Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add explicit trash-button deletion for notes and folders in the Notes workspace, with confirm modals and correct URL/navigation behavior.

**Architecture:** Extend the existing Notes REST API with single-note deletion, then simplify the Notes page so destructive actions come from dedicated trash buttons instead of breadcrumb arming. Reuse the shared confirm modal and existing URL-state navigation helpers.

**Tech Stack:** React, React Router, Tailwind utility classes, NestJS, TypeORM, Jest

---

### Task 1: Add failing backend note-delete tests

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/note/note.service.spec.ts`

**Step 1: Write the failing test**

Add tests for:
- deleting an owned note returns its ids
- deleting a missing note returns `null`

**Step 2: Run test to verify it fails**

Run: `npm test -- note.service.spec.ts`

Expected: FAIL because `deleteNote` does not exist yet.

### Task 2: Implement backend single-note delete

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/note/note.service.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/note/note.controller.ts`

**Step 1: Write minimal implementation**

- add `deleteNote(userId, id)`
- add `DELETE /note/:id`
- return 404 when the note is missing or not owned

**Step 2: Run backend tests**

Run: `npm test -- note.service.spec.ts`

Expected: PASS

### Task 3: Add frontend delete-note API types

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/lib/types/note.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/lib/api/note.api.ts`

**Step 1: Add response type**

- create `DeleteNoteResult`
- add `deleteNote(id)` API wrapper

**Step 2: Keep type usage aligned**

- update imports in `Notes.tsx` after the UI change

### Task 4: Replace Notes delete UX with confirm modals

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Notes/Notes.tsx`
- Use: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/components/Modal/ConfirmModal.tsx`

**Step 1: Remove old breadcrumb delete-arm flow**

- remove `armedDeleteCategoryId`
- make breadcrumb labels plain text again

**Step 2: Add confirm-modal state**

- add modal state for deleting the current folder
- add modal state for deleting the selected note
- add in-flight disable state

**Step 3: Wire trash buttons**

- root view: keep `+ Note`
- folder view: swap the secondary left button to `Trash`
- note editor header: replace `...` with `Trash`

**Step 4: Wire deletion behavior**

- folder confirm calls `deleteNoteCategory`
- note confirm calls `deleteNote`
- folder delete navigates to parent
- note delete clears the selected note from URL and local state

### Task 5: Verify

**Files:**
- N/A

**Step 1: Run backend tests**

Run: `npm test -- note.service.spec.ts`

Expected: PASS

**Step 2: Run backend build**

Run: `npm run build`

Expected: PASS

**Step 3: Run frontend build**

Run: `npm run build`

Expected: PASS
