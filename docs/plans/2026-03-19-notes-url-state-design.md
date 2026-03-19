# Notes URL State Design

## Goal

Keep `/notes` as a single workspace page while persisting the active folder and note in the URL so refreshes restore the same context.

## URL Shape

- Folder only: `/notes?category=<categoryId>`
- Folder + note: `/notes?category=<categoryId>&note=<noteId>`
- Root note: `/notes?note=<noteId>`
- Root list: `/notes`

## Source of Truth

- The query string becomes the source of truth for the active folder and selected note.
- The page derives `currentFolderId` and `selectedNoteId` from the URL instead of keeping separate navigation state.
- Folder breadcrumbs are reconstructed from the category tree returned by `GET /note/categories`.

## Validation

- If `category` does not exist, the page shows an error and redirects back to `/notes`.
- If `note` does not exist in the currently addressed folder, the page shows an error and redirects back to `/notes`.
- This intentionally treats mismatched `note` + `category` combinations as invalid deep links.

## Interaction Rules

- Clicking a folder updates only `category` and clears `note`.
- Clicking Back moves to the parent folder by rewriting `category`; at root it clears both params.
- Clicking a note updates `note` and preserves the current `category`.
- Creating a note selects it by writing its id into the URL after creation.

## Error Handling

- Invalid URL-state errors use the existing inline error banner in the left pane.
- Normal load/save errors continue to use the same inline surface.

## Testing

- Refresh on `/notes?category=...&note=...` restores the same folder and note.
- Refresh on `/notes?category=...` restores the folder and leaves the editor empty.
- Invalid URLs redirect back to `/notes` and show an inline error.
