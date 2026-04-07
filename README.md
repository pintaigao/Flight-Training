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

This app supports both session cookies and `AUTH_MODE=jwt` directly against `Flight-Training-Server`.

### API origin (dev)

By default, the frontend calls the API under `/api/v1` on the same origin. In this repo, local development uses a single env file:

```bash
/.env.development.local
```

Recommended contents:

```bash
VITE_AUTH_MODE=session
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

`VITE_AUTH_MODE` must match `Flight-Training-Server` `AUTH_MODE`:

- `session` -> browser uses server session cookies
- `jwt` -> browser uses server-issued access token plus refresh cookie

Endpoints expected from `Flight-Training-Server`:

- `POST /auth/register` -> returns `{ id, email }` and in jwt mode also returns `accessToken`
- `POST /auth/login` -> returns `{ id, email }` and in jwt mode also returns `accessToken`
- `POST /auth/google` -> returns `{ id, email }` (and `accessToken` in jwt mode)
- `POST /auth/logout` -> clears cookies
- `GET /auth/profile` -> returns `{ id, email }` if logged in
- `POST /auth/refresh` -> returns `{ accessToken }` in jwt mode

### Google login

Set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth Web Client ID (must match the backend):

```bash
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```
