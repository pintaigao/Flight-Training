# Notes Breadcrumb Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add breadcrumb-triggered recursive folder deletion to Notes, with frontend URL reset and backend subtree deletion.

**Architecture:** Extend the Notes backend with a recursive category-tree delete operation and expose it via `DELETE /note/categories/:id`. On the frontend, add a one-item-at-a-time armed delete state for breadcrumb folders and navigate to the deleted folder’s parent after success.

**Tech Stack:** React 18, React Router 6, NestJS, TypeORM, Jest

---

### Task 1: Add failing backend tests

**Files:**
- Modify: `Flight-Training-Server/src/note/note.service.spec.ts`

**Step 1: Add recursive delete test**

Add a test covering:
- root category
- child category
- notes in both categories
- recursive deletion result

**Step 2: Run note service test to verify it fails**

Run:

```bash
cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server
npm test -- note.service.spec.ts
```

Expected:
- fail because recursive delete method does not exist yet

---

### Task 2: Implement backend recursive delete

**Files:**
- Modify: `Flight-Training-Server/src/note/note.service.ts`
- Modify: `Flight-Training-Server/src/note/note.controller.ts`
- Modify: `Flight-Training-Server/src/note/dto/note.dto.ts` (only if a response/helper type is needed elsewhere)

**Step 1: Add service method**

Implement a method that:
- finds the owned root category
- gathers all descendant category ids
- finds notes belonging to those categories
- deletes notes first, then categories
- returns deleted ids plus `parentId`

**Step 2: Add controller route**

Add:

```ts
@Delete('categories/:id')
```

Return 404 when the category is missing or not owned by the current user.

**Step 3: Run note service test to verify it passes**

Run:

```bash
cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server
npm test -- note.service.spec.ts
```

Expected:
- pass

---

### Task 3: Implement breadcrumb delete UI

**Files:**
- Modify: `Flight-Training/src/lib/api/note.api.ts`
- Modify: `Flight-Training/src/lib/types/note.ts`
- Modify: `Flight-Training/src/pages/Notes/Notes.tsx`

**Step 1: Add delete API client**

Create a typed client for `DELETE /note/categories/:id`.

**Step 2: Add armed breadcrumb state**

Track:
- which breadcrumb category is armed for deletion
- which category is currently being deleted

**Step 3: Wire delete flow**

On successful delete:
- clear armed state
- clear selected note
- navigate to the deleted category’s parent using query params
- refresh categories and notes through existing page flow

---

### Task 4: Verify end-to-end behavior

**Files:**
- Verify only

**Step 1: Verify backend tests**

Run:

```bash
cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server
npm test -- note.service.spec.ts
```

**Step 2: Verify backend build**

Run:

```bash
cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server
npm run build
```

**Step 3: Verify frontend build**

Run:

```bash
cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training
npm run build
```
