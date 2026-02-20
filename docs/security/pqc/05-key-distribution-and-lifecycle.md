# Navcom PQC Key Distribution and Lifecycle

Status: Draft
Owner: Security Architecture + Client Engineering
Last Updated: 2026-02-18
Depends On: 02-security-requirements.md, 04-wire-format-envelope.md

Navigation: Previous: [04-wire-format-envelope.md](04-wire-format-envelope.md) | Next: [06-capability-negotiation.md](06-capability-negotiation.md)

## Purpose

This document defines how PQ key material is published, discovered, validated, rotated, and revoked.
It establishes lifecycle policies required for secure and reliable operation.

## Audience

- Security engineers
- Client implementers
- Ops and incident responders

## Key Types

- User PQ KEM keypair for recipient wrapping.
- Optional device-scoped key identifiers for multi-device handling.
- Group epoch key material derived and managed per group state.

## Publication Model

- PQ public key metadata is published in a signed user-owned event.
- Publication event contains algorithm identifier, key bytes/reference, and expiry metadata.
- Publication event is immutable per version and superseded by newer active record.

## Publication Event Fields (Conceptual)

- `schema`: key metadata schema version.
- `user_pubkey`: owner identity.
- `pq_alg`: algorithm profile.
- `pq_pub`: encoded PQ public key bytes.
- `key_id`: stable key identifier.
- `created_at`: creation timestamp.
- `expires_at`: expiry timestamp.
- `status`: active, deprecated, revoked.
- `device_hint`: optional device label.

## Signature and Authenticity

- Publication event must be signed by existing user identity key.
- Unsigned or invalid-signature key publication entries are rejected.
- Duplicate active key ids with conflicting values are rejected.

## Key Discovery Flow

1. Sender resolves recipient identity.
2. Sender loads cached key metadata if fresh.
3. If stale/missing, sender requests latest key publication events.
4. Sender validates signature and schema.
5. Sender selects eligible key by policy.
6. Sender caches selected key with freshness metadata.

## Freshness Policy

- Fresh if current time < expires_at and local stale window not exceeded.
- Expired keys cannot be used in strict mode.
- Compatibility mode may fallback to classical if policy permits.
- Freshness check required at first secure send per session.

## Rotation Policy

- Time-based rotation interval must be defined (default candidate: 90 days).
- Rotation should be triggered on suspected compromise, algorithm deprecation, or device migration.
- Rotated keys publish new key_id and validity window.
- Old key records remain for decrypt compatibility history where needed.

## Revocation Policy

- Revocation entry marks key_id as compromised or retired.
- Revocation must be signed by owner identity.
- Clients must reject revoked keys for new send operations.
- Group workflows should trigger rekey where compromised membership affects access.

## Multi-Device Handling

- Device-specific key hints may be used to optimize routing.
- If multiple active keys exist, sender can choose policy:
  - Per-device wrapping.
  - Latest-active wrapping.
  - Strict single-key enforcement.
- Policy must be deterministic and documented.

## Group Epoch Lifecycle

- Each secure group has active epoch identifier.
- Membership changes can trigger epoch advancement.
- Epoch transitions must update wrapping sets for current members only.
- Removed members must not receive future epoch key wraps.

## Cache Model

- Key cache stores validated metadata entries and freshness status.
- Cache includes source relay set and last validation timestamp.
- Cache refresh policy should avoid excessive network load.
- Cache poisoning defenses rely on signature + schema + status validation.

## Failure Handling

- Missing key metadata -> fetch and retry once before policy fallback.
- Expired key metadata -> attempt refresh; block or fallback by mode.
- Conflicting active records -> prefer most recent valid with deterministic tie-break.
- Revoked selected key -> reject and select alternate if valid.

## Downgrade Interaction

- Key unavailability reason must map to explicit fallback reason code.
- Strict mode blocks send when no valid PQ key exists.
- Compatibility mode can use classical profile with warning.

## Operational Controls

- Kill-switch to disable specific algorithm profiles.
- Emergency rotate recommendation channel for compromised algorithms.
- Key publication monitoring for abnormal churn or conflict patterns.

## Telemetry and Auditing

- Key lookup success/failure counts.
- Expired-key encounter rate.
- Revocation event handling counts.
- Rotation adoption lag metrics.
- Group epoch transition counters.

Telemetry must avoid plaintext or private-key leakage.

## Security Considerations

- Key publication authenticity depends on signature validation correctness.
- Stale cache increases downgrade pressure risk.
- Overly long key lifetimes increase exposure window.
- Aggressive rotation without UX support can reduce deliverability.

## Testing Requirements

- Valid publication parse and selection tests.
- Expired key rejection tests.
- Revoked key exclusion tests.
- Multi-device key selection determinism tests.
- Group membership transition key-wrap exclusion tests.

## Decision Log

- 2026-02-18: Defined signed key publication model using user-owned events.
- 2026-02-18: Established explicit status model for active/deprecated/revoked.
- 2026-02-18: Linked group epoch lifecycle to membership transitions.

## Open Questions

- Exact default rotation period for initial launch.
- Whether device-specific wrapping is required in first release.
- How long deprecated keys remain eligible for decrypt-only compatibility.

## Review Checklist

- Are freshness and expiry rules deterministic?
- Are revocation semantics actionable in all modes?
- Is multi-device behavior predictable and testable?
- Does group epoch model enforce removed-member exclusion?

## Exit Criteria

- Security approval of lifecycle policy.
- Engineering feasibility sign-off.
- QA plan includes key lifecycle edge cases.
