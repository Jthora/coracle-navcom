# Component Treatments

## Buttons
- Shape: 4px radius, flat top plane with 1px border `#2c343d` and inner highlight `rgba(99,230,255,0.25)`.
- Default: gun-metal fill (`#181c20`), text near-white.
- Hover: lighten to `#20262c`, cyan edge glow.
- Active: `#0ea5e9` fill with inset shadow; text white.
- Secondary: outline in cyan, transparent fill; hover adds faint fill `rgba(34,211,238,0.1)`.
- Danger/Warning variants swap to danger/warning tokens; keep text white.

## Inputs & Fields
- Background: `#0f1114`; border `#2c343d`; focus ring dual-layer in cyan.
- Placeholder: muted `#4b5563`; caret accent cyan.
- Validation: warn border `#f5b942`; error border `#dc2626` with subtle glow.

## Cards/Panels
- Solid mode: `#0f1114` with 1px seam; drop shadow minimal (`0 6px 18px rgba(0,0,0,0.25)`).
- Holo mode: `rgba(15,17,20,0.72)` with blur and cyan inner stroke.
- Headers: uppercase label in accent; fine divider line.

## Lists/Feeds
- Row hover: tint background `rgba(34,211,238,0.06)`; maintain separators.
- Active/selected row: left border in accent, slight glow.

## Badges/Chips
- Fill `rgba(34,211,238,0.12)` with cyan border; text accent.
- Status chips: green for live, yellow for caution, red for fault—pair with icon.

## Modals/Overlays
- Backdrop: `rgba(0,0,0,0.65)`; modal surface as holo panel.
- Close affordance: cyan outline icon, glow on hover.

## Tables/Data Blocks
- Header row: `#111827` background, accent underline.
- Gridlines: `#2c343d`; zebra optional with very subtle tint.
