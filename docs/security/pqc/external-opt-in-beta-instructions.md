# PQC External Opt-In Beta Instructions

Generated At: 2026-02-19T23:35:58.846Z
Checkpoint Status: hold
Recommendation: hold-populate-readiness-metrics

## Status Overview

Checkpoint is hold: external opt-in beta should remain disabled until failed gates are resolved.

## Current Gate Snapshot

- Failed gates: 3
- Open issue counts: total=5, critical=0, high=2, medium=3, low=0
- Readiness window: 2026-02-19T00:00:00.000Z to 2026-02-20T00:00:00.000Z (daily-dogfood-window)
- Triage rows analyzed: 5

## Command Sequence

```bash
pnpm benchmark:pqc:rollout:prepare-telemetry -- --force
pnpm benchmark:pqc:rollout:assess-readiness:warn
pnpm benchmark:pqc:rollout:triage-errors:warn
pnpm benchmark:pqc:rollout:checkpoint-beta:warn
pnpm benchmark:pqc:rollout:publish-opt-in-instructions
```

## Enablement Steps

1. Confirm approved external users/cohorts are listed by release operations.
2. Verify latest checkpoint state and failed gate count from `rollout-beta-checkpoint.json`.
3. If checkpoint status is proceed, enable `pqc_enabled`, `pqc_dm_enabled`, and `pqc_groups_enabled` for approved cohort only.
4. Record rollout change ticket with timestamp, cohort identifiers, and operator.
5. Monitor daily readiness, triage, and checkpoint outputs before any cohort expansion.

## Guidance
- Do not enable external opt-in beta flags yet.
- Resolve all failed checkpoint gates and regenerate artifacts.
- Re-run this publisher after checkpoint moves to proceed state.

## Failed Gates

- readiness: Readiness thresholds are not satisfied for this checkpoint.
- highBudget: 2 high open classes (max 0).
- mediumBudget: 3 medium open classes (max 1).

