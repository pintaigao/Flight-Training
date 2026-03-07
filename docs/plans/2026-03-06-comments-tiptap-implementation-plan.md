# Comments (single field) + TipTap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the three comment fields with a single `comments` rich-text field stored in MySQL, edited via TipTap in FlightDetail.

**Architecture:** Store TipTap output as an HTML string in `flights.comments` (MySQL `LONGTEXT`). Frontend edits via TipTap and persists via existing `PUT /flight/:id`.

**Tech Stack:** React + Vite + TS, NestJS + TypeORM + MySQL, TipTap (`@tiptap/react`, `@tiptap/starter-kit`).

---

### Task 1: Backend schema + DTO switch to string comments

**Files:**

- Modify: `Flight-Training-Server/src/flight/schemas/flight.schema.ts`
- Modify: `Flight-Training-Server/src/flight/dto/flight.dto.ts`
- Verify: `Flight-Training-Server/src/flight/flight.service.ts` (no JSON assumptions)

**Steps:**

1. Change `comments` column from `json` to `longtext` and type to `string`.
2. Update `UpsertFlightDto.comments` to `string`.
3. Run `npm test` in `Flight-Training-Server` (should pass).

---

### Task 2: Frontend store types + reducer for string comments

**Files:**

- Modify: `Flight-Training/src/store/types.ts`
- Modify: `Flight-Training/src/store/reducer.ts`
- Modify: `Flight-Training/src/store/seed.ts`
- Verify: `Flight-Training/src/lib/api/flight.api.ts` request types compile

**Steps:**

1. Replace `FlightComments` object type with `string` on `Flight.comments`.
2. Simplify action to `SET_COMMENTS` or keep `UPDATE_COMMENTS` but accept `string` and set directly.
3. Update seed flights to `comments: ''`.
4. Run `npm run build` in `Flight-Training`.

---

### Task 3: TipTap editor in FlightDetail + move Save button under Comments

**Files:**

- Modify: `Flight-Training/src/pages/Flights/FlightDetail/FlightDetail.tsx`
- (Optional) Add: `Flight-Training/src/components/richtext/TipTapEditor.tsx`
- Modify: `Flight-Training/src/pages/Flights/FlightDetail/FlightDetail.scss`
- Modify: `Flight-Training/package.json` (add TipTap deps)

**Steps:**

1. Add TipTap dependencies and minimal editor styling.
2. Replace three textarea cards with a single `Comments` card using TipTap.
3. Wire editor `onUpdate` to store `comments` as HTML string in the global store.
4. Move “Save to Database” button under the editor inside the Comments card.
5. Run `npm run build` in `Flight-Training`.

---

### Task 4: DB reset instructions (drop + recreate)

**Files:**

- Modify: `Flight-Training-Server/README.md` (optional) or provide commands in handoff message

**Steps:**

1. Identify MySQL database name from server config.
2. Provide exact `DROP DATABASE ...; CREATE DATABASE ...;` commands for user to run.
