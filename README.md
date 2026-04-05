# Flight Log Web (MVP)

React + useReducer flight logbook with a map (Leaflet) and per-flight comments.

## Features

- Real login via NestJS backend (Register / Login / Logout) using HttpOnly cookies
- Dashboard: stats + recent flights + mini map preview
- Flights list: search + filter
- Flight detail: map + 3-part debrief (Well / Improve / Notes) + GPX import
- Map explorer: all tracks + quick focus + "View Details"

## Tech

- Vite + React + TypeScript
- react-router-dom
- react-leaflet + leaflet
- @tmcw/togeojson for GPX → GeoJSON

## Run locally

1. Install deps

```bash
npm install
```

2. Start dev server

```bash
npm run dev
```

Open http://localhost:5173

## GPX import

Open a flight detail page and click **Import GPX Track**.

Flights/comments are stored in `localStorage` for now (so your notes persist).

## Backend auth

This app supports both session cookies and `AUTH_MODE=jwt` (access token + refresh cookie).

### API origin (dev)

By default, the frontend calls the API under `/api/v1` on the same origin. For local dev, set:

```bash
VITE_API_URL=http://localhost:3000
```

In this repo, it already exists in `.env.development.local`.

Endpoints expected:

- `POST /auth/register` -> returns `{ id, email }` and sets cookies
- `POST /auth/login` -> returns `{ id, email }` and sets cookies
- `POST /auth/google` -> returns `{ id, email }` (and `accessToken` in jwt mode)
- `POST /auth/logout` -> clears cookies
- `GET /auth/profile` -> returns `{ id, email }` if logged in
- `POST /auth/refresh` (optional) -> refresh cookies

### Google login

Set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth Web Client ID (must match the backend):

```bash
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```
