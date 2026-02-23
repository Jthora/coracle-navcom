# M1/M2 File-by-File Implementation Backlog

Status: Draft
Owner: Engineering
Last Updated: 2026-02-22

## Purpose

Translate Milestone M1 (Create/Join Runtime Enforcement) and M2 (Secure Control-Plane Completion) into executable file-level work items.

## Scope

- Enforce mode behavior for Auto/Basic/Secure/Max in create/join.
- Complete secure control-action implementation for strict-mode viability.
- Ensure strict-mode fallback behavior is explicit, blocked by default, and audited when overridden.

## M1 — Create/Join Runtime Enforcement

## M1.1 Mode enforcement in guided flow

### File: src/app/views/GroupCreateJoin.svelte

Changes:

- Introduce explicit strict-mode create/join preflight branch:
  - `Secure` and `Max` hard fail when secure control path is unavailable.
- Make `shouldAllowCapabilityFallback` contractually mode-aware and centralize error messaging by mode.
- Add deterministic blocked reason mapping in UI state for:
  - secure pilot disabled,
  - capability readiness mismatch,
  - missing signer requirements,
  - relay auth/viability blockers.

Acceptance checks:

- `Auto` can fallback.
- `Basic` stays baseline path.
- `Secure/Max` do not silently proceed via baseline path.

### File: src/app/groups/guided-create-options.ts

Changes:

- Align mode copy to strict runtime truth:
  - remove any implication that strict modes may fallback by default.
- Add explicit “claim boundary” text for `Max` pending verified runtime prerequisites.

Acceptance checks:

- Help/status copy passes “no overclaiming” review.

### File: src/app/groups/transport-mode.ts

Changes:

- Confirm resolver behavior is limited to supported mode vocabulary and does not accept stale aliases.
- Add guardrail behavior for unknown mode inputs.

Acceptance checks:

- Resolver outputs deterministic `requestedMode` and source for all current mode inputs.

## M1.2 Engine-level enforcement wiring

### File: src/engine/group-commands.ts

Changes:

- Add/create wrappers for strict-mode operations that carry structured policy context where needed.
- Ensure create/join message paths share downgrade/audit behavior expectations consistently.

Acceptance checks:

- Diagnostics and downgrade audit events are emitted on all secure→baseline transitions when allowed.

### File: src/engine/group-transport.ts

Changes:

- Harden capability fallback checks and error reason consistency for strict modes.
- Standardize policy-block reason strings for UI and telemetry consumption.

Acceptance checks:

- Strict-mode requests fail with deterministic policy/capability reasons.

## M1.3 Messaging and state consistency

### File: src/app/groups/capability-gate.ts

Changes:

- Make capability gate message mode-aware:
  - Auto: fallback language allowed.
  - Secure/Max: fallback language blocked unless explicit override policy path is active.

### File: src/app/groups/security-state.ts

Changes:

- Split secure-state hints for strict-mode active vs compatibility fallback semantics.
- Remove ambiguous fallback wording from strict secure-active state.

Acceptance checks:

- User-facing state text aligns with actual strict-mode behavior.

## M1.4 Test updates

### Files:

- tests/unit/app/groups/transport-mode.spec.ts
- tests/unit/app/groups/capability-gate.spec.ts
- tests/unit/app/groups/security-state.spec.ts
- tests/unit/app/groups/relay-capability.spec.ts

Changes:

- Replace stale privacy literals and align tests to `auto/basic/secure/max` taxonomy.
- Add strict-mode messaging and fallback-policy expectation assertions.

Acceptance checks:

- Tests prove current taxonomy and strict-mode semantics.

## M2 — Secure Control-Plane Completion

## M2.1 Implement secure control actions

### File: src/engine/group-transport-secure.ts

Changes:

- Replace `publishControlAction` unsupported path with secure control-action dispatcher.
- Route create/join/leave/put-member/remove-member/edit-metadata actions into secure ops.

Acceptance checks:

- Secure adapter can publish all required control actions for strict modes.

### File: src/engine/group-transport-secure-ops.ts

Changes:

- Add secure control-action handlers and input validators.
- Reuse existing secure key lifecycle and send wrapper patterns where applicable.
- Emit structured transport errors and reason codes.

Acceptance checks:

- Control actions return deterministic success/error results.

## M2.2 Control-plane protocol contract clarity

### File: src/domain/group-kinds.ts

Changes:

- Confirm/extend event-kind mapping if secure control paths require additional kinds.

### File: src/domain/group-control.ts

Changes:

- Ensure control templates support secure path requirements or add secure equivalents.

Acceptance checks:

- Protocol/event contract remains explicit and test-covered.

## M2.3 Engine policy and auditing integration

### Files:

- src/engine/group-tier-policy.ts
- src/engine/group-downgrade-audit.ts (and related consumers)

Changes:

- Confirm strict create/join control actions trigger tier-policy blocks/overrides consistently.
- Ensure override events are auditable and queryable.

Acceptance checks:

- Tier policy behavior is consistent for control and send paths.

## M2.4 Test and integration coverage

### Files:

- tests/unit/engine/group-transport-secure.spec.ts
- tests/unit/engine/group-transport.spec.ts
- tests/unit/engine/group-commands.spec.ts (or nearest command coverage)
- tests/unit/app/groups/create-join-prompt.spec.ts
- cypress/e2e/groups-smoke.cy.ts (strict-mode paths)

Changes:

- Add tests proving secure control actions are reachable and enforced.
- Add strict create/join negative tests for blocked preconditions.
- Add strict-mode happy-path test for create/join when prerequisites pass.

Acceptance checks:

- No strict-mode create/join claim without passing control-path tests.

## Sequencing (Execution Order)

1. M1 UI/engine policy alignment and stale-test cleanup.
2. M2 secure adapter control-action implementation.
3. M2 tier/audit integration and strict-mode e2e validation.

## Merge Gates for M1/M2

- Mode taxonomy tests green.
- Strict-mode fallback behavior deterministic and documented.
- Secure control actions implemented for all required group actions.
- Telemetry includes requested/resolved mode and policy-block reasons.
