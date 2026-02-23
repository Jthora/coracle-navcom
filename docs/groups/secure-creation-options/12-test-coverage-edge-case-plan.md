# Test Coverage + Edge-Case Expansion Plan

Status: Proposed
Owner: QA + Engineering + Security
Last Updated: 2026-02-23

## Why this exists

Current coverage is strong for policy helpers and secure transport internals, but not yet deep enough to claim high confidence that every Security Mode path and PQC boundary works under adverse conditions.

## Audit Summary

### Well-covered areas

- Mode/policy helpers:
  - `tests/unit/app/groups/create-join-policy.spec.ts`
  - `tests/unit/app/groups/max-preconditions.spec.ts`
  - `tests/unit/app/groups/max-diagnostics.spec.ts`
- Secure transport behavior and tier-policy callbacks:
  - `tests/unit/engine/group-transport.spec.ts`
  - `tests/unit/engine/group-transport-secure-ops.spec.ts`
  - `tests/unit/engine/group-transport-secure-tier.spec.ts`
- Surface-separated evidence boundaries:
  - `tests/unit/app/groups/surface-evidence-report.spec.ts`
- Max E2E smoke path:
  - `cypress/e2e/groups-max-flow.cy.ts`

### Coverage gaps (priority order)

1. **Group command dispatch surface is under-tested**
   - `src/engine/group-commands.ts` has many branches (permission checks, diagnostics fallback audit, retry/recovery wrappers), but tests currently only validate message formatting (`tests/unit/engine/group-commands.spec.ts`).
2. **UI mode matrix depth is low**
   - Cypress currently has one explicit mode selection (`max`) and mostly smoke checks; no deterministic Auto/Basic/Secure/Max matrix with strict blocked-state assertions.
3. **Mode-level telemetry contract is not explicitly gated**
   - Existing telemetry tests validate transport canonicalization, but not full setup/join mode intent/resolution schema invariants for all modes.
4. **Relay capability fixture hardening tests are narrow**
   - Fixture path exists, but malformed fixture-shape/error behavior and fallback-to-real-probe behavior are not fully tested.
5. **PQC group-path adverse integration scenarios need expansion**
   - Existing secure/PQC tests are strong, but missing explicit end-to-end scenarios for key-state recovery interplay, rotated epoch mismatch under strict mode, and deterministic user-surface error assertions.

## Proposed Test Backlog

## T1 — Group Command Contract Matrix (Unit)

**Target files**
- New: `tests/unit/engine/group-commands-contract.spec.ts`

**Cases**
- Permission-denied branches for each action (`create`, `join`, `leave`, `put-member`, `remove-member`, `edit-metadata`).
- Diagnostics fallback audit behavior:
  - secure requested + baseline resolved => downgrade audit recorded.
  - secure requested + secure resolved => no downgrade audit.
- Recovery wrapper behavior:
  - retryable path retries and returns ack outcome.
  - non-retryable path returns deterministic mapped reason.

## T2 — Security Mode UX Matrix (Cypress)

**Target files**
- New: `cypress/e2e/groups-security-modes.cy.ts`

**Cases**
- Auto: fallback allowed, setup can continue when secure unavailable, telemetry reflects compatibility fallback.
- Basic: baseline-only posture surfaced; no strict-mode messaging leakage.
- Secure: blocked when secure pilot disabled or secure signal missing.
- Max: blocked for missing Navcom/NIP104/NIP-EE signals; active only when all strict checks pass.

## T3 — Strict Negative UX Paths (Cypress)

**Target files**
- New: `cypress/e2e/groups-strict-negative.cy.ts`

**Cases**
- Relay viability blocker prevents create/join.
- Auth-required without signer blocks with deterministic message.
- Tier-2 non-strict invite policy block messaging is deterministic and non-bypassable.

## T4 — Telemetry Contract Enforcement (Unit + Cypress)

**Target files**
- New: `tests/unit/app/groups/telemetry-contract.spec.ts`
- New: `cypress/e2e/groups-telemetry-contract.cy.ts`

**Cases**
- Required fields emitted for setup/join attempts:
  - requested/resolved transport
  - security mode requested/resolved (when introduced in P7.4.1)
  - policy block reason where applicable
- Tier-policy callback events include mission tier + reason + requested/resolved mode.

## T5 — Relay Capability Fixture Robustness (Unit)

**Target files**
- Extend: `tests/unit/app/groups/relay-capability.spec.ts`

**Cases**
- malformed fixture map => ignored safely
- missing relay fixture entry => default fixture shape used
- fixture disabled => real probe path invoked

## T6 — PQC Group Adversarial Integration (Unit)

**Target files**
- Extend: `tests/unit/engine/group-transport-secure-ops.spec.ts`
- Extend: `tests/unit/engine/pqc/secure-path-integration.spec.ts`

**Cases**
- corrupted epoch payload + repaired epoch mismatch => fail closed + deterministic reason.
- stale key lifecycle state with strict mode send => blocked and non-mutating outcome.
- removed member receives wrapped event after rotation => rejection + evidence logging.

## T7 — CI Gating for Coverage Regression

**Target files**
- `vitest.config.ts` / CI workflow scripts

**Cases**
- Add per-suite coverage threshold checks for group security modules.
- Add dedicated CI jobs for:
  - mode matrix unit tests
  - strict negative Cypress suite
  - max flow Cypress suite

## Definition of Done (Testing)

- All T1–T6 suites are implemented and passing in CI.
- No flaky quarantines for strict-mode blocking tests.
- PQC Group readiness claim blocked unless Group evidence tests pass independently from DM tests.
- Telemetry contract tests fail on schema drift for required fields.
