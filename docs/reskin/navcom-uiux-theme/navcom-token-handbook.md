# NavCom Token Handbook

Date: 2026-03-22
Status: Active handbook
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md
- tailwind.config.cjs
- src/partials/state.ts

## 1. Purpose

Define semantic token usage for shell, surface, accent, status, typography, and motion.

Rule:
- component styling should prefer semantic tokens over hardcoded literals.

## 2. Theme Axes (3 x 4)

- Shell: midnight, void, carbon, nebula
- Surface: steel, obsidian, graphite, abyss
- Accent: cyan, amber, emerald, arc

## 3. Core Semantic Tokens

Shell tokens:
- --nc-shell-bg
- --nc-shell-deep
- --nc-shell-border

Surface tokens:
- --nc-surface-card
- --nc-surface-hover
- --nc-surface-input
- --nc-surface-elevated
- --nc-surface-divider

Accent tokens:
- --nc-accent-primary
- --nc-accent-hover
- --nc-accent-glow
- --accent
- --accent-rgb

Status tokens:
- --success
- --warning
- --danger

## 4. Tailwind Semantic Colors

Preferred class usage:
- bg-nc-shell, bg-nc-shell-deep
- border-nc-shell-border
- bg-nc-card, bg-nc-card-hover
- bg-nc-input, bg-nc-elevated
- border-nc-divider
- text-nc-accent, bg-nc-accent, border-nc-accent

Existing neutral and tinted classes are valid when mapped through CSS vars.

## 5. Allowed vs Avoided Patterns

Allowed:
- var(--token) based classes and utilities
- rgba(var(--accent-rgb), alpha) for accent effects
- semantic status colors with icon or label backup

Avoided:
- hardcoded hex in component markup for shared UI states
- hardcoded rgba accent literals when accent-rgb token is available
- one-off arbitrary gradient values for shared shell surfaces

## 6. State Semantics

Interaction states:
- default
- hover
- focus-visible
- active
- disabled
- error

Required behavior:
- focus-visible must always remain perceptible
- disabled must stay readable while clearly non-interactive
- error and warning states must include non-color cue where possible

## 7. Contrast and Accessibility Rules

- body text and key labels must meet contrast thresholds
- warning and danger states require icon or text support
- avoid low-opacity text on elevated surfaces without contrast check

## 8. Usage Checklist

Before merging component styling updates:
- uses semantic tokens or approved mapped classes
- no avoidable hardcoded color literals
- focus-visible and error states validated
- renders clearly in non-default shell and surface combos
