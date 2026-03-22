# NavCom UI/UX Theme Master Checklist

Date: 2026-03-22
Status: Execution tracker
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-audit.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-plan.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-app-wide-audit.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-wave-matrix.md

Seed format:
- Stage: X.0.0.0
- Phase: X.Y.0.0
- Step: X.Y.Z.0
- Task: X.Y.Z.T

## Stage 1.0.0.0 - Program Governance and WHY Alignment

### Phase 1.1.0.0 - Vision and Doctrine Lock

#### Step 1.1.1.0 - WHY-to-UI Doctrine Finalization
- [ ] 1.1.1.1 Confirm COMMS doctrine language for default user flow.
- [ ] 1.1.1.2 Confirm NAV doctrine language for map access and persistence.
- [ ] 1.1.1.3 Confirm INTEL doctrine language for structured reporting and confidence cues.
- [ ] 1.1.1.4 Confirm AUTH doctrine language for trust, role, and identity signaling.
- [ ] 1.1.1.5 Confirm INFRA doctrine language for degraded-mode visibility.
- [x] 1.1.1.6 Publish approved doctrine summary in strategy docs.

#### Step 1.1.2.0 - Mode Contract Definition
- [x] 1.1.2.1 Define Comms Mode default layout contract (desktop).
- [x] 1.1.2.2 Define Comms Mode default layout contract (mobile).
- [x] 1.1.2.3 Define Ops Mode advanced layout contract (desktop).
- [x] 1.1.2.4 Define Ops Mode advanced layout contract (mobile).
- [x] 1.1.2.5 Define mode-switch behavior and persistence rules.
- [x] 1.1.2.6 Define anti-overload constraints for persistent status items.

### Phase 1.2.0.0 - Scope and Ownership

#### Step 1.2.1.0 - Workstream Ownership
- [ ] 1.2.1.1 Assign owner for shell and status workstream.
- [ ] 1.2.1.2 Assign owner for primitives and forms workstream.
- [ ] 1.2.1.3 Assign owner for comms and groups workstream.
- [ ] 1.2.1.4 Assign owner for map and ops workstream.
- [ ] 1.2.1.5 Assign owner for long-tail normalization workstream.
- [ ] 1.2.1.6 Assign owner for QA and accessibility workstream.

#### Step 1.2.2.0 - Milestones and Gates
- [x] 1.2.2.1 Define Stage-level milestone calendar.
- [x] 1.2.2.2 Define Wave-level acceptance gate checklist template.
- [x] 1.2.2.3 Define defect triage severity rubric for UI regressions.
- [x] 1.2.2.4 Define release cut criteria for theme rollout.

## Stage 2.0.0.0 - Theme System and Token Foundation

### Phase 2.1.0.0 - 3x4 Theme Architecture Hardening

#### Step 2.1.1.0 - Palette and Axis Integrity
- [x] 2.1.1.1 Validate Shell axis has exactly 4 curated palettes.
- [x] 2.1.1.2 Validate Surface axis has exactly 4 curated palettes.
- [x] 2.1.1.3 Validate Accent axis has exactly 4 curated palettes.
- [x] 2.1.1.4 Validate persistence schema for shell/surface/accent selection.
- [x] 2.1.1.5 Validate fallback behavior for invalid stored palette values.
- [x] 2.1.1.6 Validate migration behavior from legacy theme keys.

#### Step 2.1.2.0 - Theme Combination Stability
- [x] 2.1.2.1 Define required test matrix for 16 Shell x Surface combinations.
- [x] 2.1.2.2 Define representative accent sampling strategy for all 4 accents.
- [x] 2.1.2.3 Validate semantic status colors across all combinations.
- [x] 2.1.2.4 Validate focus ring visibility across all combinations.
- [x] 2.1.2.5 Validate contrast floors for primary text roles.

### Phase 2.2.0.0 - Semantic Token Contract

#### Step 2.2.1.0 - Token Taxonomy
- [x] 2.2.1.1 Finalize shell token names and allowed usage.
- [x] 2.2.1.2 Finalize surface token names and allowed usage.
- [x] 2.2.1.3 Finalize accent token names and allowed usage.
- [x] 2.2.1.4 Finalize status token names and allowed usage.
- [x] 2.2.1.5 Finalize typography token names and allowed usage.
- [x] 2.2.1.6 Finalize motion token names and allowed usage.

