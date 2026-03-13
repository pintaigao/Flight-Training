# Session Cookie + JWT (In-Memory) Auth Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an `AUTH_MODE=session|jwt` switch (backend) and `VITE_AUTH_MODE=session|jwt` switch (frontend) so the app can run either session-cookie auth or JWT-only auth (access token stored in memory).

**Architecture:** The backend exposes the same protected APIs in both modes. A single guard reads `AUTH_MODE` and authenticates using either session (`req.session.userId`) or JWT (`Authorization: Bearer ...`), then attaches `req.user`. The frontend optionally adds an `Authorization` header from an in-memory token store when `VITE_AUTH_MODE=jwt`.

**Tech Stack:** NestJS (Express), `express-session` (session mode), JWT (HS256), React + axios (frontend client).

---

### Task 1: Add env switches and JWT signing/verifying helpers (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/main.ts`
- Create: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/jwt.ts`

**Step 1: Add `AUTH_MODE` + `JWT_SECRET` env conventions**
- `AUTH_MODE` defaults to `session` when unset
- `JWT_SECRET` defaults to a dev value when unset
- JWT exp defaults to `1h` (simple demo)

**Step 2: Implement minimal JWT helpers**

```ts
export function signAccessToken(payload: { sub: string; email: string }): string;
export function verifyAccessToken(token: string): { sub: string; email: string };
```

**Step 3: Manual verification**
- Start backend with `AUTH_MODE=jwt`, login, confirm token returned.
- Try calling a protected route without `Authorization` -> 401.
- Try calling with `Authorization: Bearer <token>` -> 200.

---

### Task 2: Make session middleware conditional (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/main.ts`

**Step 1: Gate `app.use(session(...))`**
- If `AUTH_MODE=session`: enable session middleware
- If `AUTH_MODE=jwt`: do not install session middleware

**Step 2: Manual verification**
- In jwt mode, ensure no `connect.sid` cookie is required.
- In session mode, ensure existing flows still work.

---

### Task 3: Add `AuthModeGuard` to support both modes (backend)

**Files:**
- Create: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/authMode.guard.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/sessionAuth.guard.ts`
- Modify: Controllers currently using session guard (e.g. flight controllers)

**Step 1: Implement guard logic**
- `AUTH_MODE=session`: delegate to session guard
- `AUTH_MODE=jwt`: read bearer token, verify, attach `req.user = { id, email }`

**Step 2: Update protected endpoints to use `AuthModeGuard`**
- Replace `SessionAuthGuard` usage.

**Step 3: Manual verification**
- Session mode still works.
- JWT mode works for the same routes.

---

### Task 4: Make auth endpoints return mode-specific outputs (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/auth.controller.ts`

**Step 1: `POST /auth/login` and `/auth/register`**
- Session mode: set `req.session.userId` and return `{id,email}`
- JWT mode: return `{id,email, accessToken}` without using session

**Step 2: `GET /auth/profile`**
- Session mode: read session
- JWT mode: read bearer token via the same verification helper
- Always send `no-store` headers

**Step 3: `POST /auth/logout`**
- Session mode: destroy session + clear cookie
- JWT mode: return `{ok:true}` (front end clears in-memory token)

---

### Task 5: Add frontend in-memory access token store

**Files:**
- Create: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/lib/auth/accessToken.ts`

**Step 1: Implement**

```ts
let token: string | null = null;
export function getAccessToken(): string | null;
export function setAccessToken(next: string | null): void;
export function clearAccessToken(): void;
```

**Step 2: Manual verification**
- Ensure refresh clears token (expected).

---

### Task 6: Attach Authorization header in JWT mode (frontend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/lib/api/client.ts`

**Step 1: Add request interceptor**
- If `import.meta.env.VITE_AUTH_MODE === 'jwt'` and token exists, set `config.headers.Authorization = 'Bearer ...'`

**Step 2: Manual verification**
- In jwt mode, requests include Authorization.
- In session mode, nothing changes.

---

### Task 7: Store token on login/register and clear on logout (frontend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training/src/lib/api/auth.api.ts`
- (If needed) Modify login/register pages to handle returned shape

**Step 1: Update Auth API response handling**
- Session mode: unchanged
- JWT mode: read `accessToken` from response and set in memory store

**Step 2: Manual verification**
- JWT login works without cookies.
- Refresh loses auth (expected).

---

### Task 8: Smoke test both modes end-to-end

**Commands:**
- Backend (session): `AUTH_MODE=session npm run start:dev`
- Backend (jwt): `AUTH_MODE=jwt JWT_SECRET=dev-jwt-secret npm run start:dev`
- Frontend (session): `VITE_AUTH_MODE=session npm run dev`
- Frontend (jwt): `VITE_AUTH_MODE=jwt npm run dev`

**Expected:**
- Session: refresh stays logged in (until session expires or server restarts).
- JWT (in-memory): refresh goes back to login; API works while tab remains open.
