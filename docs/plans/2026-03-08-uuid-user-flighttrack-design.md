# UUID IDs (User + FlightTrack) — Design

**Date:** 2026-03-08

## Goal

Improve ID uniqueness by switching:

- `User.id` from auto-increment integer to UUID string
- `FlightTrack.id` from auto-increment integer to UUID string

while **keeping**:

- `Flight.id` as the existing readable string (e.g. `f-2025-...`)

## Constraints / Assumptions

- Database will be cleared; no migration/backfill required.
- Session auth is in use; `req.session.userId` must match the new UUID type.
- MySQL + TypeORM `synchronize: true` is enabled in dev.

## Data Model Changes

### Users

- `User.id`: `uuid` primary key (TypeORM: `@PrimaryGeneratedColumn('uuid')`)
- Type in code: `string`

### Flights

- `Flight.userId`: change from `int` to `varchar(36)` (or equivalent) storing the user’s UUID
- Type in code: `string`

### FlightTracks

- `FlightTrack.id`: `uuid` primary key (TypeORM: `@PrimaryGeneratedColumn('uuid')`)
- Type in code: `string`
- `FlightTrack.flightId` stays as `string` referencing `Flight.id`

## API / Frontend Impact

- Auth endpoints continue returning `{ id: string, email: string }` (already matches frontend types).
- Flight endpoints unchanged at the URL layer (`/flight/:id` still uses `Flight.id`).
- No frontend routing changes needed.

## Verification

- Register/login returns UUID `id` string.
- Creating/importing flights sets `Flight.userId` to the session UUID.
- `GET /flight` returns only the logged-in user’s flights.
- `npm test` and `npm run build` pass in the backend.

