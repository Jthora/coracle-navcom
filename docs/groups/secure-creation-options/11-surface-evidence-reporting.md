# Surface-Separated Evidence Reporting

Status: Active
Owner: Security + QA + Engineering
Last Updated: 2026-02-22

## Purpose

Provide explicit evidence separation so DM maturity is not used as substitute proof for group claim readiness.

## DM Evidence Section

DM claim readiness evidence is tracked from DM-specific secure path tests and must be evaluated independently from group coverage.

Current DM evidence anchors:

- `tests/unit/engine/pqc/secure-path-integration.spec.ts`
- `tests/unit/engine/pqc/group-epoch-decrypt.spec.ts`

Readiness rule:

- DM claim readiness is blocked if DM evidence checks are missing, pending, or failing.

## Group Evidence Section

Group claim readiness evidence is tracked from group create/join/chat strict-mode coverage and tier-policy telemetry coverage.

Current Group evidence anchors:

- `tests/unit/engine/group-transport.spec.ts`
- `tests/unit/engine/group-transport-secure.spec.ts`
- `tests/unit/engine/group-transport-secure-ops.spec.ts`

Readiness rule:

- Group claim readiness is blocked unless group-specific checks pass.
- DM evidence cannot satisfy group claim readiness.

## Implementation Notes

Surface-separated evidence reporting is implemented in:

- `src/app/groups/surface-evidence-report.ts`

Coverage is validated in:

- `tests/unit/app/groups/surface-evidence-report.spec.ts`

This implementation enforces:

- independent DM vs Group readiness states,
- deterministic blocking reasons (`EVIDENCE_MISSING`, `EVIDENCE_INCOMPLETE`),
- sectioned markdown output for DM and Group evidence surfaces.