#### Step 2.2.2.0 - Token Enforcement Prep
- [x] 2.2.2.1 Inventory hardcoded color literal usage by component family.
- [x] 2.2.2.2 Inventory arbitrary utility class usage by component family.
- [x] 2.2.2.3 Define approved exceptions list for non-token styles.
- [x] 2.2.2.4 Add review checklist item for token compliance in PR template.

## Stage 3.0.0.0 - Wave 1 Execution (Shell and Status)

### Phase 3.1.0.0 - Navigation and Shell Surfaces

#### Step 3.1.1.0 - Top-Level Shell
- [x] 3.1.1.1 Normalize top navigation gradients and shadows to token semantics.
- [x] 3.1.1.2 Normalize desktop menu shell to semantic token contract.
- [x] 3.1.1.3 Normalize mobile menu shell to semantic token contract.
- [x] 3.1.1.4 Normalize mode tab shell and active indicator behavior.

#### Step 3.1.2.0 - Overlay Shell
- [x] 3.1.2.1 Normalize modal backdrop to semantic token usage.
- [x] 3.1.2.2 Normalize modal container borders and depth language.
- [x] 3.1.2.3 Validate modal shell coherence under all accent palettes.

### Phase 3.2.0.0 - Status Surface Standardization

#### Step 3.2.1.0 - Status Bars
- [x] 3.2.1.1 Normalize main status bar shell/background contract.
- [x] 3.2.1.2 Normalize uplink status bar shell/background contract.
- [x] 3.2.1.3 Standardize status indicator spacing and hierarchy.
- [x] 3.2.1.4 Standardize accent usage for values vs labels.

#### Step 3.2.2.0 - Status Semantics
- [x] 3.2.2.1 Define critical vs inspectable status fields for Comms mode.
- [x] 3.2.2.2 Define expanded status fields for Ops mode.
- [x] 3.2.2.3 Validate success, warning, danger signals with icon backup.

### Phase 3.3.0.0 - Wave 1 Validation

#### Step 3.3.1.0 - Quality Checks
- [ ] 3.3.1.1 Capture desktop screenshot baseline for shell/status views.
- [ ] 3.3.1.2 Capture mobile screenshot baseline for shell/status views.
- [ ] 3.3.1.3 Run contrast checks on shell/status text layers.
- [x] 3.3.1.4 Verify no critical hardcoded accent literal remains in Wave 1 scope.
- [ ] 3.3.1.5 Complete Wave 1 acceptance gate sign-off.

## Stage 4.0.0.0 - Wave 2 Execution (Primitives and Forms)

### Phase 4.1.0.0 - Primitive Control Standardization

#### Step 4.1.1.0 - Input Family
- [x] 4.1.1.1 Normalize Input states (default, hover, focus, disabled, error).
- [x] 4.1.1.2 Normalize Textarea states (default, hover, focus, disabled, error).
- [x] 4.1.1.3 Normalize Select states (default, hover, focus, disabled, error).
- [x] 4.1.1.4 Normalize Toggle states (off, on, disabled, focus-visible).
- [x] 4.1.1.5 Normalize Tabs active and inactive treatment.

#### Step 4.1.2.0 - Button and Action Family
- [x] 4.1.2.1 Normalize primary button semantics across all accents.
- [x] 4.1.2.2 Normalize secondary button semantics across shell/surface combos.
- [x] 4.1.2.3 Normalize destructive and warning action semantics.
- [x] 4.1.2.4 Validate button focus-visible behavior and hit targets.

### Phase 4.2.0.0 - Form Surface Harmonization

#### Step 4.2.1.0 - Settings and Policy Forms
- [x] 4.2.1.1 Normalize settings form panel hierarchy.
- [x] 4.2.1.2 Normalize policy editor form field hierarchy.
- [x] 4.2.1.3 Normalize validation message semantics and placement.

#### Step 4.2.2.0 - Group and Admin Forms
- [x] 4.2.2.1 Normalize group setup form surfaces.
- [x] 4.2.2.2 Normalize admin policy form surfaces.
- [x] 4.2.2.3 Normalize diagnostics form surfaces.

### Phase 4.3.0.0 - Wave 2 Validation

