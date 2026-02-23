# Progress Tracker — Secure Creation Options

Date: 2026-02-23
Legend: `Phase -> Step -> Task`

## Phase P0 — Program Foundation

- [x] P0.1 Publish secure-creation documentation baseline
  - [x] P0.1.1 Create docs directory and index
  - [x] P0.1.2 Define mode contracts, crypto requirements, protocol matrix
- [x] P0.2 Capture deep-audit findings and execution implications
  - [x] P0.2.1 Secure control-path blocker findings
  - [x] P0.2.2 Protocol signaling vs guarantee boundary findings
  - [x] P0.2.3 Relay viability/auth gating dependency findings
  - [x] P0.2.4 Tier-policy UX-surface findings
  - [x] P0.2.5 Mode-messaging consistency findings
  - [x] P0.2.6 DM-vs-Group PQC evidence separation findings
  - [x] P0.2.7 Invite policy propagation/mapping findings
  - [x] P0.2.8 Telemetry mode-field contract findings
  - [x] P0.2.9 Secure-storage integration evidence findings

## Phase P1 — Contract + Governance Alignment

- [ ] P1.1 Mode contract approvals
  - [x] P1.1.0 Approval workbook published (`13-p1-contract-freeze-workbook.md`)
  - [ ] P1.1.1 Security review sign-off
  - [ ] P1.1.2 Product copy sign-off
  - [ ] P1.1.3 Engineering feasibility sign-off
- [ ] P1.2 Telemetry schema finalization
  - [x] P1.2.0 Telemetry schema draft published (`14-telemetry-schema-freeze-v1.md`)
  - [ ] P1.2.1 requested/resolved mode fields frozen
  - [ ] P1.2.2 block/downgrade reason fields frozen
- [ ] P1.3 Validation contract alignment
  - [x] P1.3.1 Stale mode taxonomy tests updated
  - [ ] P1.3.2 Mode-contract traceability checks in CI
  - [ ] P1.3.3 Add CI guard for telemetry contract-required fields
- [ ] P1.4 Invite mapping contract finalization
  - [x] P1.4.0 Invite mapping contract draft published (`15-invite-mode-mapping-contract.md`)
  - [ ] P1.4.1 Transport-hint to mode mapping finalized
  - [ ] P1.4.2 Invalid/incompatible invite behavior finalized

## Phase P2 — Runtime Enforcement (Completed)

- [x] P2.1 Mode-specific create/join behavior enforced
  - [x] P2.1.1 Auto fallback behavior
  - [x] P2.1.2 Basic baseline-only behavior
  - [x] P2.1.3 Secure strict behavior
  - [x] P2.1.4 Max strict behavior
- [x] P2.2 Deterministic blocked reason codes
- [x] P2.3 Relay viability/auth strict gating integration
  - [x] P2.3.1 Viability checks integrated
  - [x] P2.3.2 Auth-required checks integrated
- [x] P2.4 Strict-mode messaging alignment
  - [x] P2.4.1 Capability-gate copy mode-aware
  - [x] P2.4.2 Security-state hints mode-aware
- [x] P2.5 Invite policy context enforcement
  - [x] P2.5.1 Mission tier propagated into policy checks
  - [x] P2.5.2 Deterministic invite policy block reasons emitted

## Phase P3 — Secure Control-Plane (Completed)

- [x] P3.1 Secure control action path support complete
- [x] P3.2 Strict modes no-silent-downgrade validated

## Phase P4 — Max Preconditions (Completed)

- [x] P4.1 Max precondition evaluator implemented
- [x] P4.2 Navcom-only constraints enforced
- [x] P4.3 Max blocked/active diagnostics surfaced in UI

## Phase P5 — End-to-End Crypto Validation (Completed)

