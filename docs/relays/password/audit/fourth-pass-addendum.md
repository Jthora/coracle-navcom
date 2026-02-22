# Fourth-Pass Addendum — Relay Password/Relay Handling Audit

Date: 2026-02-22
Type: Code review only (delta from first, second, and third pass)

## Why this addendum

A fourth pass was performed to check for residual gaps in relay transport safety and claim-token hardening outside previously documented paths.

## Newly Identified Gaps

## FP-01 — Group relay policy path independently permits `ws://` transport

Severity: **High**

Evidence:

- `src/app/groups/relay-policy.ts` validates URLs with `^wss?://...`, explicitly allowing both `wss://` and `ws://`.
- `src/app/views/GroupRelayPolicyEditor.svelte` depends on this validation for policy save flow.

Risk:

- Non-TLS relay endpoints can be persisted as approved group policy.
- This is a separate downgrade surface from guided create/join parsing and increases likelihood of insecure relay operation.

Gap vs prior passes:

- Third pass identified `ws://` allowance in guided create options; fourth pass confirms a second independent allowance in policy storage/validation logic.

## FP-02 — Claim token paths lack bounded input policy (length/shape)

Severity: **Medium**

Evidence:

- `src/app/invite/create.ts` serializes claim values directly into URL query payload.
- `src/app/groups/relay-policy.ts` trims claim values but does not enforce length/charset constraints.
- `src/engine/commands.ts` publishes relay claim tags directly via `requestRelayAccess` without size/format preflight.

Risk:

- Oversized or malformed claim payloads can increase exposure and instability risk across URL/clipboard/logging/publish paths.
- Lack of canonical claim constraints makes behavior inconsistent across surfaces.

Gap vs prior passes:

- Prior passes focused on plaintext storage/transport and parsing robustness; fourth pass adds bounded-input policy gap for claims.

## Delta Recommendations

1. Enforce `wss://` in group relay policy validator and confine `ws://` to explicit legacy override pathways.
2. Establish a single claim validation contract (max length + allowed charset) and enforce it at UI input, invite serialization, and relay publish boundaries.
3. Add audit tests that assert reject/normalize behavior for insecure relay URLs and oversized claim payloads.
