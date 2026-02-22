# Stage 1 Scope Lock (Program Setup)

Date: 2026-02-21  
Status: Frozen for implementation phases 1-4  
Related: action-plan.md, findings.md, progress-tracker.md

## 1) Canonical Transport Modes (Frozen)

| Mode | Intent | Runtime behavior baseline | Fallback behavior | User-facing claim boundary |
|---|---|---|---|---|
| baseline | Broad compatibility path | Uses standard group transport path without secure-pilot-only operations | N/A (native baseline) | Must not imply confidentiality upgrade |
| secure-pilot | Preferred hardened path where capability allows | Uses secure adapter/secure ops pipeline when pilot + capability conditions are met | Falls back to compatibility/baseline path with explicit reason telemetry | May claim enhanced handling only when active runtime state confirms it |
| compatibility | Interop recovery mode for unsupported peers/contexts | Uses compatibility-safe path preserving delivery continuity | Can collapse to baseline defaults if capability checks fail | Must frame as delivery compatibility, not stronger cryptographic guarantees |

Precedence rules (frozen):

1. Explicit requested mode from command/context.
2. Capability and policy gate eligibility.
3. Deterministic fallback order: `secure-pilot -> compatibility -> baseline`.
4. Telemetry must emit both requested mode and resolved mode.

## 2) Guarantee Labels (Frozen)

| Label class | Definition | Allowed wording patterns | Disallowed wording patterns |
|---|---|---|---|
| transport-integrity | Structured envelope and integrity-oriented handling within transport constraints | “integrity checks”, “transport-protected structure”, “verification path” | “end-to-end secret”, “confidential by default” |
| confidentiality | Cryptographic secrecy guarantees where implementation and runtime state explicitly provide it | “confidential payload”, “encrypted content” | Any confidentiality claim without active verified cryptographic path |
| compatibility-delivery | Best-effort interoperability and delivery continuity | “compatibility mode”, “fallback delivery path” | “same security as secure mode” |

Policy note (frozen):

- Any surface that cannot verify confidentiality at runtime must use transport-integrity or compatibility-delivery language only.

## 3) UI/Telemetry Wording Map (Approved)

### 3.1 UI wording map

| Context | Runtime state | Approved wording | Prohibited wording |
|---|---|---|---|
| Group create/join privacy selector | secure-pilot requested | “Secure pilot preferred (uses compatibility fallback if unavailable)” | “Always encrypted” |
| Group list/detail security chip | secure-pilot active | “Secure transport active” | “Private by cryptography” |
| Group list/detail security chip | fallback active | “Compatibility transport active” | “Same as secure mode” |
| Recovery/guard message | malformed route/input | “We recovered and routed you safely. Review details and continue.” | “Unknown fatal state” |

### 3.2 Telemetry field map

| Field | Type | Values | Notes |
|---|---|---|---|
| `requested_transport_mode` | enum | baseline, secure-pilot, compatibility | Captured at intent boundary |
| `resolved_transport_mode` | enum | baseline, secure-pilot, compatibility | Captured after capability/policy resolution |
| `fallback_reason` | enum | unsupported-capability, policy-denied, runtime-error, none | Required when requested != resolved |
| `guarantee_label` | enum | transport-integrity, confidentiality, compatibility-delivery | Must mirror UI guarantee class |

Approval record:

- Wording and field taxonomy frozen for implementation phases unless superseded by explicit audit update.

## 4) Per-Finding Acceptance Criteria (Frozen)

| Finding | Done condition | Evidence artifact |
|---|---|---|
| G-01 | Guided privacy selection deterministically influences runtime mode resolution | Unit/integration tests + mode-resolution trace log |
| G-02 | Group chat send path always traverses adapter abstraction | Code diff + regression test asserting no direct publish bypass |
| G-03 | Secure pilot activation state is observable outside tests and reflected in UI status | Runtime bootstrap verification + status mapping test |
| G-04 | PQC envelope and command boundaries share aligned type/result contracts | Scoped typecheck pass output for touched modules |
| P2-01 | Baseline-default ambiguity removed and precedence documented/tested | Documentation update + precedence tests |
| P2-02 | Tier/capability checks run on chat send path consistently | Send-path tests with capability on/off scenarios |
| P2-03 | Non-test pilot activation path validated | Integration verification notes + automated check |
| P2-04 | Secure storage runtime mismatches recover through controlled error path | Failure-mode tests + recovery-path evidence |
| P2-05 | Guard recovery context preserved across serializer/redirect interactions | Route-flow tests verifying message continuity |
| P3-01 | No confidentiality overclaim where runtime guarantee is not confidentiality | UI copy audit + security-claims gate checklist |
| P3-02 | Integrity mechanism upgraded to cryptographically meaningful primitive | Design spec + implementation tests |
| P3-03 | Rotation/lifecycle state survives restart and replays idempotently | Restart simulation test + replay telemetry |
| P3-04 | Multi-recipient recipient-binding deterministic across permutations | Table-driven tests for tag order/duplicates/self-send |
| P3-05 | Malformed invite decode cannot crash route flow | Negative tests for malformed encodings |
| P3-06 | localStorage failures degrade gracefully (no route/runtime crash) | Storage-failure simulation tests |
| P3-07 | Invalid recipient/key inputs fail early with deterministic diagnostics | Validation tests + stable error map |
| P3-08 | Exclusion outcomes deterministic under timestamp skew/manipulation | Adversarial timestamp tests + tie-break policy assertions |

## 5) Frozen Validation Gate Matrix

### 5.1 Functional gate

- Required:
  - Touched unit specs for groups + pqc modules.
  - Touched smoke/e2e specs for affected flows.
- Pass threshold:
  - 100% pass on touched suites.

### 5.2 Correctness gate

- Required:
  - Proof that group send flow has no direct-send bypass.
  - Mode intent-to-resolution assertions.
- Pass threshold:
  - No bypass call path in tested flow matrix.

### 5.3 Resilience gate

- Required:
  - Malformed input scenarios.
  - Storage-disabled/quota failure simulations.
- Pass threshold:
  - No unhandled exceptions in scoped scenarios.

### 5.4 Security-claims gate

- Required:
  - UI text review against guarantee labels.
  - Telemetry field/value review against approved map.
- Pass threshold:
  - Zero claim mismatch findings.

### 5.5 Type-safety gate

- Required:
  - Scoped typecheck for touched transport/PQC modules.
- Pass threshold:
  - Zero new type errors in modified scope.

## 6) Merge Eligibility for Stage 1 Completion

Stage 1 is complete when:

1. Canonical mode taxonomy and guarantee labels are published and frozen.
2. UI/telemetry wording map is approved and frozen.
3. Per-finding acceptance criteria table is complete for all findings.
4. Gate matrix and merge thresholds are published.