- [x] P5.1 Tamper + recipient-binding strict tests
- [x] P5.2 Max create→join→chat e2e pass
- [x] P5.3 Negative-path fail-closed verification
- [x] P5.4 Tier-policy UX/telemetry verification
  - [x] P5.4.1 Mission tier confirmation capture tests
  - [x] P5.4.2 Override-audit visibility tests
- [x] P5.5 Surface-separated evidence reporting
  - [x] P5.5.1 DM evidence section
  - [x] P5.5.2 Group evidence section

## Phase P6 — Verification Test Hardening (Completed)

- [ ] P6.1 Unit test contract hardening
  - [x] P6.1.1 Group command contract matrix tests
  - [x] P6.1.2 Telemetry contract schema tests
  - [x] P6.1.3 Relay capability fixture robustness tests
  - [x] P6.1.4 PQC group adversarial integration tests
  - [x] P6.1.5 Deterministic reason-code snapshot tests
  - [x] P6.1.6 Mode resolver regression tests (requested→resolved)
  - [x] P6.1.7 Fail-closed non-mutation assertions for strict paths
- [x] P6.2 UI test matrix hardening
  - [x] P6.2.1 Security mode UI matrix tests (Auto/Basic/Secure/Max)
  - [x] P6.2.2 Strict negative-path UX tests
  - [x] P6.2.3 Deterministic blocked-state assertion coverage
  - [x] P6.2.4 Invite tier-policy UX matrix coverage
  - [x] P6.2.5 Mobile vs desktop create/join parity checks
  - [x] P6.2.6 UI copy contract checks for strict-mode blockers
- [x] P6.3 Smoke test readiness gate
  - [x] P6.3.1 Max create→join→chat smoke gate in CI
  - [x] P6.3.2 Secure mode create/join smoke gate in CI
  - [x] P6.3.3 Fallback compatibility smoke gate in CI
  - [x] P6.3.4 Smoke-run telemetry artifact capture and retention
  - [x] P6.3.5 Retry-once policy for nondeterministic infrastructure failures
- [x] P6.4 Automated regression gate hardening
  - [x] P6.4.1 Mode matrix unit gate in CI
  - [x] P6.4.2 UI matrix + strict-negative Cypress gates in CI
  - [x] P6.4.3 Flaky-test budget and quarantine policy
  - [x] P6.4.4 Per-suite runtime budget thresholds and alerting
  - [x] P6.4.5 Branch-required status checks mapped to P6 suites

## Phase P7 — Rollout + Claim Readiness (In Progress)

- [ ] P7.1 Staged rollout execution
  - [ ] P7.1.1 Cohort ramp checklist defined
  - [ ] P7.1.2 Kill-switch drill executed
  - [ ] P7.1.3 Rollback rehearsal evidence captured
- [ ] P7.2 Telemetry stability review
  - [ ] P7.2.1 Event volume/error budget baseline
  - [ ] P7.2.2 Block reason consistency audit
  - [ ] P7.2.3 Requested/resolved mode correlation audit
- [ ] P7.3 PQC claim readiness sign-off
  - [ ] P7.3.1 DM evidence gate accepted
  - [ ] P7.3.2 Group evidence gate accepted
  - [ ] P7.3.3 Security + QA final sign-off
- [ ] P7.4 Telemetry contract upgrade
  - [ ] P7.4.1 Mode-level telemetry fields added
  - [ ] P7.4.2 Mode/transport compliance dashboards added

## Phase P8 — Post-Release Operational Hardening

- [ ] P8.1 Runbook updates from rollout/incident learnings
- [ ] P8.2 PQC recertification cadence established (DM + Group)
- [ ] P8.3 Quarterly contract drift review against docs + telemetry

## Related Backlog

- [M1/M2 File-by-File Backlog](10-m1-m2-file-by-file-implementation-backlog.md)

## Immediate Next Sprint

