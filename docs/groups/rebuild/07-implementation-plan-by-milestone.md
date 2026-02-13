# Implementation Plan by Milestone

Status: Draft
Owner: Engineering Manager
Reviewers: Architecture, Security, QA, Product
Last Updated: 2026-02-12

## 1. Purpose

Convert strategy into actionable delivery milestones.
Define dependencies, acceptance gates, and ownership.
Enable predictable implementation cadence.

## 2. Planning Principles

Ship in thin vertical slices.
Protect existing messaging behavior while iterating.
Gate high-risk changes behind flags.
Require evidence at each milestone boundary.

## 3. Milestone Overview

M0: Foundations and contracts.
M1: Group domain and projections.
M2: Baseline transport and routes.
M3: Moderation/admin and invites.
M4: Secure pilot adapter and key lifecycle.
M5: Hardening, matrix validation, rollout prep.

## 4. M0 Scope

Approve charter, threat model, protocol matrix.
Approve target architecture and event contracts.
Create schema registry scaffold.
Create feature-flag scaffolding for groups rebuild.

## 5. M0 Exit Criteria

All strategy docs approved.
Schema registry scaffold merged.
Feature flags available in app config.
No unresolved architecture blockers.

## 6. M1 Scope

Implement Group domain entities.
Implement canonical group identifier parser.
Implement group summary/detail projections.
Implement projection persistence checkpoints.

## 7. M1 Dependencies

M0 contract approval.
Storage adapter extension plan.
Baseline projection test harness.

## 8. M1 Exit Criteria

Group list projections stable on fixture data.
Projection idempotency tests pass.
Legacy messaging regression suite unchanged.
No critical performance regression.

## 9. M2 Scope

Implement GroupTransport interface.
Implement baseline adapter.
Add /groups route tree and serializers.
Add groups list/detail/create screens (baseline).
Wire composer through transport resolver.

## 10. M2 Dependencies

M1 domain/projections available.
UI composition decisions from architecture doc.
Capability gate skeleton.

## 11. M2 Exit Criteria

Create/join/send/read works in baseline mode.
Policy engine selects baseline deterministically.
Fallback warning UX functional.
Channel regression tests remain green.

## 12. M3 Scope

Implement membership state machine.
Implement moderation/admin actions.
Implement group settings and policy editor.
Extend invite model to include group context.

## 13. M3 Dependencies

M2 baseline end-to-end flow stable.
Event contracts for control actions finalized.
Role policy rules approved.

## 14. M3 Exit Criteria

Membership transitions deterministic and tested.
Moderation action replay/idempotency tests pass.
Invite create/accept supports groups.
Audit trail visible in UI.

## 15. M4 Scope

Implement secure pilot adapter.
Implement keypackage lifecycle service.
Implement secure local state handling.
Integrate secure mode with policy engine.

## 16. M4 Dependencies

Security hardening policy approved.
Capability matrix minimum lanes available.
Signer capability checks integrated.

## 17. M4 Exit Criteria

Secure pilot create/join/send/read works in pilot lanes.
No plaintext leakage in secure mode tests.
Downgrade policy enforcement tests pass.
Key lifecycle checks pass.

## 18. M5 Scope

Run full interop matrix.
Run reliability and performance sweeps.
Finalize rollback and kill-switch controls.
Complete operational runbooks and release notes.

## 19. M5 Dependencies

M4 pilot stable with known residual risks.
Ops and support readiness training.
Telemetry dashboards and alerts configured.

## 20. M5 Exit Criteria

Interop matrix pass in required lanes.
Quality gates all green.
Security sign-off complete.
Rollout plan approved.

## 21. Cross-Cutting Workstreams

W1: Documentation and decision logging.
W2: Test harness and fixtures.
W3: Observability and diagnostics.
W4: Performance optimization.
W5: UX copy and onboarding updates.

## 22. Ownership Model

Each milestone has primary DRI.
Each cross-cutting workstream has DRI.
Security and QA co-approve milestone exits.
No milestone closes without evidence package.

## 23. Risk Controls Per Milestone

M1 risk: projection complexity.
Mitigation: deterministic fixture-first validation.
M2 risk: route and composer regressions.
Mitigation: strict regression suite and feature flag.
M3 risk: moderation semantics drift.
Mitigation: contract-driven control action tests.
M4 risk: secure mode reliability.
Mitigation: pilot cohort and fallback controls.
M5 risk: rollout blast radius.
Mitigation: staged enablement and kill-switch drills.

## 24. Evidence Package Template

Milestone summary.
Completed scope checklist.
Failed/deferred items list.
Test and metrics evidence links.
Decision log updates.
Residual risk statement.

## 25. Not-Ready Conditions

Unapproved architecture changes.
Red security findings unresolved.
Intermittent data corruption issues.
Unknown fallback behavior under relay failure.

## 26. Change Control

Scope changes require milestone impact note.
Timeline changes require risk update.
Any contract change requires version note and migration impact.

## 27. Open Questions

Exact timeline cadence by team capacity.
Parallelization limits across workstreams.
Secure pilot cohort composition.

## 28. Exit Criteria For This Document

Milestones approved by engineering and product.
Dependencies validated by architecture.
Exit gates approved by QA and Security.
Linked to quality and rollout documents.
