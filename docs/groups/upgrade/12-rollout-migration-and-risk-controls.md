# Rollout, Migration, and Risk Controls

Status: Draft
Owner: Release + Security + Ops
Last Updated: 2026-02-21

## Objective

Define safe rollout for UX and behavior changes in groups.

## Rollout Phases

1. Instrumentation baseline phase
2. Guided mode pilot phase
3. Relay policy rollout phase
4. Broad release with guardrails

## Risk Controls

- Feature flags for guided/expert pathways
- Fast rollback hooks
- Fallback safety checks preserved
- Incident runbook for relay/private relay failures

## Migration Considerations

- Existing groups remain accessible
- No destructive schema migration without backout
- Mode defaults do not break expert users

## Acceptance Criteria

- Rollout checkpoints and owner sign-off points defined
- Rollback exercises documented and testable

## Critique of Prior Draft

The prior draft identified phases but lacked gate criteria.
It did not define risk severity/routing.
It did not define explicit rollback triggers.

## Rollout Gate Model

Each phase requires:

1. Entry criteria.
2. Monitoring criteria.
3. Exit criteria.
4. Abort criteria.

## Risk Register Dimensions

- User-impact severity.
- Probability.
- Detectability.
- Time-to-mitigation.

## High-Priority Risk Classes

1. Guided flow conversion regression.
2. Expert policy state loss on mode switch.
3. Relay policy misconfiguration causing posting failure.
4. Security-state overclaim or misleading fallback copy.

## Rollback Triggers

- Conversion drop exceeds defined threshold.
- P0 error rate increase sustained over window.
- Security-state inconsistency detected in production.

## Controlled Exposure Strategy

- Internal dogfood.
- Limited cohort.
- Expanded cohort.
- Full exposure.

Progression requires gate sign-off and stable telemetry.

## Migration Policy

- No destructive migration without backout path.
- Preserve compatibility with existing room state.
- Maintain expert users’ functional access during transition.

## Incident Response Integration

Include:

- On-call ownership mapping.
- Escalation matrix.
- User-facing communication templates.

## Operational Readiness Checklist

1. Dashboards and alerts active.
2. Rollback switch tested.
3. Runbook reviewed by on-call.
4. Support team briefed on known failure modes.

## Stage 4 Evidence and Automation Hooks

Use the Stage 4 rollout execution log as canonical evidence source:

- `docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md`

Use command helpers for evidence tracking and tracker synchronization:

- `pnpm groups:stage4:rollout:evidence`
- `pnpm groups:stage4:rollout:evidence:strict`
- `pnpm groups:stage4:rollout:log-entry -- --task-key=S4-P1-ST1-T1-SU1 --outcome=PASS --action='describe rollout action'`
- `pnpm groups:stage4:rollout:validate`
- `pnpm groups:stage4:rollout:summarize`
- `pnpm groups:stage4:rollout:status`
- `pnpm groups:stage4:rollout:sync-summary`
- `pnpm groups:stage4:rollout:sync-summary:dry`
- `pnpm groups:stage4:rollout:status:sync`
- `pnpm groups:stage4:rollout:sync`
- `pnpm groups:stage4:rollout:sync:dry`
- `pnpm groups:stage4:rollout:close`
- `pnpm groups:stage4:rollout:close:dry`
- `pnpm groups:stage3:ops:release-controls:status`
- `pnpm groups:stage3:ops:release-controls:status:json`
- `pnpm groups:stage3:ops:release-controls:status:strict`
- `pnpm groups:stage3:ops:release-controls:next`
- `pnpm groups:stage3:ops:release-controls:next:json`
- `pnpm groups:ops:refresh`
- `pnpm groups:ops:refresh:dry`
- `pnpm groups:ops:status`
- `pnpm groups:ops:status:strict`
- `pnpm groups:ops:status:sync`
- `pnpm groups:ops:status:sync:dry`
- `pnpm groups:ops:status:sync:strict`
- `pnpm groups:ops:doctor`
- `pnpm groups:ops:doctor:strict`
- `pnpm groups:ops:doctor:json`
- `pnpm groups:ops:doctor:strict:json`
- `pnpm groups:ops:doctor:json:file`
- `pnpm groups:ops:doctor:strict:json:file`
- `pnpm groups:ops:doctor:json:history`
- `pnpm groups:ops:doctor:strict:json:history`
- `pnpm groups:ops:doctor:history:prune`
- `pnpm groups:ops:doctor:history:prune:dry`
- `pnpm groups:ops:doctor:history:prune:age`
- `pnpm groups:ops:doctor:history:prune:age:dry`
- `pnpm groups:ops:doctor:history:report`
- `pnpm groups:ops:doctor:history:report:json`
- `pnpm groups:ops:doctor:history:report:strict`
- `pnpm groups:ops:doctor:history:report:strict:json`
- `pnpm groups:ops:close:status:dry`
- `pnpm groups:ops:close:status`
- `pnpm groups:ops:close`
- `pnpm groups:ops:close:dry`

Policy:

- `S4-P1-*` checklist rows in `progress-tracker.md` remain open until corresponding Stage 4 `PASS` evidence entries exist.
- Tracker closure should occur via `groups:stage4:rollout:sync` after evidence checks pass.

## Exit Criteria

Rollout plan is complete when:

- All phases include full gate definitions.
- Rollback triggers and actions are tested.
- Risk register has owners and review cadence.

