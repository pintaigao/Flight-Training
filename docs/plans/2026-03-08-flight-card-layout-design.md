# Flight Card Layout Redesign (Flights Page) — Design

**Goal:** Update the Flights list `FlightCard` information architecture to match the “booking card” reference layout, improving scanability while keeping the page compact (2 cards per row).

## Constraints

- Keep 2 cards per row on `Flights` page.
- Keep bottom row: left = tags, right = “View Detail”.
- Do not add left logo or right-side price.
- Use Tailwind utilities in TSX; keep existing `.scss` files and class names, but do not rely on SCSS for styling (selectors may remain empty).

## Layout Spec

### Row 1 (Header)

**Two columns (gap ~16px):**

- **Left:** `From → To` and `TAIL # <tailNumber>`
- **Right:** `Description` (max 2 lines; truncate overflow)

### Row 2 (Timeline Row — single row)

**Three columns:**

- **Left time block:** Local start time + tz abbrev; below it zulu start time
- **Center timeline:** a thin track with two blue endpoints; **duration label above the track**
- **Right time block:** Local end time + tz abbrev; below it zulu end time

**Date placement:** `YYYY-MM-DD` is centered **below the timeline track**.

## Data / Formatting

- Use existing `trackMeta.departureTimeZone` when available to format local times and tz abbreviations.
- Continue to show Zulu times (`HH:mmZ`) under local times.
- Continue to derive `duration` from `flight.durationMin` and show as `x.x hrs`.

