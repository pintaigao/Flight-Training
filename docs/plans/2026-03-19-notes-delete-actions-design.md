# Notes Delete Actions Design

## Goal

Make note and folder deletion feel direct and obvious in the Notes workspace:

- the right-side note action becomes a trash button that deletes the selected note
- the left-side secondary action becomes a trash button when viewing a folder and deletes the current folder
- both destructive actions use a confirm modal

## UX

- In the root Notes view, the left header actions remain `Folder` and `+ Note`.
- Inside a folder, the left header actions become `Folder` and `Trash`.
- The right editor header shows a trash button when a note is selected.
- Breadcrumbs return to being plain navigation context only; they no longer arm deletion.
- Deleting a folder asks for confirmation, then deletes the folder tree recursively and returns to the parent folder (or `/notes` for a top-level folder).
- Deleting a note asks for confirmation, then stays in the current folder and clears the selected `note` query parameter.

## API

- Reuse existing `DELETE /note/categories/:id` for recursive folder deletion.
- Add `DELETE /note/:id` for deleting a single owned note.
- Return the deleted note id and category id so the frontend can update local state safely.

## Frontend Structure

- `src/pages/Notes/Notes.tsx`
  - remove breadcrumb delete-arm state
  - add confirm modal state for `delete-folder` and `delete-note`
  - switch the left secondary action based on `currentFolderId`
  - replace the right header `...` button with a trash button
- `src/lib/api/note.api.ts`
  - add `deleteNote(id)`
- `src/lib/types/note.ts`
  - add delete-note response type
- `src/components/Modal/ConfirmModal.tsx`
  - reuse existing modal component; no new modal system needed

## Error Handling

- Failed note delete shows the existing inline Notes error banner.
- Failed folder delete does the same.
- Confirm buttons disable while the request is in flight to prevent duplicate submissions.

## Testing

- Backend: add service tests for deleting an owned note and rejecting deletion of a missing note.
- Frontend: no frontend test harness exists in this repo, so verify with `npm run build` and manual UI flow.
