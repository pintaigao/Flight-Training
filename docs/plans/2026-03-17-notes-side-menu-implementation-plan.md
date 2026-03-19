# Notes Side Menu + Route Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new `Notes` item in the left sidebar that navigates to a placeholder `/notes` page.

**Architecture:** Treat `Notes` as another private route under `RequireAuth + MainLayout`. The page is a simple placeholder component for now; backend integration can be added later.

**Tech Stack:** React 18, React Router v6 (`createBrowserRouter`), Vite, Tailwind, `lucide-react`.

---

### Task 1: Add Notes placeholder page

**Files:**
- Create: `src/pages/Notes/Notes.tsx`

**Step 1: Implement placeholder page**
- Render a page title (`Notes`) and a short “coming soon” style message.

**Step 2: Manual check**
- Navigate to `/notes` after wiring routing (Task 2).

---

### Task 2: Add `/notes` route

**Files:**
- Modify: `src/router/index.tsx`

**Step 1: Add route**
- Import `Notes` page.
- Add `{ path: '/notes', element: <Notes /> }` under the private layout routes.

**Step 2: Verify build**
- Run: `npm run build`
- Expected: exits `0`

---

### Task 3: Add sidebar nav item

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`

**Step 1: Add nav link**
- Add `{ to: '/notes', label: 'Notes', icon: <a lucide icon> }` to `nav`.

**Step 2: Manual check**
- Start: `npm run dev`
- Expected: Sidebar shows `Notes`, and clicking it routes to `/notes` and highlights as active.

