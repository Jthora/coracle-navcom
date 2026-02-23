# Deep Codebase Audit and Coverage Gaps

Status: Active
Owner: Security + Engineering
Last Updated: 2026-02-22

## Why this document exists

The initial secure-creation plan was directionally correct, but a deeper audit found critical implementation realities and pre-existing functionality that must be reflected in execution scope.

## Critical findings from deeper audit

## F-01 Secure control path is not complete

- Secure transport adapter currently does not implement control actions (`publishControlAction` returns unsupported).
- Impact: strict `Secure`/`Max` create/join cannot be treated as complete today.
- Execution implication: Milestone M2 is a hard prerequisite for strict mode readiness claims.

## F-02 Group secure envelope path is not sufficient proof of confidentiality on its own

- Group epoch envelope content currently encodes plaintext into `ct` via base64-style encoding and decodes correspondingly.
- Impact: envelope format alone is not evidence of cryptographic confidentiality.
- Execution implication: M4 evidence must verify cryptographic guarantees from full runtime path, not envelope labeling.

## F-03 NIP-104 is currently a capability/profile signal, not an enforceable runtime protocol guarantee

- Relay capability checks parse and report NIP-104 advertisement signals.
- Impact: NIP-104 presence cannot alone justify “PQC active” claims.
- Execution implication: Mode docs and UI text must keep NIP-104 in signaling/profile role unless runtime enforcement is added.

## F-04 Existing create/join relay hardening is already substantial and should be reused

- Relay viability and auth-required gating already block invalid create/join attempts.
- Impact: this is a critical existing capability, not a missing area.
- Execution implication: secure-mode rollout should integrate with this path rather than rebuild duplicate checks.

## F-05 Secure pilot activation path exists in production bootstrap

- Secure pilot runtime is initialized through environment/storage bootstrap wiring.
- Impact: plan must avoid assuming “test-only” activation.
- Execution implication: rollout docs should treat pilot activation as controlled runtime behavior with explicit flags and kill switch.

## F-06 Baseline adapter currently accepts secure mode requests as fallback-compatible

- Baseline transport can operate for both baseline and secure requested modes.
- Impact: fallback can occur unless strict policy prevents it.
- Execution implication: strict mode enforcement must explicitly block incompatible resolution without override policy.

## F-07 Message path policy knobs are not fully surfaced at UX layer

- Group send path sets requested mode from projection transport but does not expose mission-tier/downgrade confirmation controls in normal chat flow.
- Impact: strict policy behavior may be underexpressed in UX.
- Execution implication: add policy UX coverage requirements in M1/M4.

## F-08 Test drift risk exists in mode resolver specs

- Existing transport-mode unit spec references legacy privacy literals (`private`, `standard`, `fallback-friendly`) that diverge from current mode taxonomy (`auto`, `basic`, `secure`, `max`).
- Impact: false confidence risk if tests are stale or not aligned with current contract.
- Execution implication: add explicit test-contract realignment task in M0 and M1 gates.

## F-09 Tier-policy controls are implemented in engine but under-surfaced in default UX

- Transport policy supports mission tiers, downgrade confirmation, and tier-2 override controls.
- Current group chat UX path does not expose these controls in normal send flow.
- Impact: strict-mode downgrade semantics can be enforced in engine but appear opaque to users/operators.
- Execution implication: include explicit UX + telemetry tasks for tier-policy visibility and explicit confirmations.

## F-10 Capability-gate messaging can conflict with strict-mode intent

- Capability gate messaging currently says baseline fallback may be used when secure readiness is insufficient.
- Impact: message can be misleading in strict modes where fallback should be blocked.
- Execution implication: gate messaging and plan copy must become mode-aware (Auto vs Secure/Max).

## F-11 Group secure-state messaging still implies possible fallback in secure-active state

- Security-state hints currently include fallback language when secure transport is active.
- Impact: user understanding of strict-mode guarantees can degrade.
- Execution implication: add strict-mode-specific state text and acceptance checks for wording precision.

## F-12 Group-vs-DM PQC boundary must be explicit

- DM PQC envelope and receive validation paths are well-developed and tested.
- Group secure send path has separate implementation constraints and must not inherit DM readiness claims implicitly.
- Impact: without explicit boundary docs, plan may over-credit group readiness from DM coverage.
- Execution implication: add protocol/crypto validation gates split by surface (DM vs Groups) and require group-specific evidence for group claims.

## F-13 Rotation durability is more mature than initially captured

