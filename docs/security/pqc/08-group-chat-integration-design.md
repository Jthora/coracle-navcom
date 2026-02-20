# Navcom PQC Group Chat Integration Design

Status: Draft
Owner: Client Engineering + Security Architecture
Last Updated: 2026-02-18
Depends On: 04-wire-format-envelope.md, 05-key-distribution-and-lifecycle.md, 06-capability-negotiation.md

Navigation: Previous: [07-dm-integration-design.md](07-dm-integration-design.md) | Next: [09-relay-compatibility-and-limits.md](09-relay-compatibility-and-limits.md)

## Purpose

This document defines how hybrid PQC is integrated into group chat and secure group transport.
It focuses on epoch-based keys, membership churn, and secure-mode policy behavior.

## Audience

- Client engineers implementing group transport
- Security reviewers
- QA teams validating membership/rekey behavior

## Integration Goals

- Encrypt group message content under secure epoch key model.
- Trigger deterministic rekey on membership-sensitive events.
- Prevent removed members from future epoch decrypt capability.
- Maintain compatibility behavior where policy allows.

## Existing Baseline Summary

- Group messaging currently supports transport events and projection state.
- Secure transport scaffolding exists but requires stronger crypto wiring.
- Membership events already influence projection and control behavior.

## Core Concepts

- Group epoch: versioned security state for active membership set.
- Epoch key: symmetric content key for group messages in epoch.
- Wrap set: per-member encapsulation artifacts for epoch access.
- Rekey trigger: event that requires epoch advancement.

## Rekey Trigger Events

- Member added.
- Member removed.
- Leave request accepted.
- Compromised device remediation.
- Policy-driven periodic rotation.

## Group Send Flow (Secure Mode)

1. Resolve active projection and membership set.
2. Validate sender role and policy eligibility.
3. Resolve current epoch state.
4. If rekey required, advance epoch before send.
5. Encrypt message content with epoch key.
6. Build envelope with epoch metadata.
7. Include recipient wrap references as needed.
8. Publish signed event to selected relays.
9. Record send metrics and security state.

## Group Receive Flow (Secure Mode)

1. Validate event signature and group id binding.
2. Parse envelope and epoch metadata.
3. Resolve local membership and epoch availability.
4. Obtain/decrypt epoch key material if necessary.
5. Decrypt content and validate associated data.
6. Render plaintext with secure indicator.
7. Record decrypt outcome and epoch stats.

## Membership Change Flow

1. Ingest membership control event.
2. Validate ordering and authority rules.
3. Evaluate if event is rekey-triggering.
4. Advance epoch state when required.
5. Recompute eligible member wrap set.
6. Persist new epoch state.
7. Emit audit and telemetry markers.

## Removed Member Guarantees

- Removed members must not be included in new wrap set.
- Post-removal messages must use new epoch.
- Clients should mark old epoch as deprecated when transition finalizes.

## Churn Management

- Batch rapid membership events into bounded rekey windows.
- Prevent rekey storms by cooldown policy.
- Ensure deterministic windowing behavior across clients.

## Policy Modes

- Group strict mode: all required participants must meet hybrid requirements.
- Group compatibility mode: controlled fallback allowed by policy.
- Tiered policy can enforce stricter rules for higher-sensitivity groups.

## Failure Handling

- Epoch mismatch -> reconcile before decrypt.
- Missing wrap data -> fetch/retry path then policy fallback.
- Rekey conflict -> deterministic tie-break and retry.
- Oversized secure envelope -> split or fallback per policy.

## UI and UX Requirements

- Show group security mode and epoch status.
- Show downgrade/fallback notices where applicable.
- Show membership-change security impacts to admins.
- Provide diagnostics for failed secure sends.

## Telemetry Requirements

- Rekey trigger counts by type.
- Rekey latency and success rates.
- Group secure send success/fallback/block counts.
- Decrypt failure reason distribution.
- Epoch mismatch incidents.

## Security Controls

- Validate membership authority before applying rekey triggers.
- Fail closed on envelope parse errors in strict mode.
- Prevent rendering unverifiable decrypted state.
- Keep plaintext out of logs and telemetry.

## Integration Anchors

- Group send command and secure transport operations.
- Group projection reconciliation lane.
- Membership command feedback and remediation pathways.
- UI group conversation rendering layer.

## Testing Plan Summary

- Unit tests for epoch transition logic.
- Unit tests for removed-member exclusion behavior.
- Integration tests for add/remove/churn scenarios.
- Mixed-capability member scenarios under strict and compatibility policies.
- Failure injection for missing wraps and relay rejects.

## Rollout Strategy

- Stage 1: secure mode behind flag in controlled groups.
- Stage 2: expand to opt-in groups with observability.
- Stage 3: default compatibility mode for eligible groups.
- Stage 4: optional strict-mode defaults for high-tier groups.

## Decision Log

- 2026-02-18: Adopted epoch-based secure group key model.
- 2026-02-18: Marked membership removal as mandatory rekey trigger.
- 2026-02-18: Added churn batching and cooldown policy requirement.

## Open Questions

- Should group sends include full wrap set every message or reference latest epoch package?
- What cooldown window balances security freshness and performance?
- Which tier policy defaults apply to newly created groups?

## Review Checklist

- Is removed-member exclusion provable by design?
- Are rekey triggers complete and deterministic?
- Are strict/compatibility differences explicit?
- Is rollout path operationally realistic?

## Exit Criteria

- Security approval for epoch and rekey model.
- Engineering prototype with rekey on membership changes.
- QA scenarios passing for key membership transitions.
