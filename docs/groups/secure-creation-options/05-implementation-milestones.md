# Implementation Milestones

Status: Draft
Owner: Engineering
Last Updated: 2026-02-23

## Phase P0 — Program Foundation (Completed)

- Publish secure-creation documentation set.
- Capture deep-audit coverage gaps and mandatory plan corrections.
- Establish progress tracking and evidence traceability workflow.

Exit Criteria:

- Documentation baseline published and actively maintained.

## Phase P1 — Contract + Governance Alignment

- Finalize mode contracts and non-negotiables.
- Finalize protocol matrix and claim boundaries.
- Finalize telemetry schema fields.
- Realign test contracts with current mode taxonomy (`auto`, `basic`, `secure`, `max`).
- Define canonical mapping from invite transport hints (`baseline-nip29` / `secure-nip-ee`) to security mode behavior.
- Clarify execution posture: this phase does not impose a code freeze and does not require feature-flag-only delivery for active implementation work.

Exit Criteria:

- Security/Product/Engineering sign-off captured.

## Phase P2 — Create/Join Runtime Enforcement (Completed)

- Ensure mode selection is enforced in create/join dispatch.
- Implement strict blocking behavior for `Secure` and `Max` when prerequisites fail.
- Ensure reason-code surfaced remediation.
- Integrate existing relay viability/auth-required gating as mandatory preflight dependency.
- Add mode-aware capability/state UX messaging so strict modes do not imply fallback.
- Propagate invite mission-tier policy context into create/join enforcement paths.

Exit Criteria:

- Unit tests pass for mode × capability matrix.

## Phase P3 — Secure Control-Plane Completion (Completed)

- Complete secure control-action support needed for strict modes.
- Remove any strict-mode path that silently resolves to incompatible fallback.
- Treat secure control-action completion as blocker for strict mode readiness claims.

Exit Criteria:

- Create/join/admin control actions work under secure-capable runtime.

## Phase P4 — Max Mode PQC Preconditions (Completed)

- Add single precondition evaluator for Max.
- Enforce Navcom-only policy constraints.
- Block with deterministic reason codes when any requirement fails.
- Integrate existing key-rotation durability/replay hooks into strict-mode lifecycle tests.
- Verify secure storage/recovery integration points for strict-mode group flows.

Exit Criteria:

- Max mode preflight correctness tests pass.

## Phase P5 — End-to-End Crypto Validation (Completed)

- Validate strict-mode send/receive correctness.
- Verify tamper and downgrade fail-closed behavior.
- Validate recovery UX for blocked scenarios.
- Require cryptographic evidence beyond envelope/schema validation before PQC claims.
- Add explicit tier-policy confirmation flow coverage (mission tier, downgrade confirmation, override audit event).
- Split PQC evidence reporting by surface: DM readiness vs Group readiness (group claims require group-specific evidence).

Exit Criteria:

- Integration + e2e strict-mode suites pass.

## Phase P6 — Verification Test Hardening (In Progress)

- Expand unit contract matrix coverage across mode and command paths.
- Add deterministic UI mode-matrix suites for `auto`, `basic`, `secure`, `max`.
- Add explicit smoke tests for strict create/join/chat and critical negative paths.
- Add telemetry schema contract tests and CI guards for required fields.
- Add dedicated CI gates for unit, UI, and smoke test suites before rollout progression.

Exit Criteria:

- Unit, UI, and smoke suites pass in CI with no unresolved strict-mode flaky failures.

## Phase P7 — Rollout + Claim Readiness (In Progress)

- Staged flag rollout.
- Observe metrics and error budgets.
- Sign off “PQC-ready” only after evidence gate pass.
- Upgrade telemetry contract to include explicit mode-level fields and compliance dashboards.
- Add tier-policy and downgrade observability review checkpoints.

Exit Criteria:

- One release observation window passes thresholds.

## Phase P8 — Post-Release Operational Hardening (Planned)

- Capture rollback drill outcomes and update runbooks.
- Triage production telemetry drift and enforce schema conformance checks.
- Establish periodic PQC evidence recertification cadence for DM and Group surfaces.

Exit Criteria:

- Runbooks updated from real rollout incidents/exercises.
- Recertification schedule and ownership approved.
