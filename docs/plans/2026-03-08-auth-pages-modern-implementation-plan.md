# Auth Pages (Login/Register) — Modern UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize Login/Register UI (centered card + modern background + labeled fields + show/hide password) without changing auth logic.

**Architecture:** Pure presentational updates in the two pages with Tailwind utility classes; `Auth.scss` remains as a placeholder.

**Tech Stack:** React, Tailwind utility classes, existing CSS variables theme.

---

### Task 1: Update Login page UI

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Auth/Login.tsx`

**Step 1: Add show/hide password state**

- Add `showPassword` state and toggle button next to the password input.

**Step 2: Update layout**

- Add background gradient/glow layers.
- Update card spacing, typography, and button layout.
- Add labels + `id`/`htmlFor`.

**Step 3: Build**

Run:
- `npm run build`

Expected: PASS.

---

### Task 2: Update Register page UI

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/pages/Auth/Register.tsx`

**Step 1: Add show/hide password state**

- Add `showPassword` and `showConfirm` toggles.

**Step 2: Update layout**

- Mirror Login layout (background/card/actions).
- Add labels + `id`/`htmlFor`.

**Step 3: Build**

Run:
- `npm run build`

Expected: PASS.

