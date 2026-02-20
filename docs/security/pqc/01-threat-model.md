# Navcom PQC Threat Model

Status: Draft
Owner: Security Architecture + Core Team
Last Updated: 2026-02-18
Depends On: 00-readme.md

Navigation: Previous: [00-readme.md](00-readme.md) | Next: [02-security-requirements.md](02-security-requirements.md)

## Purpose

This document defines the threat model for Navcom PQC communications.
It identifies adversaries, assets, trust boundaries, and acceptable residual risk.
All security requirements in 02-security-requirements.md must map to this model.

## Audience

- Security engineers
- Client engineers
- Relay operators
- Product and UX stakeholders
- QA and validation teams

## Scope

- Direct messages in Navcom.
- Group chat and group transport behavior in Navcom.
- Key publication, discovery, and rotation for PQ capabilities.
- Capability negotiation and fallback behavior.

## Out of Scope

- Full Nostr-wide consensus threat model.
- National policy/legal compliance threat frameworks.
- Physical attacks on user hardware beyond compromise assumptions.

## Security Goals

- Preserve content confidentiality against current and future adversaries.
- Reduce harvest-now-decrypt-later exposure.
- Prevent silent downgrade from stronger to weaker modes.
- Preserve message integrity and sender authenticity.
- Maintain secure behavior in mixed-client networks.

## Non-Security Goals

- Perfect metadata privacy in all relay topologies.
- Universal compatibility with every legacy client behavior.
- Zero performance impact on all devices.

## Assets to Protect

- Message plaintext (DM and group chat).
- Group epoch keys and per-recipient wrapping material.
- User PQ public/private key material.
- Capability state and negotiation outcomes.
- Membership-change state influencing key validity.

## Adversary Classes

### A1 Passive Relay Observer

- Can read and retain all event content and tags visible at relay.
- Cannot forge signatures without key compromise.
- Can perform long-term storage for future cryptanalysis.

### A2 Active Relay Operator

- Can reorder, delay, drop, or replay events.
- Can enforce arbitrary event size and policy restrictions.
- Can attempt downgrade pressure by selective delivery.

### A3 Network Adversary

- Can observe traffic timing and volumes.
- Can infer communication patterns from metadata.
- Cannot break TLS instantly but may store traffic indefinitely.

### A4 Malicious Group Participant

- Holds valid membership at some point in time.
- Can leak received plaintext outside protocol controls.
- Can attempt stale-key or downgrade manipulations.

### A5 Compromised Endpoint

- Gains access to local secret material on device.
- Can exfiltrate keys and plaintext available on host.
- Can continue sending valid signed traffic while compromised.

### A6 Future Quantum-Capable Adversary

- May break classical public-key assumptions retroactively.
- May decrypt harvested traffic if classical-only schemes were used.
- Motivates hybrid PQ + classical transition model.

## Trust Boundaries

- Client runtime boundary: trusted execution and local key handling.
- Relay boundary: untrusted transport and storage substrate.
- Peer-client boundary: partially trusted; capability claims must be verified.
- Local persistence boundary: protected but assumed compromiseable at endpoint risk level.

## Entry Points

- Message send pipeline.
- Message receive and decrypt pipeline.
- PQ key publication and retrieval path.
- Group membership and epoch transition events.
- Capability signaling tags and metadata parsing.

## Threats by Category

### T1 Confidentiality Threats

- Relay-visible plaintext if encryption path not applied.
- Historical ciphertext later decrypted under classical-only assumptions.
- Key reuse increasing cross-message compromise impact.

### T2 Integrity and Authenticity Threats

- Malformed envelope injection to trigger parser ambiguity.
- Reordered or replayed encrypted messages.
- Incorrect sender binding in decrypted payload handling.

### T3 Downgrade Threats

- Peer advertises incomplete capability causing fallback.
- Relay selectively withholds capability events.
- Client silently downgrades under error conditions.

### T4 Availability Threats

- Oversized payload rejection by relays.
- Computational overload from expensive PQ operations on low-end devices.
- Membership churn causing excessive rekey operations.

### T5 State-Consistency Threats

- Stale key cache causing failed decrypt or weaker fallback.
- Concurrent membership changes and out-of-order epoch transitions.
- Partial delivery causing split-brain key epoch views.

## Assumptions

- Outer Nostr signature validation remains classical for interoperability.
- Clients can securely store private keys at least at current baseline.
- Relay behavior is not trusted for confidentiality.
- Some fraction of peers will remain legacy/non-PQ during rollout.

## Accepted Risks (Initial)

- Metadata leakage through relay-visible routing/tags remains possible.
- Legacy clients may force compatibility fallbacks during migration.
- Endpoint compromise remains high-impact and cannot be solved by transport crypto alone.

## Unacceptable Risks

- Silent downgrade without user-visible indication where policy requires strict mode.
- Inability to revoke compromised member access in future group epochs.
- Ambiguous envelope parsing that can produce inconsistent decrypt behavior.

## Threat-to-Control Mapping Seeds

- T1 -> Hybrid envelope encryption and key lifecycle controls.
- T2 -> Strong schema validation and authenticated encryption checks.
- T3 -> Capability negotiation rules with explicit downgrade policy.
- T4 -> Relay limit strategies and adaptive operational controls.
- T5 -> Deterministic epoch transition and cache freshness policy.

## Abuse Cases

- Adversary floods fake capability events to induce fallback confusion.
- Removed group member attempts to decrypt post-removal messages.
- Legacy-only recipient causes repeated downgrade loops in group sends.
- Relay rejects large messages selectively to disrupt secure mode users.

## Residual Risk Areas

- Traffic analysis by global observers.
- User behavior that bypasses warnings and continues in low-security mode.
- Client implementation bugs in early rollout phases.

## Required Follow-On Artifacts

- Security requirements with MUST/SHOULD controls.
- Envelope schema with strict validation rules.
- Negotiation truth table and downgrade behavior matrix.
- Incident playbook for key compromise and emergency disable.

## Decision Log

- 2026-02-18: Established adversary model including quantum-capable future actor.
- 2026-02-18: Marked silent downgrade as unacceptable risk in strict policy contexts.
- 2026-02-18: Defined relay boundary as untrusted for confidentiality.

## Open Questions

- Which metadata fields can be minimized without harming Nostr interoperability?
- What maximum acceptable downgrade frequency will be tolerated during phased rollout?
- Which device classes require reduced-PQ workload behavior?

## Review Checklist

- Does each requirement in doc 02 map to a threat in this doc?
- Are trust boundaries consistent with architecture overview?
- Are accepted risks explicitly acknowledged by security owner?
- Are all unacceptable risks tied to planned controls?

## Exit Criteria

- Security owner approves threat inventory.
- Engineering confirms feasibility of mapped controls.
- Product acknowledges user-facing downgrade and warning behavior implications.
