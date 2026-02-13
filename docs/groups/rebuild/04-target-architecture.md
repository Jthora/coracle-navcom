# Target Architecture

Status: Draft
Owner: Architecture Lead
Reviewers: Core Team, Security, QA
Last Updated: 2026-02-12

## 1. Purpose

Define the end-state architecture for Groups rebuild.
Set boundaries and contracts before deep implementation work.
Prevent coupling that blocks protocol agility.

## 2. Architectural Goals

Introduce first-class Group domain entities.
Decouple transport from UI and projections.
Support tier-aware policy enforcement.
Preserve reliability under relay variability.

## 3. Core Components

Group Domain Layer.
Group Projection Layer.
Group Transport Layer.
Policy and Capability Layer.
UI Route and Screen Layer.
Operations and Observability Layer.

## 4. Group Domain Model

Group: canonical identity and static metadata.
GroupMembership: member pubkey, role, status, timestamps.
GroupPolicy: mission tier, mode lock, fallback policy.
GroupTimelineRef: pointer to message stream by transport mode.
GroupAuditEvent: immutable operation log entries.

## 5. Projection Model

GroupSummaryProjection for list screen.
GroupDetailProjection for detail screen.
GroupMembershipProjection for roster/admin UI.
GroupModerationProjection for action history.
GroupHealthProjection for capability/fallback status.

## 6. Transport Abstraction

Define GroupTransport interface.
Register adapters by mode.
Resolve adapter by group policy + capability gates.
Expose send, subscribe, reconcile, validate operations.

## 7. GroupTransport Interface (Conceptual)

getModeId().
canOperate(group, capabilitySnapshot).
sendMessage(group, payload, context).
subscribe(group, cursor, handlers).
publishControlAction(group, action, context).
reconcile(group, remoteEvents, localState).

## 8. Adapter Types

Baseline adapter for relay-managed mode.
Secure pilot adapter for confidential mode.
Legacy bridge adapter for migration-only scenarios.

## 9. Capability Evaluation Layer

Collect relay and signer capabilities.
Compute group-ready capability snapshot.
Cache and refresh capability snapshots.
Provide deterministic decision reasons.

## 10. Policy Engine

Input: mission tier, workspace policy, group policy, capability snapshot.
Output: selected mode, fallback allowance, warning level.
Must be deterministic and testable.
Must produce user-visible reason codes.

## 11. Route Architecture

/groups.
/groups/create.
/groups/:groupId.
/groups/:groupId/members.
/groups/:groupId/moderation.
/groups/:groupId/settings.

## 12. UI Composition Strategy

Reuse message list and composer primitives where possible.
Inject mode-specific behavior via view models.
Show mode badge and health status in header.
Keep moderation/admin actions in dedicated panels.

## 13. Data Flow (Create Group)

User submits create form.
Policy engine evaluates mode.
Capability layer validates prerequisites.
Transport adapter publishes create/control events.
Projection layer materializes GroupSummary and GroupDetail.
UI navigates to group detail with status badges.

## 14. Data Flow (Join Group)

User opens invite or group address.
Resolver identifies target group identity.
Capability gate check runs.
Policy engine enforces tier constraints.
Adapter executes join operation.
Projections update membership and timeline status.

## 15. Data Flow (Send Message)

Composer emits canonical message intent.
Transport resolver selects adapter.
Adapter constructs and publishes protocol-specific events.
Ack handling updates local optimistic state.
Projection merges confirmed state.
UI reflects sent/failed/retry status.

## 16. Data Flow (Moderation Action)

Admin initiates action.
Role and policy checks run.
Adapter publishes control event.
Projection updates moderation history and effective state.
UI surfaces action outcome and audit reference.

## 17. State Management Strategy

Keep canonical Group entities in dedicated store namespace.
Derive read models via deterministic projection functions.
Use idempotent projection updates.
Persist checkpoints for fast resume.

## 18. Identity Strategy

Canonical groupId independent of participant-set identifiers.
Store alias mapping for legacy channel migration compatibility.
Never use route parameter as sole trust source.
Resolve identifiers through validated parser.

## 19. Error Handling Strategy

Classify errors: policy, capability, network, validation, conflict.
Attach machine-readable reason codes.
Provide user-facing remediation text.
Capture operator diagnostics without sensitive payload leakage.

## 20. Conflict and Replay Handling

All control actions pass idempotency checks.
Projection tracks processed event identities.
Conflicting updates resolved with deterministic precedence rules.
Divergence events trigger reconciliation workflows.

## 21. Resilience Strategy

Multi-relay subscription and publish support.
Backoff with jitter for unstable relay paths.
Offline queue for user intents where policy permits.
Reconciliation pass at startup and periodic intervals.

## 22. Observability Strategy

Metrics for send ack latency.
Metrics for projection lag and divergence rate.
Metrics for fallback frequency.
Structured logs with redacted identifiers.

## 23. Security Architecture Hooks

Policy engine gates weak-mode fallback.
Secure mode uses dedicated local secret handling.
Audit events for sensitive policy overrides.
Redaction boundaries for telemetry outputs.

## 24. Migration Architecture

Introduce group routes behind feature flag.
Bridge selected channel views to group entities where applicable.
Do not mutate legacy data in-place.
Use migration index mapping to support rollback.

## 25. Performance Targets

Cold load group list under defined threshold.
Incremental timeline update under defined threshold.
Membership roster rendering scales with expected group sizes.
No unbounded memory growth in projection caches.

## 26. Open Architecture Questions

Final shape of secure adapter storage dependencies.
Cross-device sync strategy for secure state snapshots.
Scope of legacy bridge support window.

## 27. Exit Criteria For This Document

Boundaries approved by architecture review.
Interface contracts approved by implementation owners.
Policy/capability hook points approved by security.
Referenced by event contracts and milestone plan.
