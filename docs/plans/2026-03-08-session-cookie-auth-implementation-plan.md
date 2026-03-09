# Session Cookie Auth (No Redis) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace JWT auth with session-cookie auth (no Redis) across backend + frontend, and scope flights/tracks by logged-in user.

**Architecture:** Backend uses `express-session` and authorizes via `req.session.userId`. Frontend uses cookie credentials only and bootstraps with `/auth/me`.

**Tech Stack:** NestJS (Express), TypeORM (MySQL), React (Vite), Axios.

---

### Task 1: Set up session middleware (backend)

**Files:**
- Modify: `Flight-Training-Server/src/main.ts`
- Modify: `Flight-Training-Server/package.json`
- Modify: `Flight-Training-Server/package-lock.json`
- Create: `Flight-Training-Server/src/auth/session.d.ts`

**Step 1: Add dependencies**

- Add `express-session` (and `@types/express-session`) to `Flight-Training-Server/package.json`.
- Run: `npm install`

**Step 2: Register session middleware**

Implement minimal session middleware in `Flight-Training-Server/src/main.ts`:

- `app.use(session({ secret, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: false } }))`
- Keep existing `enableCors({ credentials: true })`.

**Step 3: Type session data**

Create `Flight-Training-Server/src/auth/session.d.ts`:

- augment `express-session` `SessionData` with `userId?: number`

**Step 4: Verify build/tests**

Run:
- `npm test`
- `npm run build`

Expected: PASS.

---

### Task 2: Replace JWT auth endpoints with session endpoints (backend)

**Files:**
- Modify: `Flight-Training-Server/src/auth/auth.controller.ts`
- Modify: `Flight-Training-Server/src/auth/auth.service.ts`
- Modify: `Flight-Training-Server/src/auth/auth.module.ts`
- Delete: `Flight-Training-Server/src/auth/jwt.strategy.ts` (optional cleanup)

**Step 1: Implement endpoints**

- `POST /auth/register` returns `{ id, email }` and sets `req.session.userId`
- `POST /auth/login` returns `{ id, email }` and sets `req.session.userId`
- `POST /auth/logout` destroys session
- `GET /auth/me` returns current user from session (401 if not logged in)

**Step 2: Remove JWT-only profile**

- Remove `/auth/profile` protected by `AuthGuard('jwt')` (or repurpose to session-based `/auth/me`).

**Step 3: Verify build/tests**

Run:
- `npm test`
- `npm run build`

---

### Task 3: Add session guard + scope flights/tracks by user (backend)

**Files:**
- Create: `Flight-Training-Server/src/auth/sessionAuth.guard.ts`
- Modify: `Flight-Training-Server/src/flight/schemas/flight.schema.ts`
- Modify: `Flight-Training-Server/src/flight/flight.controller.ts`
- Modify: `Flight-Training-Server/src/flight/flight.service.ts`
- Modify (if needed): `Flight-Training-Server/src/track/track.controller.ts`
- Modify (if needed): `Flight-Training-Server/src/track/track.service.ts`

**Step 1: Implement guard**

`SessionAuthGuard`:
- allow if `req.session.userId` exists
- else throw `401`

**Step 2: Add `flights.userId`**

Add a non-nullable `userId: number` column to `Flight`.

**Step 3: Scope flight APIs**

- `GET /flight` → only returns flights for current session user
- All mutations (`PUT`, `PATCH`, `DELETE`, track upserts/uploads) must ensure the flight belongs to the session user.
- Ignore any client-sent `userId` (always override).

**Step 4: Verify build/tests**

Run:
- `npm test`
- `npm run build`

Manual smoke test (dev):
- clear DB
- register user A → create/import flights
- register/login user B → no access to user A flights

---

### Task 4: Remove refresh-token retry logic (frontend)

**Files:**
- Modify: `Flight-Training/src/lib/api/client.ts`

**Step 1: Simplify Axios client**

- Keep `withCredentials: true`
- Remove `/auth/refresh` logic and 401 retry behavior

**Step 2: Verify build**

Run:
- `npm run build`

---

### Task 5: Ensure auth bootstrap + logout clears user data (frontend)

**Files:**
- Modify: `Flight-Training/src/App.tsx`
- Modify: `Flight-Training/src/components/sidebar/Sidebar.tsx`
- Modify: `Flight-Training/src/store/flights/*` (as needed)

**Step 1: Bootstrap stays `/auth/me`**

- Keep `GET /auth/me` call on app start.

**Step 2: Logout clears flights**

- When logout succeeds (or even if it fails), clear:
  - `auth.user`
  - flights state (ids, byId, selection, etc.)

**Step 3: Verify behavior**

- Login → private pages load flights
- Logout → redirected to `/login` and flights list cleared
- Navigate to `/map` while logged out → redirect `/register`

---

### Task 6: Manual end-to-end verification

**Backend**
- Run: `npm run start:dev`
- Confirm session cookie set on login/register (DevTools → Application → Cookies)

**Frontend**
- Run: `npm run dev`
- Confirm:
  - logged-in users can access Dashboard/Flights/Map and edit flows
  - logged-out users are redirected to `/register`
  - backend restart invalidates session (next `/auth/me` returns 401)

