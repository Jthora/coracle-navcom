# Groups Rebuild Charter and Success Criteria

Status: Draft
Owner: Navcom Core Team
Reviewers: Security, Product, Field Ops
Last Updated: 2026-02-12

## 1. Purpose

This document defines why the Groups rebuild exists.
This is the top-level control document for scope.
All other rebuild documents inherit constraints from this charter.
If another document conflicts with this one, this document wins.

## 2. Problem Statement

Navcom currently has strong direct messaging and channel UX.
Navcom does not currently ship first-class in-app groups.
Historical groups UX was intentionally removed from the app.
The current architecture is participant-set centric, not group-entity centric.
This mismatch blocks robust membership, moderation, and secure group workflows.

## 3. Strategic Outcome

Deliver a production-grade groups capability for GEOINT and OSINT collaboration.
Support mission-driven security posture by workflow tier.
Preserve interoperability while enabling stronger confidentiality paths.
Avoid architecture lock-in to a single evolving protocol path.

## 4. In Scope

Define a canonical group domain model.
Implement group lifecycle: create, join, leave, archive.
Implement role-aware membership and moderation actions.
Introduce pluggable group transport architecture.
Ship baseline interoperable groups workflow.
Ship pilot-grade secure group transport path.
Define fallback behavior for relay and capability gaps.
Add rollout controls and kill-switch policy.

## 5. Out of Scope

No full rewrite of all message rendering primitives.
No hard dependency on a single relay implementation.
No irreversible migration that strands existing channel data.
No requirement to make every legacy client interoperate.
No mandatory MLS default on day one.

## 6. Stakeholders

Primary: analysts, operators, coordinators.
Secondary: admins, incident commanders, relay operators.
Internal: frontend, engine, security, QA, release engineering.
External: relay ecosystems and client interoperability partners.

## 7. Guiding Principles

Security posture must be mission-tier aware.
Interoperability should degrade gracefully.
Safety and recoverability beat novelty.
Operational reliability beats protocol purity.
Local state must be durable and recoverable.
Design decisions must be traceable to documented rationale.

## 8. Non-Negotiable Constraints

All major decisions require recorded rationale in decision log.
All milestone exits require passing quality gates.
All protocol claims must have interoperability evidence.
All security claims must have explicit validation steps.
All fallback paths must be user-visible and operator-observable.

## 9. Success Metrics

### 9.1 Product Metrics

Group create success rate >= 99% in supported relay matrix.
Join success rate >= 98% for valid invites and permissions.
Message publish acknowledgment median < 2 seconds on healthy relays.
Unread and membership state correctness >= 99.9% in test scenarios.

### 9.2 Security Metrics

No plaintext leakage for secure-tier group messages.
No unauthorized membership writes in enforced-mode flows.
Key rotation policy compliance >= 99% in pilot cohorts.
At-rest protection enabled for secure-tier local group state.

### 9.3 Reliability Metrics

Crash-free session rate unaffected by group features.
Recovery from intermittent relay outages without data corruption.
Deterministic replay and idempotent projection behavior.
Fallback path invocation is deterministic and documented.

## 10. Quality Bars

Code quality bar equals existing Navcom standards or higher.
Architectural additions require clear ownership boundaries.
No unbounded background tasks without observability.
No hidden feature behavior changes without release notes.
No shipping of unresolved high-risk security findings.

## 11. Release Phases

Phase A: architecture foundations and baseline group entity.
Phase B: interoperable baseline groups workflow.
Phase C: secure transport pilot and hardening.
Phase D: production rollout with measured enablement.

## 12. Governance Model

Weekly design review for architecture-impacting changes.
Security review required before any secure-tier enablement.
Release review required before expanding cohort percentage.
Decision deadlocks escalate to core owner + security owner.

## 13. Decision Recording Rules

Every irreversible decision gets an ADR entry.
Every deferred decision gets an owner and revisit date.
Every rejected alternative gets a brief reason.
Every rollout change records blast-radius assumptions.

## 14. Risk Register Categories

Protocol churn risk.
Relay capability fragmentation risk.
Data migration risk.
User confusion risk.
Operational support burden risk.
Local secret handling risk.

## 15. Required Evidence Before Build Starts

Approved threat model.
Approved protocol strategy matrix.
Approved target architecture boundaries.
Approved milestone plan and quality gates.

## 16. Required Evidence Before Public Rollout

Interop matrix across required relay/client combinations.
Security hardening checklist completion.
Pilot incident log and mitigation outcomes.
Rollback and kill-switch drill completion.

## 17. Definition of Done (MVP)

Group entities exist and persist correctly.
Membership state machine handles nominal and edge flows.
Moderation actions function in baseline mode.
Fallback behavior is deterministic and visible.
All MVP tests pass in CI and staging.

## 18. Definition of Done (Production)

Rollout gates passed for reliability and supportability.
Security gates passed for target mission tiers.
Operational runbooks approved and tested.
Telemetry and alerting thresholds validated.
Documentation set is complete and current.

## 19. Open Questions

Default mission tier for new organizations.
Default transport for mixed-capability environments.
Operator policy overrides and tenancy boundaries.
User education strategy for transport differences.

## 20. Exit Criteria For This Document

Reviewed by Product.
Reviewed by Security.
Reviewed by Engineering.
Linked in milestone plan.
Referenced by all subsequent rebuild docs.
