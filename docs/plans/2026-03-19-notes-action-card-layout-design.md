# Notes Action Card Layout Design

## Goal

Simplify the Notes left header so the create actions live in the content area instead of the top-right button cluster.

## Layout

- Remove the top-right `Folder` and `+ Note` buttons.
- Keep the left header focused on:
  - `Workspace`
  - the current title (`My Notes` or the current folder name)
  - the folder/note counts
- When viewing a folder, show the folder delete trash icon at the far right of the title row.

## Action Area

- Replace the single large `Add new note` card with two matching large cards:
  - `New folder`
  - `Add new note`
- On narrow widths they stack vertically.
- On wider widths they appear side by side in one row.
- Both cards reuse the same visual language as the existing big note card action.

## Behavior

- `New folder` opens the existing create-folder modal.
- `Add new note` opens the existing create-note modal.
- Folder delete still uses the existing confirm modal and recursive delete API.
- Note delete behavior is unchanged.

## Files

- Modify: `src/pages/Notes/Notes.tsx`

## Verification

- Run `npm run build`
- Manually confirm:
  - no top-right create buttons remain
  - action cards render side by side on wider screens
  - folder trash appears in the title row only when inside a folder
