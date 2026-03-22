# NavCom Theme Validation Checklists

Date: 2026-03-22
Status: QA checklist template
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-wave-matrix.md
- docs/reskin/navcom-uiux-theme/navcom-token-handbook.md

## 1. Wave Validation Template

Use this at end of each wave.

- [ ] Scope complete for targeted component families.
- [ ] No new avoidable hardcoded style literals introduced.
- [ ] Focus-visible states validated on updated components.
- [ ] Error, warning, and danger states validated with non-color cues.
- [ ] Desktop screenshots captured for key updated surfaces.
- [ ] Mobile screenshots captured for key updated surfaces.
- [ ] Regression issues triaged and resolved or documented.

## 2. Theme Matrix Checklist

Core matrix:
- [ ] Validate all 16 Shell x Surface combinations on critical routes.
- [ ] Validate each accent palette on primary actions and alerts.

Critical routes:
- [ ] User settings and theme control route.
- [ ] Group create or join route.
- [ ] Comms conversation route.
- [ ] Map and layer control route.
- [ ] Ops overview route.

## 3. Accessibility Checklist

- [ ] Contrast checks pass for primary text roles.
- [ ] Warning and danger are not color-only semantics.
- [ ] Keyboard navigation works through primary interactions.
- [ ] Focus order and visual focus remain coherent.
- [ ] Reduced-motion behavior reviewed where animation exists.

## 4. Map and Ops Legibility Checklist

- [ ] Marker and label readability validated on real tiles.
- [ ] Toolbar and layer controls readable across required combinations.
- [ ] Popup and overlay content remains legible and actionable.
- [ ] Ops status hierarchy remains clear under non-default themes.

## 5. Release Readiness Checklist

- [ ] Wave acceptance gate marked complete.
- [ ] Open defects reviewed with severity labels.
- [ ] High and critical issues resolved before release.
- [ ] Documentation updated with final decisions and exceptions.
