# Comment Composer Modal Refresh Design

**Status:** Approved

**Goal:** Redesign the shared comment-editing modal into a cleaner composition-focused writing surface inspired by the provided reference while keeping the current save flow and Lexical data model intact.

## Scope

This design applies to the shared modal and rich-text editor infrastructure used by flight comments.

Primary implementation targets:

- `src/components/Modal/Modal.tsx`
- `src/components/Modal/Modal.scss`
- `src/components/richtext/LexicalEditor.tsx`
- `src/components/richtext/LexicalEditor.scss`
- `src/pages/Flights/FlightDetail/FlightDetail.tsx`
- `src/lib/types/ui.ts`

## Approved Decisions

### 1. This is a shared editor pattern, not a one-off page override

The redesign should be reusable. It should not live only inside `FlightDetail`.

Approved direction:

- add a dedicated modal variant for comment composition
- add a cleaner editor presentation mode for Lexical
- keep the existing generic modal available for other flows

### 2. The comment modal has no header

The approved layout removes the current title row and close-button-first structure.

Approved direction:

- no modal header block
- no visible title bar
- close behavior remains available through existing backdrop/escape/explicit actions

### 3. The editor surface should feel like a quiet writing panel

The reference is not a literal clone, but the modal should feel closer to a modern composition surface than a form dialog.

Approved direction:

- large open content area
- no obvious input border
- no heavy chrome around the editor
- placeholder should read like a writing prompt, not a field label

### 4. No top toolbar

The top formatting toolbar is explicitly not part of the approved design.

Approved direction:

- do not show a header toolbar in the comment modal
- do not replace it with another top action row
- keep the writing surface visually quiet

### 5. Bottom actions are right-aligned in a floating dark control area

The final approved combination is:

- overall modal body follows the lighter “comment composition panel” direction
- bottom controls follow the “floating dark action area” direction

Approved direction:

- a dark floating action tray near the bottom of the modal
- `Cancel` and `Save` both live on the right side
- `Cancel` is secondary
- `Save` is primary

## Visual Language

### Modal shell

The modal shell should become quieter and softer than the current generic modal.

Approved qualities:

- large rounded panel
- no obvious border
- light neutral or warm-gray body tone
- depth from spacing and soft shadow, not chrome

### Editor area

The editor area should read as content-first.

Approved qualities:

- generous padding
- plain writing-surface look
- no framed textarea feel
- readonly and editable comment states should stay in the same family

### Floating action tray

The action area is the main contrasting element.

Approved qualities:

- dark near-black tray
- not full-width edge-to-edge
- visually detached from the body by spacing
- right-aligned action cluster only

## Component Boundaries

### Modal

`Modal` should support a comment-composer-specific variant instead of forcing the generic header/body layout onto every use case.

Recommended boundary:

- keep the existing default modal behavior intact
- add a variant that can hide the header and expose a cleaner body layout
- avoid turning every modal into the new comment style

### LexicalEditor

`LexicalEditor` should support a composition mode rather than having the comment modal hand-roll styling around it.

Recommended boundary:

- keep current rich text behavior and serialized state format
- add a cleaner “composer” presentation mode
- keep toolbar support available for other future contexts, but not active here

### FlightDetail

`FlightDetail` should only wire the approved variant together.

Recommended boundary:

- open the comment composer variant
- pass the editor into the cleaner composition mode
- place `Cancel` and `Save` into the floating bottom tray
- do not duplicate modal shell styling locally

## Guardrails

- do not change comment persistence logic
- do not change `patchFlightComment`
- do not change Lexical serialization format
- do not globally remove modal headers from unrelated dialogs
- do not reintroduce a top toolbar for this comment flow
- do not make the bottom action area span the full modal width like a traditional footer bar

## Verification Criteria

The redesign is complete when:

- the comment modal opens without a header
- the editor surface feels like a plain composition panel rather than a form box
- no visible top toolbar appears in the comment modal
- `Cancel` and `Save` appear together on the right in a dark floating action tray
- unrelated modals keep their current behavior unless explicitly switched to the new variant
- comment editing and saving still work exactly as before