- [ ] S2.1 Run P1 Security/Product/Engineering sign-off sessions using workbook.
- [ ] S2.2 Execute P7.2 telemetry stability review with evidence notes.
- [ ] S2.3 Implement P7.4.1 mode-level telemetry fields.
- [ ] S2.4 Add P6.4.1 mode matrix CI gate.
- [ ] S2.5 Start P6.1.1 group command contract matrix tests.
- [ ] S2.6 Start P6.2.1 security mode UI matrix suite.
- [ ] S2.7 Implement P1.3.3 telemetry-contract CI guard.

## Latest Execution Notes

- 2026-02-22: Implemented modular guided create/join policy helper (`src/app/groups/create-join-policy.ts`) for strict-mode capability blocking and fallback policy consistency.
- 2026-02-22: Wired mission-tier propagation into create/join command dispatch path (`GroupCreateJoin.svelte` -> `group-commands.ts`).
- 2026-02-22: Realigned stale mode taxonomy unit tests and verified focused pass:
  - `tests/unit/app/groups/transport-mode.spec.ts`
  - `tests/unit/app/groups/guided-create-options.spec.ts`
  - plus invite and engine focused suites.
- 2026-02-22: Wired deterministic invite policy block reasons into guided create/join preflight (`GroupCreateJoin.svelte`) via `getInvitePolicyBlockReason` and `toInvitePolicyBlockMessage`.
- 2026-02-22: Made strict messaging mode-aware in `capability-gate` and `security-state`, and passed targeted group helper specs (`capability-gate`, `security-state`, `create-join-policy`).
- 2026-02-22: Implemented deterministic relay blocker reason taxonomy in `create-join-policy` (`RELAY_REQUIRES_*`) and wired create/join telemetry to emit these codes instead of ad-hoc strings.
- 2026-02-22: Extracted reusable GroupCreateJoin helper functions into `src/app/groups/create-join-view-helpers.ts` to reduce monolithic view logic and keep policy/UI helpers modular.
- 2026-02-22: Verified focused M1 policy/messaging suites pass (`create-join-policy`, `capability-gate`, `security-state`).
- 2026-02-22: Added centralized guided setup preflight resolver (`resolveGuidedSetupBlockReason`) and unified reason→message dispatch in `create-join-policy`, then routed create/join preflight through it.
- 2026-02-22: Verified mode-specific behavior coverage for Auto/Basic/Secure/Max with focused tests (`create-join-policy`, `transport-mode`, `guided-create-options`).
- 2026-02-22: Extracted relay auth-session and viability helper logic from `GroupCreateJoin.svelte` into `src/app/groups/create-join-relay-session.ts` for additional monolith reduction.
- 2026-02-22: Re-verified focused policy/mode suites after modularization (`create-join-policy`, `capability-gate`, `security-state`, `transport-mode`).
- 2026-02-22: Implemented secure control-action dispatcher in `src/engine/group-transport-secure-control.ts` and wired `securePilotGroupTransport.publishControlAction` to use it.
- 2026-02-22: Added secure control validation + template coverage in `tests/unit/engine/group-transport-secure-control.spec.ts` and expanded secure adapter control validation test in `group-transport-secure.spec.ts`.
- 2026-02-22: Re-ran focused engine transport suites (`group-transport-secure-control`, `group-transport-secure`, `group-transport`) to validate M2 control-plane behavior and strict no-silent-downgrade enforcement.
- 2026-02-22: Added single Max precondition evaluator module `src/app/groups/max-preconditions.ts` with deterministic `MAX_*` block reasons and reason→message mapping.
- 2026-02-22: Integrated Max evaluator into guided strict-mode policy resolution in `create-join-policy` and enforced Navcom-only relay constraints for Max mode.
- 2026-02-22: Added focused tests for Max evaluator + integration (`max-preconditions.spec.ts`, `create-join-policy.spec.ts`) and re-verified mode policy suite pass.
- 2026-02-22: Added modular Max diagnostics helper `src/app/groups/max-diagnostics.ts` for blocked/pending/active state evaluation and checklist output.
- 2026-02-22: Surfaced Max diagnostics panel in guided create flow security section (`GroupCreateJoin.svelte`) with deterministic reason labels and status checklist.
- 2026-02-22: Verified focused Max diagnostics/precondition/policy suites pass (`max-diagnostics`, `max-preconditions`, `create-join-policy`).
- 2026-02-22: Split secure send/subscribe input parsing and filter builders out of `src/engine/group-transport-secure-ops.ts` into new modular file `src/engine/group-transport-secure-input.ts` (secure-ops reduced below 500 lines).
- 2026-02-22: Strengthened strict tamper/recipient-binding negative-path coverage in `group-transport-secure-ops.spec.ts` with fail-closed assertions (`retryable` contract + projection not mutated on invalid secure events).
- 2026-02-22: Re-ran focused strict crypto-path suites (`group-transport-secure-ops`, `group-epoch-decrypt`, `group-transport-secure`) and verified pass.
- 2026-02-22: Extracted repeated guided relay-block telemetry payload assembly from `GroupCreateJoin.svelte` into modular helper `src/app/groups/create-join-block-telemetry.ts` and wired create/join preflight block tracking through shared builder.
- 2026-02-22: Added integration-style Max flow coverage in `tests/unit/engine/group-transport.spec.ts` for strict secure create→join→chat path (mission tier 2, no fallback) and verified focused pass.
- 2026-02-22: Re-ran focused suites and verified pass:
  - `tests/unit/engine/group-transport.spec.ts`
  - `tests/unit/app/groups/create-join-policy.spec.ts`
