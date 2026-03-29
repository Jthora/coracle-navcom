# NavCom Theme Acceptance Gates

Date: 2026-03-22
Status: Gate criteria
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-master-checklist.md
- docs/reskin/navcom-uiux-theme/navcom-theme-validation-checklists.md

## Gate A - Doctrine Gate

Pass when:
- Comms and Ops mode contracts are documented and approved.
- WHY-to-UI mapping is explicit and consistent with vision.

## Gate B - Token Gate

Pass when:
- semantic token contract is documented and used by targeted wave scope.
- no unapproved hardcoded color literals remain in wave scope.

## Gate C - Usability Gate

Pass when:
- first-use path remains clear and low-friction.
- one primary action per major screen region remains obvious.

## Gate D - Legibility Gate

Pass when:
- readability and contrast checks pass for updated scope.
- map and ops overlays remain legible in required combinations.

## Gate E - Accessibility Gate

Pass when:
- keyboard and focus-visible checks pass.
- warning and danger semantics are not color-only.

## Gate F - Regression Gate

Pass when:
- screenshot and behavior regressions are reviewed.
- high and critical regressions are resolved.

## Gate G - Release Gate

Pass when:
- wave checklist is complete and signed off.
- docs and exception log are updated.
- release notes include theme and UX changes.
