# apiFetch (axios) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch `apiFetch` helpers to axios without changing their public signatures or error semantics.

**Architecture:** Replace `fetch` calls with a configured axios instance and keep `ApiError` throwing logic in one place. Convert `HeadersInit` to a plain object and normalize axios `data` to match existing `parseBody` behavior.

**Tech Stack:** React + Vite + TypeScript, axios (new dependency)

---

### Task 1: Add axios dependency

**Files:**
- Modify: `Flight-Training/package.json`
- Modify: `Flight-Training/package-lock.json`

**Step 1: Install dependency**

Run: `cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training && npm install axios`

Expected: `package.json` and `package-lock.json` updated, `node_modules/axios` present.

### Task 2: Refactor api client internals

**Files:**
- Modify: `Flight-Training/src/lib/api/client.ts`

**Step 1: Create axios instance**

- Configure `baseURL` from existing `API_URL`
- Set `withCredentials: true`
- Set `validateStatus: () => true`

**Step 2: Map RequestInit to axios request config**

- Map: `init.method`, `init.headers`, `init.body`, `init.signal`
- Normalize headers from `HeadersInit` into a plain object.

**Step 3: Preserve body parsing + error semantics**

- Normalize response body to match current behavior (empty => `null`, string => try JSON parse, object => pass through).
- If status is not in 200..299, throw `new ApiError(status, body)`.

**Step 4: Preserve FormData behavior**

- For `apiFetchFormData*`, do not set `Content-Type`.

### Task 3: Verify

**Files:**
- (none)

**Step 1: Build**

Run: `cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training && npm run build`

Expected: TypeScript + Vite build succeeds.

