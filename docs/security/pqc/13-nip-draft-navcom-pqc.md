# NIP Draft: Navcom PQC Hybrid Messaging Profile

Status: Working Draft
Owner: Navcom Core Team
Last Updated: 2026-02-18
Target: Community review draft

Navigation: Previous: [12-operations-and-incident-playbook.md](12-operations-and-incident-playbook.md) | Next: n/a

## Abstract

This draft proposes a hybrid post-quantum messaging profile for Nostr-compatible clients.
It defines capability signaling, key publication metadata, and encrypted envelope conventions.
The design preserves relay interoperability by keeping outer event validation unchanged.

## Motivation

Classical-only encrypted messaging is vulnerable to harvest-now-decrypt-later threats.
A transition path is needed that can be adopted incrementally in mixed-client networks.
Hybrid modes provide better future resilience while maintaining compatibility.

## Goals

- Enable hybrid PQ + classical message confidentiality.
- Avoid mandatory relay software cryptographic changes.
- Support deterministic capability negotiation.
- Define structured envelope and key publication behaviors.

## Non-Goals

- Replacing Nostr identity and outer signature scheme in this draft.
- Mandating one specific PQ implementation library.
- Defining every possible PQ algorithm profile.

## Terminology

- Hybrid profile: algorithm combination of classical and PQ components.
- Capability record: signed metadata describing client support.
- Key publication record: signed metadata for PQ key discovery.
- Envelope: encoded encrypted message payload.

## Compatibility Statement

This draft is designed to coexist with current clients.
Legacy clients may not decrypt envelope payloads and should show unsupported state.
Compatibility mode allows controlled fallback paths where policy permits.

## Capability Record (Draft)

Recommended fields:

- `caps.version`
- `caps.modes`
- `caps.algs`
- `caps.key_id`
- `caps.updated_at`

Capability records should be signed by owner identity key.

## PQ Key Publication Record (Draft)

Recommended fields:

- `schema`
- `pq_alg`
- `pq_pub`
- `key_id`
- `created_at`
- `expires_at`
- `status`

Records should be signed and publishable via user-owned event mechanisms.

## Envelope Structure (Draft v1)

Required fields:

- `v`
- `mode`
- `alg`
- `nonce`
- `ct`
- `ad`
- `recipients`

Recipient wrap fields:

- `pk_ref`
- `kem_alg`
- `kem_ct`
- `key_epoch` (group use)

## Negotiation Rules (Draft)

1. Determine local policy mode.
2. Load peer capabilities.
3. Select strongest shared profile.
4. If unavailable, apply policy fallback/block.
5. Emit explicit reason code for downgrade/block.

## Strict vs Compatibility Modes

- Strict: no silent downgrade; block send if requirements unmet.
- Compatibility: controlled fallback with user-visible indication.

## Group Messaging Considerations

- Group secure mode should use epoch-based key lifecycle.
- Membership removal should trigger epoch advancement.
- Removed members should not receive future epoch wraps.

## Relay Considerations

- Relays remain transport and policy layer, not confidentiality trust anchor.
- Payload size limits vary and should be handled client-side.
- Clients should preflight size and adjust behavior by policy.

## Security Considerations

- Capability spoofing mitigated by signed records and freshness checks.
- Replay and stale records require timestamp/freshness handling.
- Malformed envelope parsing must fail closed in strict mode.
- Endpoint compromise remains a high-impact risk outside protocol scope.

## Privacy Considerations

- Metadata leakage at relay layer remains possible.
- Envelope should avoid unnecessary metadata expansion.
- Telemetry should avoid plaintext and secret material.

## Error and Reason Code Guidance

Suggested categories:

- negotiation failure
- stale capability
- missing key
- key expired
- envelope invalid
- decrypt failed
- relay size rejected

## Interop Guidance

- Clients should include clear unsupported state for unknown envelope versions.
- Clients should retain compatibility mode during migration windows.
- Versioning and extension handling should be deterministic.

## Test Vectors and Fixtures

Implementations should include:

- valid minimal envelope fixture
- valid multi-recipient fixture
- malformed field fixtures
- unknown critical field fixture
- stale capability fixture

## Operational Guidance

- Implement kill-switch for algorithm profile disable.
- Provide diagnostics for fallback and block outcomes.
- Maintain rollback path to classical profile operation.

## Backward Migration and Rollback

- If critical flaws are identified, clients should disable affected profile and revert to compatibility behavior.
- Rollback should preserve ability to read prior messages when possible.

## IANA / Registry Considerations (Informational)

- Local algorithm profile registry recommended.
- Capability schema version registry recommended.
- Envelope version registry recommended.

## Open Questions

- Which initial hybrid profile should be required vs optional?
- How should chunking be standardized, if at all?
- What minimum capability freshness interval is recommended?

## Reference Implementation Notes

- Keep parser strict and deterministic.
- Separate policy engine from crypto primitives.
- Instrument reason codes for rollout visibility.

## Draft Adoption Plan

- Publish draft for community discussion.
- Gather feedback on schema and negotiation semantics.
- Iterate with interop test reports.
- Advance toward broader NIP proposal readiness.

## Changelog

- 2026-02-18: Initial working draft created for Navcom-focused hybrid profile.
- 2026-02-18: Added capability, key record, envelope, and negotiation sections.
- 2026-02-18: Added security/privacy/interop guidance and open questions.

## Appendix A - Example Capability Payload (Illustrative)

- version: 1
- modes: [hybrid, classical]
- algs: [hybrid-mlkem768+x25519-aead-v1]
- key_id: k-2026-01
- updated_at: 1739836800

## Appendix B - Example Key Metadata Payload (Illustrative)

- schema: 1
- pq_alg: mlkem768
- key_id: k-2026-01
- created_at: 1739836800
- expires_at: 1747612800
- status: active

## Appendix C - Example Envelope Header (Illustrative)

- v: 1
- mode: hybrid
- alg: hybrid-mlkem768+x25519-aead-v1
- recipient_count: 3

## Appendix D - Example Downgrade Reasons (Illustrative)

- NO_CAPABILITY_RECORD
- STALE_CAPABILITY_RECORD
- MISSING_VALID_PQ_KEY
- RELAY_SIZE_REJECTED
- POLICY_STRICT_BLOCK

## Appendix E - Conformance Checklist (Draft)

- Implements capability parsing
- Implements key publication validation
- Implements envelope v1 parser
- Implements strict-mode block behavior
- Emits required reason codes
- Provides unsupported-version UX
