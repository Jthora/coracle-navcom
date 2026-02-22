# Stage 5 Integrity Design (P3-02)

Date: 2026-02-21  
Status: Implemented baseline (5.1.1.2/5.1.1.3 complete)  
Related: action-plan.md, findings.md, progress-tracker.md

## 1) Threat Model

### 1.1 Assets

- Secure group epoch state records persisted on device.
- Epoch identifiers and sequence progression used by secure group send/receive validation.
- Operator/user trust in integrity warnings and recovery behavior.

### 1.2 Attacker capabilities in scope

- Local state tampering (malicious extension, injected script, or compromised local profile) that can modify persisted epoch payloads.
- Replay of old persisted epoch records.
- Partial payload corruption in storage migration/recovery scenarios.

### 1.3 Out of scope

- Compromise of the user’s signing key material itself.
- Full host compromise where all local secrets are exfiltrated in real time.

### 1.4 Security goals

- Detect unauthorized mutation of persisted epoch state with cryptographic integrity (not checksum-style detection only).
- Detect replay of older epoch records when newer sequence/version exists.
- Preserve deterministic fail-closed behavior for strict paths, with explicit compatibility fallback where configured.

## 2) Candidate Primitive Evaluation

### Option A — Plain hash (SHA-256) over payload

- Pros: simple and fast.
- Cons: no authenticity; attacker can recompute hash after tampering.
- Decision: rejected.

### Option B — Device-local HMAC-SHA-256 over canonical payload

- Pros: strong tamper detection against payload mutation without key access; efficient WebCrypto support.
- Cons: requires local key bootstrap + persistence and rotation handling.
- Decision: selected baseline.

### Option C — Ed25519 signature over payload

- Pros: strong authenticity and auditability.
- Cons: requires signer availability and key operation for local state writes; higher integration complexity for offline/bootstrap flows.
- Decision: deferred as future uplift candidate.

## 3) Selected Primitive and Data Model

Selected primitive: **HMAC-SHA-256** over canonical epoch payload with a device-local integrity key.

### 3.1 Canonical payload

Canonicalized stable fields (ordered):

1. schema
2. groupId
3. epochId
4. sequence
5. createdAt
6. updatedAt

### 3.2 Integrity envelope fields (next schema)

- `schema`: increment from 1 to 2
- `integrityAlg`: `hmac-sha256-v1`
- `integrityMac`: base64url MAC output
- `integrityKeyId`: stable local key reference

### 3.3 Replay guard

- Keep monotonic `(groupId, sequence, updatedAt)` acceptance policy.
- Reject persisted states with lower sequence than already loaded memory state.
- On equal sequence, require `updatedAt` non-decreasing.

## 4) Integration Plan for 5.1.1.2

### 4.1 Key management

- Generate 256-bit integrity key via WebCrypto `crypto.subtle.generateKey`.
- Persist key material via existing secure storage abstraction where available.
- Key bootstrap fallback:
  - if key unavailable and strict mode active, fail closed with explicit recovery reason.
  - if compatibility mode active, emit telemetry + recover using existing rehydration path.

### 4.2 Verification points

- Verify MAC before accepting any persisted epoch state.
- Reject on MAC mismatch with explicit typed reason.
- Log telemetry counter for mismatch/replay rejection.

### 4.3 Migration/versioning

- Loader accepts schema 1 and 2 during migration window.
- On successful schema-1 load, re-save in schema-2 format with MAC.
- Corrupt or unrecognized schema payloads are quarantined (ignored + telemetry).

## 5) Compatibility and Failure Behavior

- Strict policy: cryptographic verification failure returns deterministic blocked state.
- Compatibility policy: verification failure enters controlled fallback/rehydration flow.
- All failure classes must map to stable reason codes for telemetry and support diagnostics.

## 6) Acceptance Criteria Mapping (5.1.1.1)

- Threat model documented: ✅
- Candidate primitives evaluated with tradeoffs: ✅
- Selected primitive + data model frozen for implementation: ✅

## 7) Implementation Notes for 5.1.1.2/5.1.1.3

- Add tamper mutation test vectors:
  - single-field mutation (sequence, epochId, updatedAt),
  - replay payload injection,
  - invalid MAC format.
- Add migration tests:
  - schema-1 read then schema-2 writeback,
  - schema mismatch quarantine path.
- Publish support runbook snippets for integrity verification failures and user-facing recovery guidance.
