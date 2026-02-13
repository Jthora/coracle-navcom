# Rollout, Fallback, and Kill-Switch

Status: Draft
Owner: Release Engineering
Reviewers: Ops, Security, Product, QA
Last Updated: 2026-02-12

## 1. Purpose

Define safe rollout strategy for Groups rebuild.
Define deterministic fallback behavior.
Define emergency kill-switch operations.

## 2. Rollout Principles

Prefer gradual cohort expansion.
Measure before expanding blast radius.
Keep rollback path continuously available.
Never hide downgrade impacts from users.

## 3. Rollout Stages

Stage 0: internal dogfood only.
Stage 1: pilot organizations and curated relays.
Stage 2: limited general availability.
Stage 3: broad availability with policy defaults.

## 4. Entry Criteria Per Stage

All prior stage incident actions resolved.
Quality gates passed for target scope.
Interop lanes green for target cohort.
Security sign-off for enabled mission tiers.

## 5. Exit Criteria Per Stage

Error rate below threshold.
Fallback frequency within expected band.
No unresolved critical incidents.
Operator support load acceptable.

## 6. Feature Flag Model

Flag F1: groups routes enabled.
Flag F2: baseline transport enabled.
Flag F3: secure pilot transport enabled.
Flag F4: tier-policy enforcement strict mode.
Flag F5: emergency groups disable switch.

## 7. Flag Scoping

Global scope.
Workspace scope.
Cohort scope.
User scope for diagnostics.

## 8. Fallback Policy

Fallback triggered by capability gate failure or runtime instability.
Fallback path must preserve user action intent where safe.
Fallback requires user-visible badge and reason text.
Fallback reason recorded for telemetry and support.

## 9. Tier-Specific Fallback

Tier 0 allows automatic fallback.
Tier 1 allows prompted fallback.
Tier 2 disallows auto fallback and requires explicit override.
Tier 2 override logs mandatory audit event.

## 10. Kill-Switch Types

KS1: Disable secure pilot adapter only.
KS2: Disable all new groups creation.
KS3: Disable all group send operations.
KS4: Hide groups routes while preserving readonly state.
KS5: Full groups subsystem disable.

## 11. Kill-Switch Triggers

Confirmed confidentiality incident.
Severe data corruption in projections.
Widespread publish ack failures.
Unbounded crash or memory regressions.
Operator escalation due to sustained incident.

## 12. Kill-Switch Activation Workflow

Declare incident class and severity.
Select minimal effective kill-switch level.
Apply scoped flag changes.
Verify effect in telemetry.
Announce status to stakeholders.

## 13. Rollback Workflow

Stop cohort expansion.
Freeze related deployments.
Revert feature flags to previous known-safe profile.
Run rollback verification checks.
Document incident timeline and findings.

## 14. Forward-Fix Workflow

Open coordinated incident workstream.
Define temporary mitigations.
Ship patch under restricted cohort.
Re-run required quality and interop checks.
Resume staged rollout only after sign-off.

## 15. Operational Dashboards

Mode adoption by tier.
Fallback rates by workspace.
Send ack latency and failure rates.
Projection divergence indicators.
Crash-free session trends.

## 16. Alerting Rules

Critical alert on confidentiality-risk signals.
Critical alert on unauthorized admin action anomalies.
High alert on sustained send failures.
High alert on repeated fallback spikes.

## 17. Support Runbook Requirements

Decision tree for user-reported send failures.
Decision tree for join and membership anomalies.
Decision tree for secure-mode unavailability.
Escalation path with required diagnostic bundle.

## 18. Communication Plan

Internal incident channel templates.
Operator-facing status update templates.
User-facing degraded-mode copy templates.
Post-incident summary template.

## 19. Data Retention During Incidents

Retain only necessary diagnostics.
Respect redaction boundaries.
Expire sensitive diagnostic artifacts promptly.
Track retention exceptions with approval.

## 20. Chaos and Drill Requirements

Run kill-switch drills before public rollout.
Run rollback drills for each rollout stage.
Run degraded relay simulation drills.
Capture time-to-mitigate metrics.

## 21. Governance

Release manager controls rollout stage transitions.
Security lead can enforce emergency kill-switch.
Ops lead can request scoped freeze.
All emergency actions require post-action review.

## 22. Open Questions

Exact numeric thresholds for stage transitions.
Preferred cohorting strategy by workspace type.
Fallback UX copy localization scope.

## 23. Exit Criteria For This Document

Runbook approved by Ops and Release Engineering.
Kill-switch drills scheduled and owned.
Thresholds approved by Product and Security.
Referenced by milestone and decision-log docs.

## 24. Stage-to-Flag Mapping Reference

- Stage-to-flag mapping and scoped rollout validation matrix for `6.2.1.1` are defined in `docs/groups/rebuild/18-feature-flag-stage-mapping.md`.

## 25. Kill-Switch Drill Evidence Reference

- KS1/KS2 drill outcomes for `6.2.1.2` are documented in `docs/groups/rebuild/19-kill-switch-drill-outcomes-2026-02-12.md`.

## 26. Rollback Drill Evidence Reference

- Staged rollback drill outcomes for `6.2.1.3` are documented in `docs/groups/rebuild/20-rollback-drill-outcomes-2026-02-12.md`.
