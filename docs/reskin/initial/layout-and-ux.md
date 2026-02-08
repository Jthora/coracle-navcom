# Layout & UX Patterns

## Overall Structure
- Shell: layered—solid metal base panels with inset seams; holo overlays for secondary info (sidebars, flyouts, dialogs).
- Navigation: left rail or top bar with strong separation; active item uses accent cyan glow and thin top/bottom bars.
- Content surfaces: cards/panels with 1px borders and slight inner highlights; avoid soft, large radii (keep 2–6px corners).

## States & Feedback
- Hover/Focus: clear edge highlights and subtle glows; keep animations under 180ms for snappy, operator feel.
- Loading: skeletal shimmer aligned left-to-right; consider scan-line effect instead of pulsing dots.
- Empty states: concise copy, outline icons, and a single CTA in accent; keep backgrounds clean.

## Data Density
- Allow compact layouts; tighten vertical rhythm versus the original. Increase padding only on touch targets.
- Use gridlines or subtle separators (`#2c343d`) to align telemetry-style blocks.

## Holographic Elements
- Glass cards: translucent dark background (70–80% opacity) with cyan inner stroke and soft outer glow.
- HUD cues: crosshair or bracket accents on highlighted items; avoid overuse to reduce noise.

## Accessibility & Responsiveness
- Preserve contrast at all breakpoints; ensure focus indicators are visible on touch/keyboard.
- On mobile, keep overlays full-width with strong edges; avoid tiny glows that vanish on OLED.
