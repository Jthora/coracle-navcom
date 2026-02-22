# Groups + PQC Audit — Plan of Action

Date: 2026-02-21  
Source findings: `G-01..G-04`, `P2-01..P2-05`, `P3-01..P3-08`

## 1) Objectives

1. Close the gap between user-visible privacy claims and runtime transport behavior.
2. Eliminate high-likelihood crash/failure edges in invite/decode/storage paths.
3. Stabilize PQC type contracts and secure transport execution reliability.
4. Establish measurable release gates for security model clarity and robustness.

## 2) Workstreams and Coverage Map

### WS-A: Transport intent → runtime enforcement

- Implement a single transport-mode source of truth from guided privacy selection through command dispatch.
- Route group chat send through transport adapter abstraction (not direct publish path).
- Verify secure pilot activation/wiring behavior under explicit feature states.

Addresses:

- `G-01`, `G-02`, `G-03`
- `P2-01`, `P2-02`, `P2-03`

### WS-B: PQC contract and input robustness

- Align PQC envelope and command integration type contracts (remove drift at module boundaries).
- Add early recipient/key-shape validation before secure send.
- Harden invite decode and local storage error handling to fail soft.

Addresses:

- `G-04`
- `P3-05`, `P3-06`, `P3-07`

### WS-C: Security model correctness and trust semantics

- Clarify “secure” semantics in UI/docs/telemetry (integrity framing vs confidentiality claims).
- Strengthen epoch integrity design assumptions and implementation plan.
- Harden timestamp/trust assumptions in membership exclusion decisions.

Addresses:

- `P3-01`, `P3-02`, `P3-08`

### WS-D: Durable operations and recovery

- Persist key lifecycle and rotation job state across app restart.
- Add startup replay/reconciliation and idempotent execution semantics.
- Tighten route/guard recovery consistency for malformed paths.

Addresses:

- `P3-03`
- `P2-05`

### WS-E: Multi-recipient receive correctness

- Replace first-`p`-tag recipient heuristic with deterministic recipient selection rules.
- Add compatibility tests for tag ordering, duplicates, and self-send.

Addresses:

- `P3-04`

## 3) Execution Sequence (Recommended)

### Phase 0 — Scope lock (0.5 day)

- Freeze claim language and runtime mode taxonomy used by UI + telemetry.
- Finalize acceptance criteria and test matrix for each workstream.

Exit criteria:

- Published mapping: UI state label ↔ runtime transport path ↔ guarantee level.

### Phase 1 — Immediate risk reduction (1-2 days)

- WS-B crash-proofing (`P3-05`, `P3-06`, `P3-07`).
- WS-C truth-in-labeling baseline (`P3-01`, partial `P3-02`).

Exit criteria:

- Malformed invite input does not crash route flow.
- Storage exceptions are non-fatal in affected paths.
- No confidentiality claim appears for non-confidentiality path.

### Phase 2 — Core transport correctness (2-4 days)

- WS-A single-path enforcement (`G-01`, `G-02`, `P2-01`, `P2-02`).
- WS-A secure pilot gating clarity (`G-03`, `P2-03`).
- WS-B contract alignment (`G-04`).

Exit criteria:

- Group send/control flows consistently traverse adapter abstraction.
- Transport mode selected in UX is reflected in runtime dispatch decisions.
- Typecheck is clean for touched PQC transport modules.

### Phase 3 — Reliability + semantics hardening (3-5 days)

- WS-D durable lifecycle/rotation (`P3-03`) and route/guard coherence (`P2-05`).
- WS-E multi-recipient AD binding robustness (`P3-04`).
- WS-C timestamp trust hardening (`P3-08`).

Exit criteria:

- Rotation queue survives restart and resumes idempotently.
- Multi-recipient parsing yields deterministic expected recipient binding.
- Exclusion outcomes remain deterministic under timestamp-skew tests.

