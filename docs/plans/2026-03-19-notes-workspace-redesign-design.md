# Notes Workspace Redesign

## Goal

Redesign `/notes` into a full-bleed note workspace that fills the entire area to the right of the global app sidebar, and make note editing direct by default.

## UX

- `/notes` uses the full main content area, similar to `/map`, instead of the standard centered `max-w-6xl` layout.
- The page is a two-pane workspace:
  - Left pane: current folder header, primary actions, and a mixed list of folders and notes for the current level.
  - Right pane: active note editor.
- Clicking a folder navigates into that folder and clears the right pane.
- Clicking a note opens it in the right pane.
- Notes are editable immediately on selection; no extra edit button or mode switch.
- If no note is selected, the right pane stays visually empty/minimal rather than showing a heavyweight placeholder.

## Visual Direction

- Match the reference more closely: cleaner productivity-app layout, lighter chrome, stronger pane separation, and less card-heavy styling.
- Preserve the app theme system so light/dark mode still works.
- Reduce decorative effects in Notes and emphasize workspace structure: toolbar strip, list rows, editor header, thin borders.

## Data Flow

- Keep current folder navigation client-side with `folderStack`.
- Load categories and current-folder notes from the existing Notes REST API.
- Add note patching on the frontend with debounced autosave for title/content changes.
- Show lightweight save states such as `Saving...`, `Saved`, and error text.

## Error Handling

- Failed loads still surface as inline error text in the left pane.
- Failed saves keep the draft locally and show a visible save error in the editor header.

## Testing

- Verify `/notes` uses full width and no longer inherits the centered content constraint.
- Verify selecting a note enables direct title/body editing.
- Verify edits trigger `PATCH /note/:id` and persist after refresh.
- Verify folder navigation clears the active note and right pane content.