#### Step 4.3.1.0 - Quality Checks
- [ ] 4.3.1.1 Run form state contrast checks across theme matrix.
- [ ] 4.3.1.2 Verify keyboard navigation and focus order in core forms.
- [ ] 4.3.1.3 Verify touch target minimum size in mobile form controls.
- [ ] 4.3.1.4 Complete Wave 2 acceptance gate sign-off.

## Stage 5.0.0.0 - Wave 3 Execution (Comms, Groups, Onboarding)

### Phase 5.1.0.0 - Comms Workflow Clarity

#### Step 5.1.1.0 - Conversation Surfaces
- [x] 5.1.1.1 Normalize conversation container hierarchy.
- [x] 5.1.1.2 Normalize message bubble hierarchy and metadata contrast.
- [x] 5.1.1.3 Normalize compose action prominence and spacing.

#### Step 5.1.2.0 - Channel and Feed Surfaces
- [x] 5.1.2.1 Normalize channel list state hierarchy.
- [x] 5.1.2.2 Normalize feed card border and hover semantics.
- [x] 5.1.2.3 Normalize unread and priority indicators.

### Phase 5.2.0.0 - Group Workflow Consistency

#### Step 5.2.1.0 - Group Entry Paths
- [x] 5.2.1.1 Normalize group create or join hero and action hierarchy.
- [x] 5.2.1.2 Normalize group detail overview surface semantics.
- [x] 5.2.1.3 Normalize group conversation side panels.

#### Step 5.2.2.0 - Group Admin Paths
- [x] 5.2.2.1 Normalize audit history panel visual hierarchy.
- [x] 5.2.2.2 Normalize group policy editor visual hierarchy.
- [x] 5.2.2.3 Normalize relay policy editor visual hierarchy.

### Phase 5.3.0.0 - Onboarding and Trust Cues

#### Step 5.3.1.0 - First-Use Experience
- [x] 5.3.1.1 Normalize onboarding start screen clarity and emphasis.
- [x] 5.3.1.2 Normalize key choice flow readability and action hierarchy.
- [x] 5.3.1.3 Normalize profile-lite and completion screen consistency.

#### Step 5.3.2.0 - Trust and Identity Signals
- [x] 5.3.2.1 Normalize trust badge visibility rules.
- [x] 5.3.2.2 Normalize role and verification icon language.
- [x] 5.3.2.3 Validate trust cues remain meaningful without visual noise.

### Phase 5.4.0.0 - Wave 3 Validation

#### Step 5.4.1.0 - Quality Checks
- [ ] 5.4.1.1 Run minute-one path usability script end-to-end.
- [ ] 5.4.1.2 Verify one primary action per major screen region.
- [ ] 5.4.1.3 Run readability checks for conversation and feed text.
- [ ] 5.4.1.4 Complete Wave 3 acceptance gate sign-off.

## Stage 6.0.0.0 - Wave 4 Execution (Map and Ops)

### Phase 6.1.0.0 - Map Surface Legibility

#### Step 6.1.1.0 - Map Chrome and Controls
- [x] 6.1.1.1 Normalize map toolbar and control surface token usage.
- [x] 6.1.1.2 Normalize map layer panel hierarchy and contrast.
- [x] 6.1.1.3 Normalize map draw tools hierarchy and contrast.
- [x] 6.1.1.4 Normalize marker popup container hierarchy and contrast.

#### Step 6.1.2.0 - Map Overlay Semantics
- [ ] 6.1.2.1 Validate marker visibility across Shell x Surface matrix.
- [ ] 6.1.2.2 Validate label readability on real map tiles.
- [ ] 6.1.2.3 Validate selected, hover, and focus states on map elements.

### Phase 6.2.0.0 - Ops Dashboard Coherence

#### Step 6.2.1.0 - Ops Panels
- [x] 6.2.1.1 Normalize ops card hierarchy and spacing.
- [x] 6.2.1.2 Normalize telemetry and metric emphasis tiers.
- [x] 6.2.1.3 Normalize warning and alert visual semantics in ops surfaces.

#### Step 6.2.2.0 - Ops Status Language
- [x] 6.2.2.1 Define persistent vs drill-in status elements for ops mode.
- [x] 6.2.2.2 Validate alert urgency signaling without alarm fatigue.

