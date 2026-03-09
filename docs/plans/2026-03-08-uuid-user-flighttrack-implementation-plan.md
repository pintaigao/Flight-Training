# UUID IDs (User + FlightTrack) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Switch `User.id` and `FlightTrack.id` to UUIDs and update flight ownership (`Flight.userId`) to store UUID strings, without changing `Flight.id`.

**Architecture:** TypeORM `uuid` primary keys for user + track. Session auth stores `req.session.userId` as UUID string; flight queries filter by that string.

**Tech Stack:** NestJS (Express), TypeORM (MySQL), React (no changes expected).

---

### Task 1: Update User primary key to UUID (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/user/schemas/user.schema.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/user/user.service.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/session.d.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/auth/auth.controller.ts`

**Step 1: Change `User.id`**

- Switch to `@PrimaryGeneratedColumn('uuid')`
- Change type to `string`

**Step 2: Update user service types**

- `findById(id: string)`

**Step 3: Update session typing**

- `SessionData.userId?: string`

**Step 4: Build**

Run:
- `npm run build`

Expected: PASS.

---

### Task 2: Update Flight ownership to UUID string (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/flight/schemas/flight.schema.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/flight/flight.service.ts`
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/flight/flight.controller.ts`

**Step 1: Change `Flight.userId` column**

- change from `int` to `varchar(36)`
- change TS type from `number` → `string`

**Step 2: Update service/controller signatures**

- Replace `userId: number` with `userId: string`

**Step 3: Tests + build**

Run:
- `npm test`
- `npm run build`

Expected: PASS.

---

### Task 3: Update FlightTrack primary key to UUID (backend)

**Files:**
- Modify: `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training-Server/src/flight/schemas/flightTrack.schema.ts`

**Step 1: Switch primary key**

- change `@PrimaryGeneratedColumn()` → `@PrimaryGeneratedColumn('uuid')`
- type `id: string`

**Step 2: Tests + build**

Run:
- `npm test`
- `npm run build`

Expected: PASS.

---

### Task 4: Frontend sanity check

**Files:**
- None expected

**Step 1: Build**

Run:
- `npm run build` in `/Users/pintaigaohe-mini/Documents/Projects/Flight-Training`

Expected: PASS.

**Step 2: Manual**

- Register → confirm returned `user.id` looks like UUID
- Import KML → confirm flights remain visible after logout/login as same user

