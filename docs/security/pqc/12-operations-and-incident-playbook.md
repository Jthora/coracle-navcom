# Navcom PQC Operations and Incident Playbook

Status: Draft
Owner: Platform Operations + Security Response
Last Updated: 2026-02-18
Depends On: 05-key-distribution-and-lifecycle.md, 09-relay-compatibility-and-limits.md, 10-implementation-plan.md

Navigation: Previous: [11-test-and-validation-plan.md](11-test-and-validation-plan.md) | Next: [13-nip-draft-navcom-pqc.md](13-nip-draft-navcom-pqc.md)

## Purpose

This document defines operational procedures for monitoring, incident response, and rollback.
It provides actionable runbooks for security and availability incidents in PQC features.

## Audience

- On-call engineers
- Security response team
- Release managers
- Relay operators

## Operational Objectives

- Detect and triage secure messaging failures quickly.
- Contain impact of key compromise or algorithm issues.
- Preserve user trust through clear and fast remediation.
- Maintain service continuity with safe fallback options.

## Monitoring Baseline

Track at minimum:

- Secure send success/failure rates.
- Downgrade rates by reason.
- Decrypt failure rates by category.
- Relay rejection rates by size/policy.
- Rekey latency and failure rates.

Operational helper commands:

- `pnpm benchmark:pqc:rollout:prepare-telemetry` to scaffold daily telemetry input at `docs/security/pqc/cache/rollout-telemetry.json`.
- `pnpm benchmark:pqc:rollout:monitor-daily:warn` to validate daily secure success/downgrade telemetry, emit monitor artifacts (`rollout-daily-monitor.json`/`.md`), and append trend history (`rollout-daily-monitor.ndjson`).
- `pnpm benchmark:pqc:rollout:assess-readiness:warn` to generate readiness artifacts without failing CI/local runs.
- `pnpm benchmark:pqc:rollout:assess-readiness` to enforce strict rollout gating when required metrics/thresholds are not met.
- `pnpm benchmark:pqc:rollout:enable-internal-cohorts:warn` to validate internal dogfood cohort payloads and generate cohort-stage enablement artifacts (`rollout-internal-cohort-enablement.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:rollout:confirm-internal-baseline:warn` to evaluate baseline health gates before internal cohort expansion and generate expansion-gate artifacts (`rollout-internal-baseline-health.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:rollout:triage-errors:warn` to generate top error-class owner triage artifacts (`rollout-error-triage.json`/`.md`) for daily dogfood review.
- `pnpm benchmark:pqc:rollout:checkpoint-beta:warn` to compute the Stage 5.2 beta checkpoint decision (`rollout-beta-checkpoint.json`/`.md`) from readiness + triage artifacts.
- `pnpm benchmark:pqc:rollout:publish-opt-in-instructions` to publish external opt-in beta instructions at `docs/security/pqc/external-opt-in-beta-instructions.md` from checkpoint state.
- `pnpm benchmark:pqc:rollout:enable-opt-in-flags:warn` to generate approved-user external opt-in enablement artifacts (`rollout-opt-in-enablement.json`/`.md`) and append audit events.
- `pnpm benchmark:pqc:rollout:collect-feedback:warn` to validate issue-template submissions and generate feedback collection artifacts (`rollout-feedback-collection.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:rollout:tag-feedback-classes:warn` to tag collected feedback issues into security/perf/interop classes and generate triage artifacts (`rollout-feedback-triage.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:rollout:feed-feedback-milestone:warn` to transform tagged feedback issues into next-milestone plan artifacts (`rollout-feedback-milestone-plan.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:kill-switch:execute:warn` to validate staging kill-switch execution from checklist inputs and generate execution artifacts (`rollout-kill-switch-execution.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:kill-switch:verify-user:warn` to validate user-facing behavior while kill-switch disable state is active and generate behavior artifacts (`rollout-kill-switch-user-behavior.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:kill-switch:verify-recovery:warn` to validate recovery path after re-enable and generate recovery artifacts (`rollout-kill-switch-recovery.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:rollback:l1:warn` to validate staged rollback level 1 (disable strict defaults) and generate rollback artifacts (`rollout-rollback-level1.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:rollback:l2:warn` to validate staged rollback level 2 (disable hybrid send, preserve receive) and generate rollback artifacts (`rollout-rollback-level2.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:rollback:l3:warn` to validate staged rollback level 3 (disable PQ features, return to classical behavior) and generate rollback artifacts (`rollout-rollback-level3.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:compromise:simulate:warn` to run compromise detection and triage simulation (IC-1/P1) and generate triage artifacts (`rollout-compromise-triage.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:compromise:timing:warn` to validate revocation + rekey workflow timing against drill SLAs and generate timing artifacts (`rollout-compromise-revocation-timing.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:compromise:actions:warn` to publish validated corrective actions from compromise drill outcomes and generate action artifacts (`rollout-compromise-corrective-actions.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:relay-surge:simulate:warn` to simulate high relay rejection conditions and generate surge artifacts (`rollout-relay-rejection-surge.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:relay-surge:fallback:warn` to validate adaptive fallback + alerting behavior under relay surge conditions and generate validation artifacts (`rollout-relay-fallback-alerting.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:relay-surge:playbook:warn` to capture operator playbook updates from relay surge drill outcomes and generate update artifacts (`rollout-relay-playbook-updates.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:release-signoff:traceability:warn` to validate MUST-requirement traceability matrix completeness and generate sign-off prep artifacts (`rollout-requirement-traceability.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:release-signoff:gaps:warn` to verify no open critical MUST-requirement gaps remain and generate verification artifacts (`rollout-requirement-gap-verification.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:release-signoff:record:warn` to record security + QA production sign-off approvals and generate sign-off artifacts (`rollout-security-qa-signoff.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:release-signoff:exceptions:review:warn` to review exception records with owners against MUST-exception policy and generate owner-review artifacts (`rollout-exception-owner-review.json`/`.md`) with NDJSON audit history.
- `pnpm benchmark:pqc:ops:release-signoff:exceptions:decide:warn` to approve or close reviewed exception requests and generate decision-log artifacts (`rollout-exception-decision-log.json`/`.md`) with NDJSON audit history.

## Alert Threshold Examples

- High decrypt failure spike over baseline.
- Sudden increase in policy-blocked sends.
- Relay rejection spike on secure payloads.
- Unexpected increase in stale key encounters.

Thresholds must be tuned with production data.

## Incident Classes

- IC-1: Suspected key compromise.
- IC-2: Widespread decrypt failures.
- IC-3: Algorithm implementation vulnerability.
- IC-4: Relay policy incompatibility outage.
- IC-5: Negotiation logic causing systemic downgrade.

## Incident Severity Levels

- P1: Active confidentiality/integrity risk.
- P2: Severe secure messaging disruption.
- P3: Partial degradation with viable fallback.
- P4: Non-critical observability/diagnostic issue.

## Triage Workflow

1. Confirm alert validity.
2. Classify incident type and severity.
3. Identify affected scope (users, relays, groups, versions).
4. Apply immediate containment controls.
5. Communicate status and ETA.
6. Execute remediation and verify recovery.

## Containment Controls

- Disable affected algorithm profile via kill-switch.
- Force compatibility fallback globally if strict path unstable.
- Temporarily disable group secure mode if epoch path compromised.
- Isolate relay sets causing cascading failures.

## Key Compromise Runbook

1. Confirm compromise indicators.
2. Mark affected key ids as revoked.
3. Trigger forced rotation guidance.
4. Trigger group epoch advancement where impacted.
5. Validate removed compromised keys are excluded from send paths.
6. Communicate user remediation steps.

## Decrypt Failure Runbook

1. Inspect failure reason distribution.
2. Determine parser vs key vs negotiation root cause.
3. Compare by app version and relay profile.
4. Roll back problematic release or disable affected profile.
5. Confirm recovery via rolling metrics.

## Relay Constraint Outage Runbook

1. Detect size/policy rejection concentration.
2. Apply adaptive relay selection and fallback behavior.
3. Communicate operator guidance for self-hosted relays.
4. Adjust payload limits/chunking policy if enabled.

## Communication Plan

- Internal incident channel updates every fixed interval.
- User-facing status update templates for major incidents.
- Security advisory template for compromise/vulnerability cases.
- Post-incident summary within agreed SLA.

## Rollback Strategy

- Rollback level 1: disable strict defaults.
- Rollback level 2: disable hybrid send while preserving receive support.
- Rollback level 3: disable PQ features and return to classical behavior.

Each rollback level must document impact and restoration prerequisites.

## Recovery Verification

- Confirm alert metrics return below thresholds.
- Validate key lifecycle state consistency.
- Run smoke tests for DM and group paths.
- Confirm user-facing trust indicators are correct.

## Postmortem Requirements

- Timeline of events.
- Root cause analysis.
- Containment and remediation actions.
- Missed detection opportunities.
- Required preventive actions with owners and deadlines.

## Operational Readiness Checklist

- Kill-switch tested.
- Rollback paths tested.
- Alert dashboards validated.
- On-call runbooks accessible and current.
- Escalation contacts current.

## Security Considerations

- Incident logs must avoid secret/plaintext exposure.
- Emergency overrides must be auditable.
- Compromise handling must prioritize revocation and rekey speed.

## Drills and Exercises

- Quarterly compromise simulation.
- Quarterly relay rejection surge simulation.
- Semiannual downgrade-behavior validation drill.
- Drill outcomes fed back into docs and code changes.

## Decision Log

- 2026-02-18: Defined incident class taxonomy and severity model.
- 2026-02-18: Established staged rollback model.
- 2026-02-18: Added mandatory postmortem requirements.

## Open Questions

- What exact SLA applies for user-facing incident communications?
- Which metrics trigger automatic rollback vs manual approval?
- How should self-hosted relay operators receive emergency recommendations?

## Review Checklist

- Are runbooks actionable without tribal knowledge?
- Are rollback impacts clearly documented?
- Are communication templates sufficient?
- Are drills scheduled and owned?

## Exit Criteria

- Operations and security approve playbook.
- Incident drills completed with recorded outcomes.
- Release readiness includes operational sign-off.
