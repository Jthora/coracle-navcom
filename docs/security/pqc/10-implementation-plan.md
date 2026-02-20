# Navcom PQC Implementation Plan

Status: Draft
Owner: Core Team
Last Updated: 2026-02-18
Depends On: 01-09 docs

Navigation: Previous: [09-relay-compatibility-and-limits.md](09-relay-compatibility-and-limits.md) | Next: [11-test-and-validation-plan.md](11-test-and-validation-plan.md)

## Purpose

This document provides the execution roadmap for implementing PQC communication support.
It defines milestones, dependencies, rollout stages, and release gates.

## Audience

- Engineering leads
- Security owners
- QA and release management
- Product and operations stakeholders

## Delivery Principles

- Build from requirements before code expansion.
- Ship behind feature flags.
- Validate with telemetry before broad rollout.
- Maintain rollback options at every stage.

## Workstreams

- WS-A: Protocol and schema implementation.
- WS-B: DM secure integration.
- WS-C: Group secure integration and epoch handling.
- WS-D: Capability and key lifecycle services.
- WS-E: UX and diagnostics.
- WS-F: Validation, performance, and operations readiness.

## Milestone M0 - Foundation Approval

- Threat model approved.
- Security requirements approved.
- Architecture and wire format approved.
- Exit: design freeze for prototype scope.

## Milestone M1 - Protocol Core Prototype

- Envelope encode/decode v1 implemented.
- Capability negotiation core implemented.
- Key publication and retrieval core implemented.
- Feature flags created.
- Exit: local protocol unit tests pass.

## Milestone M2 - DM Hybrid Prototype

- DM send path hybrid integration complete.
- DM receive/decrypt integration complete.
- Strict and compatibility policy paths implemented.
- Message-level trust indicators visible.
- Exit: DM integration tests pass in CI.

## Milestone M3 - Group Hybrid Prototype

- Secure group send/decrypt integration complete.
- Epoch key model implemented.
- Rekey triggers on membership changes implemented.
- Removed-member exclusion checks implemented.
- Exit: group membership security tests pass.

## Milestone M4 - Relay and Perf Hardening

- Relay preflight size checks implemented.
- Fallback behavior for relay constraints validated.
- Mobile and desktop crypto performance benchmarked.
- Adaptive controls defined for constrained devices.
- Exit: performance and compatibility thresholds met.

## Milestone M5 - Beta Rollout

- Feature flag enabled for internal users.
- Telemetry and diagnostics monitored.
- Mixed-client behavior validated in real traffic.
- UX messaging refined from feedback.
- Exit: beta quality gate sign-off.

## Milestone M6 - Production Readiness

- Incident playbook validated.
- Rollback and kill-switch tested.
- Release documentation finalized.
- Security and QA final approvals completed.
- Exit: production rollout approval.

## Dependencies

- Envelope schema stability.
- Key lifecycle policy stability.
- Capability negotiation finalization.
- UI trust semantics alignment with product.
- Relay compatibility baseline from operations.

## Feature Flags

- `pqc_enabled`
- `pqc_dm_enabled`
- `pqc_groups_enabled`
- `pqc_strict_default`
- `pqc_chunking_enabled`

Flags must support runtime disable where operationally required.

## Rollout Phases

- Phase 1: internal development only.
- Phase 2: internal dogfood and controlled test users.
- Phase 3: opt-in external beta.
- Phase 4: default-on compatibility mode.
- Phase 5: optional strict defaults for designated tiers.

## Team Responsibilities

- Security Architecture: control approval and exceptions.
- Client Engineering: implementation and integration.
- QA: automated and exploratory validation.
- Operations: relay policy guidance and observability.
- Product/UX: trust and warning UX decisions.

## Risk Register

- R1: payload size rejection at relays.
- R2: capability mismatch fragmentation.
- R3: stale key cache downgrade loops.
- R4: performance regressions on mobile.
- R5: incomplete incident readiness.

Each risk requires owner, mitigation, and trigger thresholds.

## Success Metrics

- Secure send success rate.
- Downgrade rate by reason.
- Decrypt failure rate.
- Group rekey success latency.
- Relay reject rate due to size.
- User-visible error frequency.

## Gate Criteria Summary

- G1 Prototype: core protocol + DM path stable.
- G2 Beta: group + relay hardening stable.
- G3 Production: all MUST requirements met and incident readiness proven.

## Release Checklist

- Threat-requirement traceability complete.
- Test matrix passing with no critical gaps.
- Performance baseline documented.
- Rollback drills executed.
- Security sign-off recorded.

## Decision Log

- 2026-02-18: Established milestone model M0-M6.
- 2026-02-18: Added feature flag set for staged enablement.
- 2026-02-18: Defined rollout as compatibility-first with strict-mode path.

## Open Questions

- Which milestone should include chunking support if needed?
- What threshold triggers strict-mode default enablement?
- How many relays in baseline test matrix are required before production?

## Review Checklist

- Are milestones realistically sequenced?
- Are dependencies explicit and assigned?
- Are risk mitigations measurable?
- Are gate criteria enforceable in CI/release process?

## Exit Criteria

- Plan approved by engineering, security, QA, and operations.
- Milestones linked to tracked implementation tasks.
- Rollout governance accepted by product leadership.
