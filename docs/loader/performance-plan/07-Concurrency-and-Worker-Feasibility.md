# 07 - Concurrency and Worker Feasibility

Status: In Progress
Owner: Frontend Platform
Last Updated: 2026-02-24

## Candidate CPU-Bound Tasks

Candidate tasks reviewed:

1. Feed dedupe/sort transforms on large event windows.
2. Feed reducer parent/context preparation for reply-heavy streams.
3. Snapshot diff/merge computation for bursty relay updates.
4. Metric aggregation for high-frequency trace streams.

Non-candidates (keep on main thread):

- Svelte store mutation and UI state application.
- Loader stage enter/update/exit orchestration.
- Small-batch list updates (< 100 events).

## Worker Suitability Matrix

| Task | CPU Intensity | Data Transfer Cost | Determinism Risk | Browser Support Risk | Suitability |
|---|---:|---:|---:|---:|---|
| Feed dedupe/sort transform | High | Medium | Low | Low | High |
| Reducer context preparation | High | Medium/High | Medium | Low | Medium |
| Snapshot diff/merge | Medium/High | Medium | Medium | Low | Medium |
| Metric rollups | Medium | Low | Low | Low | Low/Medium |

Preliminary conclusion:

- Best first worker candidate is feed dedupe/sort transform when event windows are large.
- Reducer context preparation should remain on main thread until batching and deterministic ordering are fully stable.

## Main-Thread vs Worker Cost Model

Variables:

- $N$: events per batch
- $C_m$: main-thread compute cost
- $C_w$: worker compute cost
- $S$: serialization + transfer overhead
- $R$: response/application overhead

Decision inequality:

$$
C_w + S + R < C_m
$$

Operating guidance from current architecture:

- For small/medium batches, $S + R$ can erase worker benefit.
- Worker path should be gated by event-count threshold and device capability.
- Default to main thread unless thresholds are exceeded.

Initial threshold proposal (to validate in experiments):

- Enable worker path only when pending event window >= 300 and device tier is not low-end.

## Fallback Plan

Fallback behavior:

1. Feature flag `feed_worker_transform_enabled` defaults OFF.
2. Runtime capability check for Worker support and transfer reliability.
3. On worker failure/timeout, immediately fall back to main-thread path.
4. Emit metric tag `worker_fallback_reason` for each fallback event.
5. Preserve identical output ordering contract between worker and main-thread paths.

Rollback path:

- Disable feature flag globally without code rollback.
- Revert to existing synchronous transform path.

## Go/No-Go Criteria

Go criteria:

- p95 `first_10_rendered` improves >= 15% on feed in benchmark cohort.
- No regression > 5% on low-volume feed sessions.
- No new ordering inconsistencies or duplicate-render defects.
- Worker timeout/fallback rate <= 1% of eligible operations.

No-go criteria:

- Improvement < 10% at p95 after threshold tuning.
- Noticeable increase in ordering bugs, duplicates, or UI jitter.
- Worker fallback/timeouts > 3% or significant memory pressure reports.

Decision for current cycle:

- No-go for immediate production implementation of Item #9.
- Proceed with Item #10 (adaptive load-size tuning) first.
- Revisit worker offload after baseline benchmarks are captured in Doc 03 and after additional reducer telemetry confirms high-batch hotspots.
