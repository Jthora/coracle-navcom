# Implementation Workplan and Milestones

Status: Draft
Owner: Engineering Manager
Last Updated: 2026-02-21

## Objective

Translate upgrade specs into executable phases with ownership and acceptance criteria.

## Milestones

- M0: Instrumentation and baseline measurement
- M1: Guided flow implementation
- M2: Expert controls and mode switch
- M3: Room relay policy + private relay UX
- M4: Security-state UX normalization
- M5: E2E hardening and rollout readiness

## Required per Milestone

- Scope checklist
- Owner
- Test gates
- Telemetry validation
- Rollback strategy

## Exit Criteria

- All P0/P1 items from audits mapped to milestones
- Dependencies and blockers explicitly tracked

## Critique of Prior Draft

The prior draft listed milestones but lacked execution detail.
It did not define dependency gates between milestones.
It did not define artifact requirements per milestone.

## Milestone Contract Template

Each milestone must include:

1. Scope in/out.
2. Primary owner.
3. Supporting owners.
4. Required artifacts.
5. Test gates.
6. Telemetry gates.
7. Rollback plan.

## Dependency Chain

- M0 must complete before M1-M4 implementation validation.
- M1 and M2 can overlap with careful API/UX contract alignment.
- M3 depends on policy model stability.
- M4 depends on state resolver decisions.
- M5 depends on all prior acceptance criteria.

## Artifact Requirements by Milestone

### M0

- Baseline dashboards.
- Event dictionary updates.

### M1

- Guided flow spec-to-implementation mapping.
- Guided e2e pack.

### M2

- Expert control matrix implementation notes.
- Mode switch regression suite.

### M3

- Relay policy behavior matrix.
- Private relay validation checklist.

### M4

- Security-state rendering matrix.
- Transition telemetry checks.

### M5

- Consolidated release-readiness report.

## Blocker Taxonomy

1. Product decision blockers.
2. Protocol/capability blockers.
3. Test infrastructure blockers.
4. Observability blockers.

## Reporting Cadence

- Weekly milestone review.
- Daily blocker updates while in active implementation.
- Release-candidate readiness checkpoint.

## Completion Definition

A milestone is complete only when:

- Scope checklist done.
- Tests pass at defined gate.
- Telemetry validations pass.
- Documentation updates merged.

## Exit Criteria

Workplan is complete when:

- All P0/P1 requirements are milestone-bound.
- Owners and dependencies are explicit.
- Completion definition is adopted by team.

