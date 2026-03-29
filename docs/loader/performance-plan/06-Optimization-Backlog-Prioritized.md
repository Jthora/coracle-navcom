# 06 - Optimization Backlog (Prioritized)

Status: In Progress
Owner: Frontend Platform
Last Updated: 2026-02-25

## Implementation Status (Current Cycle)

- Completed (2026-02-24):
	- #1 Remove serialized reduction path in feed reducer
	- #2 Eliminate duplicate dedupe/sort layers across service/UI
	- #3 Add feed-specific loader stages (ingest/reduce/context/render)
	- #4 Add first_10_rendered + reducer timing instrumentation
	- #5 Reduce reload churn from reactive reset loops
	- #6 Enforce operation ID uniqueness per instance
	- #7 Implement stream abort contract in feed data service
	- #8 Align stage arbitration tie-break with spec
	- #10 Adaptive load-size tuning by device/network profile
- Next in execution order:
	- #11 Tune Intel Map constrained-network loader thresholds (from Stage 5 post-launch review)
	- #12 Expand Bootstrap startup instrumentation coverage (from Stage 5 post-launch review)
	- #13 Rebalance adaptive load-size for low-tier groups cohort (from Stage 5 post-launch review)
	- #9 Introduce bounded worker offload for CPU-heavy transforms (deferred; revisit after Doc 03 baselines)

## Prioritization Model

Scoring model (1-5):
- Impact: expected user-perceived performance gain
- Confidence: certainty from audits/measurements
- Complexity: implementation complexity (higher = harder)
- Risk: regression/operational risk (higher = riskier)

Priority heuristic:
- Prioritize high impact + high confidence with manageable complexity/risk.
- Defer high complexity items unless they unlock large strategic gains.

## Candidate Improvements

| Rank | Candidate | Impact | Confidence | Complexity | Risk | Priority Rationale |
|---:|---|---:|---:|---:|---:|---|
| 1 | Remove serialized reduction path in feed reducer | 5 | 5 | 3 | 3 | Critical bottleneck likely causing long spinner tails |
| 2 | Eliminate duplicate dedupe/sort layers across service/UI | 5 | 4 | 3 | 3 | Immediate CPU relief and lower tail latency |
| 3 | Add feed-specific loader stages (ingest/reduce/context/render) | 4 | 5 | 2 | 2 | Improves UX trust and diagnosability quickly |
| 4 | Add first_10_rendered + reducer timing instrumentation | 4 | 5 | 2 | 1 | Required for objective validation and prioritization |
| 5 | Reduce reload churn from reactive reset loops | 4 | 4 | 3 | 3 | Prevents avoidable cold starts and duplicate work |
| 6 | Enforce operation ID uniqueness per instance | 3 | 4 | 2 | 2 | Prevents status cross-talk and debugging confusion |
| 7 | Implement stream abort contract in feed data service | 3 | 4 | 2 | 2 | Improves lifecycle safety and cancellation correctness |
| 8 | Align stage arbitration tie-break with spec | 2 | 4 | 1 | 1 | Small but important correctness and UX consistency fix |
| 9 | Introduce bounded worker offload for CPU-heavy transforms | 4 | 3 | 4 | 3 | Potential large gain; only after baseline fixes |
| 10 | Adaptive load-size tuning by device/network profile | 3 | 3 | 3 | 2 | Incremental performance polish after core fixes |
| 11 | Tune Intel Map constrained-network loader thresholds | 4 | 3 | 2 | 2 | Needed to convert map canary improvements from inconclusive to promotable confidence |
| 12 | Expand Bootstrap startup instrumentation coverage | 3 | 3 | 2 | 1 | Improves confidence for startup-path decisions and avoids blind tuning |
| 13 | Rebalance adaptive load-size for low-tier groups cohort | 3 | 3 | 3 | 2 | Targets remaining groups settle tail under constrained capability profiles |

## Stage 3.1.2 Promotion Updates (Validated Hypotheses)