### Phase 6.3.0.0 - Wave 4 Validation

#### Step 6.3.1.0 - Quality Checks
- [ ] 6.3.1.1 Capture map and ops screenshot matrix for all required combinations.
- [ ] 6.3.1.2 Run legibility and contrast checks on map overlays.
- [ ] 6.3.1.3 Verify no map control becomes unreadable in non-default palettes.
- [ ] 6.3.1.4 Complete Wave 4 acceptance gate sign-off.

## Stage 7.0.0.0 - Wave 5 Execution (Long-Tail Normalization)

### Phase 7.1.0.0 - Shared Content Families

#### Step 7.1.1.0 - Note and Feed Families
- [x] 7.1.1.1 Normalize note content variants to style contract.
- [x] 7.1.1.2 Normalize feed variants to style contract.
- [x] 7.1.1.3 Normalize person badge and profile surface variants.

#### Step 7.1.2.0 - Utility Families
- [x] 7.1.2.1 Normalize suggestions and overflow menus.
- [x] 7.1.2.2 Normalize slider and popover surfaces.
- [x] 7.1.2.3 Normalize auxiliary banners and update notices.

### Phase 7.2.0.0 - Drift Cleanup

#### Step 7.2.1.0 - Exception Resolution
- [x] 7.2.1.1 Catalog remaining hardcoded styling exceptions.
- [x] 7.2.1.2 Resolve exceptions or document approved rationale.
- [x] 7.2.1.3 Remove obsolete utility patterns superseded by tokens.

#### Step 7.2.2.0 - Contract Reconciliation
- [x] 7.2.2.1 Validate all shared components against style contract.
- [x] 7.2.2.2 Validate all major routes against style contract.
- [x] 7.2.2.3 Publish final residual debt report.

### Phase 7.3.0.0 - Wave 5 Validation

#### Step 7.3.1.0 - Quality Checks
- [ ] 7.3.1.1 Run broad screenshot regression suite.
- [ ] 7.3.1.2 Run final contrast and focus visibility checks.
- [ ] 7.3.1.3 Complete Wave 5 acceptance gate sign-off.

## Stage 8.0.0.0 - Quality, Accessibility, and Release Readiness

### Phase 8.1.0.0 - Accessibility Hardening

#### Step 8.1.1.0 - Visual Accessibility
- [ ] 8.1.1.1 Verify WCAG contrast compliance for key text tiers.
- [ ] 8.1.1.2 Verify color is never the only status signal.
- [ ] 8.1.1.3 Verify focus-visible states across interactive elements.

#### Step 8.1.2.0 - Interaction Accessibility
- [ ] 8.1.2.1 Verify keyboard-only navigation in core workflows.
- [ ] 8.1.2.2 Verify screen-reader labels for status and critical actions.
- [ ] 8.1.2.3 Verify reduced-motion behavior where applicable.

### Phase 8.2.0.0 - Theme Matrix QA

#### Step 8.2.1.0 - Matrix Execution
- [ ] 8.2.1.1 Execute Shell x Surface matrix checks on core routes.
- [ ] 8.2.1.2 Execute accent sweep checks on core actions and alerts.
- [ ] 8.2.1.3 Execute map and ops legibility checks in non-default combinations.
- [ ] 8.2.1.4 Execute mobile and desktop checks for each critical route.

#### Step 8.2.2.0 - Defect Closure
- [ ] 8.2.2.1 Triage matrix defects by severity.
- [ ] 8.2.2.2 Resolve critical and high severity defects.
- [ ] 8.2.2.3 Re-run failed matrix cases after fixes.

### Phase 8.3.0.0 - Release and Sustainment

#### Step 8.3.1.0 - Launch Readiness
- [ ] 8.3.1.1 Publish final UI/UX theme release notes.
- [x] 8.3.1.2 Publish updated style contract and token handbook.
- [ ] 8.3.1.3 Publish final acceptance gate sign-off record.

#### Step 8.3.2.0 - Post-Launch Guardrails
- [x] 8.3.2.1 Add ongoing PR checklist items for theme consistency.
- [ ] 8.3.2.2 Add recurring visual regression checks in CI workflow.
- [ ] 8.3.2.3 Schedule post-launch audit checkpoint.
