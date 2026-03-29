# 02 - Measurement Plan and Metrics Dictionary

Status: In Progress
Owner: Frontend Platform
Last Updated: 2026-02-24

## Instrumentation Points

Core feed path instrumentation:
- Query start (feed/map/request): `startCacheMetric(..., "query_start")`
- First event observed: `first_event`
- Query exhausted/settled: `query_exhausted`

Implemented instrumentation points:
- first_10_rendered (first 10 items fully rendered)
- reducer_start / reducer_end (for feed reduction pass)

Remaining additional instrumentation points:
- first_cache_paint (first UI paint from cached data)
- parent_lookup_start / parent_lookup_end (for context fetch path)
- reload_trigger_reason (to detect churn sources)

## Timers

Canonical timers:

| Timer | Start | End | Surface |
|---|---|---|---|
| query_to_first_event_ms | query_start | first_event | feed/map/thread/notifications/groups |
| query_to_exhausted_ms | query_start | query_exhausted | feed/map/thread/notifications/groups |
| query_to_first_10_rendered_ms | query_start | first_10_rendered | feed |
| reducer_duration_ms | reducer_start | reducer_end | feed/notifications |
| parent_lookup_latency_ms | parent_lookup_start | parent_lookup_end | feed/notifications |
| route_load_duration_ms | route_start | route_ready | routes |
| bootstrap_duration_ms | bootstrap_start | bootstrap_ready | app |

Slow-state thresholds:
- stage_slow_2s, stage_slow_5s, stage_slow_10s buckets per blocking stage.

## Counters

Per-session counters:
- events_received_total
- events_deduped_total
- events_sorted_total
- reducer_invocations_total
- parent_lookups_total
- parent_lookup_misses_total
- reload_count_total
- spinner_visible_events_total
- spinner_10s_exceeded_total

Per-operation counters:
- relay_count_selected
- relay_timeouts_total
- retries_total
- cancel_actions_total

## Sampling and Storage

Sampling policy:
- 100% sampling in local/dev diagnostics.
- Production sampling configurable by surface and release cohort.

Retention:
- In-memory ring buffer for session-level debug traces.
- Aggregated metrics exported to analytics backend with environment tags.

Dimensions:
- surface, stage_id, operation_id, network_profile, device_tier, build_version.

## Data Quality Checks

Quality rules:
1. Every timer must have both start and end events or explicit timeout classification.
2. No duplicate operation_id with conflicting stage ordering in a single trace.
3. Monotonicity checks for timestamp ordering.
4. Counter cardinality bounds to avoid memory blowups.

Validation checklist:
- Timer deltas non-negative.
- Stage transitions follow allowed state-machine edges.
- Missing events logged with reason codes.

