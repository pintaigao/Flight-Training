# Notes Action Card Copy Tweak Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the two Notes action card labels by removing subtitles and shortening the note label.

**Architecture:** Update only the action-card text nodes in `Notes.tsx` and keep all existing behavior unchanged.

**Tech Stack:** React, TypeScript, Tailwind utility classes

---

### Task 1: Update action card copy

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Notes/Notes.tsx`

**Step 1: Remove subtitles**

- delete the helper text under both action cards

**Step 2: Shorten note label**

- change `Add new note` to `Add Note`

### Task 2: Verify

**Files:**
- N/A

**Step 1: Run frontend build**

Run: `npm run build`

Expected: PASS
