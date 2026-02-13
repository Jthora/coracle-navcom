# Relay Capability and Interoperability Matrix

Status: Draft
Owner: Interop Lead
Reviewers: QA, Security, Ops
Last Updated: 2026-02-12

## 1. Purpose

Define required relay and client capabilities by mode.
Establish interoperability acceptance matrix.
Drive gating for rollout and fallback decisions.

## 2. Scope

Relay protocol behaviors.
Client capability requirements.
Signer capability requirements.
Mode-specific readiness criteria.

## 3. Capability Categories

C1: Authentication behavior.
C2: Publish acknowledgment behavior.
C3: Query/filter support behavior.
C4: Group control event handling behavior.
C5: Retention and replay behavior.
C6: Secure transport dependency support.

## 4. Relay Capability Definitions

Auth challenge support.
Auth error semantics.
Rate-limit signaling consistency.
Deterministic OK/CLOSED behavior.
Support for required event kinds and filters.

## 5. Client Capability Definitions

Canonical event validation.
Projection reconciliation handling.
Mode badge and warning UX.
Policy engine integration.
Recovery and replay processing.

## 6. Signer Capability Definitions

Required encryption primitives.
Required signing behavior.
Prompt policy behavior for high-frequency operations.
Failure reason propagation.

## 7. Environment Profiles

Profile P0: Local dev relays.
Profile P1: Public mixed relays.
Profile P2: Curated mission relay set.
Profile P3: High-risk secure relay cohort.

## 8. Matrix Axes

Axis A: mission tier.
Axis B: transport mode.
Axis C: relay profile.
Axis D: client build variant.
Axis E: signer variant.

## 9. Required Matrix Coverage

Tier 0 x Mode A x P0/P1.
Tier 1 x Mode A/B x P1/P2.
Tier 2 x Mode B x P2/P3.
At least two signer variants for each secure test lane.

## 10. Capability Probe Strategy

Probe at startup for known relay set.
Probe on create/join flows.
Probe periodically in active groups.
Probe on explicit user refresh action.

## 11. Probe Output Contract

Relay URL.
Capability flags.
Confidence level.
Last successful probe timestamp.
Failure reason code and expiry window.

## 12. Readiness Levels

R0: Unknown.
R1: Basic baseline ready.
R2: Baseline + control action ready.
R3: Secure pilot ready.
R4: Production secure ready.

## 13. Interop Acceptance Criteria

No critical protocol parsing errors.
Publish ack reliability above threshold.
Projection convergence across relays.
Policy/fallback UX behavior correct.

## 14. Known Variance Handling

Variance list maintained with reason codes.
Blocking variances trigger hard fail at create/join.
Non-blocking variances trigger warning and fallback logic.
Variance records feed decision log updates.

## 15. Test Execution Rules

Run matrix nightly for active lanes.
Run full matrix before milestone promotion.
Run targeted matrix after protocol adapter changes.
Capture deterministic artifacts for failures.

## 16. Evidence Requirements

Capability snapshots from each lane.
Publish/subscribe traces with redaction.
Projection consistency reports.
Fallback trigger audit records.

## 17. Failure Classification

F1: capability probe false positive.
F2: capability probe false negative.
F3: publish ack instability.
F4: subscription divergence.
F5: policy mismatch behavior.

## 18. Remediation Workflow

Open issue with lane identifier.
Attach artifacts and reason codes.
Assign owner and priority.
Define temporary policy workaround if needed.
Retest lane before closing.

## 19. Operator Guidance

Use curated relay profiles for Tier 2.
Avoid unverified relays in secure mode.
Monitor fallback rates by workspace.
Respond to repeated probe instability.

## 20. Metrics

Capability probe success rate.
Mode-ready relay percentage by workspace.
Fallback frequency per mission tier.
Interop lane pass rate trend.

## 21. Security Constraints

No secure payload capture in matrix logs.
No secret material in probe output.
Redact identifiers in shared artifacts.
Limit diagnostic retention windows.

## 22. Open Questions

Minimum secure-ready relay count for Tier 2 groups.
How to score conflicting capability signals.
How to handle transient auth behavior drift.

