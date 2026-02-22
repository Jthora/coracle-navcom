# Groups + PQC Code Audit Findings

Status: Read-only review complete  
Date: 2026-02-21  
Scope: Groups UX/routes/state, Groups transport adapters, PQC DM envelope/policy/receive flow

## 1) Executive Summary

The codebase shows strong progress in UX clarity and test coverage for Groups and PQC behavior, especially around fallback explanation and guard recovery.  
However, there are important integration gaps between UX intent and runtime transport behavior, and there is active type-contract drift in PQC modules that currently impacts repository typecheck reliability.

Overall posture:

- UX clarity: **Improved / Good**
- Unit + smoke test coverage: **Good and expanding**
- Runtime secure-transport integration completeness: **Partial**
- PQC type-safety/build reliability: **At risk**

## 2) What Looks Solid

### 2.1 Groups UX and recovery messaging

- Privacy copy clearly distinguishes **PQC-preferred** vs compatibility behavior.
- Guard redirection copy explains both cause and next action.
- Security state chips/hints are visible across list/detail/chat/settings.

Primary files:

- `src/app/views/GroupCreateJoin.svelte`
- `src/app/groups/guided-create-options.ts`
- `src/app/groups/security-state.ts`
- `src/app/groups/guards.ts`
- `src/app/views/GroupList.svelte`
- `src/app/views/GroupDetail.svelte`
- `src/app/views/GroupSettingsAdmin.svelte`

### 2.2 PQC policy + receive validation design

- Strict vs compatibility negotiation behavior is explicit and testable.
- Envelope validation includes canonicalization and critical-field checks.
- Receive path validates associated-data binding and uses strict fail-closed placeholder behavior.

Primary files:

- `src/engine/pqc/dm-send-policy.ts`
- `src/engine/pqc/dm-send-preflight.ts`
- `src/engine/pqc/negotiation.ts`
- `src/engine/pqc/envelope-validation.ts`
- `src/engine/pqc/dm-receive-envelope.ts`

### 2.3 Test coverage trend

Coverage is materially improved for:

- Groups guard/security/guided options/invite helpers (unit)
- Groups route, join, invite, and recovery flows (smoke e2e)
- PQC envelope and negotiation surfaces (unit)

Primary folders/specs:

- `tests/unit/app/groups/*`
- `tests/unit/engine/pqc/*`
- `cypress/e2e/groups-smoke.cy.ts`
- `cypress/e2e/groups-routes-smoke.cy.ts`
- `cypress/e2e/groups-invite-smoke.cy.ts`

## 3) High-Impact Gaps

### G-01 (Medium): Guided privacy selection is mostly presentation-level

`createPrivacy` is captured in guided UI and telemetry, but create/join dispatch paths do not clearly wire that selection into requested transport mode/policy enforcement in the action call path.

Implication:

- User may interpret privacy selection as immediate runtime behavior guarantee when it is primarily intent signaling.

Evidence:

- `src/app/views/GroupCreateJoin.svelte`
- `src/engine/group-commands.ts`
- `src/engine/group-transport.ts`

### G-02 (High): Group message send path bypasses secure adapter pipeline

`publishGroupMessage` currently publishes directly via `publishThunk` rather than routing through secure adapter send + secure ops orchestration.

Implication:

- Secure group transport controls, tier policy hooks, and secure send diagnostics are not uniformly exercised by standard chat send path.

Evidence:

- `src/engine/group-commands.ts`
- `src/engine/group-transport-secure.ts`
- `src/engine/group-transport-secure-ops.ts`

### G-03 (Medium-High): Secure pilot enablement appears dormant by default

Secure pilot is disabled by default and no production wiring was observed in this review path that enables it outside tests.

Implication:

- UI can communicate secure preference, while runtime may still resolve to baseline fallback in most environments.

Evidence:

- `src/engine/group-transport-secure.ts`
- `src/app/groups/capability-gate.ts`

### G-04 (High): PQC type-contract drift is present

Recent typecheck output indicates mismatches across PQC envelope modules and command integration points.

Implication:

- Increased risk of regressions and CI/pre-commit instability even when runtime behavior is mostly correct.

Evidence hotspots:

- `src/engine/pqc/dm-envelope.ts`
- `src/engine/pqc/dm-receive-envelope.ts`
- `src/engine/commands.ts`

## 4) Risk Rating

- **Functional UX risk:** Low to Medium (copy and flow are strong)
- **Runtime transport correctness risk:** Medium to High (partial wiring)
- **Type/maintainability risk:** High (contract drift impacts confidence)

## 5) Recommended Next Sequence (No code changes in this document)

1. Establish a single source of truth for transport mode selection from guided privacy intent to dispatch.
2. Route group chat send through transport adapter abstraction so secure/baseline policy and telemetry are consistent.
3. Resolve PQC envelope module type contracts and align error/result unions end-to-end.
4. Add one explicit matrix doc mapping user-visible state labels to actual runtime transport states under pilot-off/pilot-on conditions.