### Phase 4 — Structural security uplift (design + implementation)

- WS-C integrity semantics upgrade (`P3-02`) with explicit threat-model statement.

Exit criteria:

- Integrity mechanism is cryptographically grounded and test-covered.

## 4) Finding-by-Finding Action Table

| Finding | Primary Action | Phase | Done when |
|---|---|---:|---|
| G-01 | Wire guided privacy into dispatch source of truth | 2 | Requested mode influences runtime selection deterministically |
| G-02 | Move send path to adapter-based publish | 2 | Chat send always traverses transport abstraction |
| G-03 | Explicit pilot activation + fallback disclosure | 2 | Runtime state observable and consistent with UI labels |
| G-04 | Align PQC type/result unions | 2 | Touched modules typecheck cleanly |
| P2-01 | Remove baseline-default ambiguity | 2 | Mode defaulting behavior documented + tested |
| P2-02 | Enforce secure ops on chat send | 2 | Tier/capability checks applied consistently |
| P2-03 | Verify non-test activation paths | 2 | Pilot state exercised in integration checks |
| P2-04 | Add safe failure wrappers in secure storage paths | 1/3 | Unsupported/runtime mismatch errors are recoverable |
| P2-05 | Preserve recovery context after redirect | 3 | Guard messaging survives malformed-route handling |
| P3-01 | Truth-in-labeling and guarantee matrix | 1 | No misleading confidentiality claims |
| P3-02 | Replace weak integrity signaling | 4 | Cryptographic integrity design implemented + tested |
| P3-03 | Durable rotation/lifecycle state | 3 | Restart does not lose pending rotation work |
| P3-04 | Deterministic multi-recipient binding | 3 | Tag permutation tests pass with stable outcomes |
| P3-05 | Harden invite decoding | 1 | Malformed encodings do not crash app flow |
| P3-06 | Guard localStorage access | 1 | Storage failures degrade gracefully |
| P3-07 | Pre-validate recipient/key inputs | 1 | Invalid input fails early with clear error |
| P3-08 | Reduce timestamp trust in exclusion path | 3 | Skew/manipulation scenarios handled deterministically |

## 5) Validation Gates

1. **Functional gate**
   - Unit + smoke tests for modified paths pass (`groups` + PQC touched specs).
2. **Correctness gate**
   - Adapter path coverage demonstrates no direct-send bypass for group chat.
3. **Resilience gate**
   - Malformed input/storage exception suites confirm non-fatal behavior.
4. **Security-claims gate**
   - UI/telemetry matrix reviewed: no overstated confidentiality guarantees.
5. **Type-safety gate**
   - Touched PQC/transport modules pass typecheck.

## 6) Rollout and Safety Controls

- Ship Phases 1 and 2 behind explicit feature flags where behavior can materially change send path.
- Add temporary telemetry counters for:
  - fallback/placeholder rates,
  - recipient validation early-fail counts,
  - post-restart rotation replay outcomes.
- Require one release cycle of telemetry stability before enabling broader defaults.

## 7) Definition of Done (Program Level)

- All findings (`G`, `P2`, `P3`) have implemented fixes or documented accepted risk with rationale.
- Runtime transport behavior is traceably aligned with user-facing privacy/security labels.
- Crash-prone malformed input/storage paths are fail-soft.
- Key rotation and recipient binding behavior are deterministic under restart and edge-case tests.

## 8) Mode-to-Guarantee Matrix Reference (Stage 2)

Implementation and telemetry work in Stage 2 must reference the frozen matrix in:

- `stage-1-scope-lock.md` → sections `2) Guarantee Labels` and `3.2 Telemetry field map`

Required telemetry fields for transport/guarantee alignment:

- `requested_transport_mode`
- `resolved_transport_mode`
- `fallback_reason`
- `guarantee_label`

## 9) Stage 3 Phase 2 Traceability Notes

Implemented for Task `3.1.1`:

