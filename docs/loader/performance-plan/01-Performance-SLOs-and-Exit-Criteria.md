# 01 - Performance SLOs and Exit Criteria

Status: In Progress
Owner: Frontend Platform (primary), App UX (co-owner)
Last Updated: 2026-02-25

## User-Visible SLOs

Primary user promise:
- Loaders must be truthful and specific about what dependency is blocking progress.
- First meaningful content should appear quickly, even if full enrichment continues.

Surface-level SLOs:

| Surface | Metric | Target (p50) | Target (p95) |
|---|---|---:|---:|
| Feed | Time to first event | <= 1.2s | <= 3.5s |
| Feed | Time to first 10 rendered items | <= 2.0s | <= 5.5s |
| Feed | Time to settled state | <= 4.5s | <= 12.0s |
| Route lazy load | Time to component ready | <= 0.8s | <= 2.5s |
| Bootstrap | Time to app interactive | <= 1.8s | <= 4.5s |
| Map | Time to first marker/first snapshot | <= 2.4s | <= 6.0s |

Loader transparency SLOs:
- 100% of visible loader messages map to a real technical operation.
- 0% generic standalone "Loading..." messages.
- Slow-state escalation shown by 5s for all blocking stages.

## Engineering Budgets

Main-thread budgets (target):
- Feed reduction + sorting overhead: <= 25ms per 100 incoming events on median device.
- Single render frame budget: <= 16ms for smooth interaction, <= 32ms worst-case during burst.

Pipeline budgets:
- Parent context resolution should not serialize whole feed processing.
- Reload/reset churn: <= 1 unintended reload per feed session.

Network/relay budgets (observed and managed, not guaranteed):
- Relay response variability monitored by percentile and timeout buckets.
- Retry/backoff bounded to prevent infinite spinner loops.

## p50/p95 Targets

Measurement windows:
- First event: query_start -> first_event
- First 10 rendered: query_start -> first_10_rendered
- Settled: query_start -> query_exhausted or explicit settled criteria

Quality targets:
- p50 improvement target from baseline: >= 25% for first_10_rendered on feed.
- p95 improvement target from baseline: >= 30% for first_10_rendered on feed.
- Spinner duration > 10s should drop by >= 60% from baseline.

## Must-Pass Exit Criteria

1. Performance
- Feed first_10_rendered meets p50/p95 targets for at least 3 consecutive benchmark runs.
- No regression > 10% on bootstrap and route lazy load surfaces.

2. UX truthfulness
- All loader copy conforms to stage mapping in loader status specs.
- Slow-stage escalation appears deterministically with no stale banner residue.

3. Reliability
- No increase in error rate or uncaught exceptions attributable to loader flow changes.
- Cancellation/abort behavior leaves no orphaned loading states.

4. Rollout readiness
- Canary cohort passes guardrails for at least 24h.
- Rollback runbook tested and executable within 10 minutes.

## Stop-Ship Conditions

- p95 first_10_rendered regresses by > 20% against baseline on feed.
- Any blocking loader can remain visible indefinitely without timeout/recovery action.
- Increased crash/error rate > 5% linked to loader/perf changes.
- Canary shows persistent regression gate violations for > 60 minutes.

## Feasibility Check Against Current Evidence (Task 1.2.1.1.3)

Evidence inputs:
- Baseline report status and capture posture: `03-Baseline-Benchmark-Report.md`
- Experiment and guardrail framework: `10-Experiment-and-A-B-Test-Plan.md`
- Post-launch deltas and decision outcomes: `12-Post-Launch-Review-and-Tuning.md`

Feasibility determination by target class:

| Target Class | Feasibility | Basis | Follow-up |
|---|---|---|---|
| Feed first-event / first-10-rendered p95 improvements | Confirmed feasible | Post-launch deltas show double-digit tail improvements with stable guardrails | Promote feed improvements and continue weekly monitoring |
| Notifications settle p95 improvements | Confirmed feasible | Post-launch deltas show meaningful reduction without reliability regressions | Keep promoted state; verify at next checkpoint |
| Groups settle p95 improvements | Conditionally feasible | Positive direction but weaker confidence for low-tier cohorts | Iterate adaptive low-tier sizing and re-measure |
| Map first-event p95 target attainment | Not yet confirmed | Improvement present but below promote confidence threshold under constrained network | Threshold tuning + focused cohort pass required |
| Bootstrap app-interactive p95 target attainment | Not yet confirmed | Small improvement with low-medium confidence due coarse instrumentation | Expand startup instrumentation and rerun assessment |

Conclusion:
- Current SLO targets remain directionally feasible and should stay in place.
- Full multi-surface feasibility is partially confirmed; map/bootstrap require one additional tuning-and-validation cycle before final confidence sign-off.

