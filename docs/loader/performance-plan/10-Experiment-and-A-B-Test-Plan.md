# 10 - Experiment and A/B Test Plan

Status: In Progress
Owner: App Team + Frontend Platform
Last Updated: 2026-02-24

## Experiment Design

Objective:

- Validate that Stage 3 and Stage 4 loader improvements produce measurable user-visible gains without introducing regressions.

Experiment format:

- Primary approach: phased cohort rollout with treatment/control comparison where possible.
- Secondary approach: before/after comparison for surfaces where strict A/B split is not feasible.

Experiment windows:

- Ramp 0 (internal): 1-2 days smoke validation.
- Ramp 1 (limited cohort): 5% traffic, 2-3 days.
- Ramp 2 (expanded cohort): 25% traffic, 3-5 days.
- Ramp 3 (near-full): 50-100% traffic, pending guardrail compliance.

## Cohorts

Eligibility dimensions:

- Surface: Feed, Intel Map, Notifications, Groups, Bootstrap.
- Device tier: low / mid / high capability profile.
- Network tier: constrained / normal / fast.
- User state: signed-in vs read-only.

Cohort assignment strategy:

- Deterministic hash bucketing on stable user/session key.
- Preserve assignment for entire experiment window to avoid cohort churn.
- Exclude known internal QA sessions from production decision metrics.

Suggested initial cohorts:

| Cohort | Description | Target Share |
|---|---|---:|
| C0 | Control (existing baseline behavior) | 50% |
| C1 | Treatment (Stage 3+4 improvements enabled) | 50% |

Sub-slicing for analysis:

- C1-low-device, C1-constrained-network, C1-read-only to validate tail-risk behavior.

## Success Metrics

Primary KPIs:

- p50/p95 `first_event` by surface.
- p50/p95 `first_10_rendered` by surface.
- p50/p95 `query_exhausted/settle` equivalent latency.

Secondary KPIs:

- Slow-state display rate.
- Retry action invocation rate (route and degraded flows).
- Loader stale-state defect rate (operations not exited correctly).

Operational quality KPIs:

- Error-rate delta by surface.
- Timeout/fallback rate by scenario class.
- Cancel/abort success rate for feed/map/post operations.

Success threshold targets (initial):

- p95 `first_10_rendered` improvement >= 10% on Feed cohort.
- No KPI regression > 5% on low-device or constrained-network cohorts.
- No statistically meaningful increase in error/timeout rates.

## Guardrails

Hard guardrails:

- Crash/uncaught error rate increase > 10% vs control -> stop ramp.
- p95 latency regression > 15% on any primary surface -> stop ramp.
- Stale loader-status leakage incidents > baseline threshold -> stop ramp.

Soft guardrails:

- Retry usage spike > 20% -> investigate before next ramp stage.
- Timeout/fallback rate increase > 10% -> hold ramp and diagnose.

Monitoring cadence:

- Daily checkpoint during active ramps.
- Additional checkpoint at each ramp boundary.

## Decision Rules

Promotion rubric:

- Promote: primary KPI targets met, no hard guardrails breached, soft guardrails within tolerance.
- Iterate: mixed KPI results or soft guardrail warnings; tune configuration and rerun.
- Reject/Rollback: hard guardrail breach or unacceptable risk pattern.

Decision owners:

- Primary: App Team (product-facing decision).
- Technical sign-off: Frontend Platform.
- Runtime/relay health sign-off: Engine maintainers.

Sample size / duration assumptions:

- Minimum experiment duration: 7 days total across ramps (or until stable confidence interval achieved).
- Minimum surface sample targets:
	- Feed/Map: >= 10k sessions each in treatment+control combined.
	- Notifications/Groups/Bootstrap: >= 3k sessions each.
- If sample target not met, continue observation window before final decision.
