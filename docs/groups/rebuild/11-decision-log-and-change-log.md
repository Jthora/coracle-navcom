# Decision Log and Change Log

Status: Draft
Owner: Architecture Lead
Reviewers: Security, Product, Release
Last Updated: 2026-02-12

## 1. Purpose

Provide a single traceable history of major decisions.
Capture scope, rationale, alternatives, and reversals.
Tie implementation changes to risk and rollout context.

## 2. Usage Rules

Every major decision must be logged before merge.
Every reversal must reference original decision ID.
Every risk acceptance must include explicit approvers.
Every release-impacting change must include rollback note.

## 3. Entry Types

ADR entry.
Change-log entry.
Risk acceptance entry.
Exception waiver entry.
Incident follow-up entry.

## 4. Required Fields For ADR Entries

Decision ID.
Date.
Owner.
Context.
Decision statement.
Alternatives considered.
Rationale.
Risks accepted.
Rollback strategy.
Validation evidence links.

## 5. Required Fields For Change Entries

Change ID.
Date.
Related ADR IDs.
Summary.
Affected components.
Migration impact.
Test evidence links.
Release note required flag.

## 6. Required Fields For Risk Acceptance

Risk ID.
Date.
Risk statement.
Impacted mission tiers.
Mitigations in place.
Expiry/review date.
Approvers.

## 7. Decision Taxonomy

Architecture boundary decisions.
Protocol and mode policy decisions.
Data contract decisions.
Security policy decisions.
Rollout and operations decisions.

## 8. Naming Conventions

ADR-YYYY-### for decisions.
CHG-YYYY-### for implementation changes.
RSK-YYYY-### for risk acceptances.
INC-YYYY-### for incident records.

## 9. Decision Lifecycle

Proposed.
Under review.
Approved.
Implemented.
Superseded.
Rejected.

## 10. Change Lifecycle

Drafted.
Merged.
Released.
Rolled back.
Superseded.

## 11. Template: ADR Entry

ID:
Date:
Owner:
Status:
Context:
Decision:
Alternatives:
Rationale:
Risks:
Rollback:
Evidence:
Notes:

## 12. Template: Change Entry

ID:
Date:
Owner:
Related ADR:
Summary:
Affected Files/Modules:
Migration/Compat Impact:
Test Evidence:
Release Notes:
Rollback Notes:

## 13. Template: Risk Acceptance Entry

ID:
Date:
Owner:
Risk Statement:
Tier Impact:
Mitigations:
Expiry Date:
Approvers:
Revisit Trigger:

## 14. Initial ADR Seeds

ADR-2026-001: Adopt first-class Group domain model.
ADR-2026-002: Introduce transport adapter abstraction.
ADR-2026-003: Tier-aware policy engine is mandatory.
ADR-2026-004: No silent secure-tier downgrade.
ADR-2026-005: Feature-flagged staged rollout required.

## 15. Initial Change-Log Seeds

CHG-2026-001: Add groups route tree and serializers.
CHG-2026-002: Add group projection stores.
CHG-2026-003: Add baseline transport adapter.
CHG-2026-004: Add membership state machine.
CHG-2026-005: Add secure pilot adapter.

## 16. Initial Risk Seed Entries

RSK-2026-001: Relay capability fragmentation.
RSK-2026-002: Projection divergence under relay disorder.
RSK-2026-003: User confusion in mixed mode UX.
RSK-2026-004: Secure mode support burden.

## 17. Linking Rules

Each milestone completion references relevant ADR IDs.
Each PR references at least one change-log ID.
Each risk acceptance links to mitigation tasks.
Each incident links to resulting ADR/CHG updates.

## 18. Review Cadence

Weekly review for new ADR proposals.
Bi-weekly review for risk acceptance expiries.
Per-release review for change log completeness.
Post-incident review within defined SLA.

## 19. Quality Rules

