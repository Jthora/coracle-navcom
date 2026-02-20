# Navcom PQC DM Integration Design

Status: Draft
Owner: Client Engineering
Last Updated: 2026-02-18
Depends On: 04-wire-format-envelope.md, 05-key-distribution-and-lifecycle.md, 06-capability-negotiation.md

Navigation: Previous: [06-capability-negotiation.md](06-capability-negotiation.md) | Next: [08-group-chat-integration-design.md](08-group-chat-integration-design.md)

## Purpose

This document describes how hybrid PQC is integrated into Navcom direct message flows.
It maps secure behavior to concrete send/receive pipeline stages.

## Audience

- Client application engineers
- Security reviewers
- QA engineers writing DM scenarios

## Integration Goals

- Add hybrid encryption for DM content without relay-side crypto changes.
- Preserve current event signing and publish behavior.
- Keep deterministic fallback and strict-mode block behavior.
- Expose clear user trust indicators.

## Existing Baseline Summary

- DM send currently routes through message command pipeline.
- DM receive currently resolves plaintext via legacy mechanisms.
- Messaging relay configuration affects delivery reliability.

## New Components for DM Path

- Capability resolver service.
- Peer PQ key resolver/cache service.
- Envelope encoder for DM payloads.
- Envelope decoder and validator for DM receive.
- Policy decision helper for strict vs compatibility mode.

## DM Send Flow (Target)

1. Build recipient set and normalize IDs.
2. Resolve peer capability state.
3. Resolve fresh peer PQ key metadata.
4. Execute negotiation algorithm.
5. If strict mode and no hybrid path, block send with reason.
6. Build envelope associated data context.
7. Encrypt plaintext and wrap keys per recipient.
8. Serialize envelope and attach to event content.
9. Add mode/capability tags to event.
10. Sign and publish via existing route.
11. Record telemetry outcome and reason codes.

## DM Receive Flow (Target)

1. Validate event signature and basic structure.
2. Detect envelope mode markers.
3. Parse envelope with strict schema checks.
4. Resolve local key material.
5. Attempt decrypt according to envelope profile.
6. Validate associated data bindings.
7. Render plaintext and security state.
8. Record decrypt telemetry and failures.

## Fallback Logic

- Strict policy: block send if no valid hybrid mode.
- Compatibility policy: fallback to classical profile with explicit warning.
- If envelope parse fails in strict receive contexts, show undecryptable secure message state.
- If envelope parse fails in compatibility contexts, attempt legacy path only when explicitly allowed.

## UI and UX Requirements

- Trust indicator reflects negotiated mode per message.
- Downgrade warning includes reason category.
- Message detail view includes envelope/profile diagnostics.
- Send composer shows strict policy block reason when applicable.

## Error Handling

- `DM_NEGOTIATION_FAILED`
- `DM_KEY_UNAVAILABLE`
- `DM_KEY_EXPIRED`
- `DM_ENVELOPE_ENCODE_FAILED`
- `DM_ENVELOPE_PARSE_FAILED`
- `DM_DECRYPT_FAILED`
- `DM_POLICY_BLOCKED`

Errors map to user-safe messages and telemetry reason codes.

## Telemetry Events

- `dm_secure_send_success`
- `dm_secure_send_fallback`
- `dm_secure_send_blocked`
- `dm_secure_receive_success`
- `dm_secure_receive_failure`

Telemetry payloads should include mode, reason code, and timing buckets only.

## State and Caching

- Peer capability cache with freshness timestamps.
- Peer key cache with expiry and status.
- Message-level security state persisted for rendering.
- Retry guard to avoid repeated failing key lookups.

## Performance Considerations

- Batch key lookups for multi-recipient DM channels where applicable.
- Avoid blocking UI thread for heavy cryptographic operations.
- Measure encryption and decryption latency percentiles.
- Keep envelope payload size within relay-aware limits.

## Backward Compatibility

- Legacy peers remain reachable in compatibility mode.
- Envelope-tagged messages should render unsupported-state in old clients.
- Migration should not break existing message history rendering.

## Security Controls

- Fail closed on malformed envelope in strict mode.
- Never silently downgrade when strict policy enabled.
- Bind sender and recipient context through associated data.
- Avoid plaintext leakage to logs.

## Implementation Work Breakdown

- Task DM-1: capability/key resolver integration.
- Task DM-2: envelope encoder integration in send path.
- Task DM-3: envelope decoder integration in receive path.
- Task DM-4: UI trust indicator and warning states.
- Task DM-5: telemetry and diagnostics reason mapping.
- Task DM-6: tests and regression hardening.

## Test Plan Summary

- Unit tests for negotiation decisions.
- Unit tests for envelope encode/decode and validation.
- Integration tests for send/receive in strict and compatibility modes.
- Mixed-peer scenarios (supports hybrid / legacy only / stale key).
- Failure mode scenarios for parse/decrypt/key fetch errors.

## Rollout Strategy

- Feature flag off by default initially.
- Internal dogfood with telemetry review.
- Opt-in beta with warning UX validation.
- Default-on compatibility mode after stability gate.
- Strict mode promotion decision after adoption baseline.

## Decision Log

- 2026-02-18: Defined DM send/receive staged integration model.
- 2026-02-18: Added strict-mode block behavior for failed negotiation.
- 2026-02-18: Declared message-level trust indicators required.

## Open Questions

- Should compatibility mode try dual-wrap in first DM release?
- What UX wording best communicates downgrade state?
- Which retry strategy minimizes user friction and relay load?

## Review Checklist

- Are all send/receive steps testable?
- Are strict and compatibility behaviors fully specified?
- Are telemetry fields privacy-safe?
- Are performance risks addressed for low-end devices?

## Exit Criteria

- Engineering prototype merged behind feature flag.
- Security review passes for DM path controls.
- QA matrix for DM path passing in CI.
