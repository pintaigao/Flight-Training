# HTTP Client (axios instance) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Export a configured axios instance (`http`) and migrate API modules to use `http.get/post/put/delete(...)` instead of `apiFetch`.

**Architecture:** Use a single axios instance with interceptors to normalize response bodies, throw `ApiError` on non-2xx, and auto refresh+retry once on 401 (skipping auth endpoints to avoid loops).

**Tech Stack:** React + Vite + TypeScript, axios (new dependency)

---

### Task 1: Add axios dependency

**Files:**

- Modify: `Flight-Training/package.json`
- Modify: `Flight-Training/package-lock.json`

**Step 1: Install dependency**

Run: `cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training && npm install axios`

Expected: `package.json` and `package-lock.json` updated, `node_modules/axios` present.

### Task 2: Export `http` axios instance + interceptors

**Files:**

- Modify: `Flight-Training/src/lib/api/client.ts`

**Step 1: Create axios instance (`http`)**

- Configure `baseURL` from existing `API_URL`
- Set `withCredentials: true`
- Set `validateStatus: () => true`

**Step 2: Add request interceptor**

- Default `Content-Type: application/json` for non-`FormData` requests.

**Step 3: Add response interceptor**

- Normalize response body to match current behavior (empty => `null`, string => try JSON parse, object => pass through).
- If status is not in 200..299, throw `new ApiError(status, body)`.
- If status is 401 and request is not an auth endpoint, POST `/auth/refresh` once (coalesced) and retry original request once.

### Task 3: Migrate API modules to `http.*`

**Files:**

- Modify: `Flight-Training/src/lib/api/auth.api.ts`
- Modify: `Flight-Training/src/lib/api/flight.api.ts`
- Modify: `Flight-Training/src/lib/api/track.api.ts`

**Step 1: Replace imports**

- Replace `{ apiFetch... }` imports with `{ http }`.

**Step 2: Replace calls**

- Convert `apiFetch*` calls to `http.get/post/put/delete(...)` and return `res.data`.
- For JSON bodies, pass objects directly.
- For uploads, pass `FormData` directly.

### Task 4: Verify

**Files:**

- (none)

**Step 1: Build**

Run: `cd /Users/pintaigaohe-mini/Documents/Projects/Flight-Training && npm run build`

Expected: TypeScript + Vite build succeeds.