## 6) Bottom Line

The project has strong UX and testing momentum, but there is still a gap between **what users are told** and **what runtime transport path is guaranteed**. Closing transport wiring and PQC type-contract alignment should be treated as the next critical hardening step.

## 7) Pass 2 Robustness Addendum

### P2-01 (Medium): Transport mode defaults still favor baseline paths

- Group control dispatch defaults to baseline mode unless requested mode is explicitly passed.
- Guided privacy selection currently behaves more like UI intent than an enforced runtime transport contract.

Evidence:

- `src/engine/group-transport.ts`
- `src/engine/group-commands.ts`
- `src/app/views/GroupCreateJoin.svelte`

### P2-02 (High): Chat message send bypasses transport abstraction

- `publishGroupMessage` uses direct publish behavior and does not run through secure adapter send path.
- Tier/capability guardrails and secure send diagnostics are not consistently applied on chat send.

Evidence:

- `src/engine/group-commands.ts`
- `src/engine/group-transport-secure.ts`
- `src/engine/group-transport-secure-ops.ts`

### P2-03 (Medium-High): Dormant secure pilot risk

- Secure pilot remains disabled by default and no non-test activation path was found in this pass.
- User-visible secure preference can therefore overstate runtime guarantees.

Evidence:

- `src/engine/group-transport-secure.ts`
- `src/app/groups/capability-gate.ts`

### P2-04 (Medium): Failure-handling hard edges

- Secure storage throws hard errors for unsupported runtime primitives and schema mismatch.
- Recovery helpers exist but active runtime integration for automatic remediation appears limited.

Evidence:

- `src/engine/group-secure-storage.ts`
- `src/engine/group-secure-storage-recovery.ts`

### P2-05 (Low-Medium): Route/guard recovery consistency edge case

- Serializer/required-param redirect logic can preempt route-guard messaging for malformed paths, reducing user recovery context.

Evidence:

- `src/util/router.ts`
- `src/app/Routes.svelte`

## 8) Pass 3 Deep-Dive Audit (Failure-Mode + Robustness)

### P3-01 (Critical, conditional): “Secure group content” path appears to be envelope encoding, not confidentiality-grade cryptography

- Based on reviewed modules, `encodeSecureGroupEpochContent` stores plaintext as base64 (`ct`) and builds deterministic nonce from metadata.
- This behavior reads as transport structuring/validation logic rather than confidentiality-grade encryption.
- If this is the intended production path for “secure content,” threat assumptions are materially weaker than implied; if it is transitional/pilot-only, labeling should make that explicit.

Evidence:

- `src/engine/group-epoch-content.ts`
- `src/engine/group-epoch-decrypt.ts`

### P3-02 (High): Epoch integrity mechanism is non-cryptographic and mutable-client local

- Epoch integrity uses lightweight hash (`djb2`-style) over local state fields.
- It can detect accidental corruption but should not be treated as tamper resistance against capable adversaries.

Evidence:

- `src/engine/group-epoch-state.ts`

### P3-03 (High): Key lifecycle and rotation services are memory-resident only

- Key lifecycle registry and key-rotation job queue are in-memory process state.
- App restart drops counters/jobs, reducing reliability of TTL/rotation/retry semantics over long sessions.
- Retry/complete helpers exist; a durable scheduler/executor integration was not identified in reviewed paths and should be explicitly verified.

Evidence:

- `src/engine/group-key-lifecycle.ts`
- `src/engine/group-key-rotation-service.ts`
- `src/engine/group-transport-secure-ops.ts`

### P3-04 (Medium-High): DM recipient binding can be brittle for multi-recipient paths

- Receive plaintext resolution binds expected recipient from first `p` tag only.
- For multi-recipient/self-sent messages, AD binding may mismatch despite otherwise recoverable data, increasing fallback/placeholder occurrences.

Evidence:

- `src/engine/state.ts`
- `src/engine/state-message-plaintext.ts`
- `src/engine/pqc/dm-receive-envelope.ts`

### P3-05 (Medium): Malformed invite query can hard-fail decode path

- `decodeGroupInvitePayloads` calls `decodeURIComponent` without top-level exception handling.
- Malformed percent-encoding in query input can raise runtime error and bypass graceful user recovery.

Evidence:

- `src/app/invite/schema.ts`

### P3-06 (Medium): localStorage writes/parsing are not uniformly guarded

- Several modules write to localStorage without try/catch; quota/private-mode/storage-disabled environments can throw synchronously.
- This can escalate non-critical telemetry/UI preference paths into user-visible runtime failures.

Evidence:

- `src/app/groups/admin-mode.ts`
- `src/engine/pqc/dm-fallback-history.ts`

### P3-07 (Medium): Recipient validation is permissive before secure send

- Secure send parse accepts any non-empty recipient strings; key-shape/format checks are deferred or absent in this layer.
- This can produce late failures with less precise user diagnostics.

