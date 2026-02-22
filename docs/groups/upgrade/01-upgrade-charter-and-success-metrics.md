# Groups Upgrade Charter and Success Metrics

Status: Draft
Owner: Product + Engineering
Reviewers: Security, QA
Last Updated: 2026-02-21

## Mission

Upgrade Groups so users can create, operate, and secure group chat rooms with low friction.
Support both beginner-friendly guided paths and expert-level control surfaces.
Enable room-level relay targeting, including private/self-hosted relays outside public rosters.

## Critique of Prior Draft

The previous draft was too short for a governing charter.
It did not define measurable thresholds, ownership model, or phase gates.
It did not define explicit non-negotiable safety constraints for security-state messaging.
It did not define how to evaluate user ease-of-use versus protocol correctness.
It did not define what “done” means for MVP versus broad rollout.

## Strategic Outcomes

1. New users can create a room and send a first message quickly.
2. Operators can configure relay and policy behavior per room.
3. Security posture is transparent and truthful in all UI states.
4. Invite flows convert reliably from link to active participation.

## In Scope

- Guided mode UX for setup and daily operation.
- Expert mode UX for advanced control.
- Room-level relay configuration with private relay support.
- PQC-related security-state rendering and fallback transparency.
- Invite/share flow improvements and conversion instrumentation.

## Out of Scope

- Full protocol rewrite.
- Mandatory secure mode for all rooms on day one.
- Breaking baseline interoperability.
- Replacing unrelated app onboarding flows.

## Non-Negotiable Constraints

1. Never claim secure state when fallback is active.
2. Never hide fallback reason from users/admins.
3. Never remove rollback controls during rollout phases.
4. Never ship without measurable funnel telemetry.
5. Never ship without novice-flow e2e coverage for P0 paths.

## User Success Metrics

### Primary KPIs

1. Create-to-first-message completion rate.
2. Median time to first message after entering group setup.
3. Invite accept to active membership conversion.
4. Invite accept to first message conversion.

### Secondary KPIs

1. Guard redirect recovery completion rate.
2. Security-state comprehension proxy (details-open and recovery-action rate).
3. Room relay configuration completion rate.

## Engineering/Quality Metrics

1. No regression in baseline group send/read reliability.
2. P0 e2e suite pass rate at release checkpoints.
3. Telemetry schema stability through rollout.
4. Defect escape rate below agreed threshold for group flows.

## Security Metrics

1. Security-state rendering always matches runtime transport state.
2. Fallback events are always user-visible where required.
3. No insecure downgrade in restricted policy modes.

## Phase Gates

### Gate A: Planning Complete

- Docs approved
- Open decisions tracked
- Acceptance criteria testable

### Gate B: Build Complete

- P0 implementation complete
- P0 tests passing
- Telemetry events shipping

### Gate C: Pilot Complete

- Funnel metrics collected
- No critical security/UI truthfulness issues
- Rollback drill validated

### Gate D: Broad Rollout Approval

- KPI trajectory acceptable
- Operational playbook confirmed
- Residual risk accepted by stakeholders

## Ownership Model

- Product: UX behavior, copy, success criteria.
- Security: state/fallback policy truthfulness and constraints.
- Engineering: implementation and technical feasibility.
- QA: test coverage and quality gates.
- Release/Ops: rollout controls and incident readiness.

## Definition of Done (MVP)

1. Guided flow works end-to-end for create/join/send.
2. Expert mode available for advanced controls.
3. Room relay policy supports private relay input.
4. Security states are consistent and user-understandable.
5. P0 telemetry and tests are live.

## Definition of Done (Broad Release)

1. Pilot metrics meet agreed thresholds.
2. P1 improvements delivered and validated.
3. Support/runbook readiness complete.
4. No unresolved high-severity audit issues.

## Open Decisions (Initial)

- What default mode should new users start in?
- How strict should secure-intent handling be in guided mode?
- What minimum room relay policy is required?

## Governance

This charter governs all upgrade docs in `docs/groups/upgrade/`.
Conflicting decisions must be escalated and resolved in writing.
# Groups Upgrade Charter and Success Metrics

Status: Draft
Owner: Product + Engineering
Last Updated: 2026-02-21

## Goal

Upgrade existing Groups so setup and operation are easy for new users while preserving expert controls and PQC security posture.

## In Scope

- Guided and Expert experiences for group setup/operation
- Room-level relay configuration, including private relays
- Security-state transparency for PQC/fallback behavior
- Invite/share usability

## Non-Goals

- Replacing all protocol internals
- Breaking baseline interoperability

## Success Metrics

- Create-to-first-message completion rate
- Time-to-first-message
- Invite accept to active member conversion
- Invite accept to first-message conversion
- User comprehension of security state

## Mandatory Constraints

- No misleading security claims
- Deterministic fallback behavior
- Support for room-level relay targets including private relays