- Unified mode resolver in `src/app/groups/transport-mode.ts` now drives requested mode selection from:
   - guided privacy (`create` flow),
   - invite preferred mode (`join` flow),
   - deterministic default fallback (`baseline-nip29`).
- `GroupCreateJoin.svelte` now passes resolved `requestedMode` into create/join command dispatch calls.
- `group_setup_*` telemetry now includes `requested_transport_mode` and `transport_mode_source` for auditability.

Implemented for Task `3.1.2`:

- `publishGroupMessage` now dispatches through transport adapters via `dispatchGroupTransportMessage` (no direct publish bypass path).
- Baseline adapter now implements `sendMessage` with validation and canonical group message event publishing.
- Send path now applies capability fallback and tier-policy checks through transport dispatch, with downgrade diagnostics emitted on secure→baseline fallback.

Implemented for Task `3.1.3`:

- Non-test secure pilot activation path is now initialized at app startup via env + optional storage override:
   - `VITE_ENABLE_SECURE_GROUP_PILOT` (default runtime flag)
   - `group_secure_pilot_enabled` (optional local storage override)
- Runtime security status reporting now includes UI-aligned status labels and canonical resolved transport mode fields in chat telemetry.

Implemented for Task `3.1.4`:

- PQC envelope mode/compat contracts are now centralized in `src/engine/pqc/envelope-contracts.ts` and consumed by builder/receiver modules to remove duplicated mode unions and reduce boundary drift.
- Envelope validation now enforces shared mode membership and typed `compat` metadata field checks (`compat.fallback_mode`, `compat.reason_code`) with stable error codes for parser mapping.
- DM envelope parse/build call sites were updated for explicit union narrowing against shared validation/build result contracts, including command-boundary handling for policy and encode-failure branches.
- Verification evidence:
   - Focused PQC test suite: `tests/unit/engine/pqc/envelope.spec.ts`, `tests/unit/engine/pqc/dm-envelope.spec.ts`, `tests/unit/engine/pqc/dm-receive-envelope.spec.ts`, `tests/unit/engine/pqc/dm-send-policy.spec.ts`, `tests/unit/engine/pqc/dm-send-preflight.spec.ts` (all passing).
   - Touched-file diagnostics clean for: `src/engine/pqc/envelope-validation.ts`, `src/engine/pqc/dm-envelope.ts`, `src/engine/pqc/dm-receive-envelope.ts`, `src/engine/commands.ts`.

## 10) Stage 4 Phase 3 Traceability Notes

Implemented for Task `4.1.1`:

- Secure group key lifecycle state now persists with a versioned durable schema (`schema: 1`) and corruption-safe load behavior in `src/engine/group-key-lifecycle.ts`.
- Secure group key rotation jobs now persist with a versioned durable schema (`schema: 1`) in `src/engine/group-key-rotation-service.ts`, including fail-soft handling for malformed/incompatible persisted payloads.
- Rotation startup replay/reconciliation is now implemented through `replaySecureGroupKeyRotationJobs`, which loads persisted jobs and normalizes failed-job state into deterministic replay outcomes (resume/defer/reconcile/exhausted).
- Deterministic idempotency keys are now attached to each rotation job intent (`group-rotation:{groupId}:{keyId}:{trigger}`) to stabilize replay behavior and prevent duplicate side effects for equivalent job intents.
- Startup wiring now executes replay on app bootstrap in `src/main.js` and emits a telemetry event (`groups_secure_rotation_replay_bootstrap`) with replay outcome counters.
- Verification evidence:
   - Focused durability suites pass: `tests/unit/engine/group-key-lifecycle.spec.ts`, `tests/unit/engine/group-key-rotation.spec.ts`.
   - Added coverage validates persisted state restoration, replay resumption, and idempotency-key persistence across service rehydration.

Implemented for Task `4.1.2`:

