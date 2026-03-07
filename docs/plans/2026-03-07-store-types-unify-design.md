# Store Types Cleanup: Remove `rootTypes.ts`

## Summary

Simplify `src/store` by removing the extra indirection file `rootTypes.ts` and making `src/store/types.ts` the single “public” module for store types.

## Goals

- Reduce file hopping and boilerplate re-exports.
- Keep runtime behavior unchanged (types-only refactor).
- Keep external imports stable (`@/store/types` remains the canonical import path).

## Non-goals

- Changing store state shape, actions, or reducer logic.
- Splitting the store into multiple providers.

## Design

- Move the root type definitions into `src/store/types.ts`:
  - `AppState`
  - `Action`
  - re-export `Flight` (and other slice types) from their slice modules
- Delete `src/store/rootTypes.ts`.
- Update all internal imports that referenced `rootTypes.ts` to import from `types.ts` instead:
  - `src/store/rootReducer.ts`
  - `src/store/*/reducer.ts`

## Verification

- `npm run build` succeeds.
- No remaining imports of `rootTypes.ts`.

