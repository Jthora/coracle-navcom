# Stage 3 Operational Readiness Controls

Status: Draft
Owner: Release + Data + Engineering
Last Updated: 2026-02-21

## Purpose

Define concrete, reviewable controls for Stage 3 operational readiness tasks:

- `S3-P2-ST1-T1` Validate dashboard alerts and thresholds
- `S3-P2-ST1-T2` Run rollback drill and confirm runbook
- `S3-P2-ST1-T3` Complete release readiness sign-off

This document is implementation-facing and pairs with:

- `16-stage3-rollback-drill-runbook.md`
- `17-stage3-staging-execution-log.md`
- `scripts/validate-groups-operational-readiness.mjs`

## Scope

In scope:

1. Alert threshold definitions for groups upgrade funnels.
2. Owner routing model for operational alerts.
3. Validation checklist runnable in-repo.
4. Evidence format for tracker updates.

Out of scope:

1. External dashboard vendor setup details.
2. Pager integration implementation in third-party tooling.
3. Cohort rollout execution (Stage 4).

## Alert Threshold Matrix (Stage 3 Baseline)

| Alert Key | Trigger | Window | Threshold | Severity | Primary Owner | Secondary Owner |
| --- | --- | --- | --- | --- | --- | --- |
| `groups.create_funnel_drop` | Create funnel conversion drop | 24h | `>=15%` relative drop vs trailing 7-day baseline | High | Product | Engineering |
| `groups.join_funnel_latency_spike` | Join funnel time-to-completion increase | 24h | `>=25%` median increase vs trailing baseline | Medium | Data | Product |
| `groups.guard_redirect_unrecovered` | Guard redirects not followed by recovery action | 6h | `>=20%` unrecovered rate | High | Engineering | Product |
| `groups.fallback_duration_spike` | Fallback-active duration inflation | 24h | `>=30%` increase in median fallback-active duration | High | Security | Engineering |
| `groups.relay_policy_save_failures` | Relay policy save failures | 1h | `>=5%` failure rate over >=50 attempts | High | Engineering | Support |
| `groups.first_message_failures` | First-message failures after setup/join | 6h | `>=8%` failure rate | High | Engineering | Product |

## Alert Routing Contract

Routing must satisfy all of the following:

1. Every High alert has a named primary and secondary owner.
2. Every owner belongs to an on-call or response rotation.
3. Severity High alerts route to synchronous paging channel.
4. Severity Medium alerts route to asynchronous response queue.
5. All alerts route to a retained incident log channel.

### Owner Mapping

| Team Alias | Responsibility | Escalation |
| --- | --- | --- |
| Product | Funnel health and UX conversion | PM -> Director Product |
| Engineering | Runtime failures and regressions | Eng On-call -> EM |
| Data | Metric definition and anomaly confidence | Data IC -> Data Lead |
| Security | Fallback/security-state integrity | Security IC -> Security Lead |
| Support | User-impact communication loop | Support Lead -> Ops |

## Validation Checklist (In-Repo)

Run:

`node scripts/validate-groups-operational-readiness.mjs`

Optional evidence-status summary:

`node scripts/check-groups-stage3-staging-evidence.mjs`

Operational summary helper:

`pnpm groups:stage3:ops:summarize`

Combined status helper:

`pnpm groups:stage3:ops:status`

Focused release-controls status helper:

`pnpm groups:stage3:ops:release-controls:status`

`pnpm groups:stage3:ops:release-controls:status:json`

`pnpm groups:stage3:ops:release-controls:status:strict`

`pnpm groups:stage3:ops:release-controls:next`

`pnpm groups:stage3:ops:release-controls:next:json`

Tracker snapshot sync helpers:

`pnpm groups:stage3:ops:sync-summary`

`pnpm groups:stage3:ops:sync-summary:dry`

Combined status + tracker sync:

`pnpm groups:stage3:ops:status:sync`

Cross-stage refresh command:

`pnpm groups:ops:refresh`

Cross-stage refresh dry-run (non-destructive tracker snapshot pass):

`pnpm groups:ops:refresh:dry`

Cross-stage close gates:

`pnpm groups:ops:close:dry`

`pnpm groups:ops:close`

`pnpm groups:ops:close:status:dry`

`pnpm groups:ops:close:status`

Cross-stage status dashboard:

`pnpm groups:ops:status`

`pnpm groups:ops:status:strict`

`pnpm groups:ops:status:sync`

`pnpm groups:ops:status:sync:dry`

`pnpm groups:ops:status:sync:strict`

`pnpm groups:ops:doctor`

`pnpm groups:ops:doctor:strict`

`pnpm groups:ops:doctor:json`

`pnpm groups:ops:doctor:strict:json`

`pnpm groups:ops:doctor:json:file`

`pnpm groups:ops:doctor:strict:json:file`

`pnpm groups:ops:doctor:json:history`

`pnpm groups:ops:doctor:strict:json:history`

`pnpm groups:ops:doctor:history:prune`

`pnpm groups:ops:doctor:history:prune:dry`

`pnpm groups:ops:doctor:history:prune:age`

`pnpm groups:ops:doctor:history:prune:age:dry`

`pnpm groups:ops:doctor:history:report`

`pnpm groups:ops:doctor:history:report:json`

`pnpm groups:ops:doctor:history:report:strict`

`pnpm groups:ops:doctor:history:report:strict:json`

Entry authoring helper:

`pnpm groups:stage3:ops:log-entry -- --task-key=S3-P2-ST1-T1-SU1 --outcome=PASS --action='describe validation action'`

Strict closure gate:

`node scripts/check-groups-stage3-staging-evidence.mjs --strict`

Evidence-driven closure command:

`pnpm groups:stage3:ops:close`

Validation must confirm:

1. Required Stage 3 control docs exist.
2. Threshold matrix contains all required alert keys.
3. Threshold rows include primary/secondary owners.
4. Staging execution log exists for evidence capture.
5. Tracker `S3-P2-ST1-*` state is consistent with recorded PASS evidence (open before evidence, closed after complete evidence).
6. Evidence parser can map `Task Key` + `Outcome` fields for Stage 3 subtasks.

## Evidence Attachment Format

When an item is validated, attach evidence in tracker notes using:

- Command run
- Timestamp (UTC)
- Result summary
- Link to runbook/report artifact

Example:

- `2026-02-21T16:10:00Z` — `node scripts/validate-groups-operational-readiness.mjs` — PASS

## Stage 3 Exit Gating Notes

`S3-P2-ST1-T1` should only be checked when:

1. Thresholds are configured in staging dashboard.
2. Alert routing is tested end-to-end to owner channels.

`S3-P2-ST1-T2` should only be checked when:

1. Rollback drill has execution timings.
2. Runbook has post-drill updates committed.

`S3-P2-ST1-T3` should only be checked when:

1. Product, Engineering, QA sign-off captured.
2. Go/no-go decision recorded in tracker notes.

## Risks and Mitigations

1. Risk: Alert thresholds too tight -> false positives.
   - Mitigation: use relative baseline windows and minimum sample sizes.
2. Risk: Owner mapping stale.
   - Mitigation: require owner check at release readiness review.
3. Risk: Tracker marked complete without evidence.
   - Mitigation: enforce evidence bullets in Stage 3 notes.

## Implementation Notes

This document intentionally separates threshold definition from external tooling setup.
External staging validation remains required and is tracked explicitly in `progress-tracker.md`.
