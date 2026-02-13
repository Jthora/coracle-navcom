# Protocol Strategy Matrix

Status: Draft
Owner: Architecture Lead
Reviewers: Security, Product, QA
Last Updated: 2026-02-12

## 1. Purpose

Define the protocol strategy per mission tier.
Eliminate ambiguity in transport selection decisions.
Document fallback behavior and prohibited downgrades.

## 2. Inputs

Threat model and mission tiers.
Current Navcom architecture constraints.
Relay capability variability.
Interoperability goals.

## 3. Candidate Protocol Modes

Mode A: Baseline relay-managed group flows.
Mode B: Confidential transport pilot for secure-tier groups.
Mode C: Hybrid where baseline control coexists with secure messaging.

## 4. Decision Drivers

Confidentiality requirement.
Relay support in target environment.
Client interoperability requirement.
Operational reliability requirement.
User training overhead.

## 5. Tier-to-Mode Defaults

Tier 0 default: Mode A.
Tier 1 default: Mode A with optional Mode B.
Tier 2 default: Mode B.
Tier 2 fallback to Mode A: not automatic.

## 6. Fallback Rules

Fallback only when capability checks fail.
Fallback must be visible to user.
Tier 0 fallback can be passive.
Tier 1 fallback requires explicit acknowledgment.
Tier 2 fallback requires admin override and audit event.

## 7. Capability Gate Model

Gate G1: required relay auth behavior available.
Gate G2: required event kinds accepted and queryable.
Gate G3: required message flow acknowledgment behavior stable.
Gate G4: required client key lifecycle primitives available.
Gate G5: required local storage protections enabled.

## 8. Gate Evaluation Timing

At group creation.
At join acceptance.
At app startup for known groups.
At periodic health checks.
Before transport mode transitions.

## 9. Group Creation Policy

Tier 0 group create uses Mode A unless operator selects otherwise.
Tier 1 group create suggests Mode B when capabilities pass.
Tier 2 group create blocks if Mode B gates fail.
Create wizard must show mode rationale and capability summary.

## 10. Join Policy

Join path validates target mode and capability state.
Join blocks on incompatible tier-policy combinations.
Join records selected mode in local group metadata.
Join logs policy mismatch reasons for diagnostics.

## 11. Messaging Policy

Send path dispatches through mode-specific adapter.
Mode selected per-group and versioned.
Cross-mode bridge is disallowed unless explicitly specified.
Mixed-mode rooms must show visible transport badge.

## 12. Membership Policy

Membership writes require mode-aware validation.
Role actions are always integrity-checked.
Admin actions must be deterministic across relays.
Mode B membership transitions require key lifecycle updates.

## 13. Moderation Policy

Tier 0: baseline moderation semantics accepted.
Tier 1: baseline semantics + stronger audit requirements.
Tier 2: moderation actions require secure-tier policy checks.
All tiers: moderation actions must be idempotent.

## 14. Metadata Exposure Policy

Tier 0 accepts baseline metadata visibility.
Tier 1 allows baseline with user warning.
Tier 2 requires minimized metadata exposure mode.
Mode badge must communicate metadata posture.

## 15. Promotion Criteria (Pilot to Default)

Secure mode can be promoted only when:
Interoperability matrix passes required environments.
Operational incident rate is below defined thresholds.
User task completion remains acceptable.
No unresolved high severity security findings.

## 16. Rollback Criteria

Rollback triggers:
Sustained publish failure above threshold.
Unresolved confidentiality incident.
Widespread membership inconsistency.
Critical key lifecycle defect.

## 17. Operator Overrides

Operators can force mode per workspace policy.
Overrides must be logged and visible.
Tier 2 forced downgrade requires dual confirmation.
Overrides expire unless renewed by policy.

## 18. UX Requirements

Always show active transport mode in group header.
Show clear warning when sending on weaker mode.
Show reason text when secure mode unavailable.
Provide one-click remediation links for missing capabilities.

## 19. Config Model

Policy defaults by mission tier.
Per-workspace override support.
Per-group locked mode option.
Emergency policy push support.

## 20. Telemetry Requirements

Track mode adoption by tier.
Track fallback frequency and reasons.
Track capability gate failure rates.
Track mode-switch churn.
No secure payload or secret logging.

## 21. Interop Risk Handling

Document known relay quirks.
Document known client incompatibilities.
Block unsupported combinations in create/join flows.
Provide remediation suggestions where possible.

## 22. Test Obligations

Mode selection unit tests.
Gate evaluation integration tests.
Fallback UX tests.
Tier policy enforcement tests.
Mode migration tests.

## 23. Open Questions

Exact secure mode default for Tier 1 orgs.
Minimum relay set for Tier 2 field operations.
Policy sync behavior for offline clients.

## 24. Exit Criteria For This Document

Approved by Security.
Approved by Product.
Approved by Architecture.
Referenced by implementation plan and rollout docs.