- Replaced single first-`p` recipient binding with deterministic recipient-candidate derivation in `src/engine/state-message-plaintext.ts`:
   - collect all `p`-tag recipients,
   - normalize + de-duplicate,
   - sort for order-invariant stability,
   - prioritize local pubkey when present.
- Extended PQC AD binding validation in `src/engine/pqc/dm-receive-envelope.ts` to accept candidate recipient sets (`expectedRecipientPubkeys`) while preserving backward compatibility with existing single-recipient input (`expectedRecipientPubkey`).
- DM receive binding now succeeds when any deterministic recipient candidate matches envelope associated-data recipients, preventing brittle failures from tag-order variance in multi-recipient and self-send scenarios.
- Verification evidence:
   - Focused suites pass: `tests/unit/engine/state-message-plaintext.spec.ts`, `tests/unit/engine/pqc/dm-receive-envelope.spec.ts`.
   - Added table-driven deterministic ordering/duplicate coverage plus self-send multi-recipient integration-style validation in `state-message-plaintext` tests.

Implemented for Task `4.1.3`:

- Identified redirect context-loss point in required-parameter redirect handling (`src/app/Routes.svelte`), where malformed/partially decoded route state previously redirected without structured recovery metadata.
- Added shared redirect context builder in `src/app/groups/route-recovery.ts` and wired both required-parameter and route-guard redirects through it.
- Redirect context now consistently carries:
   - `guardMessage`,
   - `guardFrom`,
   - `guardReason`,
   - and recovered `groupInviteRecoveryErrors` (when present) for downstream UI/recovery flows.
- Verification evidence:
   - Focused route recovery tests pass: `tests/unit/app/groups/route-recovery.spec.ts`, `tests/unit/app/groups/guards.spec.ts`, `tests/unit/app/groups/invite-router-serializer.spec.ts`.

Implemented for Task `4.1.4`:

- Hardened removed-member wrap exclusion ordering in `src/engine/group-wrap-exclusion.ts` to prioritize deterministic ingestion sequence over raw `created_at` values.
- Added explicit tie-break precedence for exclusion ordering decisions:
   - sequence index,
   - then `created_at`,
   - then event id lexical order.
- Updated cutoff tracking for removal markers to use ordering tuples instead of timestamp-only comparisons, reducing dependence on untrusted/skewed timestamps in exclusion-critical decisions.
- Verification evidence:
   - Focused suite pass: `tests/unit/engine/group-wrap-exclusion.spec.ts`.
   - Added skew/adversarial ordering coverage for:
      - removal-before-wrap with older timestamp,
      - wrap-before-removal with newer timestamp,
      - deterministic outcomes based on sequence-first ordering.

## 11) Stage 5 Phase 4 Traceability Notes

Implemented for Task `5.1.1.1`:

- Added integrity design specification in `docs/groups/audits/2026-02-21/groups-pqc-code-audit/stage-5-integrity-design.md`.
- Documented threat model and attacker capabilities for persisted secure group epoch state tampering/replay scenarios.
- Evaluated integrity primitive options and selected `HMAC-SHA-256` with device-local keying as the implementation baseline for `5.1.1.2`.
- Defined schema/versioning and migration direction (`schema: 2`, integrity algorithm/tag fields, replay-guard policy), plus strict/compatibility failure behavior expectations.

Implemented for Task `5.1.1.2`:

- Upgraded secure group epoch persistence envelope in `src/engine/group-epoch-state.ts` from checksum-only `schema: 1` to `schema: 2` with explicit integrity metadata:
   - `integrityAlg`
   - `integrityKeyId`
   - `integrityMac`
- Added cryptographic integrity generation/verification using `HMAC-SHA-256` with a device-local integrity key persisted under `secure-group-epoch-integrity-key:v1` when runtime secure randomness is available.
- Preserved compatibility semantics by retaining deterministic legacy verification support (`legacy-djb2-v1`) and selecting a runtime-safe algorithm fallback when secure keying is unavailable.
- Implemented compatibility migration path:
   - loader accepts validated `schema: 1` payloads,
   - transforms them into `schema: 2` with selected integrity algorithm,
   - writes back upgraded payload atomically via existing save path.
