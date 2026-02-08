# Palette & Tokens

Guiding principle: centralize tokens (CSS custom properties or a theme file) instead of env vars. Use env only if the build currently requires it; prefer committing tokens in code.

## Core Palette (proposed)
- Base / Gun-metal: `#0f1114` (bg primary), `#181c20` (bg raised), `#20262c` (surface), `#2c343d` (divider/lines), `#0a0c0f` (deep backdrop).
- Accent / Holo Blue: `#22d3ee` (primary accent), `#63e6ff` (hover/active glow), `#0ea5e9` (pressed), optional secondary `#9ae6ff` (light glass edges).
- Dynamic / Matrix: `#7af57a` for live telemetry/readouts; use sparingly for data highlights.
- Warning: `#f5b942` base, `#f97316` for urgent caution.
- Danger: `#f87171` (soft), `#dc2626` (hard stop), `#7f1d1d` (bg for errors).
- Neutral text: `#e6edf3` (primary), `#c7d0d9` (secondary), `#94a3b8` (muted).
- Chrome lines: `#4b5563` (panel seams), `#111827` (shadow edges).

## Token Mapping (suggested)
- `--accent`: holo blue (`#22d3ee`)
- `--warning`: `#f5b942`
- `--danger`: `#dc2626`
- `--success`: `#7af57a`
- Neutrals `--neutral-50..950`: span jet-black to light steel; map darkest (`--neutral-950`) to `#050608`, mid (`--neutral-600`) to `#2c343d`, light (`--neutral-200`) to `#c7d0d9`.
- `--tinted-*`: glass highlights; use light cyans/steels (`#0f172a` to `#1f2937`) for translucent UI.

## Application Notes
- Prefer translucent overlays: use `rgba(accent, 0.12–0.18)` on holo panels with 1px inner stroke `#63e6ff` at 20% opacity.
- Use gradients sparingly: subtle vertical gun-metal gradient (`#0f1114` -> `#181c20`) on shells; holographic sweeps on focus rings.
- Glows: soft outer glow on interactive focus (`0 0 12px rgba(34, 211, 238, 0.35)`).
- Borders: 1px lines in `#2c343d`; for elevated glass, add 1px inner highlight `rgba(99, 230, 255, 0.25)`.

## States
- Hover: lighten accent (`#63e6ff`), brighten text to `#f8fafc`.
- Active/Pressed: drop to `#0ea5e9`, inset shadow `rgba(0,0,0,0.35)`.
- Disabled: reduce opacity to 40% and remove glows; text `#4b5563`.
- Focus: dual ring — inner 1px `#22d3ee`, outer 2px `rgba(34, 211, 238, 0.25)`.

## Background Systems
- Body background: `#050608` with faint noise or brushed-metal texture.
- Panels: `#0f1114` solid; holo panels: `rgba(15, 17, 20, 0.72)` with blur (if allowed) and cyan edge.