- 2026-02-22: Added tier-policy telemetry verification tests in `tests/unit/engine/group-transport.spec.ts`:
  - mission-tier confirmation capture for blocked downgrades (`onTierPolicyBlocked`) across control action + message dispatch paths.
  - override-audit event visibility (`onTierOverride`) including mission tier/reason and requested/resolved mode fields.
- 2026-02-22: Re-ran focused engine tier-policy suite and verified pass:
  - `tests/unit/engine/group-transport.spec.ts` (13/13)
- 2026-02-22: Implemented surface-separated claim evidence reporting helper `src/app/groups/surface-evidence-report.ts` with independent DM vs Group readiness states and deterministic block reasons (`EVIDENCE_MISSING`, `EVIDENCE_INCOMPLETE`).
- 2026-02-22: Added unit coverage for DM/Group evidence boundary enforcement and sectioned output in `tests/unit/app/groups/surface-evidence-report.spec.ts`.
- 2026-02-22: Added documentation sections for DM and Group evidence surfaces in `docs/groups/secure-creation-options/11-surface-evidence-reporting.md` and linked it from `README.md`.
- 2026-02-22: Continued modularization of monolithic create/join view by extracting relay-check telemetry emission into `src/app/groups/create-join-relay-check-telemetry.ts` and wiring `GroupCreateJoin.svelte` to use it.
- 2026-02-22: Re-ran focused suites and verified pass:
  - `tests/unit/app/groups/surface-evidence-report.spec.ts`
  - `tests/unit/engine/group-transport.spec.ts`
  - `tests/unit/app/groups/create-join-policy.spec.ts`
- 2026-02-23: Implemented deterministic Max e2e flow coverage in new Cypress spec `cypress/e2e/groups-max-flow.cy.ts` with create→join→chat path assertions and telemetry checks.
- 2026-02-23: Added Cypress-only relay capability fixture override module `src/app/groups/relay-capability-fixture.ts` and wired `checkRelayCapabilities` to consume it when Cypress fixture data is present.
- 2026-02-23: Added fixture override unit coverage in `tests/unit/app/groups/relay-capability.spec.ts`.
- 2026-02-23: Re-ran focused verification and passed:
  - `pnpm exec vitest run tests/unit/app/groups/relay-capability.spec.ts tests/unit/engine/group-transport.spec.ts`
  - `pnpm exec cypress run --spec cypress/e2e/groups-max-flow.cy.ts`
