# NavCom UI/UX App-Wide Deep Audit

Date: 2026-03-22
Status: Deep audit extension
Depends on:
- docs/navcom-vision.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-audit.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-plan.md

## 1. Scope and Intent

This audit extends the baseline into app-wide execution reality.

Goal:
- identify where UI/UX and theme work must land across the full interface surface
- map migration waves by component family
- preserve the 3 sets x 4 themes architecture (Shell, Surface, Accent)

## 2. Quantitative Surface Inventory

Component footprint:
- src/app/views: 106 Svelte files
- src/app/shared: 118 Svelte files
- src/partials: 66 Svelte files
- Total in core UI surface: 290 Svelte files

Styling prevalence:
- neutral, tinted, accent class usage instances in Svelte: 976
- arbitrary utility and color literal pattern instances: 228
- direct color literal or rgba hotspots led by:
  - src/app.css
  - src/app/shared/ThemeControls.svelte
  - src/partials/state.ts
  - map and group workflow views

Interpretation:
- theme token infrastructure exists and is widely used
- app still has non-trivial styling debt in arbitrary classes, gradients, and local color literals
- migration must happen in waves, not one global sweep

## 3. Critical Findings (Severity Ordered)

## High

1. Shell coherence risk across top-level navigation and status surfaces
- Core shell components still mix semantic tokens with local arbitrary gradients and shadows
- Risk: inconsistent atmosphere across theme combinations, especially outside default palettes

2. Map and Ops legibility risk
- Map-related views and overlays are among top literal/arbitrary style hotspots
- Risk: losing marker and control readability when Shell or Surface palettes change

3. Form and workflow inconsistency in group and onboarding flows
- GroupCreateJoin and related setup flows carry dense neutral class usage and local styling decisions
- Risk: first-use clarity and trust cues drift between routes

## Medium

1. Accent semantics drift
- Widespread accent use is good, but inconsistent emphasis tiers can make everything look equally urgent

2. Shared component divergence
- Reusable shared and partial components include one-off styling exceptions that can fragment visual language

3. Motion and glow overuse potential
- Ambient effects are present but not fully constrained by global usage rules

## Low

1. Legacy style residues
- Some remaining patterns appear inherited from earlier theme assumptions

2. Documentation to implementation traceability
- Existing docs are strong but need a dedicated app-wide migration matrix per wave

## 4. App-Wide Area Map and Complexity

High complexity:
- Map mode and map tooling (legibility-critical)
- Comms conversation surfaces (high-frequency operator interaction)
- Ops dashboards and status rails (dense information surfaces)

Medium complexity:
- Group management and policy flows
- Onboarding and trust cues
- Feed and note rendering variants

Low complexity:
- auth and utility forms
- ancillary notifications and minor menus

## 5. Priority File Families for Early Migration

Wave-first families (not exhaustive file list):

1. Shell and status infrastructure
- Nav, MainStatusBar, UplinkStatusBar, ModeTabBar, Menu variants

2. Form primitives and shared controls
- Input, Textarea, Select, Toggle, Tabs, Modal shell

3. Core mode views
- CommsView, OpsView, MapView and map layer/draw panels

4. Group entry and setup workflows
- GroupCreateJoin and associated setup/admin policy panels

5. Shared message/feed surfaces
- Message rendering, feed cards, note content variants

## 6. App-Wide Migration Waves

## Wave 1: Shell and Semantic Baseline

Objective:
- harden semantic token usage at global shell level

Targets:
- nav and menu shell
- status bars and mode tabs
- modal shell and top-level overlay surfaces

Acceptance:
- no critical shell components depend on hardcoded accent literals
- all shell layers remain coherent across all 4 accent palettes

## Wave 2: Primitives and Forms

Objective:
- normalize controls and interaction affordances

Targets:
- input/select/textarea/toggle/tabs/button families
- form containers used by settings, groups, onboarding

Acceptance:
- focus, hover, error, disabled states are semantically consistent
- controls retain contrast and clarity across all 16 Shell x Surface combinations

## Wave 3: Core Workflows (Comms, Groups, Onboarding)

Objective:
- improve first-use and daily-use task clarity app-wide

Targets:
- comms thread + compose hierarchy
- group create or join and group admin workflows
- onboarding decision screens and trust cues

Acceptance:
- minute-one route to active group communication is clear
- visual hierarchy emphasizes one primary action per region

## Wave 4: Ops and Map Surfaces

Objective:
- ensure dense operational interfaces remain legible and trustworthy

Targets:
- map overlays, layer controls, draw tools, ops cards, telemetry panels

Acceptance:
- marker and control legibility validated under all active theme combinations
- status and warning signals remain actionable without alarm fatigue

## Wave 5: Content and Long-Tail Surface Normalization

Objective:
- remove residual visual drift in shared content surfaces

Targets:
- note content variants, feed variants, secondary panels, utility surfaces

Acceptance:
- no major route has off-system color or border behavior
- component style contract is visibly consistent app-wide

## 7. Risk Matrix

Critical:
- map and overlay contrast regressions
- status signal ambiguity when multiple accents are active

High:
- onboarding confusion from dense or low-contrast first screens
- inconsistent form state signaling in mission-critical settings

Medium:
- motion noise reducing operator focus
- one-off component exceptions reintroducing drift

## 8. Validation Framework (Per Wave)

Shared checks:
- contrast and readability checks for key text roles
- keyboard and focus state visibility checks
- mobile and desktop screenshot regression checks
- semantic status checks (success, warning, danger) across palette combinations

Theme matrix checks:
- minimum required matrix: 16 Shell x Surface combinations with each accent profile sampled
- critical path matrix: group join, comms message send, map layer toggle, settings update

Performance and reliability checks:
- no visible flashing during theme changes
- no layout shifts in shell and status surfaces when switching palettes

## 9. Recommended Next Documentation Artifacts

1. docs/reskin/navcom-uiux-theme/navcom-uiux-theme-wave-matrix.md
- explicit file-family target list and owner per wave

2. docs/reskin/navcom-uiux-theme/navcom-uiux-theme-validation-checklists.md
- copy-paste checklist templates for PR and release reviews

3. docs/reskin/navcom-uiux-theme/navcom-uiux-theme-acceptance-gates.md
- formal gate criteria to prevent style drift during rollout

## 10. Deep Audit Conclusion

The app is ready for app-wide UI/UX evolution, but success depends on disciplined wave execution.

The highest leverage path is:
- stabilize shell and primitives first
- improve comms and onboarding clarity second
- then harden dense map and ops surfaces
- then normalize long-tail content components

This keeps NavCom anchored to its WHY while scaling changes across the full interface surface without visual fragmentation.
