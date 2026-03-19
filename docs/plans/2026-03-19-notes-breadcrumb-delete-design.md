# Notes Breadcrumb Delete Design

## Goal

Allow deleting any folder shown in the active Notes breadcrumb, including its entire descendant folder tree and all notes inside that tree.

## UX

- Breadcrumb items in the right pane become interactive.
- First click on a breadcrumb folder arms delete mode for that specific breadcrumb item.
- The armed breadcrumb item swaps its label for a red trash icon.
- Clicking the trash icon again performs the delete.
- Only one breadcrumb item can be armed at a time.

## Delete Semantics

- Deleting a folder recursively deletes:
  - the folder itself
  - all descendant folders
  - all notes whose `categoryId` belongs to any deleted folder
- This applies whether the clicked breadcrumb is the current folder or an ancestor folder in the open path.

## Navigation After Delete

- After a successful delete, the Notes page navigates to the deleted folder’s parent folder.
- If the deleted folder was a top-level folder, the page navigates back to `/notes`.
- The `note` query param is cleared because the current note may have been deleted.

## Backend API

- Add `DELETE /note/categories/:id`
- Validate ownership with `userId`
- Return:
  - `deletedCategoryIds`
  - `deletedNoteIds`
  - `parentId`

## Error Handling

- Missing or foreign-owned category returns 404
- Frontend shows inline error text using the existing Notes error surface
- Delete failures leave the current page state intact

## Testing

- Service test for recursive category/note deletion
- Frontend/build verification for breadcrumb interaction and URL reset after delete
