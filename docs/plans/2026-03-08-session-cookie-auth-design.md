# Session Cookie Auth (No Redis) — Design

**Date:** 2026-03-08

## Goal

Switch the app from JWT (Authorization: Bearer) to **session-cookie auth** so:

- Frontend does not store/refresh access tokens.
- Backend authorizes requests via `req.session.userId`.
- Flights/Tracks are scoped to the currently logged-in user.

**Non-goals**

- Cross-device persistent login across backend restarts (beyond Redis-backed session).

## Current State (Observed)

- Backend (`flight-training-server`) includes `passport-jwt` and returns `{ access_token }` from `POST /auth/login`.
- Frontend (`flight-training`) already uses `withCredentials: true` and bootstraps by calling `GET /auth/profile`.
- Vite dev proxy strips `/api/v1` and forwards to backend root (so backend routes are `/auth/*`, `/flight/*`, ...).

## Approach

### Backend (NestJS + Express)

1) Add `express-session` middleware in `src/main.ts`.
2) Auth endpoints:
   - `POST /auth/register`: create user, set `req.session.userId`, return `{ id, email }`.
   - `POST /auth/login`: validate user, set `req.session.userId`, return `{ id, email }`.
   - `POST /auth/logout`: destroy session (best-effort), return `{ ok: true }`.
   - `GET /auth/profile`: if session present, return `{ id, email }`, else `401`.
3) Add a `SessionAuthGuard` and apply it to:
   - all `flight/*` endpoints
   - all `track/*` endpoints (and any other private APIs)
4) Data scoping:
   - Add `flights.userId` column and set it server-side (ignore any client-provided userId).
   - All flight reads/writes are filtered by `{ userId: session.userId }`.
   - Track reads/writes require the flight to belong to the session user.

### Frontend (React)

1) Remove JWT/refresh logic from the Axios client:
   - no `/auth/refresh`
   - no automatic retry
2) Keep:
   - `withCredentials: true` globally
  - App bootstrap via `GET /auth/profile` (already exists)
3) On logout:
   - call `POST /auth/logout`
   - clear auth user in store (already implemented)
   - clear flights state (to avoid leaking previous user’s data after login switch)

## Cookie Policy (Dev)

- Cookie name: default `connect.sid` (from `express-session`)
- Attributes:
  - `HttpOnly: true`
  - `SameSite: 'lax'`
  - `Secure: false` in local dev over http (true in production https)

## Persist Sessions Across Backend Restarts (Redis)

To avoid losing sessions on backend restarts, use Redis-backed sessions:

- Run Redis (example):
  - `docker run -d --name flight-training-redis -p 6379:6379 redis:7-alpine`
- Set env:
  - `REDIS_URL=redis://localhost:6379`
  - `SESSION_SECRET=...`

## Migration / Data

User will clear database before using this change. No backfill is needed.

## Verification

- Manual:
  - Register → redirected into private pages, `/auth/profile` returns user.
  - Logout → private pages redirect to `/register`.
  - Backend restart → next `/auth/profile` returns 401 → redirect to `/register`.
  - Flights endpoint returns different results per user (scoped by `userId`).
