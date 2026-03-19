# Notes Action Card Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move Notes create actions into two large action cards below the header and place folder deletion in the title row.

**Architecture:** Keep existing Notes data flow and delete modals intact. Only reshape the left header/action section in `Notes.tsx` by removing the top-right button cluster, adding a title-row trash button for folder delete, and replacing the single large note card with a two-card responsive action grid.

**Tech Stack:** React, TypeScript, Tailwind utility classes

---

### Task 1: Update header structure

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Notes/Notes.tsx`

**Step 1: Remove top-right action buttons**

- delete the top `Folder` and `+ Note` button cluster

**Step 2: Move folder delete control**

- add the folder trash icon to the title row
- only show it when `currentFolderId` exists

### Task 2: Add action card grid

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Notes/Notes.tsx`

**Step 1: Replace the single note card**

- change the one-card block into a responsive two-card grid

**Step 2: Keep behavior unchanged**

- left card opens folder modal
- right card opens note modal

### Task 3: Verify

**Files:**
- N/A

**Step 1: Run frontend build**

Run: `npm run build`

Expected: PASS
