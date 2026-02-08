# Navcom Reskin: Design Starter

Purpose: capture the initial visual/UX direction for the Navcom reskin (gun-metal + holographic blue + jet-black, mil-tech cyber uplink), separate from project setup/renaming. These notes are for design implementation; see other docs in this folder for specifics.

## Themes & Atmosphere
- Tone: military console meets holo ops deck; tactile metal surfaces with projected/glass UI overlays.
- Color feel: gun-metal base, jet-black depths, holo blue highlights, matrix green for dynamic telemetry, yellow/orange for caution, deep red for fault states.
- Motion: purposeful, minimal; emphasize scans, sweeps, and crosshair-like focus rather than playful easing.
- Typography: angular/technical over rounded; clear hierarchy for operator readability.

## Scope vs. Non-goals
- In scope: colors, typography, icon/asset guidance, component treatments (panels/cards/nav/buttons/forms), motion primitives.
- Not here: product copy, feature changes, analytics/legal/branding setup (handled separately in setup/branding docs).

## Success Criteria
- Immediate read as Navcom (not Coracle) via palette, logo presence, and UI chrome.
- Consistent tokenization: colors and radii come from a central theme source, not scattered literals.
- States are legible: default/hover/active/disabled/warn/error all distinct under dark backgrounds.
- Works for both PWA and Capacitor builds; animated logo used where it makes sense, static variants for icons.
