# Flight Log Web (MVP)

React + useReducer flight logbook with a map (Leaflet) and per-flight comments.

## Features
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

The app stores state in `localStorage` (so your notes persist).
