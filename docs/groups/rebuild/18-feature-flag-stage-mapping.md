# Feature Flag Stage Mapping

Status: Active
Owner: Release Engineering
Reviewers: Ops, Security, QA
Last Updated: 2026-02-12

## 1. Purpose

Define deterministic stage-to-flag mapping for groups rollout.
Validate scoped rollout behavior before broad expansion.
Support Stage 6.2.1.1 tracker tasks.

## 2. Flag Definitions

- F1: `groups.routes.enabled`
- F2: `groups.transport.baseline.enabled`
- F3: `groups.transport.securePilot.enabled`
- F4: `groups.policy.strictTierEnforcement`
- F5: `groups.emergency.disableAll`

## 3. Stage-to-Flag Mapping (6.2.1.1.a)

| Rollout Stage | F1 Routes | F2 Baseline | F3 Secure Pilot | F4 Strict Tier Policy | F5 Emergency Disable |
| --- | --- | --- | --- | --- | --- |
| Stage 0 (Dogfood) | ON (internal cohort) | ON | ON (internal secure cohort only) | ON | OFF |
| Stage 1 (Pilot Orgs) | ON (pilot cohorts) | ON | ON (curated secure cohorts) | ON | OFF |
| Stage 2 (Limited GA) | ON (limited workspace cohorts) | ON | ON (approved secure-ready cohorts) | ON | OFF |
| Stage 3 (Broad Availability) | ON (all target cohorts) | ON | ON (tier-eligible cohorts) | ON | OFF |
| Emergency Freeze Profile | OFF (or readonly fallback profile) | OFF | OFF | ON | ON |

## 4. Scoped Rollout Validation Matrix (6.2.1.1.b)

| Validation ID | Scope | Scenario | Expected Result |
| --- | --- | --- | --- |
| FLAG-SCOPE-001 | Global | Toggle F1 OFF while F5 OFF. | Group routes hidden; no secure/baseline action entry points available. |
| FLAG-SCOPE-002 | Workspace | Enable F3 for secure-approved workspace only. | Secure pilot paths available only in targeted workspace; others stay baseline. |
| FLAG-SCOPE-003 | Cohort | Enable F1/F2 for pilot cohort while non-cohort remains disabled. | Cohort receives groups routes and baseline flows; non-cohort sees no groups routes. |
| FLAG-SCOPE-004 | User diagnostics | Enable diagnostic overrides for selected tester user. | Tester sees debug fallback details without changing workspace defaults. |
| FLAG-SCOPE-005 | Emergency | Activate F5 in active stage profile. | All groups operations disabled according to emergency profile with operator notice. |

## 5. Validation Checklist

- Confirm scoped flag precedence order: `F5` > scope-specific F1-F4 > defaults.
- Confirm tier-policy guardrails remain enforced when secure pilot is scoped off.
- Confirm fallback UX reasons remain visible when secure path is disabled by scope.
- Confirm telemetry tags include scope source (`global`, `workspace`, `cohort`, `user`).
- Confirm rollback profile restores prior stage mapping without orphaned scope overrides.

## 6. Exit Criteria for 6.2.1.1

Stage-to-flag mapping table is approved.
Scoped rollout behavior validation matrix is defined.
Document is linked from rollout and tracker docs.
