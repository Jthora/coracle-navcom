# 00 - Performance Charter

Status: In Progress
Owner: Frontend Platform (primary), App UX (co-owner)
Last Updated: 2026-02-25

## Mission

Mission statement:
- Deliver faster, more trustworthy loading across core app surfaces by reducing user-visible wait time, exposing technically truthful progress, and eliminating avoidable client-side bottlenecks.

Intended user outcomes:
- Users reach first meaningful content quickly enough to continue task flow without uncertainty.
- Loader messaging explains what is actually in progress (network, reduction, render, route/bootstrap) rather than generic waiting states.
- Slow or degraded scenarios provide clear next actions (retry/fallback/wait rationale) without stale or misleading status.

Primary user pain to solve:
- Long spinner durations with low clarity about what dependency is blocking completion.

Primary technical outcomes:
- Faster time to first meaningful content.
- Reduced tail latency for feed-heavy surfaces.
- Deterministic, stage-based loader messaging tied to actual async operations.

## Scope

In scope:
- App bootstrap loading flow.
- Route module loading.
- Feed loading path (request -> cache -> reduce -> render).
- Group hydration and relay request lifecycle.
- Note publish flow and Intel map loading flow.
- Loader status orchestration and UX behavior.

Surfaces:
- Feed, map, notifications, groups, routes, bootstrap.

## Non-Goals

Explicit non-goals:
- Rewriting the routing system or data model from scratch.
- Changing core protocol behavior of relays.
- Cosmetic redesign unrelated to loading clarity/performance.
- Feature expansion beyond performance, resilience, and loader UX trust.

Anti-patterns to avoid:
- Shipping copy-only loader tweaks without corresponding technical-state mapping.
- Treating aggregate throughput as success when p95 user-perceived latency regresses.
- Introducing broad architecture churn where targeted, reversible bottleneck fixes are sufficient.
- Adding speculative concurrency complexity without measurable net gain and rollback safety.

## Constraints

Technical:
- Existing architecture uses Svelte stores/reactive lifecycle and relay-driven async operations.
- Current feed path includes multiple processing layers; changes must preserve functional parity.
- Existing test/lint debt exists in unrelated files; optimization scope must remain targeted.

Product/Delivery:
- Changes should ship incrementally in phases with rollback points.
- UX copy must remain truthful to real technical state transitions.
- Performance improvements must be measurable against a baseline.

Constraint ownership matrix:

| Cluster | Constraint Scope | Primary Owner | Backup Owner |
|---|---|---|---|
| C-ARCH-1 | Svelte lifecycle/store orchestration and loader-state arbitration | Frontend Platform | App Team |
| C-ARCH-2 | Relay/request lifecycle compatibility and abort/cancel semantics | Engine maintainers | Frontend Platform |
| C-DEL-1 | Release cadence, canary gating, rollback execution readiness | App Team | Frontend Platform |
| C-UX-1 | Truthful loader copy/state mapping and escalation behavior | App UX | Frontend Platform |
| C-MEAS-1 | Baseline comparability, KPI definitions, and evidence quality | Frontend Platform | App Team |

## Principles

1. Measure first, optimize second.
2. Prioritize user-perceived latency (first meaningful content) over raw throughput alone.
3. Keep status text dependency-specific; avoid generic "Loading..." states.
4. Prefer incremental, reversible changes over broad refactors.
5. Optimize bottlenecks at root cause (orchestration + reduction + render), not just symptoms.
6. Only retain complexity (e.g., worker offload) when data proves net benefit.

Compliant vs non-compliant examples:

| Principle | Compliant Change | Non-Compliant Change |
|---|---|---|
| Measure first | Add instrumentation, capture baseline, then optimize reducer path | Refactor reducer architecture without before/after evidence |
| User-perceived latency first | Improve first-event/first-10-rendered and verify p95 tails | Optimize internal batch throughput while first meaningful content regresses |
| Truthful status messaging | Map each message to real stage emitters and exit states | Add generic progress text not tied to any operation |
| Reversible delivery | Ship under flags with canary and rollback plan | Bundle broad refactors with no phased rollback controls |

Review checklist alignment:

- Performance review: prove p50/p95 impact with artifact-backed deltas.
- UX review: verify message-to-operation traceability and no stale-state leakage.
- Reliability review: verify abort/cancel correctness and guardrail compliance.
- Release review: verify canary gates and rollback procedure viability.

## Risks

High:
- Over-optimizing network layer while client-side reduction/render remains dominant bottleneck.
- Regressions from changing async sequencing in feed/reducer paths.

Medium:
- Status message churn causing noisy or misleading UX.
- Increased complexity from concurrency/worker introduction without strong guardrails.

Low:
- Short-term mismatch between documentation and implementation during phased rollout.

## Weekly Risk Register Update (2026-02-25)

| Risk ID | Risk | Severity | Current Signal | Mitigation | Owner | Next Review |
|---|---|---|---|---|---|---|
| R-01 | Intel Map constrained-network variance may delay confident promotion | High | Stage 5 outcome review shows map improvements are positive but below promote confidence threshold | Tune map slow thresholds by cohort and rerun focused validation window before GA expansion | Frontend Platform | 2026-03-03 |
| R-02 | Bootstrap startup-path visibility remains coarse for root-cause attribution | Medium | Post-launch delta is small with low-medium confidence | Expand startup instrumentation coverage and update KPI confidence guidance in post-launch review | App Team | 2026-03-03 |
| R-03 | Groups low-tier cohort may retain p95 settle tail despite adaptive sizing | Medium | Improvement present but below promote threshold for low-tier profile | Rebalance low-tier adaptive load-size strategy and monitor p95 settle + retry rates | Frontend Platform | 2026-03-10 |
| R-04 | Stage 1 charter checklist remains partially unchecked despite implemented content | Low | Tracker shows Stage 1 charter tasks pending, reducing governance clarity | Complete Stage 1 checkbox reconciliation and ensure task/subtask parity with charter sections | GitHub Copilot + App Team | 2026-03-01 |

Risk ownership refresh notes:

- Added explicit owners and review dates for active risks to support weekly M.2 governance cadence.
- Prioritized R-01 and R-02 as next-cycle gating risks for confidence before broader rollout changes.

## Mitigation Triggers and Review Cadence

Trigger conditions:

| Risk ID | Trigger Condition | Required Action |
|---|---|---|
| R-01 | Map p95 first-event remains below promote confidence for one full validation cycle | Apply threshold tuning package and rerun constrained-network cohort validation |
| R-02 | Bootstrap confidence remains low after next instrumentation pass | Expand startup-path event coverage and hold broader promotion decision |
| R-03 | Groups low-tier p95 settle trend stalls or regresses for two checkpoints | Rebalance adaptive load-size policy and run targeted regression check |
| R-04 | Stage 1 checklist/doc parity diverges at weekly checkpoint | Run checklist reconciliation sweep and align tracker/header priorities |

Cadence:
- Weekly: risk review in planning checkpoint with owner status updates.
- Monthly: deep-dive risk recalibration (severity/probability/mitigation effectiveness).

## Decision Log

- 2026-02-24: Multi-pass audits (pass 1/2/3) completed and documented under `docs/loader/audit/`.
- 2026-02-24: Performance plan docs scaffolded under `docs/loader/performance-plan/`.
- 2026-02-24: Stage 0 started with charter initialization and priority sequencing.

