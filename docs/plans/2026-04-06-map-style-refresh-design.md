# Map Style Refresh Design

**Status:** Approved

**Goal:** Restyle all three shared map surfaces so they feel closer to the provided light editorial reference while preserving flight-specific information density and interactions.

## Scope

This design applies to all current `MapView` consumers:

- `src/pages/MapExplorer/MapExplorer.tsx`
- `src/pages/Flights/FlightDetail/FlightDetail.tsx`
- `src/pages/Dashboard/Dashboard.tsx`

The shared implementation should be centered in:

- `src/components/map/MapView.tsx`
- `src/components/map/MapView.scss`

## Approved Decisions

### 1. All three maps share one visual system

The map style will be unified across:

- `MapExplorer`
- `FlightDetail`
- `Dashboard` mini map

There should not be three separate visual languages for three different pages.

### 2. The target style is calm and paper-like

The visual direction is based on the provided reference image:

- very light neutral map base
- low-saturation roads and land blocks
- quiet labels
- dark route lines
- minimal decorative chrome

The result should feel editorial and map-first rather than dashboard-first.

### 3. Preserve flight-product usability

The reference image is a mood target, not a literal clone. The app must keep its operational value:

- route selection still needs to read clearly
- replay mode in `FlightDetail` must remain understandable
- bounds fitting, map interaction, and selection must continue to work

### 4. Route lines remain solid

The route line treatment is approved as:

- solid lines only
- no dashed history line
- no dotted secondary route language

The style change should come from weight, color, and contrast rather than line pattern.

## Visual Language

### Base map

All three maps should use a lighter, lower-noise base map than the current default OpenStreetMap tiles.

Approved qualities:

- pale neutral background
- soft gray land and road hierarchy
- muted place labels
- reduced color competition with the route line

The base map should recede so the route becomes the main visual subject.

### Route lines

Route lines should shift away from the current brighter, more product-colored look.

Approved direction:

- default route line in deep gray or near-black
- selected route line slightly darker or slightly thicker
- non-selected routes still visible, but quieter
- no bright blue selection treatment

### Start/end markers

Markers should become quieter and smaller.

Approved direction:

- restrained black/gray markers
- avoid loud accent-colored markers
- distinguish start/end by shape or subtle tone instead of saturated color

### Replay cursor and labels

`FlightDetail` replay visuals must also move into the new style system.

Approved direction:

- cursor marker should stop feeling neon or tactical
- labels should stay readable, but with calmer contrast
- current position should be clear without overpowering the map

## Page-by-Page Behavior

### MapExplorer

This page should express the map style most fully.

- use the full new light base map
- keep the side panels for flight selection and details
- keep route selection behavior
- let the map itself feel calmer and more editorial

### FlightDetail

This page keeps the same map style but must preserve replay readability.

- same base map and route language as `MapExplorer`
- calmer route and cursor treatment
- replay marker and label remain readable during scrub/playback
- no reduction in replay functionality

### Dashboard

This map becomes a small-format version of the same system.

- same map family
- same route color language
- less emphasis on chrome
- no page-specific map theme divergence

## Implementation Strategy

The recommended implementation boundary is:

1. Put the shared visual rules in `MapView`
2. Use page-level code only for small behavior differences
3. Avoid page-specific one-off map styling

Recommended structural direction:

- extract shared map theme constants and route-style helpers
- make tile source configurable in one place
- keep `MapExplorer`, `FlightDetail`, and `Dashboard` thin

## Guardrails

- do not rebuild page layouts to achieve the map style
- do not rely on CSS filters to fake a new tile style
- do not introduce three separate map styling systems
- do not remove or weaken selection/replay behavior
- do not replace solid route lines with dashed lines

## Verification Criteria

The redesign is complete when:

- all three map surfaces share one light visual family
- route lines are dark, solid, and calmer than the current style
- selected routes remain clear without bright accent treatment
- replay cursor in `FlightDetail` remains readable
- page layouts and map interactions continue to work as before
