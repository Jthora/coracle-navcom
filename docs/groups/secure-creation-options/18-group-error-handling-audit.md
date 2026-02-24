# Group Error Handling Audit + Coverage Plan

Date: 2026-02-23
Status: Active
Owner: Engineering + QA + Security

## Scope Audited

- Group create/join guided flow
- Relay capability checks and relay auth lifecycle
- Invite creation, invite acceptance, invite sharing
- Group chat send path
- Secure transport / encryption path integration points

## Current Error Surface Inventory

## A) Create/Join Guided Flow

Primary files:
- `src/app/views/GroupCreateJoin.svelte`
- `src/app/groups/create-join-policy.ts`
- `src/engine/group-commands.ts`

Error classes observed:
- Invalid group address / input validation
- Capability/policy blockers (strict mode, invite tier)
- Relay reachability/authentication failures
- Publish/dispatch failures
- Clipboard/share failures

Prior gap:
- Catch blocks used inconsistent user messages and mostly ad-hoc telemetry.

## B) Relay Checks + Relay Auth

Primary files:
- `src/app/groups/relay-capability.ts`
- `src/app/views/GroupCreateJoin.svelte`

Error classes observed:
- Unreachable relay / timeout / malformed metadata endpoint
- Auth-required state with missing signer
- Unknown relay auth method

Prior gap:
- Inconsistent normalization of relay/auth failures across create and join paths.

## C) Invite Paths

Primary files:
- `src/app/views/InviteCreate.svelte`
- `src/app/views/InviteAccept.svelte`
- `src/app/views/GroupConversation.svelte`
- `src/app/invite/accept.ts`

Error classes observed:
- Invalid invite payload entries
- Share and clipboard unavailability
- Auto-join redirect failures

Prior gap:
- Invite create/accept/share paths had partial telemetry and inconsistent exception handling.

## D) Group Send + Encryption Integration

Primary files:
- `src/app/views/GroupConversation.svelte`
- `src/engine/group-commands.ts`
- `src/engine/group-transport-secure-ops.ts`

Error classes observed:
- Empty message / invalid group address
- Secure send capability and validation failures
- Dispatch and reconcile failures

Prior gap:
- UI send failures emitted telemetry but lacked canonical error classification.

## Implemented in this pass

1. Added centralized error normalization + reporting utility:
   - `src/app/groups/error-reporting.ts`
   - Canonical context and error-code taxonomy
   - Retryable flag derivation
   - Unified telemetry event emission via `group_error_reported`

2. Extended telemetry event union:
   - `src/app/groups/telemetry.ts`
   - Added `group_error_reported`

3. Wired reporting into guided create/join:
   - `src/app/views/GroupCreateJoin.svelte`
   - Relay checks (create/join), relay auth (create/join), create/join submit, access package copy

4. Wired reporting into invite and chat paths:
   - `src/app/views/GroupConversation.svelte` (invite share + send)
   - `src/app/views/InviteCreate.svelte` (submit)
   - `src/app/views/InviteAccept.svelte` (autojoin redirect)

## Remaining Gaps (Next Work)

1. Engine-level typed error contracts
   - Replace broad `Error` throws in `group-commands.ts` with structured typed errors carrying stable code + context.

2. Secure transport error code propagation
   - Promote secure-ops validation reasons into first-class UI-facing codes rather than message matching.

3. Admin operations coverage
   - Wire centralized reporting in `GroupSettingsAdmin.svelte` and related admin control actions.

4. Invite decode telemetry depth
   - Emit parse reason distribution for rejected group invite entries from invite schema/decode layer.

5. E2E error contract checks
   - Add Cypress assertions for canonical `group_error_reported` fields across create/join/send/invite failure paths.

## Second-Pass Deep/Wide Audit Findings (2026-02-23)

### Priority 0 — User-Facing Admin Actions Still Uninstrumented

File:
- `src/app/views/GroupSettingsAdmin.svelte`

Observed:
- Multiple async submit paths catch errors and only emit generic warning toasts.
- No canonical context/error-code telemetry on failures for:
   - policy+metadata submit
   - member add/update
   - member removal
   - moderation actions

