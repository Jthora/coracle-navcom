# Threat Model and Mission Tiers

Status: Draft
Owner: Security Lead
Reviewers: Core Team, Field Ops
Last Updated: 2026-02-12

## 1. Purpose

Define threat assumptions for groups in Navcom.
Tie security requirements to mission tiers.
Provide testable security expectations for implementation.

## 2. Scope

In scope: group messaging, membership, moderation, storage, relay interactions.
In scope: transport choices and fallback behavior.
Out of scope: endpoint OS hardening beyond application controls.
Out of scope: legal/compliance policy beyond technical controls.

## 3. Security Objectives

Preserve confidentiality where mission requires it.
Protect membership integrity and admin intent.
Limit metadata exposure where feasible.
Ensure reliable recovery from relay and device failures.
Prevent silent downgrade without visibility.

## 4. Mission Tiers

### Tier 0: Public OSINT Collaboration

Data sensitivity: low.
Expected adversary: casual observers and spam actors.
Required properties: integrity, abuse resistance, auditability.
Confidentiality: optional.
Metadata privacy: best effort.

### Tier 1: Restricted Ops Collaboration

Data sensitivity: moderate.
Expected adversary: targeted nuisance actors and relay scraping.
Required properties: controlled membership, reliable moderation.
Confidentiality: recommended.
Metadata privacy: improved over baseline where possible.

### Tier 2: High-Risk GEOINT Operations

Data sensitivity: high.
Expected adversary: capable targeted actors.
Required properties: strong confidentiality and key hygiene.
Confidentiality: mandatory.
Metadata privacy: mandatory within practical limits.
Downgrade resistance: mandatory.

## 5. Adversary Classes

A1: Passive relay observer.
A2: Malicious relay operator.
A3: Malicious group member.
A4: Compromised endpoint device.
A5: Network-level traffic analyst.
A6: Social engineering attacker.

## 6. Asset Inventory

Group identity and metadata.
Membership roster and role assignments.
Message payloads and attachment references.
Transport-level key material.
Local decrypted cache and indexes.
Audit events and moderation records.

## 7. Trust Boundaries

Client runtime boundary.
Local persistent storage boundary.
Relay boundary.
Signer boundary.
Network path boundary.
Admin control boundary.

## 8. Primary Threats

Unauthorized membership escalation.
Unauthorized moderation action replay.
Message confidentiality breach.
Protocol downgrade without user awareness.
Group state fork and divergence.
Key material persistence beyond policy.

## 9. Secondary Threats

Relay-side censorship and selective delivery.
Metadata correlation via timing and routing.
Invite spoofing and stale invite reuse.
Replay of stale state transitions.
User confusion causing unsafe mode usage.

## 10. Threat-to-Control Mapping

Unauthorized role change -> signed action validation + role checks.
Stale replay -> monotonic state checks + dedupe windows.
Silent downgrade -> explicit UX warning + policy guardrails.
Compromised local cache -> at-rest encryption + key scoping.
Relay withholding -> multi-relay strategy + reconciliation.

## 11. Tiered Security Requirements

### Tier 0 Requirements

Membership visibility acceptable.
Moderation enforcement required.
No silent data corruption.
Basic anti-spam controls required.

### Tier 1 Requirements

Controlled joins and role actions required.
Message confidentiality preferred.
Fallback allowed only with explicit warning.
Moderation integrity logs required.

### Tier 2 Requirements

Confidential transport mandatory.
At-rest protection mandatory.
Key lifecycle enforcement mandatory.
No automatic downgrade to weaker transport.
Operator override requires explicit acknowledgement.

## 12. Downgrade Policy

Tier 0 may downgrade with passive notice.
Tier 1 may downgrade only with active user confirmation.
Tier 2 may not downgrade automatically.
Tier 2 forced downgrade requires admin policy event and audit trail.

## 13. Compromise Assumptions

Assume some relays are untrusted.
Assume message ordering anomalies can occur.
Assume devices can be lost or seized.
Assume user mistakes will happen under stress.

## 14. Local Data Protection Requirements

Secure-tier group state must be encrypted at rest.
Decryption keys must be scoped by account and transport context.
Sensitive caches must support explicit eviction.
Background re-index must avoid leaking plaintext logs.

## 15. Operational Safeguards

Health indicators for relay delivery quality.
Visible warning when policy constraints are violated.
Incident mode toggle for restricted operations.
Emergency freeze mechanism for admin actions.

## 16. Abuse and Moderation Requirements

Role checks must be deterministic and auditable.
Moderation actions must be idempotent.
Delete/hide semantics must document relay variance.
Abuse reports must preserve chain-of-custody metadata.

## 17. Logging and Telemetry Boundaries

No message plaintext in analytics.
No secure-tier key material in logs.
No raw invite secrets in client diagnostics.
Use redaction for identifiers in support logs.

## 18. Validation Requirements

Threat scenarios mapped to integration tests.
Downgrade policy covered by explicit test cases.
Key lifecycle policy validated by automated checks.
Fork/replay behavior validated through simulation.

## 19. Open Risks

Protocol churn may invalidate assumptions.
Relay behavior may diverge from published capability.
Usability friction may induce unsafe user workarounds.
Secure-tier reliability may lag during early pilot.

## 20. Residual Risk Acceptance

Tier 0 accepts metadata exposure risk.
Tier 1 accepts constrained fallback risk with warnings.
Tier 2 accepts availability trade-offs to preserve confidentiality.
All residual risks require sign-off in decision log.

## 21. Incident Classes

P1: Confidentiality compromise.
P2: Unauthorized membership/admin action.
P3: Sustained delivery failure.
P4: Incorrect downgrade behavior.

## 22. Incident Response Expectations

P1 response start <= 15 minutes.
P2 response start <= 30 minutes.
P3 response start <= 60 minutes.
P4 response start <= 60 minutes.

## 23. Exit Criteria For This Document

Threat classes approved by Security.
Tier requirements approved by Product and Ops.
Mapped controls accepted by Engineering.
Referenced by protocol strategy and test strategy docs.