No empty rationale allowed.
No missing rollback note for high-impact changes.
No expired risk acceptance without review.
No release without updated change entries.

## 20. Auditability Rules

Entries must be immutable once released, except supersession notes.
Corrections must preserve original record and add amendment.
Amendments require reviewer acknowledgment.

## 21. Conflict Resolution

Conflicting ADRs require explicit supersession decision.
Supersession must include compatibility and migration impact.
Unresolved conflicts block milestone closure.

## 22. Open Questions

Whether to split incident log into separate file later.
How much detail to include for low-risk cosmetic changes.
Preferred automation for template enforcement.

## 23. Exit Criteria For This Document

Template fields approved by architecture and release engineering.
Initial seed entries approved.
Linked from milestone and rollout documents.
Used in first implementation PR batch.

## 24. Recorded ADR Entries

ID: ADR-2026-006
Date: 2026-02-12
Owner: Core Team
Status: Approved
Context: Group invites required richer context than legacy `groups` CSV values while preserving existing links.
Decision: Adopt structured group invite payload fields (`groupId`, `preferredMode`, `missionTier`, `label`) with backward-compatible decoders.
Alternatives: Keep CSV-only group IDs; introduce breaking query parameter migration.
Rationale: Structured payloads support policy-aware onboarding and secure-mode signaling without invalidating prior invite links.
Risks: Payload diversity (CSV, delimited, JSON) increases parser surface and malformed-input handling complexity.
Rollback: Revert serializer binding to CSV-only decoding and ignore structured fields.
Evidence: `src/app/invite/schema.ts`, `src/app/util/router.ts`, `tests/unit/app/invite/schema.spec.ts`, `tests/unit/app/groups/invite-router-serializer.spec.ts`
Notes: Supports delimited and JSON forms during transition.

ID: ADR-2026-007
Date: 2026-02-12
Owner: Core Team
Status: Approved
Context: Moderation/admin UX exposed mixed privileges without explicit role-to-control mapping.
Decision: Centralize role-based UI visibility/enablement mapping in a dedicated admin visibility model.
Alternatives: Keep per-button ad-hoc checks in view; hide all controls for non-admin roles.
Rationale: Centralized mapping improves consistency, testability, and deterministic guardrail behavior across admin screens.
Risks: Divergence risk between UI affordance map and engine-side permission checks.
Rollback: Inline visibility logic in admin view and remove visibility model.
Evidence: `src/app/groups/admin-visibility.ts`, `src/app/views/GroupSettingsAdmin.svelte`, `tests/unit/app/groups/admin-visibility.spec.ts`
Notes: Audit history remains visible to all roles; privileged actions remain role-gated.

ID: ADR-2026-008
Date: 2026-02-12
Owner: Core Team
Status: Approved
Context: Invite acceptance needed a safe path to move users into group join workflow with prefilled context.
Decision: Resolve/validate invite group entries at accept-time and deep-link to `/groups/create` via sanitized query serializers.
Alternatives: Auto-submit join requests from invite accept; add a separate invite-only join screen.
Rationale: Prefilled deep-link keeps users in the canonical join flow while preserving validation boundaries and explicit user action.
Risks: Serializer drift could desynchronize invite metadata hints from join form behavior.
Rollback: Remove prefill serializers and show group IDs as informational text only.
Evidence: `src/app/invite/accept.ts`, `src/app/groups/serializers.ts`, `src/app/groups/route-config.ts`, `src/app/views/InviteAccept.svelte`, `src/app/views/GroupCreateJoin.svelte`, `tests/unit/app/invite/accept.spec.ts`
Notes: Invalid invite entries are counted and surfaced as warnings, then ignored.

## 25. Recorded Change Entries

