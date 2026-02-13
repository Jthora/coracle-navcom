# Test Strategy and Quality Gates

Status: Draft
Owner: QA Lead
Reviewers: Engineering, Security, Product
Last Updated: 2026-02-12

## 1. Purpose

Define test strategy for Groups rebuild.
Establish mandatory quality gates for merge and release.
Standardize evidence required at each milestone.

## 2. Quality Philosophy

Test behavior, not implementation details only.
Prefer deterministic fixtures for protocol contracts.
Test failure and recovery paths as first-class concerns.
No release without tier-appropriate security validation.

## 3. Test Pyramid

Unit tests for domain logic and policy decisions.
Integration tests for adapters, projections, and stores.
E2E tests for user workflows.
Interop tests for relay/client matrix.
Resilience tests for network and replay anomalies.

## 4. Unit Test Scope

Group identifier parsing.
Policy engine decision outputs.
Capability gate evaluation.
Membership state transitions.
Moderation action idempotency.

## 5. Integration Test Scope

Projection ingestion and convergence.
Transport adapter send/subscribe/reconcile.
Route serialization and navigation flows.
Invite creation and acceptance.
Fallback and warning behavior.

## 6. E2E Test Scope

Create group workflow.
Join group workflow.
Send and receive workflow.
Moderation/admin workflow.
Policy override workflow.

## 7. Security Test Scope

Downgrade prevention tests for secure tiers.
Local encrypted storage behavior tests.
Key lifecycle rotation/revocation tests.
Sensitive logging redaction tests.

## 8. Interop Test Scope

Baseline mode lanes for required relay sets.
Secure mode pilot lanes for approved cohorts.
Signer variant compatibility lanes.
Mixed capability fallback lanes.

## 9. Performance Test Scope

Group list cold load latency.
Detail screen load latency.
Send ack median and tail latency.
Projection lag under burst traffic.
Memory use under sustained sessions.

## 10. Reliability Test Scope

Relay disconnect/reconnect cycles.
Out-of-order event delivery.
Duplicate event replay bursts.
Partial publish acknowledgment scenarios.
Offline intent queue behavior.

## 11. Fixture Strategy

Golden valid fixtures per event contract.
Golden invalid fixtures with reason-code expectations.
Replay and ordering stress fixture sets.
Cross-adapter round-trip fixture sets.

## 12. Data Management Rules

No production sensitive data in tests.
Use synthetic identities and payloads.
Version fixtures with contract revisions.
Preserve reproducibility through seed controls.

## 13. CI Gate Levels

Gate L1: unit + lint + type checks.
Gate L2: integration suite.
Gate L3: selected e2e suite.
Gate L4: security and interop lane checks.
Release requires all configured gates green.

## 14. Merge Requirements

PR links to affected contract sections.
PR links to test evidence for changed behavior.
No skipped failing tests without explicit waiver.
Waiver requires security + QA approval for high-risk areas.

## 15. Release Requirements

Full milestone acceptance suite pass.
Interop matrix pass for target rollout lanes.
Security gates pass for enabled mission tiers.
Known issues documented with risk acceptance.

## 16. Flake Management

Track flaky tests with issue IDs.
Quarantine only with owner and remediation date.
No critical-path flake allowed at release cut.
Require deterministic reproduction notes.

## 17. Failure Classification

Build failure.
Contract validation failure.
Projection consistency failure.
Policy enforcement failure.
Interop lane failure.

## 18. Triage Workflow

Capture failing artifact bundle.
Classify severity and impacted tiers.
Assign owner and ETA.
Decide block, quarantine, or rollback path.
Document in decision log.

## 19. Coverage Targets

Critical domain and policy paths: high coverage expectation.
Adapters and projections: high behavior coverage expectation.
UI workflows: representative high-value path coverage.
Security paths: explicit scenario coverage mandatory.

## 20. Negative Testing Requirements

Malformed events.
Unknown critical tags.
Stale control actions.
Unauthorized role operations.
Capability probe false positives and negatives.

## 21. Regression Protection

Retain legacy messaging regression suite during rebuild.
Protect route and serializer compatibility where promised.
Protect read/unread correctness during migration.

## 22. Observability Validation

Verify warning events emitted on fallback.
Verify metrics for mode selection and failures.
Verify sensitive data redaction in logs.

## 23. Evidence Package Requirements

Test run identifiers.
Passed/failed summary by suite.
Artifacts for failed scenarios.
Performance trend snapshots.
Risk assessment statement.

## 24. Open Questions

Final lane set size for nightly matrix.
Automated secure-mode test environment constraints.
Target performance thresholds by deployment profile.

## 25. Exit Criteria For This Document

Quality gates approved by QA and Engineering.
Security tests approved by Security.
Interop test plan approved by Interop Lead.
Referenced by milestone and rollout docs.

## 26. Stage 6 Lane Inventory References

- Baseline lane inventory (`6.1.1.1.a`) is defined in `docs/groups/rebuild/13-baseline-lane-inventory.md`.
- Secure lane prerequisites (`6.1.1.2.a`) are defined in `docs/groups/rebuild/15-secure-lane-prerequisites.md`.
