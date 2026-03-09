# Store Types Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove `src/store/rootTypes.ts` and make `src/store/types.ts` the single source of truth for `AppState` and `Action`.

**Architecture:** Keep slice type modules (`auth/*`, `flights/*`, `ui/*`) unchanged. Define `AppState`/`Action` in `src/store/types.ts`, update internal imports, and delete the redundant file.

**Tech Stack:** React + TypeScript

---

### Task 1: Add implementation plan doc

**Files:**
- Create: `docs/plans/2026-03-07-store-types-unify-implementation-plan.md`

**Step 1: Commit**

```bash
git add docs/plans/2026-03-07-store-types-unify-implementation-plan.md
git commit -m "docs: store types cleanup implementation plan"
```

### Task 2: Move root types into `types.ts`

**Files:**
- Modify: `src/store/types.ts`
- Delete: `src/store/rootTypes.ts`

**Step 1: Update `types.ts`**

- Keep `export * from './auth/types'`, `./flights/types`, `./ui/types'`.
- Add `AppState` and `Action` definitions (previously in `rootTypes.ts`).
- Re-export `Flight` from `./flights/types`.

**Step 2: Delete `rootTypes.ts`**

**Step 3: Run build**

Run: `npm run build`  
Expected: FAIL until imports are updated.

**Step 4: Commit**

```bash
git add src/store/types.ts src/store/rootTypes.ts
git commit -m "refactor(store): define AppState and Action in types"
```

### Task 3: Update imports from `rootTypes` to `types`

**Files:**
- Modify: `src/store/rootReducer.ts`
- Modify: `src/store/auth/reducer.ts`
- Modify: `src/store/flights/reducer.ts`
- Modify: `src/store/ui/reducer.ts`

**Step 1: Update imports**

- Replace `../rootTypes` / `./rootTypes` imports with `../types` / `./types`.

**Step 2: Run build**

Run: `npm run build`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/store/rootReducer.ts src/store/auth/reducer.ts src/store/flights/reducer.ts src/store/Modal/reducer.ts
git commit -m "chore(store): remove rootTypes imports"
```

