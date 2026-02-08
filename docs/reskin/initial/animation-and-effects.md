# Animation & Effects

## Motion Principles
- Purposeful and restrained; under 180ms for hovers, 220–260ms for modal/overlay entrances.
- Easing: use sharp curves (e.g., `cubic-bezier(0.25, 0.9, 0.35, 1)`) instead of elastic/bouncy.

## Patterns
- Hover/focus glow: fade in/out 120–150ms; avoid scaling beyond 1.02.
- Panel entrance: fast fade+slide (8–12px) from top/bottom; subtle blur-to-sharp on holo overlays.
- Progress/Loading: scan-line sweep or linear shimmer; avoid spinner clichés when possible.
- Notifications/Toasts: slide from edge with accent bar; auto-dismiss timing 4–6s.

## Effects
- Glows: `0 0 12px rgba(34, 211, 238, 0.35)` for accent; reduce on mobile to limit bloom.
- Noise/Texture: low-amplitude noise overlays on dark backgrounds to prevent banding.
- Blend modes: for the animated logo or holo HUD elements, use `screen`/`lighten` on dark shells.

## Performance
- Prefer CSS transforms and opacity; avoid layout thrash.
- Keep filter/blur minimal on mobile; use reduced-motion settings to disable glows and sweeps for accessibility.
