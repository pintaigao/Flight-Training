# HTTP Client (axios instance) Design

**Date:** 2026-03-05

## Goal

Replace `apiFetch`-style wrappers with a single configured `axios` instance (`http`) and migrate all API calls to use `http.get/post/put/delete(...)`.

## Non-goals

- No new retry/backoff logic.
- No auth/token header logic beyond existing behavior (cookie-based via credentials).

## Error + Refresh Semantics

- Always send cookies:
  - In axios: `withCredentials: true`.
- Default `Content-Type: application/json` for non-`FormData` requests (do not set for `FormData`).
- Response body parsing behavior matches the previous `parseBody(res)` behavior:
  - Empty body => `null`
  - Text body => try `JSON.parse`, else return raw text
  - JSON/object => return as-is
- Non-2xx response must reject with `ApiError(status, body)` where `body` is parsed as above.
- Global 401 behavior:
  - For non-auth endpoints, on HTTP 401: POST `/auth/refresh` once and retry the original request once.
  - Skip auto-refresh for `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh` to avoid loops.
  - Coalesce concurrent refresh attempts via a single in-flight refresh promise.

## Implementation Notes

- Export `http` from `src/lib/api/client.ts`.
- Implement the refresh+retry + `ApiError` behavior via axios interceptors.
- For FormData uploads, let the browser/axios set multipart boundaries.
