# Secure Lane Prerequisites

Status: Active
Owner: Security Lead
Reviewers: Interop Lead, QA Lead
Last Updated: 2026-02-12

## 1. Purpose

Define mandatory prerequisites for Stage 6 secure pilot lane execution.
Provide deterministic readiness gates for `6.1.1.2.a`.
Reduce false positives during secure interoperability runs.

## 2. Scope

Applies to secure-nip-ee pilot lanes in profiles P2/P3.
Covers environment, signer, policy, evidence, and rollback-readiness prerequisites.
Does not replace lane execution procedures for `6.1.1.2.b`.

## 3. Secure Lane IDs in Scope

- L-SEC-001: Tier 1 secure pilot lane, P2 profile.
- L-SEC-002: Tier 2 secure pilot lane, P2 profile.
- L-SEC-003: Tier 2 secure pilot lane, P3 profile.
- L-SEC-004: Tier 2 downgrade-guard validation lane (mixed capability).

## 4. Prerequisite Checklist

| Prerequisite ID | Requirement | Owner |
| --- | --- | --- |
| SEC-PREQ-001 | Capability probes return stable readiness (`R3`+) for target secure relays. | Interop Lead |
| SEC-PREQ-002 | At least two signer variants are available for each secure lane. | QA Lead |
| SEC-PREQ-003 | Secure key lifecycle suites (rotation, revocation, remediation) pass in current branch. | Security Lead |
| SEC-PREQ-004 | Secure storage suites (encrypt/wipe/recovery) pass in current branch. | Security Lead |
| SEC-PREQ-005 | Downgrade guardrails are enabled and explicit override audit events are captured. | Core Team |
| SEC-PREQ-006 | Sensitive diagnostics redaction checks are enabled for lane artifacts. | Security Lead |
| SEC-PREQ-007 | Relay profile allowlist for P2/P3 is approved for lane run window. | Ops |
| SEC-PREQ-008 | Incident fallback contact path and rollback trigger table are available before run start. | Ops |

## 5. Minimum Test Gate Before Lane Start

- Gate L1/L2/L4 subsets relevant to secure flow must be green.
- Required focused suites:
  - `tests/unit/engine/group-key-lifecycle.spec.ts`
  - `tests/unit/engine/group-key-rotation.spec.ts`
  - `tests/unit/engine/group-compromise-remediation.spec.ts`
  - `tests/unit/engine/group-secure-storage.spec.ts`
  - `tests/unit/engine/group-secure-storage-recovery.spec.ts`

## 6. Required Evidence Artifacts

- Secure capability snapshot bundle per lane (`EVID-L-SEC-###-CAP`).
- Publish/subscribe traces with redaction (`EVID-L-SEC-###-TRACE`).
- Downgrade guard behavior proof (`EVID-L-SEC-004-DG`).
- Residual-risk note entry if any prerequisite is waived.

## 7. Waiver Rules

No waiver permitted for SEC-PREQ-003, SEC-PREQ-004, or SEC-PREQ-006.
Any waiver for other prerequisites requires Security + QA approval and expiry date.
Waived lanes must be tagged as provisional in interop reports.

## 8. Exit Criteria for 6.1.1.2.a

All prerequisite IDs mapped to owners.
No-blocker prerequisites validated or explicitly waived per rule.
Document is referenced from interop matrix and test strategy docs.
