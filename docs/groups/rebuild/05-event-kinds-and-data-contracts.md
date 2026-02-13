# Event Kinds and Data Contracts

Status: Draft
Owner: Protocol Lead
Reviewers: Architecture, QA, Security
Last Updated: 2026-02-12

## 1. Purpose

Define canonical contracts for all group-related events.
Specify required tags and validation behavior.
Enable deterministic projection and interoperability.

## 2. Contract Governance

Contracts in this document are normative for implementation.
Any schema change requires ADR entry and changelog update.
Backward compatibility impacts must be explicitly declared.

## 3. Contract Principles

Canonical internal model first.
Adapter-specific shape second.
Validation before projection.
Reject malformed writes early.
Warn on recoverable read anomalies.

## 4. Event Taxonomy

Group identity and metadata events.
Membership and role control events.
Message timeline events.
Moderation action events.
Policy override and audit events.
Capability and health annotations.

## 5. Common Envelope Requirements

Event must include id.
Event must include created_at.
Event must include pubkey.
Event must include kind.
Event must include tags array.
Event must include content field.

## 6. Common Validation Rules

Reject events with malformed tags shape.
Reject invalid pubkey format.
Reject unknown critical tags.
Reject missing required tags.
Reject created_at outside configured tolerance when policy requires.

## 7. Canonical Group Identifier Tag

Define internal canonical tag key for group identity.
Mapping to protocol-specific tags handled by adapters.
Canonical parser resolves to groupId and source semantics.
Parser records provenance for diagnostics.

## 8. Membership Contract

Required fields:
member pubkey.
operation type.
issuer pubkey.
operation timestamp.
optional role payload.
Validation requires role policy checks in projection layer.

## 9. Moderation Contract

Required fields:
target entity reference.
action type.
issuer pubkey.
reason code.
Optional human-readable reason text.
Actions must be idempotent and replay-safe.

## 10. Message Contract

Canonical message payload includes:
message id.
groupId.
author pubkey.
content payload reference.
transport mode marker.
optional threading references.

## 11. Policy Override Contract

Override events require:
issuer role evidence.
override scope.
expiry policy.
justification code.
audit correlation id.

## 12. Capability Snapshot Contract

Snapshot includes:
relay set.
capability flags.
signer capability flags.
evaluation timestamp.
result mode decision.
reason codes.

## 13. Normalization Rules

Normalize relay URLs before evaluation.
Normalize pubkeys to expected form.
Trim duplicate tags according to contract policy.
Sort deterministic tag sets where required.

## 14. Reject vs Warn Matrix

Reject on missing required identifiers.
Reject on invalid signatures where verification required.
Warn on unknown optional tags.
Warn on duplicate non-critical tags.
Warn on stale but parseable events.

## 15. Versioning Strategy

Contract version field in adapter metadata.
Projection supports known versions only.
Unknown versions routed to quarantine path.
Migration adapters can up-convert known old versions.

## 16. Compatibility Strategy

Read compatibility at least one previous contract version.
Write compatibility targets current version only.
Downgrade writes are prohibited by default.
Compatibility exceptions require explicit ADR.

## 17. Schema Registry Requirements

Single registry mapping kind -> schema validator.
Validator outputs normalized canonical payload.
Validator returns deterministic reason codes on failure.
Registry supports test fixture generation.

## 18. Projection Input Contract

Only validated and normalized events enter projections.
Projections must not perform ad-hoc schema assumptions.
Projection errors emit structured diagnostic records.
Projection state remains consistent on bad event ingestion.

## 19. Adapter Mapping Requirements

Each adapter documents field mapping between canonical and wire format.
Each adapter provides round-trip tests.
Each adapter declares unsupported canonical fields.
Unsupported fields require explicit fallback behavior.

## 20. Test Fixture Requirements

Golden valid examples for each event type.
Golden invalid examples with expected reason codes.
Replay and reordering fixture sets.
Cross-adapter round-trip fixture sets.

## 21. Security Contract Rules

Never log secure payload plaintext.
Never persist temporary secrets in event records.
Require redaction on diagnostics containing sensitive refs.
Prohibit hidden transport downgrades in event handling.

## 22. Migration Contract Rules

Migration never mutates original raw events.
Migration writes derived canonical snapshots only.
Migration logs mapping provenance for rollback.
Migration rejects ambiguous identity mappings.

## 23. Open Questions

Final canonical naming for group identity tag.
Treatment of partially trusted relay annotations.
Contract behavior for oversized payload references.

## 24. Exit Criteria For This Document

Schema registry skeleton approved.
Reject/warn matrix approved by QA and Security.
Adapter mapping templates approved by architecture.
Referenced by test strategy and implementation milestones.