| Hypothesis ID | Backlog Entry | Acceptance Criteria | Dependencies | Risks |
|---|---|---|---|---|
| H-01 | #1 Remove serialized reduction path in feed reducer | `reducer_start/reducer_end` spans remain emitted; no reducer correctness regressions; maintain ordered apply semantics under concurrent preparation | Metric phase model (`#4`), reducer instrumentation path, feed correctness checks | Ordering drift under concurrent prep, hidden await hotspots |
| H-02 | #2 Eliminate duplicate dedupe/sort layers across service/UI | Single authoritative dedupe/sort ownership path; no duplicate-render regressions; `loadMore` semantics preserved | Service snapshot ownership, UI buffer slicing behavior | Snapshot/UI contract mismatch, pagination edge-case regressions |
| H-03 | #3 Add feed-specific loader stages | Feed loader stages map 1:1 to true technical phases; no stale stage leakage; UX messaging truthfulness retained | Stage taxonomy alignment, operation ID correctness (`#6`) | Stage transition flicker, stale state arbitration bugs |
| H-04 | #4 Add first_10_rendered + reducer timing instrumentation | Metrics emitted once per cycle; both snapshot/stream paths covered; phase model remains backward compatible | Cache metric phase extensions, feed query start metadata | Metric cardinality drift, duplicate emission noise |
| H-05 | #5 Reduce reload churn from reactive reset loops | Reload invoked only when dependency signature changes; initial load behavior preserved; no missed refreshes | Stable dependency signature derivation, feed option normalization | False negatives in signature changes, stale content windows |
| H-06 | #6 + #8 Operation ID uniqueness + arbitration alignment | Unique operation IDs per navigation instance; tie-break behavior matches loader spec; stale statuses always exit | Loader operation lifecycle model, status arbitration logic | Cross-instance leakage under edge timing, status-order regressions |
| H-07 | #7 Implement stream abort contract | Abort reliably cancels underlying controller work; caller API compatibility maintained; no dangling stream updates | Feed stream controller contract, route/navigation lifecycle hooks | Partial cancel behavior, missed cleanup paths |
| H-09 | #10 Adaptive load-size tuning by device/network profile | Load plan bounded by capability tiers; query metadata includes active plan; no regressions in windowing/non-windowing paths | Runtime capability detection utility, feed loadMore/reload integration | Misclassification of device/network tier, unstable tuning across cohorts |

Planned execution wave:
- Wave 1 (immediate): 1, 2, 3, 4
- Wave 2 (stability): 5, 6, 7, 8
- Wave 3 (advanced): 9, 10, 11, 12, 13

## Stage 5 Feedback Loop Updates (2026-02-25)

Source: `12-Post-Launch-Review-and-Tuning.md` post-launch outcome and incident review.

Decision summary from Stage 5 evaluation:
- Promote now: Feed and Notifications improvements.
- Iterate before full promotion: Intel Map, Groups, Bootstrap.
- Reject/Rollback: none.

Ranked follow-up entries injected into backlog:

| New Rank (follow-up queue) | Entry | Source Signal | Impact | Confidence | Complexity | Risk | Owner |
|---:|---|---|---:|---:|---:|---:|---|
| 1 | #11 Tune Intel Map constrained-network loader thresholds | Map canary variance + slow-state escalation | 4 | 3 | 2 | 2 | Frontend Platform |
| 2 | #12 Expand Bootstrap startup instrumentation coverage | Low-confidence bootstrap delta and coarse visibility | 3 | 3 | 2 | 1 | App Team |
| 3 | #13 Rebalance adaptive load-size for low-tier groups cohort | Groups p95 settle below promote threshold | 3 | 3 | 3 | 2 | Frontend Platform |

Roadmap impact:
- Sprint +1: #11 and #12
- Sprint +2: #13

## Dependencies

- Item 1 depends on clear measurement baselines (Doc 02 + 03).
- Item 2 depends on ownership decision for sorting/deduping layer (engine vs UI).
- Item 3 depends on stage taxonomy alignment with loader UX spec (Doc 08).
- Item 4 is prerequisite for proving gains from Items 1/2/5.
- Item 9 depends on completion of worker feasibility analysis (Doc 07).

## Risk and Rollback Notes

Risk controls:
- Feature-flag high-impact pipeline changes.
- Roll out by canary cohorts with strict regression gates.
- Keep reversible commits for reduction/orchestration changes.

Rollback triggers:
- p95 first_10_rendered regression > 20%.
- Increased uncaught errors linked to reducer or status lifecycle.
- Stale loader states persisting after operation completion.