- 2026-02-23: Continued monolith decomposition by extracting test-fixture capability logic from `relay-capability.ts` into `relay-capability-fixture.ts` (line-count snapshot: 608 + 45).
- 2026-02-23: Audited test depth and identified high-priority coverage gaps in command dispatch contracts, mode-matrix UI assertions, telemetry schema enforcement, relay fixture robustness, and PQC group adversarial integration.
- 2026-02-23: Added explicit coverage expansion plan `docs/groups/secure-creation-options/12-test-coverage-edge-case-plan.md` and linked it into the secure-creation docs map.
- 2026-02-23: Focused Phase P1 by publishing contract-alignment artifacts:
  - `docs/groups/secure-creation-options/13-p1-contract-freeze-workbook.md`
  - `docs/groups/secure-creation-options/14-telemetry-schema-freeze-v1.md`
  - `docs/groups/secure-creation-options/15-invite-mode-mapping-contract.md`
- 2026-02-23: Began Phase P6 taskwork by implementing group command contract matrix unit coverage in `tests/unit/engine/group-commands-contract.spec.ts` (permission gates, join/leave dispatch defaults, retry vs non-retry recovery behavior) and verified pass with:
  - `pnpm exec vitest run tests/unit/engine/group-commands-contract.spec.ts`
- 2026-02-23: Completed P6.1.2 telemetry contract schema coverage in `tests/unit/app/groups/telemetry-contract.spec.ts`:
  - asserted required create/join contract fields (`flow`, `entry_point`, `result`, `security_mode_requested`, `security_mode_resolved`, `requested_transport_mode`, `resolved_transport_mode`, `policy_block_reason`, `mission_tier`, `override_used`, `override_reason`).
  - asserted canonical transport normalization + fallback reason behavior and deterministic blocked-flow payload structure from `buildGuidedBlockTelemetryProps`.
  - verified pass with `pnpm exec vitest run tests/unit/app/groups/telemetry-contract.spec.ts`.
- 2026-02-23: Completed P6.1.3 relay capability fixture robustness coverage in `tests/unit/app/groups/relay-capability.spec.ts`:
  - malformed Cypress fixture map ignored safely with fallback to live probe path.
  - missing relay fixture entry uses deterministic default fixture shape.
  - fixture override disabled (no Cypress runtime) correctly falls back to probe path.
  - verified pass with `pnpm exec vitest run tests/unit/app/groups/relay-capability.spec.ts`.
- 2026-02-23: Completed P6.1.4 adversarial secure-group integration coverage in `tests/unit/engine/group-transport-secure-ops.spec.ts`:
  - fail-closed behavior verified when epoch mismatch is repairable but payload content is corrupted (`GROUP_TRANSPORT_VALIDATION_FAILED`, non-retryable, projection not mutated).
  - strict secure send blocked deterministically when group key lifecycle state is revoked (`GROUP_TRANSPORT_CAPABILITY_BLOCKED`, non-retryable).
  - verified pass with `pnpm exec vitest run tests/unit/engine/group-transport-secure-ops.spec.ts`.
- 2026-02-23: Completed P6.1.5 deterministic reason-code snapshot coverage in `tests/unit/engine/reason-code-snapshots.spec.ts`:
  - locked engine reason-code enums for command feedback, secure control input validation, secure send input validation, and transport intent validation.
  - locked guided setup blocker reason outcomes across strict-mode, max precondition, invite-tier, viability, and relay-auth blocker paths.
  - verified pass with `pnpm exec vitest run tests/unit/engine/reason-code-snapshots.spec.ts --reporter verbose`.
