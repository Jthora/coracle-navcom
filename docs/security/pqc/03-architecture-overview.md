# Navcom PQC Architecture Overview

Status: Draft
Owner: Client Engineering + Security Architecture
Last Updated: 2026-02-18
Depends On: 01-threat-model.md, 02-security-requirements.md

Navigation: Previous: [02-security-requirements.md](02-security-requirements.md) | Next: [04-wire-format-envelope.md](04-wire-format-envelope.md)

## Purpose

This document defines the high-level architecture for PQC communications in Navcom.
It explains how hybrid encryption is integrated while preserving Nostr relay interoperability.

## Audience

- Client engineers
- Security engineers
- QA and operations
- Technical product owners

## Architectural Goals

- Keep relays unchanged for cryptographic validation.
- Add client-side hybrid PQ encryption for message content.
- Provide deterministic capability negotiation.
- Preserve controlled compatibility fallback paths.
- Support self-hosted relay operators with explicit sizing guidance.

## High-Level Design Summary

- Outer Nostr event format remains valid and signed as normal.
- Message content carries a versioned encrypted envelope.
- Peers publish PQ capability and key material metadata.
- Send pipeline negotiates strongest mutual mode.
- Receive pipeline parses envelope, validates, decrypts, and renders.
- Group secure mode uses epoch keys rotated on membership changes.

## Core Components

- Capability Registry: tracks peer-supported security modes.
- Key Directory Cache: stores verified peer PQ key metadata with expiry.
- Envelope Encoder: serializes versioned encrypted payloads.
- Envelope Decoder: validates/parses payloads and dispatches decrypt.
- Hybrid Crypto Engine: performs key derivation, wrap, unwrap, and AEAD ops.
- Policy Engine: enforces strict vs compatibility behavior.
- Group Epoch Manager: handles key epoch transitions and membership-driven rekey.
- Telemetry and Audit Layer: records secure path outcomes and failures.

## Data Flow: Direct Message Send

1. Resolve recipient identity and fetch capability state.
2. Load recipient key metadata and validate freshness.
3. Select mode according to policy and negotiated capability.
4. Build encrypted envelope with required metadata and associated data.
5. Attach envelope to event content and sign event.
6. Publish event to selected relays.
7. Record outcome metrics and downgrade reason if applicable.

## Data Flow: Direct Message Receive

1. Validate outer event structure and signature.
2. Detect secure envelope tag/version.
3. Parse envelope schema and validate critical fields.
4. Resolve local key material and attempt decrypt path.
5. Bind decrypted result to event context checks.
6. Render plaintext to UI and mark trust level.
7. Record decrypt success/failure reason codes.

## Data Flow: Group Message Send (Secure Mode)

1. Resolve group membership and active epoch state.
2. Confirm sender policy and mode eligibility.
3. Ensure epoch key exists and is current.
4. Encrypt content with epoch key.
5. Wrap epoch key material for authorized members as needed.
6. Publish event with secure envelope and metadata tags.
7. Track send result and key-state counters.

## Data Flow: Group Membership Change

1. Receive membership change event.
2. Validate ordering and state transition rules.
3. Trigger epoch advance decision.
4. Generate new epoch state and key wrapping set.
5. Exclude removed members from future keying material.
6. Persist epoch transition metadata locally.
7. Emit audit telemetry and update UI state.

## Trust Boundary Notes

- Relays are transport/storage and policy enforcers, not confidentiality anchors.
- Client crypto engine and local key storage are primary trust domain.
- Peer capability claims are verified via signed data and freshness checks.

## Deployment Topologies

### Public Relay Mixed Topology

- Requires conservative payload size limits.
- Higher chance of capability fragmentation.
- Increased fallback handling importance.

### Self-Hosted Relay Topology

- Can raise payload caps for controlled rollout.
- Easier observability and debugging.
- Better support for secure-mode experiments.

### Hybrid Topology

- Must optimize for least-capable relay path.
- Needs robust retry/fallback policy.

## Policy Modes

- Strict PQ Mode: block send when strong mode unavailable.
- Compatibility Mode: allow controlled fallback with user-visible signal.
- Adaptive Mode (optional): compatibility behavior conditioned by context.

## Failure Mode Model

- Missing key metadata -> retry fetch, then fallback or block by policy.
- Expired key metadata -> refresh required; fallback policy applies.
- Oversized payload -> policy-driven split/chunk/fallback behavior.
- Decrypt failure -> fail closed, show secure failure state, capture reason.
- Epoch mismatch -> reconcile state, avoid rendering unverifiable content.

## Security Boundaries in UI

- Message-level trust indicator required.
- Downgrade warnings must be explicit.
- Group mode state should be visible to admins and members.
- Policy decisions should be discoverable in diagnostics panels.

## Integration Anchors (Code-Oriented)

- DM send path integration around existing send message command pipeline.
- DM receive path integration around plaintext resolution/render layer.
- Group send integration around secure transport operations.
- Group state integration around projection and membership events.
- Capability/key cache integration in engine state services.

## Compatibility Strategy

- Versioned envelope to permit evolution.
- Mode negotiation to preserve mixed-client operability.
- Explicit tags for capability discovery.
- Fallback semantics defined centrally by policy engine.

## Observability Requirements

- Secure send success rate.
- Downgrade frequency and reason distribution.
- Decrypt failure taxonomy.
- Epoch rekey frequency and latency.
- Relay rejection rate by size and mode.

## Architecture Constraints

- Must not require relay-side crypto verification updates.
- Must support offline/local-first persistence constraints.
- Must preserve existing event signing model for interoperability.
- Must avoid introducing centralized dependency for key discovery.

## Decision Log

- 2026-02-18: Confirmed client-side hybrid architecture with unchanged relay crypto requirements.
- 2026-02-18: Adopted policy-engine model for strict vs compatibility behavior.
- 2026-02-18: Group secure mode bound to epoch-based key transitions.

## Open Questions

- Which envelope encoding provides best balance of compactness and implementation complexity?
- Which default policy mode should apply for first production release?
- What are minimum supported device performance baselines for secure mode?

## Review Checklist

- Are all flows consistent with security requirements document?
- Are trust boundaries explicit and realistic?
- Are fallback and failure paths deterministic?
- Are observability hooks sufficient for rollout decisions?

## Exit Criteria

- Architecture approved by security and engineering leads.
- Integration anchors accepted by implementers.
- No unresolved critical contradictions with requirement set.
