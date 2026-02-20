# Navcom PQC Security Requirements

Status: Draft
Owner: Security Architecture + Client Engineering
Last Updated: 2026-02-18
Depends On: 01-threat-model.md

Navigation: Previous: [01-threat-model.md](01-threat-model.md) | Next: [03-architecture-overview.md](03-architecture-overview.md)

## Purpose

This document defines normative security requirements for Navcom PQC communications.
Requirements are derived from the threat model and are used as release gates.

## Requirement Language

- MUST: mandatory for production acceptance.
- SHOULD: strong recommendation with documented exceptions only.
- MAY: optional enhancement with clear tradeoff rationale.

## Audience

- Security engineering
- Client engineering
- QA and release management

## Scope

- DM encryption/decryption behavior.
- Group chat encryption/decryption and membership rekey behavior.
- Key lifecycle and capability negotiation behavior.
- Fallback, downgrade, and user trust signaling behavior.

## Confidentiality Requirements

- SR-001: Clients MUST encrypt DM payload content using approved hybrid profile when both peers support it.
- SR-002: Clients MUST encrypt group message payload content using current valid group epoch key in secure mode.
- SR-003: Clients MUST avoid storing decrypted plaintext in unsafe locations without explicit policy coverage.
- SR-004: Clients SHOULD apply payload padding strategy to reduce trivial size-based inference.
- SR-005: Clients MUST reject plaintext send path in strict PQ policy mode when prerequisites are unmet.

## Integrity and Authenticity Requirements

- SR-010: Clients MUST verify outer event signature before processing encrypted content.
- SR-011: Clients MUST perform authenticated decryption checks before rendering content.
- SR-012: Clients MUST fail closed on malformed envelope fields.
- SR-013: Clients MUST bind decrypted payload to sender/event context via associated data rules.
- SR-014: Clients SHOULD include replay-detection state where feasible in local processing.

## Downgrade and Negotiation Requirements

- SR-020: Clients MUST implement deterministic capability negotiation.
- SR-021: Clients MUST surface user-visible signal when fallback/downgrade occurs.
- SR-022: Clients MUST NOT silently downgrade in strict policy mode.
- SR-023: Clients SHOULD provide explicit user acknowledgment flows for sensitive downgrade cases.
- SR-024: Clients MUST log downgrade reason codes for diagnostics.

## Key Lifecycle Requirements

- SR-030: Clients MUST publish PQ capability key metadata in signed user-owned event format.
- SR-031: Clients MUST enforce key expiry checks prior to secure send.
- SR-032: Clients MUST support key rotation without breaking old message decryptability guarantees.
- SR-033: Clients MUST support compromise response pathways including revocation markers.
- SR-034: Clients SHOULD refresh peer key cache at startup and before first secure send.

## Group Membership and Epoch Requirements

- SR-040: Clients MUST advance group key epoch on membership removal events in secure mode.
- SR-041: Clients MUST prevent removed members from receiving post-removal epoch key material.
- SR-042: Clients MUST handle out-of-order membership events deterministically.
- SR-043: Clients SHOULD batch rekey operations under churn to preserve availability.
- SR-044: Clients MUST expose policy mode (strict/compatibility) for group secure behavior.

## Availability and Performance Requirements

- SR-050: Clients MUST enforce relay-aware payload size limits prior to publish.
- SR-051: Clients SHOULD provide fallback or retry guidance when relays reject oversized events.
- SR-052: Clients MUST avoid unbounded PQ operation loops on constrained devices.
- SR-053: Clients SHOULD track encrypt/decrypt latency and failure metrics locally.
- SR-054: Clients MAY use adaptive strategies for low-power contexts with explicit signaling.

## Parser and Schema Requirements

- SR-060: Clients MUST parse only recognized envelope versions unless compatibility rules allow otherwise.
- SR-061: Clients MUST reject duplicate or conflicting critical fields.
- SR-062: Clients MUST enforce canonical encoding rules for signature and validation stability.
- SR-063: Clients SHOULD include envelope schema fixtures in automated tests.
- SR-064: Clients MUST treat unknown critical algorithm identifiers as hard failures in strict mode.

## Logging and Telemetry Requirements

- SR-070: Clients MUST record security-relevant reason codes for decrypt failure and downgrade events.
- SR-071: Clients SHOULD avoid logging plaintext or secret material.
- SR-072: Clients MUST support privacy-preserving telemetry mode for decentralized deployments.
- SR-073: Clients SHOULD support operator-visible counters for rollout confidence.

## Operational Requirements

- SR-080: The product MUST include a kill-switch path for emergency algorithm disable.
- SR-081: The product MUST document rollback behavior for envelope/profile incompatibilities.
- SR-082: The product SHOULD include incident response workflows for key compromise.
- SR-083: Release process MUST include security sign-off against this requirement set.

## Compliance Matrix Template

- Requirement ID
- Implemented (Yes/No/Partial)
- Owning component
- Test coverage reference
- Exception approval reference
- Notes

## Traceability to Threat Model

- T1 Confidentiality -> SR-001 to SR-005, SR-030 to SR-034
- T2 Integrity -> SR-010 to SR-014, SR-060 to SR-064
- T3 Downgrade -> SR-020 to SR-024
- T4 Availability -> SR-050 to SR-054
- T5 State consistency -> SR-040 to SR-044, SR-060

## Release Gate Levels

### Gate G1 (Prototype)

- SR-001, SR-010, SR-012, SR-020, SR-030 minimally implemented.
- Basic interop tests passing.

### Gate G2 (Beta)

- All SR-0xx and SR-01x series complete.
- Downgrade UX and key expiry handling complete.
- Performance baseline captured on representative devices.

### Gate G3 (Production)

- All MUST requirements complete and tested.
- Exceptions documented and approved.
- Incident runbook and rollback validated.

## Exception Policy

- Any MUST exception requires written approval by security owner.
- Exception must include risk statement, mitigation, and expiry date.
- Expired exception without renewal blocks release.

## Decision Log

- 2026-02-18: Established SR requirement namespace and release gate model.
- 2026-02-18: Made silent downgrade disallowed in strict mode.
- 2026-02-18: Required relay-aware size checks before publish.

## Open Questions

- Which telemetry minimum is acceptable in fully local/private deployments?
- What key expiry default balances security and operational usability?
- Which adaptive performance controls are mandatory for mobile clients?

## Review Checklist

- Are all MUST requirements testable and observable?
- Is every requirement mapped to threat categories?
- Are fallback behaviors clear and non-ambiguous?
- Are strict-mode semantics explicit enough for QA automation?

## Exit Criteria

- Security and engineering approve requirement set.
- QA confirms matrix feasibility.
- Product confirms user-facing downgrade and strict-mode semantics.