ID: CHG-2026-006
Date: 2026-02-12
Owner: Core Team
Related ADR: ADR-2026-007
Summary: Added moderation composer, audit-history projection/filter UI, and explicit role-based admin restrictions.
Affected Files/Modules: `src/app/groups/moderation-composer.ts`, `src/app/groups/audit-history.ts`, `src/app/groups/admin-visibility.ts`, `src/app/views/GroupSettingsAdmin.svelte`, `src/app/views/GroupAuditHistoryPanel.svelte`
Migration/Compat Impact: None; additive UI behavior with existing engine controls unchanged.
Test Evidence: `tests/unit/app/groups/moderation-composer.spec.ts`, `tests/unit/app/groups/audit-history.spec.ts`, `tests/unit/app/groups/admin-visibility.spec.ts`
Release Notes: Required (admin and moderation workflow updates).
Rollback Notes: Remove visibility map/panel integration and restore prior inline rendering.

ID: CHG-2026-007
Date: 2026-02-12
Owner: Core Team
Related ADR: ADR-2026-006, ADR-2026-008
Summary: Extended invite schema for groups, added group QR generation hints, and wired invite-accept prefilled join flow.
Affected Files/Modules: `src/app/invite/schema.ts`, `src/app/invite/create.ts`, `src/app/invite/accept.ts`, `src/app/util/router.ts`, `src/app/views/InviteCreate.svelte`, `src/app/views/InviteAccept.svelte`, `src/app/views/GroupCreateJoin.svelte`
Migration/Compat Impact: Backward compatible with legacy CSV `groups` invites.
Test Evidence: `tests/unit/app/invite/schema.spec.ts`, `tests/unit/app/invite/create.spec.ts`, `tests/unit/app/invite/accept.spec.ts`, `tests/unit/app/groups/invite-router-serializer.spec.ts`
Release Notes: Required (invite flow now supports group context).
Rollback Notes: Revert `groups` serializer to CSV-only decode and remove invite group prefill links.

ID: ADR-2026-009
Date: 2026-02-12
Owner: Core Team
Status: Approved
Context: Group-only invites still required manual click-through to enter join flow, adding friction for guided onboarding.
Decision: Auto-open the group join flow when invite accept payload contains exactly one valid group entry and no additional people/relay payload sections.
Alternatives: Always require manual click-through; auto-open for all group entries including multi-group bundles.
Rationale: Conditional auto-open reduces friction while preserving explicit review surfaces for richer invite bundles.
Risks: Unexpected navigation if invite payload semantics are misread.
Rollback: Disable auto-join resolution helper and revert to link-only behavior.
Evidence: `src/app/invite/accept.ts`, `src/app/views/InviteAccept.svelte`, `tests/unit/app/invite/accept.spec.ts`
Notes: Auto-join is blocked when invalid entries are present.

ID: CHG-2026-008
Date: 2026-02-12
Owner: Core Team
Related ADR: ADR-2026-009
Summary: Added guarded invite auto-join resolution path for single valid group-only invites.
Affected Files/Modules: `src/app/invite/accept.ts`, `src/app/views/InviteAccept.svelte`
Migration/Compat Impact: Backward compatible; existing manual join links remain available.
Test Evidence: `tests/unit/app/invite/accept.spec.ts`
Release Notes: Optional (onboarding UX enhancement).
Rollback Notes: Remove `resolveAutoJoinGroupInvite` usage in invite accept view.

ID: CHG-2026-009
Date: 2026-02-12
Owner: Core Team
Related ADR: ADR-2026-007
Summary: Added matrix-grade mixed-capability validation scenarios for fallback/capability-block/tier-policy behavior.
Affected Files/Modules: `tests/unit/app/groups/mixed-capability-matrix.spec.ts`
Migration/Compat Impact: None.
Test Evidence: `tests/unit/app/groups/mixed-capability-matrix.spec.ts`, `tests/unit/app/groups/mixed-capability-lanes.spec.ts`, `tests/unit/engine/group-transport.spec.ts`
Release Notes: No.
Rollback Notes: Remove matrix-spec file and retain prior focused mixed-capability tests.
