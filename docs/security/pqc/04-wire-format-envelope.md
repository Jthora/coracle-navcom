# Navcom PQC Wire Format Envelope

Status: Draft
Owner: Security Architecture + Client Engineering
Last Updated: 2026-02-18
Depends On: 02-security-requirements.md, 03-architecture-overview.md

Navigation: Previous: [03-architecture-overview.md](03-architecture-overview.md) | Next: [05-key-distribution-and-lifecycle.md](05-key-distribution-and-lifecycle.md)

## Purpose

This document defines the wire format for Navcom PQC encrypted payload envelopes.
It is normative for parsing, validation, and interoperability behavior.

## Audience

- Client protocol implementers
- Security reviewers
- QA validation authors

## Format Overview

- Envelope lives inside event content payload.
- Envelope is versioned.
- Envelope carries algorithm profile identifiers.
- Envelope carries ciphertext and wrap metadata.
- Envelope parsing is fail-closed in strict mode.

## Encoding Strategy

- Preferred encoding: compact binary (CBOR or equivalent canonical form).
- Deterministic field ordering required for stable validation behavior.
- Unknown critical fields must fail parsing in strict mode.
- Unknown non-critical extension fields may be ignored in compatibility mode.

## Envelope Versioning

- Version field: `v` (integer).
- Initial version: `1`.
- Major incompatible changes require new version.
- Minor additive fields use extension map with compatibility flags.

## Required Top-Level Fields (v1)

- `v`: envelope version.
- `mode`: negotiated security mode identifier.
- `alg`: algorithm profile identifier string.
- `nonce`: AEAD nonce bytes.
- `ct`: ciphertext bytes.
- `ad`: associated data hash/descriptor.
- `recipients`: recipient wrapping entries array.
- `ts`: sender timestamp marker.
- `msg_id`: message correlation identifier.

## Optional Top-Level Fields (v1)

- `pad_len`: applied padding length.
- `ext`: extension object.
- `compat`: fallback metadata descriptor.
- `chunk`: chunk metadata if splitting is enabled.

## Recipient Entry Fields

- `pk_ref`: recipient key reference identifier.
- `kem_alg`: key encapsulation algorithm identifier.
- `kem_ct`: recipient-specific encapsulation ciphertext bytes.
- `key_epoch`: epoch identifier for group secure mode.
- `flags`: entry flags map.

## Associated Data Requirements

Associated data should bind the envelope to:

- Event id placeholder strategy or canonical event context.
- Sender public key.
- Recipient set hash.
- Group id and epoch (for group messages).
- Envelope version and algorithm profile.

## Canonicalization Rules

- Numeric fields must use canonical integer representation.
- Byte strings must be treated as opaque and not UTF-8 normalized.
- Map key ordering must be canonicalized.
- Duplicate keys are invalid.

## Validation Rules

- Reject missing required fields.
- Reject unknown critical fields in strict mode.
- Reject invalid type mismatches.
- Reject non-canonical encoding if canonical mode required.
- Reject recipient entries without required wrapping fields.
- Reject envelopes with empty recipient sets where non-empty required.

## Size Budget Guidance

- Envelope size budget must account for per-recipient KEM overhead.
- DM baseline target should remain under common relay limits where possible.
- Group secure mode should favor epoch-key reuse to reduce per-message wraps.
- Chunking may be used only when policy allows and receiver supports it.

## Chunking Metadata (Optional)

If chunking is enabled:

- `chunk.id`: stable chunk set id.
- `chunk.index`: chunk sequence index.
- `chunk.total`: total chunk count.
- `chunk.hash`: full payload integrity hash.

Chunk rules:

- Receiver must reassemble before decrypt attempt.
- Missing chunks must cause temporary pending state, not partial decrypt.
- Timeout behavior must be policy-defined.

## Fallback Metadata

`compat` object may include:

- `fallback_mode`: classical/hybrid indicator.
- `reason_code`: downgrade rationale marker.
- `peer_caps`: summarized peer capability vector.

Fallback metadata must not leak secrets.

## Algorithm Profile Registry (Local)

- `hybrid-mlkem768+x25519-aead-v1`
- `hybrid-mlkem1024+x25519-aead-v1` (optional high-security profile)
- `classical-x25519-aead-v1` (compatibility profile)

Profiles are policy-controlled and may be disabled operationally.

## Error Taxonomy

- `ERR_ENV_VERSION_UNSUPPORTED`
- `ERR_ENV_FIELD_MISSING`
- `ERR_ENV_FIELD_INVALID`
- `ERR_ENV_CANONICALIZATION`
- `ERR_ENV_RECIPIENT_WRAP_INVALID`
- `ERR_ENV_CHUNK_INCOMPLETE`
- `ERR_ENV_ALGORITHM_UNAVAILABLE`

## Sender Behavior Requirements

- Sender must emit only supported envelope version.
- Sender must include recipient wraps for authorized recipients only.
- Sender must enforce payload size checks before publish.
- Sender must include downgrade metadata when fallback occurs.

## Receiver Behavior Requirements

- Receiver must parse and validate before decrypt.
- Receiver must fail closed on malformed critical fields.
- Receiver must map errors to user and telemetry reason codes.
- Receiver must not render partially validated content.

## Security Considerations

- Envelope schema ambiguity is a security risk.
- Deterministic parsing is mandatory.
- Padding strategy should reduce simple traffic inference.
- Extension fields must avoid side-channel leaks.

## Interop Considerations

- Mixed-client ecosystems require explicit mode signaling.
- Older clients should detect unsupported envelope and show clear state.
- Version increments must include migration notes.

## Test Fixture Requirements

- Valid minimal envelope fixture.
- Valid full envelope with extensions.
- Invalid missing field fixture.
- Invalid duplicate key fixture.
- Invalid recipient wrap fixture.
- Oversized envelope fixture.
- Chunked envelope fixture set.

## Decision Log

- 2026-02-18: Established v1 envelope field baseline.
- 2026-02-18: Chose deterministic binary encoding and canonicalization requirements.
- 2026-02-18: Added optional chunking metadata model with strict reassembly rule.

## Open Questions

- Final binary codec choice for all target platforms.
- Whether chunking ships in initial beta or later milestone.
- Preferred default algorithm profile for strict mode.

## Review Checklist

- Are all required fields justified and minimal?
- Are validation rules complete and deterministic?
- Are size and chunking constraints testable?
- Is algorithm profile registry operationally manageable?

## Exit Criteria

- Security architecture approves schema and parser strictness.
- Engineering confirms implementation feasibility.
- QA confirms fixture matrix coverage path.