- Key rotation service persists jobs with schema/version checks, replay summaries, and idempotency keys.
- Impact: this existing functionality should be treated as dependency leverage rather than a missing baseline.
- Execution implication: shift plan tasks from “build from scratch” to “integrate strict-mode triggers + validate replay under strict-mode failures”.

## F-14 Invite mission tier/policy context is not enforced through create/join actions

- Invite accept path preserves `missionTier`, `preferredMode`, and `label` metadata for prefill.
- Group setup view currently surfaces mission tier as hint text but does not pass mission tier into create/join control action dispatch.
- Impact: invite-provided strict policy intent can be visible but not enforced for create/join operations.
- Execution implication: add explicit invite-policy propagation and enforcement tasks for create/join.

## F-15 Invite mode vocabulary is transport-level, not mode-level

- Invite schema supports `preferredMode` values (`baseline-nip29`, `secure-nip-ee`) but not explicit Auto/Basic/Secure/Max mode semantics.
- Impact: mode-level product contract may degrade when invites carry transport-only hints.
- Execution implication: define canonical mapping rules between invite transport hints and security modes.

## F-16 Secure storage and recovery are implemented but appear under-integrated in production flow

- Secure storage supports AES-GCM encryption and recovery helpers with corruption typing.
- Direct usage appears concentrated in tests and helper modules; production lifecycle integration is not explicit in audited group flow paths.
- Impact: recovery guarantees may be documented stronger than current runtime integration evidence.
- Execution implication: add integration verification tasks and telemetry for storage recovery pathways.

## F-17 Telemetry contract drift versus plan schema

- Group telemetry canonicalizes transport fields, but mode-level contract fields (`security_mode_requested`, `security_mode_resolved`) are not yet first-class in audited emission paths.
- Impact: rollout analytics can miss explicit mode-contract compliance evidence.
- Execution implication: add telemetry contract upgrade tasks and tests for mode-level fields.

## F-18 E2E/spec copy drift risk persists

- Audited groups smoke expectations still reference older security copy patterns.
- Impact: tests may pass/fail for wording reasons unrelated to core security contract behavior.
- Execution implication: shift key e2e assertions toward behavior/state signals and add copy drift maintenance tasks.

## Coverage gaps in initial documentation set

1. It did not explicitly track existing relay-auth/viability gating as reusable baseline capability.
2. It did not call out stale mode-taxonomy tests as a validation risk.
3. It did not explicitly separate NIP-104 signaling from enforceable protocol guarantees in acceptance language.
4. It did not state that strict-mode create/join is blocked by missing secure control-action support.
5. It did not explicitly separate engine-enforced tier-policy controls from UX-surfaced confirmations.
6. It did not call out mode-aware fallback messaging consistency requirements.
7. It did not split DM PQC maturity from group PQC maturity in claim readiness criteria.
8. It underrepresented existing key-rotation durability/replay implementation.
9. It did not capture invite mission-tier enforcement gap for create/join.
10. It did not capture invite transport-hint vs mode-contract mapping requirements.
11. It did not track secure-storage integration evidence depth in production paths.
12. It did not include mode-level telemetry schema drift risks.
13. It did not include e2e copy-drift hardening requirements.

## Required plan updates (mandatory)

- M0: Add test-contract alignment checkpoint for mode taxonomy.
- M1: Add explicit integration requirement with relay viability/auth gates.
- M2: Mark secure control-action completion as strict-mode blocker.
- M4: Require cryptographic evidence criteria beyond envelope schema checks.
- Validation gates: add stale-test detection and mode-contract traceability checks.
- M1/M4: add tier-policy UX surface and confirmation capture requirements.
- M1/M4: add mode-aware capability/state messaging alignment checks.
- Validation gates: add DM-vs-Group PQC evidence separation requirement.
- M3/M4: integrate existing rotation durability features into strict-mode failure/retry tests.
- M1/M2: propagate invite mission-tier policy into enforced create/join behavior.
- M0/M1: define invite transport-hint to mode-contract mapping rules.
- M3/M5: verify secure-storage integration and recovery telemetry in production flows.
- M0/M1: add mode-level telemetry fields and validation tests.
- Validation: reduce brittle copy assertions in e2e and favor state/behavior assertions.

## Audit-backed assumptions for ongoing execution

- `Auto` remains compatibility-first and may fallback with disclosure.
- `Basic` remains NIP-29 interoperability lane.
- `Secure` and `Max` require fail-closed behavior when prerequisites are unmet.
- `Max` (Navcom-only PQC) cannot be claimed ready until cryptographic/runtime evidence gates pass.
