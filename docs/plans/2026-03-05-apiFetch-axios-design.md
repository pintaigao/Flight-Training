# apiFetch (axios) Design

**Date:** 2026-03-05

## Goal

Replace the internal implementation of the frontend `apiFetch` helpers from `fetch` to `axios` while keeping the **public signature and calling semantics unchanged**:

- `apiFetch<T>(path: string, init?: RequestInit): Promise<T>`
- `apiFetchWithRefresh<T>(path: string, init?: RequestInit): Promise<T>`
- `apiFetchFormData<T>(path: string, formData: FormData, init?: RequestInit): Promise<T>`
- `apiFetchFormDataWithRefresh<T>(path: string, formData: FormData, init?: RequestInit): Promise<T>`

## Non-goals

- No changes to call sites.
- No new retry/backoff logic.
- No auth/token header logic beyond existing behavior (cookie-based via credentials).

## API + Error Semantics (Must Match Current)

- Always send cookies (existing: `credentials: 'include'`).
  - In axios: `withCredentials: true`.
- `apiFetch` defaults to `Content-Type: application/json` while still allowing caller overrides.
- Response body parsing behavior matches `parseBody(res)`:
  - Empty body => `null`
  - Text body => try `JSON.parse`, else return raw text
  - JSON/object => return as-is
- Non-2xx response must throw `new ApiError(status, body)` where `body` is parsed as above.
  - Required so `apiFetchWithRefresh` continues to work by checking `e.status === 401`.

## Mapping `RequestInit` to Axios

Only the commonly-used `RequestInit` fields are mapped:

- `method` -> axios `method`
- `headers` -> axios `headers` (normalize `HeadersInit` to a plain object)
- `body` -> axios `data`
- `signal` -> axios `signal` (AbortController)

Other `RequestInit` fields are ignored (not applicable in axios/browser anyway).

## Implementation Notes

- Use a single axios instance configured with:
  - `baseURL: API_URL`
  - `withCredentials: true`
  - `validateStatus: () => true` so we can implement the existing “throw ApiError on non-2xx” logic ourselves.
- For FormData helpers, do not set `Content-Type`; let the browser/axios set multipart boundaries.