- 2026-02-23: Completed P6.1.6 requested→resolved mode regression coverage in `tests/unit/engine/group-transport.spec.ts`:
  - asserted fallback path preserves `requestedMode=secure-nip-ee` while setting `resolvedMode=baseline-nip29` on dispatched message payloads.
  - asserted secure-success path preserves `requestedMode=secure-nip-ee` with `resolvedMode=secure-nip-ee`.
  - verified pass with `pnpm exec vitest run tests/unit/engine/group-transport.spec.ts`.
- 2026-02-23: Completed P6.1.7 fail-closed non-mutation strict-path assertions in `tests/unit/engine/group-transport-secure-ops.spec.ts`:
  - strict reconcile failures (removed-member wrap exclusion and invalid secure envelope) now explicitly assert no epoch sequence advancement and no projection mutation (`sourceEvents` unchanged; removed member state preserved).
  - strict tier-policy blocked secure send now explicitly asserts no secure key-lifecycle state creation (no side effects when blocked).
  - verified pass with `pnpm exec vitest run tests/unit/engine/group-transport-secure-ops.spec.ts`.
- 2026-02-23: Completed P6.2.1 security mode UI matrix coverage in `cypress/e2e/groups-security-modes.cy.ts`:
  - added deterministic create-flow matrix assertions for `auto`, `basic`, `secure`, `max` with requested transport telemetry expectations (`baseline` vs `secure-pilot`).
  - aligned setup-surface gating with existing Cypress group specs to remain stable when onboarding routes are active.
  - verified pass with `pnpm exec cypress run --spec cypress/e2e/groups-security-modes.cy.ts`.
- 2026-02-23: Completed P6.2.2 strict negative-path UX coverage in `cypress/e2e/groups-strict-negative.cy.ts`:
  - validated deterministic blocked telemetry for secure-pilot-disabled strict mode (`STRICT_REQUIRES_SECURE_PILOT`).
  - validated deterministic blocked telemetry for no viable relay path (`RELAY_REQUIRES_VIABLE_PATH`).
  - validated deterministic blocked telemetry for unresolved relay-specific auth requirement (`RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL`).
  - verified pass with `pnpm exec cypress run --spec cypress/e2e/groups-strict-negative.cy.ts`.
- 2026-02-23: Completed P6.2.3 deterministic blocked-state UI assertions by extending `cypress/e2e/groups-strict-negative.cy.ts`:
  - asserted exact blocker copy rendering in warning-state UI panel for strict-pilot-disabled, no-viable-path, and relay-specific-auth block paths.
  - asserted blocked flows remain on guided create route (`/groups/create`) while emitting deterministic `group_setup_blocked_by_relay_requirements` telemetry reasons.
  - verified pass with `pnpm exec cypress run --spec cypress/e2e/groups-strict-negative.cy.ts`.
- 2026-02-23: Completed P6.3.1 Max smoke gate wiring:
  - added dedicated smoke command `groups:test:smoke:max` in `package.json` targeting `cypress/e2e/groups-max-flow.cy.ts`.
  - added CI step in `.github/workflows/build.yml` (Node 22 matrix lane) to start Vite, verify `http://localhost:5173` readiness, and run `pnpm groups:test:smoke:max`.
  - verified local pass with `pnpm groups:test:smoke:max` (1/1 passing).
- 2026-02-23: Completed P6.3.2 Secure smoke gate wiring:
  - added dedicated smoke command `groups:test:smoke:secure` in `package.json` targeting `cypress/e2e/groups-secure-flow.cy.ts`.
  - added CI step `Groups secure smoke gate` in `.github/workflows/build.yml` (Node 22 matrix lane) to start Vite, verify `http://localhost:5173` readiness, and run `pnpm groups:test:smoke:secure`.
  - verified local pass with `pnpm groups:test:smoke:secure` (1/1 passing).
