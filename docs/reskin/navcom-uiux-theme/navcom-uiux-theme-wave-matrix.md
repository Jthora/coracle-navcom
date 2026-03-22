# NavCom UI/UX Theme Wave Matrix

Date: 2026-03-22
Status: Execution matrix
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-app-wide-audit.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-plan.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md

## 1. Wave Objectives

Wave 1:
- shell coherence and status semantics

Wave 2:
- primitive controls and form consistency

Wave 3:
- core comms, groups, onboarding workflow clarity

Wave 4:
- map and ops legibility hardening

Wave 5:
- long-tail surface normalization and drift cleanup

## 2. Wave Matrix (Component Families)

## Wave 1: Shell and Status

Primary targets:
- src/app/Nav.svelte
- src/app/MenuDesktop.svelte
- src/app/MenuMobile.svelte
- src/app/MainStatusBar.svelte
- src/app/UplinkStatusBar.svelte
- src/app/views/ModeTabBar.svelte
- src/partials/Modal.svelte

Acceptance checks:
- shell layers read consistently in all accent palettes
- no critical shell component depends on local hardcoded accent literal
- status semantics remain stable (success, warning, danger)

## Wave 2: Primitives and Forms

Primary targets:
- src/partials/Input.svelte
- src/partials/Textarea.svelte
- src/partials/Select.svelte
- src/partials/Toggle.svelte
- src/partials/Tabs.svelte
- src/partials/Button.svelte
- form-heavy views in src/app/views (settings, group policy, onboarding)

Acceptance checks:
- focus, hover, disabled, and error states are consistent
- form readability verified across Shell x Surface matrix
- no inaccessible low-contrast form state

## Wave 3: Comms, Groups, Onboarding

Primary targets:
- src/app/views/CommsView.svelte
- src/app/views/GroupCreateJoin.svelte
- src/app/views/GroupConversation.svelte
- src/app/views/GroupDetail.svelte
- src/app/views/UnlockScreen.svelte
- src/app/views/onboarding/*.svelte
- src/app/shared/Message.svelte

Acceptance checks:
- minute-one path to active group communication is clear
- one primary action per region remains visually dominant
- trust and role signals are visible without clutter

## Wave 4: Map and Ops

Primary targets:
- src/app/views/MapView.svelte
- src/app/views/OpsView.svelte
- src/app/views/MapLayerPanel.svelte
- src/app/views/MapDrawTools.svelte
- src/app/views/NavMapStatusBar.svelte
- src/app/views/NavMapToolBar.svelte
- src/app/views/MarkerPopup.svelte

Acceptance checks:
- marker, label, and control legibility under all active theme combos
- map chrome does not obscure geospatial content
- status signals remain actionable, not noisy

## Wave 5: Content and Long-Tail

Primary targets:
- src/app/shared/Feed*.svelte
- src/app/shared/Note*.svelte
- src/app/shared/Person*.svelte
- src/partials/Suggestions.svelte
- src/partials/OverflowMenu.svelte
- src/partials/SliderMenu.svelte

Acceptance checks:
- no route-level visual drift from design system contract
- semantic token usage is consistent across shared content surfaces
- residual hardcoded style exceptions minimized or documented

## 3. Cross-Wave Rules

Theme model rule:
- preserve 3 independent theme sets with 4 options each:
  - Shell (4)
  - Surface (4)
  - Accent (4)

Semantic stability rule:
- success, warning, and danger keep consistent meaning in every combination

Progressive disclosure rule:
- default Comms surfaces remain low-friction
- dense Ops detail appears intentionally, not by default overload

## 4. Suggested Execution Rhythm

Per wave:
1. inventory and classify targeted files
2. apply token and layout updates by family
3. run screenshot and contrast checks
4. capture regressions and adjust contract
5. merge with explicit acceptance sign-off

## 5. Exit Criteria (App-Wide)

App-wide theming and UI/UX migration is complete when:
- all core flows are coherent in all supported theme combinations
- shell and workflow hierarchy remain clear across desktop and mobile
- map and ops surfaces preserve legibility under palette changes
- no major route uses off-system styling without documented exception
