# 11 - Rollout Runbook and Regression Gates

Status: In Progress
Owner: Frontend Platform + App Team
Last Updated: 2026-02-24

## Pre-Release Checklist

Release readiness checklist:

- [ ] Experiment decision approved from Doc 10 (promote or iterate path).
- [ ] Stage 3/4 docs and tracker status synced.
- [ ] Regression dashboard links validated.
- [ ] Alert routing verified for loader/perf failures.
- [ ] Rollback owner on-call confirmed.

Technical readiness:

- [ ] Feature flags and defaults reviewed.
- [ ] Operation status lifecycle checks pass (no stale active operations).
- [ ] Smoke tests pass for Feed, Intel Map, Route loading, Post submit.
- [ ] Error budget and SLO baseline snapshots captured.

## Canary Plan

Canary rollout phases:

1. Canary A: 5% traffic, 24 hours.
2. Canary B: 25% traffic, 24-48 hours.
3. Canary C: 50% traffic, 48 hours.
4. General Availability: 100% traffic if regression gates pass.

Progression requirements:

- All hard gates passing during previous phase window.
- No unresolved P0/P1 incident linked to rollout.
- Owner sign-off recorded in release log.

## Regression Gates

Must-pass gates per phase:

- Gate R1: p95 `first_10_rendered` must not regress > 10% vs prior phase.
- Gate R2: uncaught error rate must not rise > 10%.
- Gate R3: timeout/fallback rate must remain within agreed threshold.
- Gate R4: stale loader-state incidents remain at/under baseline.
- Gate R5: user-visible blocker defects (route/map/feed loading) remain below stop-ship threshold.

Stop-ship triggers:

- Any Gate R1-R4 hard breach for two consecutive monitoring intervals.
- Single severe data-loss/corruption incident attributable to rollout change.
- Sustained critical UX regression confirmed by on-call triage.

## Rollback Procedure

Rollback levels:

- Level 1: disable treatment feature flags for impacted surface only.
- Level 2: revert full rollout configuration to pre-canary baseline.
- Level 3: emergency patch + global rollback.

Rollback execution checklist:

1. Declare incident level and incident commander.
2. Disable relevant flags / revert deployment.
3. Verify rollback via key health checks and smoke flows.
4. Post rollback notice in release channel with timestamp and impact.
5. Open root-cause follow-up issue and schedule postmortem.

## Ownership During Rollout

Ownership matrix:

- App Team: release decision and user-impact communication.
- Frontend Platform: rollout mechanics, loader correctness, and performance monitoring.
- Engine maintainers: relay/request health and backend-adjacent impacts.

Response-time expectations:

- Canary phases: acknowledge critical alerts within 15 minutes.
- GA phase: acknowledge critical alerts within 30 minutes.
- Non-critical regressions: triage within 1 business day.