## 23. Exit Criteria For This Document

Capability definitions approved.
Required lane coverage approved.
Acceptance criteria approved by QA and Security.
Referenced by rollout and test strategy docs.

## 24. Latest Lane Snapshot (2026-02-12)

| Lane ID | Tier/Mode/Profile | Latest Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| L-BASE-PRE-001 | Tier 0 / baseline-nip29 / P0 | PASS (preflight) | `tests/unit/app/groups/routes.spec.ts`, `tests/unit/app/groups/create-join.spec.ts` | Route tree and join/create prompts validated prior to matrix execution. |
| L-BASE-PRE-002 | Tier 1 / baseline-nip29 / P1 | PASS (preflight) | `tests/unit/app/groups/moderation-composer.spec.ts`, `tests/unit/app/groups/admin-visibility.spec.ts` | Moderation/admin workflow controls and guardrails pass focused unit suite. |
| L-SEC-PRE-001 | Tier 2 / secure-nip-ee / P2 | PASS (preflight) | `tests/unit/engine/group-key-lifecycle.spec.ts`, `tests/unit/engine/group-key-rotation.spec.ts`, `tests/unit/engine/group-secure-storage.spec.ts` | Key lifecycle and secure storage controls pass targeted tests. |
| L-INV-PRE-001 | Invite group context / baseline+secure / P1 | PASS (preflight) | `tests/unit/app/invite/schema.spec.ts`, `tests/unit/app/invite/create.spec.ts`, `tests/unit/app/invite/accept.spec.ts` | Group invite schema, QR payload generation, and accept prefill path validated. |
| L-BASE-001..L-BASE-005 | Tier 0/1 / baseline-nip29 / P0-P2 | PASS | `docs/groups/rebuild/13-baseline-lane-inventory.md`, `docs/groups/rebuild/14-baseline-lane-evidence-2026-02-12.md` | Baseline matrix execution completed with full lane coverage and green outcomes. |
| L-SEC-001..L-SEC-004 | Tier 1/2 / secure-nip-ee / P2-P3 | PASS | `docs/groups/rebuild/15-secure-lane-prerequisites.md`, `docs/groups/rebuild/16-secure-lane-evidence-2026-02-12.md` | Secure matrix execution completed, including downgrade-guard and variance outcomes. |
| L-MIX-001..L-MIX-003 | Tier 0/1 / mixed capability / P1-P2 | PASS (simulation preflight) | `docs/groups/rebuild/17-mixed-capability-lane-evidence-2026-02-12.md` | Capability mismatch simulation and fallback telemetry validations passed. |

## 25. Variance Notes and Mitigations (2026-02-12)

- V-2026-001: Full interop lane execution completed for current matrix scope; baseline and secure lane evidence is filed in `14` and `16` and no blocking variance remains.
- V-2026-002: Secure relay-profile variability (P2/P3) is quantified in secure lane evidence (`16` §4) with deterministic pass outcomes for fallback/block guard paths.
- V-2026-003: Invite payload compatibility spans legacy CSV and structured forms; mitigation is backward-compatible decoder coverage and invalid-entry ignore-with-warning behavior.
- All active variances are tracked in `docs/groups/rebuild/12-known-issues-ledger.md` with owners and target milestones.

## 26. Stage 6 Baseline Lane Inventory Reference

- Baseline lane inventory for `6.1.1.1.a` is defined in `docs/groups/rebuild/13-baseline-lane-inventory.md`.
- Execution and artifact filing for those lanes maps to `6.1.1.1.b` and `6.1.1.1.c`.
- Latest preflight evidence bundle is filed in `docs/groups/rebuild/14-baseline-lane-evidence-2026-02-12.md`.
- Secure lane prerequisite checklist for `6.1.1.2.a` is defined in `docs/groups/rebuild/15-secure-lane-prerequisites.md`.
- Latest secure preflight evidence bundle is filed in `docs/groups/rebuild/16-secure-lane-evidence-2026-02-12.md`.
- Mixed-capability simulation evidence for `6.1.1.3` is filed in `docs/groups/rebuild/17-mixed-capability-lane-evidence-2026-02-12.md`.
