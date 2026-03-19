# Action/State Centralization Design

**Context**
- We already centralized named `type` aliases under `src/lib/types`.
- The remaining friction is that reducer/store-related `Action` and `State` types are still split across domain files.

**Decision**
- Move reducer/store-related action unions into `src/lib/types/actions.ts`.
- Move reducer/store-related state shapes into `src/lib/types/state.ts`.
- Keep page-local or domain-local state names such as `SaveState` in their existing domain files.

**Boundaries**
- `actions.ts`: `AuthAction`, `FlightsAction`, `UiAction`, `Action`
- `state.ts`: `AuthStatus`, `AuthState`, `FlightsState`, `UIState`, `AppState`
- `store.ts`: keep only `Store`
- `auth.ts`, `flight.ts`, `ui.ts`: retain domain/entity/helper types only

**Why this split**
- Reducer-facing types become easy to find in one place.
- Domain files stay focused on entities and API shapes.
- We avoid over-centralizing page-local state that is not part of the global store contract.

**Impact**
- Store reducers and initial-state files will switch imports from domain files to `actions.ts` / `state.ts`.
- Domain/API/component files that use non-store types will keep importing from `auth.ts`, `flight.ts`, `note.ts`, and `ui.ts`.
