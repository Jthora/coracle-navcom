# Navcom PQC Security Program

Status: Draft
Owner: Copilot + Core Team
Last Updated: 2026-02-18
Location: docs/security/pqc/

Navigation: Previous: n/a | Next: [01-threat-model.md](01-threat-model.md)

## Purpose

This document is the entry point for Navcom's Post-Quantum Cryptography (PQC) security documentation.
It defines scope, guiding principles, structure, and execution rules for the full PQC effort.
It is intended to keep architecture, implementation, and validation aligned across the team.

## Why this exists

Navcom currently relies on standard Nostr-compatible cryptographic primitives.
Those primitives are not sufficient on their own for post-quantum resilience.
Navcom needs a migration path that preserves decentralization and relay interoperability.
This program defines that path with minimal protocol disruption and high operational clarity.

## Program Objectives

- Protect message confidentiality against harvest-now-decrypt-later risk.
- Preserve relay interoperability without requiring relay-side cryptographic changes.
- Keep decentralized operation first-class, including self-hosted relay support.
- Minimize user disruption during migration from classical-only to hybrid modes.
- Maintain clear downgrade semantics and user-visible trust indicators.
- Create auditable, testable requirements before implementation expands.

## Non-Goals

- Replacing all Nostr signatures with post-quantum signatures in this phase.
- Forcing the entire ecosystem to adopt Navcom-specific changes immediately.
- Introducing central key servers or cloud-only trust anchors.
- Shipping production PQC without interop, failure-mode, and performance validation.

## Scope (Phase 1)

- Direct message hybrid encryption design and integration.
- Group chat hybrid encryption design with epoch-based keying.
- PQ key publication, discovery, rotation, and revocation policies.
- Capability negotiation and fallback behavior in mixed-client networks.
- Relay sizing compatibility guidance and local relay tuning recommendations.
- Testing, validation, telemetry, and incident handling runbooks.

## Out of Scope (Phase 1)

- A finalized external NIP accepted by the wider Nostr ecosystem.
- Full replacement of existing key identity and address derivation model.
- Long-term archival and legal governance requirements.
- Hardware-backed key management mandates across all clients.

## Core Principles

- Decentralization first: avoid introducing centralized control points.
- Compatibility first: keep outer event behavior valid for existing relays.
- Security by default: choose safer behavior unless explicitly overridden.
- Explicit downgrade: never silently lower security posture.
- Crypto agility: version every envelope and algorithm declaration.
- Observability: log outcomes needed for rollout confidence and incident response.
- Reversibility: every rollout stage must have a clear rollback path.

## Terminology Snapshot

- PQC: Post-Quantum Cryptography.
- Hybrid encryption: combining classical and PQ cryptographic material.
- Capability negotiation: process by which clients determine shared secure mode.
- Envelope: serialized encrypted payload structure placed in event content.
- Epoch key: group-level key generation version tied to membership state.
- Strict mode: configuration that blocks send when PQ requirements are unmet.
- Compatibility mode: configuration that allows controlled fallback behavior.

## Document Set Index

1. 00-readme.md
2. 01-threat-model.md
3. 02-security-requirements.md
4. 03-architecture-overview.md
5. 04-wire-format-envelope.md
6. 05-key-distribution-and-lifecycle.md
7. 06-capability-negotiation.md
8. 07-dm-integration-design.md
9. 08-group-chat-integration-design.md
10. 09-relay-compatibility-and-limits.md
11. 10-implementation-plan.md
12. 11-test-and-validation-plan.md
13. 12-operations-and-incident-playbook.md
14. 13-nip-draft-navcom-pqc.md

## Reading Order

- Start with threat model and requirements.
- Move to architecture and wire format.
- Continue with key lifecycle and capability negotiation.
- Then read DM and group integration documents.
- Follow with relay compatibility and implementation plan.
- Finish with validation and incident operations guidance.
- Use NIP draft after internal protocol choices stabilize.

## Governance Model

- Security decisions require recorded rationale in the relevant document.
- Requirements changes must cite threat model deltas.
- Wire format changes must increment version semantics.
- Rollout policy changes must include downgrade impact notes.
- Incident lessons learned must flow back into requirements and tests.

## Ownership and Review

- Security Architecture: owns threat model and requirements docs.
- Client Engineering: owns integration, pipeline, and rollout docs.
- Platform Operations: owns relay limits and incident playbooks.
- QA and Validation: owns test matrix, benchmark standards, and gates.
- Product and UX: owns user-facing fallback and warning semantics.

## Quality Bar for each document

Each document should include:

- Purpose and audience.
- In-scope and out-of-scope declarations.
- Normative requirements where applicable.
- Failure mode behavior and fallback handling.
- Security and privacy implications.
- Open questions and unresolved risks.
- Decision log entries with date and owner.

## Program Milestones (high-level)

- Milestone A: threat model and requirements approved.
- Milestone B: envelope and key lifecycle design frozen for prototype.
- Milestone C: DM hybrid prototype behind feature flag.
- Milestone D: group chat hybrid prototype with epoch rekey.
- Milestone E: mixed-client fallback and UX behavior validated.
- Milestone F: performance and relay compatibility baselined.
- Milestone G: incident playbook and operational controls finalized.

## Success Criteria

- No required relay cryptographic feature changes.
- Deterministic client behavior under mixed capabilities.
- Security requirements traceable to automated tests.
- Group membership changes enforce rekey and access exclusion policy.
- Operational metrics support safe phased rollout decisions.

## Risks to track early

- Payload growth causing relay rejections.
- Inconsistent capability interpretation across clients.
- Key freshness failures leading to unexpected downgrade paths.
- Mobile performance regressions from heavy PQ operations.
- Operational blind spots during incidents or partial outages.

## Required companion artifacts

- Threat model data flow diagram.
- Envelope schema examples and validation fixtures.
- Key lifecycle state transition table.
- Capability negotiation truth table.
- DM and group sequence diagrams.
- Relay limit compatibility matrix.
- Test matrix and release gate checklist.

## Change Management Rules

- Keep sections stable and append changes through decision logs.
- Avoid deleting superseded decisions; mark them as replaced.
- Track effective date for all normative behavior changes.
- Include migration notes whenever compatibility semantics change.

## Decision Log

- 2026-02-18: Initialized PQC documentation program index and governance structure.
- 2026-02-18: Established 14-document structure under docs/security/pqc/.
- 2026-02-18: Defined security-first and interoperability-first principles.

## Next Document to Author

The next document in sequence is 01-threat-model.md.
That document should formalize adversaries, trust boundaries, and risk acceptance.
All downstream requirements should map directly back to that model.

## Open Questions

- Which hybrid profile will be the default in Navcom strict mode?
- What minimum relay size budget is required for group operations at launch?
- What is the acceptable downgrade rate during phased rollout?
- Which PQ library stack will be approved for all target platforms?
- What telemetry can be collected while preserving privacy and decentralization goals?

## Maintenance Checklist

- Revisit this index at each milestone boundary.
- Update ownership when team roles shift.
- Add or reorder documents only with rationale in decision log.
- Ensure links and references remain valid after refactors.
- Confirm sequence still reflects implementation reality.

## End State

When this program completes, Navcom should have:

- A clear, audited PQC design path.
- Implementation docs aligned with code-level integration points.
- Validated migration and fallback behavior.
- Operational readiness for incidents and key compromise events.
- A publishable draft suitable for wider ecosystem review.