- Integrated failure behavior into existing recovery model by rejecting invalid/tampered persisted payloads at load/save boundaries, allowing existing epoch bootstrap/rehydration flow (`ensureSecureGroupEpochState`) to recover with deterministic state regeneration.

Implemented for Task `5.1.1.3`:

- Added tamper-oriented coverage in `tests/unit/engine/group-epoch-state.spec.ts` for:
   - direct MAC mutation rejection,
   - payload field mutation (`sequence`) rejection,
   - malformed MAC format rejection,
   - validated `schema: 1` → `schema: 2` migration behavior.
- Verification evidence:
   - Focused suites pass: `tests/unit/engine/group-epoch-state.spec.ts`, `tests/unit/engine/group-epoch-reconcile.spec.ts`, `tests/unit/engine/group-epoch-message.spec.ts`.

## 12) Stage 5 Validation Gate Traceability Notes

Implemented for Task `5.2.1.1.1`:

- Executed targeted touched-module functional suites spanning Stage 4 + Stage 5 implementation surfaces.
- Verification evidence (all passing):
   - `tests/unit/engine/group-key-lifecycle.spec.ts`
   - `tests/unit/engine/group-key-rotation.spec.ts`
   - `tests/unit/engine/state-message-plaintext.spec.ts`
   - `tests/unit/engine/pqc/dm-receive-envelope.spec.ts`
   - `tests/unit/app/groups/route-recovery.spec.ts`
   - `tests/unit/app/groups/guards.spec.ts`
   - `tests/unit/app/groups/invite-router-serializer.spec.ts`
   - `tests/unit/engine/group-wrap-exclusion.spec.ts`
   - `tests/unit/engine/group-epoch-state.spec.ts`
   - `tests/unit/engine/group-epoch-reconcile.spec.ts`
   - `tests/unit/engine/group-epoch-message.spec.ts`
- Aggregate result: `11` files passed, `52` tests passed.

Implemented for Task `5.2.1.1.2`:

- Executed groups smoke/e2e specs referenced by audit findings under Cypress against local app server (`http://localhost:5173`).
- Verification evidence (all passing):
   - `cypress/e2e/groups-smoke.cy.ts` (`3/3`)
   - `cypress/e2e/groups-routes-smoke.cy.ts` (`3/3`)
   - `cypress/e2e/groups-invite-smoke.cy.ts` (`2/2`)
- Aggregate smoke result: `3` specs passed, `8` tests passed, `0` failures.

Implemented for Task `5.2.1.2`:

- Executed transport correctness suites covering adapter-only dispatch and fallback handling.
- Verification evidence (all passing):
   - `tests/unit/engine/group-transport.spec.ts`
   - `tests/unit/engine/group-transport-intent.spec.ts`
   - `tests/unit/engine/group-transport-baseline.spec.ts`
   - `tests/unit/engine/group-transport-contracts.spec.ts`
   - `tests/unit/engine/group-transport-secure.spec.ts`
   - `tests/unit/engine/group-transport-secure-tier.spec.ts`
   - `tests/unit/engine/group-transport-secure-ops.spec.ts`
   - `tests/unit/engine/group-transport-projection.spec.ts`
- Aggregate correctness-suite result: `8` files passed, `36` tests passed.
- Static call-path audit confirms group message send entry in `src/engine/group-commands.ts` routes via `dispatchGroupTransportMessage` with no direct publish invocation in the send command path.

Implemented for Task `5.2.1.3`:

