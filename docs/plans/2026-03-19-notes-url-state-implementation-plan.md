# Notes URL State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/notes` restore the active folder and note from query-string state so refreshes return to the same Notes context.

**Architecture:** Use React Router query params as the source of truth for `category` and `note`. Keep the existing two-pane Notes workspace, but derive current folder selection, breadcrumb path, and active note from the URL instead of local navigation state.

**Tech Stack:** React 18, React Router 6, TypeScript, Vite

---

### Task 1: Add query-string driven Notes state

**Files:**
- Modify: `src/pages/Notes/Notes.tsx`

**Step 1: Read URL params**

Use React Router search params to derive:
- `currentFolderId`
- `selectedNoteId`

**Step 2: Replace local folder navigation state**

Remove the local `folderStack` navigation state and rebuild:
- current folder name
- breadcrumb path
- back navigation target

from the categories tree plus the `category` query param.

**Step 3: Update click handlers**

Rewrite folder, note, back, and create-note selection flows to update the URL instead of local selection state.

---

### Task 2: Validate deep links

**Files:**
- Modify: `src/pages/Notes/Notes.tsx`

**Step 1: Validate `category`**

After loading categories, ensure the requested category exists.

**Step 2: Validate `note`**

After loading notes for the addressed folder, ensure the requested note exists in that folder’s list.

**Step 3: Redirect invalid links**

When validation fails:
- show an inline error
- redirect back to `/notes`

---

### Task 3: Verify behavior

**Files:**
- Verify only

**Step 1: Build**

Run:

```bash
npm run build
```

Expected:
- TypeScript passes
- Vite build succeeds

**Step 2: Manual Notes checks**

Verify:
- selecting a folder updates `category`
- selecting a note updates `note`
- refreshing preserves folder/note context
- invalid deep links redirect to `/notes` with an error banner