- 2026-02-23: Completed P6.3.3 fallback compatibility smoke gate wiring:
  - added fallback compatibility create→join→chat smoke spec `cypress/e2e/groups-fallback-flow.cy.ts` with deterministic baseline lane assertions (`requested_transport_mode=baseline`, `resolved_transport_mode=baseline`, `guarantee_label=compatibility-delivery`).
  - added dedicated smoke command `groups:test:smoke:fallback` in `package.json` targeting `cypress/e2e/groups-fallback-flow.cy.ts`.
  - added CI step `Groups fallback smoke gate` in `.github/workflows/build.yml` (Node 22 matrix lane) to start Vite, verify `http://localhost:5173` readiness, and run `pnpm groups:test:smoke:fallback`.
  - verified local pass with `pnpm groups:test:smoke:fallback` (1/1 passing).
- 2026-02-23: Completed P6.3.4 smoke telemetry artifact capture and retention:
  - added Cypress node task `writeGroupTelemetryArtifact` in `cypress.config.ts` to persist per-smoke-run telemetry payloads under `cypress/artifacts/group-telemetry`.
  - wired telemetry artifact emission in smoke specs (`groups-max-flow`, `groups-secure-flow`, `groups-fallback-flow`) via `afterEach` capture of `window.__groupTelemetry`.
  - added CI artifact retention step `Upload groups smoke telemetry artifacts` in `.github/workflows/build.yml` with `actions/upload-artifact@v4`, `path=cypress/artifacts/group-telemetry`, and `retention-days: 14`.
  - verified local capture with `pnpm groups:test:smoke:fallback` producing `cypress/artifacts/group-telemetry/groups-fallback-flow-*.json`.
- 2026-02-23: Completed P6.3.5 retry-once policy for nondeterministic infrastructure failures:
  - added a shared retry-once shell wrapper (`run_smoke_with_retry`) inside each CI smoke gate step in `.github/workflows/build.yml`.
  - max/secure/fallback smoke gates now retry once (after a 5s delay) before marking the lane failed, while preserving fail-fast behavior for server readiness failures.
  - validated workflow YAML diagnostics with no errors after retry policy wiring.
- 2026-02-23: Completed P6.4.1 mode matrix unit gate in CI:
  - added focused unit-gate command `groups:test:unit:mode-matrix` in `package.json` covering `transport-mode`, `guided-create-options`, `create-join-policy`, and `group-transport` suites.
  - added CI step `Groups mode matrix unit gate` in `.github/workflows/build.yml` (Node 22 matrix lane) to run `pnpm groups:test:unit:mode-matrix`.
  - verified local pass with `pnpm groups:test:unit:mode-matrix` (4 files, 36 tests passing).
- 2026-02-23: Completed P6.4.2 UI matrix + strict-negative Cypress gates in CI:
  - added dedicated UI gate commands in `package.json`: `groups:test:ui:matrix`, `groups:test:ui:strict-negative`, and combined `groups:test:ui:gates`.
  - added CI step `Groups UI matrix and strict-negative gate` in `.github/workflows/build.yml` (Node 22 matrix lane) to start Vite, verify `http://localhost:5173` readiness, and run `pnpm groups:test:ui:gates`.
  - verified local pass with `pnpm groups:test:ui:gates` (2 specs, 7 tests passing).
- 2026-02-23: Completed P6.4.3 flaky-test budget and quarantine policy:
  - added quarantine registry `docs/cache/groups-flaky-quarantine.json` with enforced `maxQuarantined` budget.
  - published policy doc `docs/groups/secure-creation-options/16-p6-flaky-quarantine-policy.md` covering scope, budget, quarantine rules, and CI enforcement.
  - added validator script `scripts/validate-groups-flaky-budget.mjs` and command `groups:test:flaky:budget` in `package.json`.
  - added CI step `Groups flaky budget gate` in `.github/workflows/build.yml` (Node 22 matrix lane) to fail on invalid schema, budget overflow, or expired entries.
  - verified local pass with `pnpm groups:test:flaky:budget`.
