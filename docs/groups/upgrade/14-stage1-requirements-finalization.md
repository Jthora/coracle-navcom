# Stage 1 Requirements Finalization

Status: Finalized
Owner: Product + Engineering + Security + QA
Last Updated: 2026-02-21

## Purpose

Lock Stage 1 product, UX, policy, sequencing, and ownership decisions so Stage 2 implementation can begin without ambiguity.

## Scope

This document finalizes the checklist items under Stage 1 in the progress tracker:

- Guided interaction budgets
- Expert control boundaries
- Relay policy constraints
- Security-state transition priorities
- Copy and IA contract approvals
- Acceptance criteria reconciliation
- Milestone dependency and ownership confirmation

## Final Decision Set

### 1) Guided Interaction Budgets (Approved)

- Start screen supports max 2 primary actions.
- Room basics supports max 3 required fields.
- Privacy selection supports max 3 options with plain-language labels.
- Relay selection defaults to recommended path with optional edit path.
- Invite step must include one prominent share action and one skip action.

### 2) Expert Control Matrix Boundaries (Approved)

Required in expert mode:

- Transport and security controls
- Relay policy controls (including private relays)
- Diagnostics visibility and downgrade context
- Mode-switch preservation contract

Not required in guided mode primary flow:

- Advanced diagnostics as default-visible controls
- Full relay graph editing in first-run path

### 3) Relay Policy Constraints (Approved)

Hard constraints:

- At least one writable relay for posting
- At least one readable relay for retrieval
- Save blocked when hard constraints fail

Soft constraints:

- Reachability/capability degradation may warn but not always block
- One-click fix recommendations should be offered when feasible

Private relay decisions:

- Manual URL entry is required
- URL normalization and structural validation are required
- Reachability/capability status must be visible

### 4) Security-State Priority Rules (Approved)

Priority order:

1. Blocked
2. Fallback Active
3. Secure Active
4. Compatibility Active

Copy constraints:

- No over-claiming guarantees
- Fallback must include plain-language reason
- Recovery guidance must be visible when state is degraded

### 5) Guided Copy and Helper Text Contract (Approved)

- Primary labels avoid protocol jargon.
- Recovery text must be short and action-oriented.
- Technical details stay behind disclosure patterns.

### 6) Expert Terminology Contract (Approved)

- Terms are technical, precise, and consistent across surfaces.
- Policy-impact actions include explicit consequence language.
- Destructive or security-weakening changes require confirmation.

### 7) Route and Guard Recovery Contract (Approved)

- Core group tasks must be reachable from top-level groups entry.
- Guard redirect must show reason and recovery action persistently.
- Room-context actions (invite/share/settings) remain first-order discoverable.

## Acceptance Criteria Reconciliation (Completed)

Final policy for acceptance criteria conflicts:

1. Security-truth constraints override convenience copy.
2. P0 completion-path criteria override optional UX preferences.
3. Testability is required for all P0/P1 acceptance criteria.
4. Telemetry observability is required for all funnel-critical criteria.

## Milestone Dependencies (Confirmed)

- M0 instrumentation baseline required before M1-M4 completion validation.
- M1 guided flow and M2 expert flow can overlap with shared contract checks.
- M3 relay policy depends on policy constraints finalized in this stage.
- M4 security-state normalization depends on approved priority rules.
- M5 readiness depends on passing P0 tests and telemetry validation.

## Blockers and Escalation (Confirmed)

Blocker classes:

- Product decision blocker
- Policy/security blocker
- Test infrastructure blocker
- Observability blocker

Escalation owner:

- Engineering Manager owns blocker routing and resolution tracking.

## Ownership Matrix (Confirmed)

- Product: guided/expert UX decisions, copy sign-off
- Engineering: implementation sequencing and dependency execution
- Security: state labeling and downgrade disclosure correctness
- QA: scenario matrix and gate validation
- Data: funnel/event contract verification

## Stage 2 Entry Criteria (Approved)

Stage 2 may begin when all criteria below are true:

1. Stage 1 decision set is documented and stable.
2. Acceptance criteria are conflict-free for P0/P1 scope.
3. Dependency map and owners are explicit.
4. No unresolved blocking ambiguity remains in guided vs expert boundaries.

## Risks to Watch During Stage 2

- Guided flow over-complexity from expert leakage
- Relay policy hard constraints causing avoidable dead ends
- Security-state rendering drift across surfaces
- Telemetry gaps on recovery and fallback paths

## Verification Checklist

- [x] Guided budget decisions recorded
- [x] Expert boundary decisions recorded
- [x] Relay policy decisions recorded
- [x] Security-state priority rules recorded
- [x] Copy + IA contracts recorded
- [x] Acceptance conflict policy recorded
- [x] Dependencies and owners recorded
- [x] Stage 2 entry criteria recorded

## Related Documents

- docs/groups/upgrade/04-guided-mode-experience-spec.md
- docs/groups/upgrade/05-expert-mode-experience-spec.md
- docs/groups/upgrade/06-room-relay-policy-and-private-relay-spec.md
- docs/groups/upgrade/07-pqc-group-security-model-and-ux-state-spec.md
- docs/groups/upgrade/08-navigation-information-architecture-and-route-plan.md
- docs/groups/upgrade/13-implementation-workplan-and-milestones.md
- docs/groups/upgrade/progress-tracker.md