Automated validation tooling:
- `pnpm benchmark:loader:baseline:init-runs` initializes `docs/loader/performance-plan/cache/baseline-runs.json` with an empty scaffold when missing.
- `pnpm benchmark:loader:baseline:capture-status` reports current baseline capture progress by surface and remaining required runs.
- `pnpm benchmark:loader:baseline:capture-status:brief` prints a compact terminal summary including the highest-priority next surface target.
- `pnpm benchmark:loader:baseline:capture-next` shortcut for brief mode when running iterative capture loops; use between capture passes to keep current target guidance visible.
- `pnpm benchmark:loader:baseline:capture-loop -- --iterations=<n>` runs iterative `capture-next` checks in one command for operator loop ergonomics.
- `pnpm benchmark:loader:baseline:capture-loop:refresh -- --iterations=<n>` runs iterative capture-next checks with `refresh-and-sync` after each iteration.
- Doc 03 includes a minimal copy/paste capture-loop snippet using `capture-next` and `capture-status:brief` for operator workflows.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-capture-status.json` and `docs/loader/performance-plan/cache/baseline-capture-status.md`.
- `pnpm benchmark:loader:baseline:validate-completeness` verifies each required surface has the minimum run count (10x) before summary/validation analysis.
- Optional strict gate: `pnpm benchmark:loader:baseline:validate-completeness:strict`.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-completeness.json` and `docs/loader/performance-plan/cache/baseline-completeness.md`.
- `pnpm benchmark:loader:baseline:validate-telemetry` validates exported run traces from `docs/loader/performance-plan/cache/baseline-runs.json`.
- Optional strict gate: `pnpm benchmark:loader:baseline:validate-telemetry:strict`.
- Output artifact: `docs/loader/performance-plan/cache/baseline-telemetry-validation.json`.
- `pnpm benchmark:loader:baseline:diagnose` classifies delay signatures, runs synthetic slow-scenario checks, and emits blind-spot recommendations.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-diagnosability.json` and `docs/loader/performance-plan/cache/baseline-diagnosability.md`.
- `pnpm benchmark:loader:baseline:assess-usefulness` evaluates Stage 2.2.2 telemetry usefulness checklist signals from validation and diagnosability artifacts.
- Optional strict gate: `pnpm benchmark:loader:baseline:assess-usefulness:strict`.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json` and `docs/loader/performance-plan/cache/baseline-telemetry-usefulness.md`.
- `pnpm benchmark:loader:baseline:remediation` emits observability remediation tickets from diagnosability blind spots.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-observability-remediation.json` and `docs/loader/performance-plan/cache/baseline-observability-remediation.md`.
- `pnpm benchmark:loader:baseline:issue-review` aggregates completeness, telemetry validation, diagnosability, telemetry usefulness, and remediation into a single baseline issue gate summary.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-issue-review.json` and `docs/loader/performance-plan/cache/baseline-issue-review.md`.
- `pnpm benchmark:loader:baseline:post-capture-checklist` emits an action-oriented post-capture checklist from capture/completeness/usefulness/issue-review artifacts.
- Optional strict gate: `pnpm benchmark:loader:baseline:post-capture-checklist:strict`.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-post-capture-checklist.json` and `docs/loader/performance-plan/cache/baseline-post-capture-checklist.md`.
- `pnpm benchmark:loader:baseline:check-closure` evaluates Stage 2 baseline closure by aggregating completeness/validation/diagnosis/usefulness/remediation/issue-review/post-capture-checklist gate status and emits per-failed-gate summary/action guidance.
- Optional strict gate: `pnpm benchmark:loader:baseline:check-closure:strict`.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-stage2-closure.json` and `docs/loader/performance-plan/cache/baseline-stage2-closure.md`.
- `pnpm benchmark:loader:baseline:close:strict` runs `refresh-and-sync` then enforces strict Stage 2 closure in one command.
- `pnpm benchmark:loader:baseline:sync-tracker-blockers` syncs top 3 blockers from issue-review output into `progress-tracker.md`, including owner/ETA metadata from `docs/loader/performance-plan/blocker-ownership.json`.
- `pnpm benchmark:loader:baseline:sync-tracker-usefulness` syncs Stage 2.2.2.1/2.2.2.2 task + subtask checkbox status in `progress-tracker.md` from `baseline-telemetry-usefulness.json` signals so outstanding priorities reflect current evidence.
- `pnpm benchmark:loader:baseline:sync-tracker-next-steps` syncs prioritized immediate next steps from capture/completeness/usefulness/post-capture-checklist/issue-review/unblock-checklist artifacts into `progress-tracker.md` (including `benchmark:loader:baseline:capture-next` guidance when a target surface remains, explicit target-surface and overall capture progress in the completeness-first action line when capture-status totals are available, telemetry-usefulness granularity-aware guidance for failing `2.2.2.1.3` evidence, owner/ETA annotations sourced from `docs/loader/performance-plan/blocker-ownership.json`, owner-tagged `refresh-and-sync` guidance based on highest-priority active unblock source, and owner-tagged fallback Stage 2 guidance lines when unblock/checklist actions are unavailable).
- `pnpm benchmark:loader:baseline:sync-tracker-next-steps:annotate-stage3` runs the same sync with Stage 3 annotation mode enabled, a visible mode line, a visible compact capture-progress badge line, and a visible outstanding-priorities line sourced from unchecked Stage 2 tasks (task IDs + task titles) in the tracker.
- `pnpm benchmark:loader:baseline:refresh-and-sync:annotate-stage3` runs the full refresh/sync chain with Stage 3 annotation mode enabled.
- `pnpm benchmark:loader:baseline:sync-tracker-closure` syncs Stage 2 closure summary plus prioritized actionable failed-gate detail/action lines from `baseline-stage2-closure.json` into the tracker header (favoring direct unblock gates over derivative issue-review detail when overlaps exist), and annotates closure action lines with owner/ETA metadata from `docs/loader/performance-plan/blocker-ownership.json`.
- `pnpm benchmark:loader:baseline:unblock-checklist` emits prioritized owner-assigned unblock actions from closure + post-capture-checklist + issue-review artifacts, defaulting to one action per blocker type for clearer operator focus, and derives telemetry-usefulness action/detail text from failing granularity evidence when `2.2.2.1.3` is incomplete.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-unblock-checklist.json` and `docs/loader/performance-plan/cache/baseline-unblock-checklist.md`.
- `pnpm benchmark:loader:baseline:sync-tracker-unblock` syncs top prioritized unblock actions from `baseline-unblock-checklist.json` into `progress-tracker.md`.
- `pnpm benchmark:loader:baseline:priority-checklist` emits a focused checklist artifact for top outstanding Stage 2 tracker tasks (ID + title), including recommended commands and evidence paths.
- Output artifacts: `docs/loader/performance-plan/cache/baseline-priority-checklist.json` and `docs/loader/performance-plan/cache/baseline-priority-checklist.md`.

## Glossary

- first meaningful content: earliest render where user sees actionable content (not only spinner).
- settled: feed/map/request reached exhausted or explicit settle condition.
- reduction: event processing path between ingress and render-ready output.
- churn: avoidable reload/reset cycles causing extra async work.

