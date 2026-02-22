# Current State Baseline and Gap Traceability

Status: Draft
Owner: Engineering
Last Updated: 2026-02-21

## Purpose

Map every upgrade requirement to current behavior and known gaps.

## Inputs

- `docs/groups/audits/2026-02-21/audit-findings.md`
- `docs/groups/audits/2026-02-21/audit-findings-round2.md`
- `docs/groups/audits/2026-02-21/task-flow-matrix.md`

## Traceability Format

- Requirement ID
- Current behavior
- Gap severity (P0/P1/P2)
- Target behavior
- Dependencies
- Validation method (test + telemetry)

## Minimum Output

A complete matrix that can drive backlog slicing with no ambiguous requirements.

## Critique of Prior Draft

The prior draft was concise but not implementation-ready.
It did not include confidence levels for each claim.
It did not define ownership discipline per gap.
It did not include revalidation cadence after incremental delivery.

## Evidence Confidence Levels

- High: directly observed and code-correlated.
- Medium: observed in flow but not fully instrumented.
- Low: plausible but not yet validated.

Each row in the baseline matrix must include one confidence level.

## Expanded Gap Register

Each requirement row should include:

1. Requirement ID.
2. Current behavior summary.
3. User impact severity.
4. Frequency estimate.
5. Confidence level.
6. Evidence source reference.
7. Target behavior definition.
8. Owner and milestone.
9. Validation criteria.

## PQC/Transport Baseline Fields

Track whether:

- Secure intent can be selected predictably.
- Active secure state is visible in room context.
- Downgrade behavior has explicit disclosure.
- Recovery actions are understandable.

## Relay Policy Baseline Fields

Track whether:

- Room-level relay configuration is visible.
- Private relay setup is discoverable.
- Join/share flows preserve relay assumptions.
- Errors distinguish policy vs connectivity issues.

## Revalidation Cadence

- At end of each milestone.
- Before rollout gate.
- One week post-release using telemetry review.

## Owner Accountability Rules

1. No P0 gap without assigned owner.
2. No gap closed without evidence link.
3. No milestone marked complete with unresolved blocking P0.

## Acceptance Signals

- Matrix reviewed by Product, Engineering, QA, Security.
- P0/P1 priorities agreed.
- Every row has validation method.
- Every row maps to a delivery phase.
# Current State Baseline and Gap Traceability

Status: Draft
Owner: Engineering
Last Updated: 2026-02-21

## Purpose

Map every upgrade requirement to current behavior and known gaps.

## Inputs

- `docs/groups/audits/2026-02-21/audit-findings.md`
- `docs/groups/audits/2026-02-21/audit-findings-round2.md`
- `docs/groups/audits/2026-02-21/task-flow-matrix.md`

## Traceability Format

- Requirement ID
- Current behavior
- Gap severity (P0/P1/P2)
- Target behavior
- Dependencies
- Validation method (test + telemetry)

## Minimum Output

A complete matrix that can drive backlog slicing with no ambiguous requirements.