Why this matters:
- These are high-value operator workflows where debugging needs actor role, action type, groupId, and retryability.
- Generic toast-only handling loses root-cause distribution and failure trend visibility.

Recommended action:
- Wrap all admin submit catches with centralized reporting utility and standardized context values:
   - `group_admin_save_policy`
   - `group_admin_put_member`
   - `group_admin_remove_member`
   - `group_admin_moderation_submit`

### Priority 1 — Silent Relay Policy Fallback Masks Corruption/Parse Failures

File:
- `src/app/groups/relay-policy.ts`

Observed:
- `loadRoomRelayPolicy` swallows JSON/localStorage errors and silently returns defaults.

Why this matters:
- Corrupt or incompatible policy state becomes invisible, making relay behavior appear nondeterministic to users and QA.

Recommended action:
- Emit one-shot error telemetry for fallback reason classes:
   - `storage_read_failed`
   - `policy_parse_failed`
   - `policy_shape_invalid`
- Include groupId and fallback-to-default flag.

### Priority 1 — Simulation Catch Path Not Reporting Capability Blocks

File:
- `src/app/groups/mixed-capability-lanes.ts`

Observed:
- Simulation returns `status: blocked` with an error string but does not emit canonical report telemetry.

Why this matters:
- This lane is used to reason about secure fallback behavior; missing telemetry limits diagnosis of capability/tier policy regressions.

Recommended action:
- Report blocked simulation outcomes with context such as `mixed_capability_simulation_dispatch` and reason mapping to canonical code taxonomy.

### Priority 2 — Engine Dispatch Layer Uses Throw-Only Error Surface

File:
- `src/engine/group-transport.ts`

Observed:
- Multiple `throw new Error(...)` branches for validation, capability gate, tier policy block, adapter contract mismatch, and transport result message.
- Upstream UI catches report generic errors, but engine-level reason structure is flattened into text.

Why this matters:
- Inconsistent free-text propagation reduces code stability and complicates deterministic telemetry analytics.

Recommended action:
- Introduce typed transport error objects (stable code + message + retryable + metadata) and maintain text as presentation-only.

### Priority 2 — Permission Denials and Message Validation in Commands Layer

File:
- `src/engine/group-commands.ts`

Observed:
- Permission denials and input checks throw plain `Error` with message strings.

Why this matters:
- Role-based policy failures are operationally important and should be queryable by canonical code.

Recommended action:
- Normalize these throws into typed command errors before crossing UI boundary.

### Priority 3 — Secure Ops Already Structured, But Reason Taxonomy Drift Risk

Files:
- `src/engine/group-transport-secure-control.ts`
- `src/engine/group-transport-secure-ops.ts`
- `src/engine/group-epoch-content.ts`

Observed:
- These modules mostly return structured transport result reasons.
- Remaining risk is mismatch between reason identifiers and UI-level canonical group error code taxonomy.

Recommended action:
- Add a single reason-code mapping contract test to prevent drift between engine reason codes and `group_error_reported.errorCode`.

## Recommended Execution Order (Second Pass)

1. Instrument `GroupSettingsAdmin.svelte` submit catches with centralized reporting.
2. Add telemetry for relay-policy fallback load errors.
3. Add canonical reporting to mixed-capability simulation blocked path.
4. Introduce typed transport error wrappers for `group-transport.ts` + `group-commands.ts` boundary.
5. Add contract tests asserting engine-to-telemetry reason-code mapping.

### Status Update (2026-02-23)

- Steps 1-5 above are now implemented.
- Typed engine wrappers are active in transport and command dispatch paths.
- Contract mapping tests now lock engine error codes to `group_error_reported.error_code` in app-level reporting.
- Telemetry contract test now asserts required `group_error_reported` payload fields (`context`, `error_code`, `retryable`, `result`, `flow`, `group_id_present`).

## Acceptance Criteria for “Comprehensive” Error Handling

- Every user-facing group flow catch path emits:
  - context
  - canonical error_code
  - retryable
  - stable result state (`error`)
- Every major failure path has deterministic user-facing guidance.
- Engine and UI share stable error-code contracts (not only free-text messages).
- CI includes schema checks for the `group_error_reported` telemetry payload.
