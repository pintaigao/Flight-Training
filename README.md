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

1) Install deps
```bash
npm install
```

2) Start dev server
```bash
npm run dev
```

Open http://localhost:5173

## GPX import
Open a flight detail page and click **Import GPX Track**.

Flights/comments are stored in `localStorage` for now (so your notes persist).

## Backend auth

1) Create `.env.local` from `.env.example` and point it to your NestJS API:

```bash
cp .env.example .env.local
```

2) Make sure your backend sets **HttpOnly cookies** and enables CORS with `credentials: true`.

Endpoints expected:
- `POST /auth/register` -> returns `{ id, email }` and sets cookies
- `POST /auth/login` -> returns `{ id, email }` and sets cookies
- `POST /auth/logout` -> clears cookies
- `GET /auth/me` -> returns `{ id, email }` if logged in
- `POST /auth/refresh` (optional) -> refresh cookies