- 2026-02-23: Completed P6.4.4 per-suite runtime budget thresholds and alerting:
  - added runtime budget instrumentation in `.github/workflows/build.yml` for mode-matrix unit gate, UI matrix+strict-negative gate, and max/secure/fallback smoke gates.
  - each gate now records elapsed seconds and emits GitHub `::warning::` alerts when runtime exceeds suite budgets (unit: 120s, UI: 300s, smoke: 180s).
  - validated workflow YAML diagnostics with no errors after runtime budget/alert wiring.
- 2026-02-23: Prepared P6.4.5 branch-required status-check mapping artifact:
  - added `docs/groups/secure-creation-options/17-p6-branch-status-check-mapping.md` with exact required check names mapped to current CI gate steps.
  - documented branch protection configuration checklist for `master`/`dev` (require checks + up-to-date branches).
  - application of branch protection settings remains a repository admin action outside workspace code changes.
- 2026-02-23: Completed P6.4.5 branch-required status checks mapping with executable apply path:
  - added helper script `scripts/configure-groups-branch-protection.mjs` to configure required status checks via `gh api` for target branches.
  - added command `groups:ops:branch-protection` in `package.json` and usage in `docs/groups/secure-creation-options/17-p6-branch-status-check-mapping.md`.
  - verified dry-run command output with `pnpm groups:ops:branch-protection -- --repo=coracle-social/coracle --branches=master,dev --dry-run` (payload includes all six P6 required checks).
- 2026-02-23: Completed P6.2.4 invite tier-policy UX matrix coverage:
  - added Cypress suite `cypress/e2e/groups-invite-tier-policy.cy.ts` covering tier-2 invite prefill behavior across `auto`, `basic`, `secure`, and `max` modes.
  - asserted deterministic tier-policy block UX + telemetry (`INVITE_TIER2_REQUIRES_STRICT_MODE`, `mission_tier=2`) for non-strict modes and no tier-policy blocker for strict modes.
  - added `groups:test:ui:invite-tier` and expanded `groups:test:ui:gates` in `package.json` to include invite tier-policy matrix coverage.
  - verified local pass with `pnpm groups:test:ui:invite-tier` (4/4 passing).
- 2026-02-23: Completed P6.2.5 mobile vs desktop create/join parity checks:
  - added Cypress suite `cypress/e2e/groups-responsive-parity.cy.ts` validating guided create/join parity on `iphone-6` and `macbook-15` viewports.
  - asserted parity telemetry contracts across viewports (`group_setup_create_attempt`, `group_setup_join_attempt`, `mode=guided`, `requested_transport_mode=baseline`).
  - added `groups:test:ui:responsive-parity` and expanded `groups:test:ui:gates` in `package.json` to include responsive parity coverage.
  - verified local pass with `pnpm groups:test:ui:responsive-parity` (2/2 passing).
- 2026-02-23: Completed P6.2.6 UI copy contract checks for strict-mode blockers:
  - added Cypress suite `cypress/e2e/groups-strict-copy-contract.cy.ts` for deterministic strict-blocker copy contracts.
  - asserted exact warning-copy + telemetry reason-code mappings for `STRICT_REQUIRES_SECURE_PILOT`, `STRICT_REQUIRES_RELAY_CHECKS`, and `STRICT_REQUIRES_NIP_EE_SIGNAL`.
  - added `groups:test:ui:strict-copy-contract` and expanded `groups:test:ui:gates` in `package.json` to include strict-copy contract coverage.
  - verified local pass with `pnpm groups:test:ui:strict-copy-contract` (3/3 passing).
- 2026-02-23: Re-validated integrated UI regression gate after P6.2.4–P6.2.6 expansion:
  - verified local pass with `pnpm groups:test:ui:gates` across five specs (`groups-security-modes`, `groups-strict-negative`, `groups-invite-tier-policy`, `groups-responsive-parity`, `groups-strict-copy-contract`) and 16/16 passing tests.
