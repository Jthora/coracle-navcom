# Groups Upgrade Documentation Map

Status: Draft
Owner: Copilot + Core Team
Last Updated: 2026-02-21

## Purpose

This directory defines the implementation-ready documentation set for upgrading Groups UX and operations so users can:

- Create and operate group chat rooms easily
- Use PQC-level security where available
- Understand compatibility and fallback states
- Configure room-level relay routing, including private/self-hosted relays

## Critique of Prior Draft

The prior version of this file was too concise for implementation orchestration.
It listed files but did not define depth standards or artifact quality gates.
It did not define how to keep the docs synchronized as implementation progresses.
It did not define review workflow, ownership boundaries, or decision-recording requirements.
It did not include readiness criteria for starting engineering work against each document.

## What This Documentation Set Must Enable

1. Product and UX alignment on guided and expert paths.
2. Security alignment on PQC-related states and fallback semantics.
3. Engineering alignment on route behavior, relay policy, and data flow.
4. QA alignment on test strategy and quality gates.
5. Release alignment on rollout and risk controls.

## Inputs

Primary source of truth for gaps and findings:

- `docs/groups/audits/2026-02-21/audit-findings.md`
- `docs/groups/audits/2026-02-21/audit-findings-round2.md`
- `docs/groups/audits/2026-02-21/task-flow-matrix.md`
- `docs/groups/audits/2026-02-21/ia-and-copy-audit.md`
- `docs/groups/audits/2026-02-21/telemetry-gap-plan.md`
- `docs/groups/audits/2026-02-21/ux-test-gap-plan.md`
- `docs/groups/audits/2026-02-21/guided-vs-expert-contract.md`

## Document Set

1. `01-upgrade-charter-and-success-metrics.md`
2. `02-personas-jtbd-and-primary-user-tasks.md`
3. `03-current-state-baseline-and-gap-traceability.md`
4. `04-guided-mode-experience-spec.md`
5. `05-expert-mode-experience-spec.md`
6. `06-room-relay-policy-and-private-relay-spec.md`
7. `07-pqc-group-security-model-and-ux-state-spec.md`
8. `08-navigation-information-architecture-and-route-plan.md`
9. `09-copy-help-and-education-plan.md`
10. `10-telemetry-funnel-and-observability-spec.md`
11. `11-test-strategy-and-quality-gates.md`
12. `12-rollout-migration-and-risk-controls.md`
13. `13-implementation-workplan-and-milestones.md`
14. `progress-tracker.md`

## Quality Standard for Every Document

Each document must include:

1. Status, owner, and last-updated metadata.
2. Critique of prior draft and missing detail.
3. Scope, non-goals, and constraints.
4. Explicit decisions required and open questions.
5. Acceptance criteria and validation method.
6. Risks and fallback/rollback considerations.
7. Dependencies and linked artifacts.

## Required Traceability Model

Every requirement in this directory must trace to at least one of:

- an audit finding,
- a user task,
- a security requirement,
- a test requirement,
- a telemetry requirement.

Recommended ID model:

- `UG-REQ-*` for upgrade requirements,
- `UG-ACC-*` for acceptance criteria,
- `UG-RISK-*` for tracked risks,
- `UG-DEC-*` for unresolved decisions.

## Review and Approval Workflow

1. Author updates draft.
2. Product review for user-task correctness.
3. Security review for state/fallback claims.
4. Engineering review for implementation feasibility.
5. QA review for testability and observability.
6. Release review for rollout implications.

## Cadence

- During planning: update at least once per week.
- During implementation: update at least once per milestone.
- During rollout: update after each phase checkpoint.

## Change Control Rules

1. No silent changes to acceptance criteria.
2. No protocol-state copy changes without security review.
3. No relay policy changes without rollout impact notes.
4. No test gate changes without QA sign-off.

## Implementation Readiness Checklist

Before coding starts for a milestone:

- [ ] Relevant documents reviewed and approved.
- [ ] Open decisions either resolved or explicitly deferred with owner/date.
- [ ] Acceptance criteria testable and mapped to planned tests.
- [ ] Telemetry events identified for impacted flow steps.
- [ ] Rollback conditions and kill criteria defined.

## Exit Condition for This Directory

The directory is implementation-ready when:

1. Every document has approved status.
2. Every open decision has an owner and target date.
3. Every P0/P1 audit finding has a mapped remediation item.
4. `progress-tracker.md` reflects current phase and evidence.

## Notes

This directory is intentionally verbose.
The verbosity is required to reduce ambiguity and avoid UX regressions during implementation.
# Groups Upgrade Documentation Map

Status: Draft
Owner: Copilot + Core Team
Last Updated: 2026-02-21

## Purpose

This directory defines the implementation-ready documentation set for upgrading Groups UX and operations so users can:

- Create and operate group chat rooms easily
- Use PQC-level security where available
- Understand compatibility and fallback states
- Configure room-level relay routing, including private/self-hosted relays

## Inputs

Primary inputs are the audit outputs from:

- `docs/groups/audits/2026-02-21/`

## Document Set

1. `01-upgrade-charter-and-success-metrics.md`
2. `02-personas-jtbd-and-primary-user-tasks.md`
3. `03-current-state-baseline-and-gap-traceability.md`
4. `04-guided-mode-experience-spec.md`
5. `05-expert-mode-experience-spec.md`
6. `06-room-relay-policy-and-private-relay-spec.md`
7. `07-pqc-group-security-model-and-ux-state-spec.md`
8. `08-navigation-information-architecture-and-route-plan.md`
9. `09-copy-help-and-education-plan.md`
10. `10-telemetry-funnel-and-observability-spec.md`
11. `11-test-strategy-and-quality-gates.md`
12. `12-rollout-migration-and-risk-controls.md`
13. `13-implementation-workplan-and-milestones.md`
14. `progress-tracker.md`

## Exit Condition for This Directory

The upgrade is implementation-ready when each document has:

- Approved status and owner
- Explicit acceptance criteria
- Traceability to audit findings
- Linked test and telemetry requirements