- Executed resilience-focused suites for malformed invite handling, route guard recovery continuity, and storage-failure fail-soft behavior.
- Verification evidence (all passing):
   - `tests/unit/app/groups/invite-router-serializer.spec.ts`
   - `tests/unit/app/groups/guards.spec.ts`
   - `tests/unit/app/groups/admin-mode.spec.ts`
   - `tests/unit/app/groups/secure-pilot-bootstrap.spec.ts`
   - `tests/unit/engine/pqc/dm-fallback-history.spec.ts`
   - `tests/unit/engine/group-key-lifecycle.spec.ts`
   - `tests/unit/engine/group-key-rotation.spec.ts`
- Aggregate resilience-suite result: `7` files passed, `26` tests passed.

Implemented for Task `5.2.1.4`:

- Executed UI/telemetry claims-alignment suites (post Stage-2 guarantee matrix wording) and resolved one private-mode copy drift in `src/app/groups/guided-create-options.ts`.
- Verification evidence (all passing):
   - `tests/unit/app/groups/telemetry.spec.ts`
   - `tests/unit/app/groups/telemetry-stage3.spec.ts`
   - `tests/unit/app/groups/security-state.spec.ts`
   - `tests/unit/app/groups/guided-create-options.spec.ts`
- Aggregate claims-suite result: `4` files passed, `19` tests passed.
- Telemetry field audit confirms required matrix fields remain emitted in `src/app/groups/telemetry.ts`:
   - `requested_transport_mode`
   - `resolved_transport_mode`
   - `guarantee_label`
   - `fallback_reason`

Implemented for Task `5.2.1.5`:

- Ran repository typecheck command: `pnpm tsc --noEmit --pretty false`.
- Cleared remaining baseline compile blockers by applying targeted typing/import fixes in:
   - `src/engine/state-content.ts`
   - `src/engine/state-social.ts`
   - `src/engine/state-storage-init.ts`
- Verification evidence:
   - Final typecheck pass with no TypeScript errors (`pnpm tsc --noEmit --pretty false`).

## 13) Stage 5 Rollout Controls Traceability Notes

Implemented for Task `5.2.2.1.1`:

- Defined rollout defaults on existing runtime controls with secure pilot enabled by default:
   - **Default cohort (all users):** `VITE_ENABLE_SECURE_GROUP_PILOT` now defaults to `true` in `src/engine/state.ts`.
   - **Operator override cohort:** deployment env can still set `VITE_ENABLE_SECURE_GROUP_PILOT=false` for controlled disablement.
   - **Device override cohort:** optional local override (`group_secure_pilot_enabled=true|false`) remains available for targeted validation.
- Confirmed runtime precedence keeps secure features ON by default while preserving explicit operational controls.

Implemented for Task `5.2.2.1.2`:

- Added explicit runtime kill-switch behavior in `src/app/groups/secure-pilot-bootstrap.ts` with enforced precedence:
   1. Env hard-disable (`VITE_DISABLE_SECURE_GROUP_PILOT=true`) always disables secure pilot.
   2. Storage kill-switch (`group_secure_pilot_kill_switch=true`) disables secure pilot on device.
   3. Existing enable override (`group_secure_pilot_enabled=true|false`) applies only when kill-switch is off.
   4. Env default (`VITE_ENABLE_SECURE_GROUP_PILOT`) is last precedence.
- Wired hard-disable into app bootstrap (`src/main.js`) through shared env state (`src/engine/state.ts`).
- Added/updated unit evidence in `tests/unit/app/groups/secure-pilot-bootstrap.spec.ts` for env/storage kill-switch precedence and initialization behavior.
- Rollback instruction (immediate):
   - Global rollback: set `VITE_DISABLE_SECURE_GROUP_PILOT=true` and redeploy.
   - Device rollback during incident triage: set local storage `group_secure_pilot_kill_switch=true`.
   - Restore forward state after mitigation: unset kill-switch first, then return to default-on config.
- Verification evidence:
   - `pnpm vitest run tests/unit/app/groups/secure-pilot-bootstrap.spec.ts` (passing).