Evidence:

- `src/engine/group-transport-secure-ops.ts`

### P3-08 (Medium): Removed-member exclusion relies on event timestamp trust assumptions

- Wrap exclusion cutoff uses `created_at` comparisons and projected membership state.
- If adversarial/malformed timestamps slip through upstream trust filters, exclusion outcomes can become inconsistent.

Evidence:

- `src/engine/group-wrap-exclusion.ts`
- `src/engine/group-membership-events.ts`

### Pass 3 Summary

Compared to previous passes, the largest newly surfaced concern is **security model clarity vs actual cryptographic guarantees** in current secure group content handling. Operationally, **durability and scheduler gaps** in key lifecycle/rotation are the next major robustness risk class.

### Calibration Note

- Severity ratings prioritize impact under conservative threat assumptions.
- Where runtime bootstrap wiring may exist outside reviewed files, findings are intentionally phrased as “not identified in reviewed paths” rather than absolute absence.
- Recommendation ordering remains unchanged because the near-term safety gains (truth-in-labeling + crash-proofing) are still highest leverage.

## 9) Ranked Remediation Plan (Execution-Ready)

### Tier A — Immediate Safety/Clarity (Do first)

1. **Security model truth-in-labeling** (addresses P3-01, P3-02)
	 - Update user-facing and internal labels to clearly distinguish:
		 - envelope-structured transport integrity checks
		 - true confidentiality-grade encryption (when/if enabled)
	 - Add explicit guardrails in docs and telemetry metadata so dashboards do not imply cryptographic confidentiality where it is not provided.
	 - Acceptance:
		 - No UI copy path claims confidentiality for the current epoch-content encoding path unless explicitly marked pilot/transitional.
		 - Runtime mode/status telemetry can be unambiguously interpreted by support/ops.

2. **Crash-proof invite decode + storage I/O** (addresses P3-05, P3-06)
	 - Wrap decode and localStorage calls in defensive try/catch with non-fatal fallbacks.
	 - Convert malformed input and storage exceptions into typed recoverable errors surfaced via existing guard/recovery UX.
	 - Acceptance:
		 - Malformed invite URLs never crash navigation.
		 - Storage-disabled/quota failures do not break route rendering or message processing.

3. **Secure send input validation front-load** (addresses P3-07)
	 - Validate recipient/key shape before expensive secure send operations.
	 - Return precise user-facing diagnostics for invalid recipients.
	 - Acceptance:
		 - Invalid recipient inputs fail early with deterministic error category.

### Tier B — Reliability Hardening (Next)

4. **Durable key rotation state + restart recovery** (addresses P3-03)
	 - Persist rotation queue/state and lifecycle counters in durable storage.
	 - Add startup replay/reconciliation to resume pending jobs after restart.
	 - Introduce idempotency keys for job execution.
	 - Acceptance:
		 - App restart preserves pending rotations and converges to expected state.
		 - No duplicate side effects when replay occurs.

5. **Recipient AD binding robustness** (addresses P3-04)
	 - Replace first-`p`-tag heuristic with deterministic recipient selection rules for multi-recipient/self-send cases.
	 - Add compatibility tests for mixed tag ordering and duplicate tags.
	 - Acceptance:
		 - AD binding stable across valid tag order permutations.
		 - Placeholder/fallback rate drops in known multi-recipient edge scenarios.

### Tier C — Integrity/Trust Model Tightening (Structural)

6. **Upgrade epoch integrity semantics** (addresses P3-02)
	 - Replace lightweight local hash signaling with cryptographically meaningful integrity primitives aligned with threat model.
	 - Document integrity guarantees and attacker assumptions explicitly.
	 - Acceptance:
		 - Integrity checks are cryptographically grounded and testable against tamper scenarios.

7. **Timestamp trust and exclusion policy hardening** (addresses P3-08)
	 - Reduce reliance on untrusted event timestamps for exclusion-critical decisions.
	 - Prefer monotonic sequence/verified authority inputs where available; define tie-break rules.
	 - Acceptance:
		 - Exclusion decisions are deterministic under timestamp skew/manipulation test cases.

## 10) Suggested Delivery Slices

- **Slice 1 (1-2 days):** Tier A items only; target zero-crash malformed input path and copy/telemetry truth alignment.
- **Slice 2 (2-4 days):** Tier B durability + AD binding fixes with focused unit/integration tests.
- **Slice 3 (design + implementation):** Tier C cryptographic integrity and exclusion-policy model updates.

## 11) Validation Matrix to Add Alongside Implementation

- Mode-label truth table: UI label ↔ transport path ↔ cryptographic guarantee.
- Restart resilience tests: pending rotation jobs survive process restart.
- Malformed-input tests: invite decode and storage failures remain non-fatal.
- Multi-recipient DM tests: deterministic AD binding across tag permutations.
- Exclusion policy tests: timestamp skew/adversarial ordering does not alter secure exclusion outcomes unexpectedly.
