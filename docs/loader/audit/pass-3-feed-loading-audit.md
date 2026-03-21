# Pass 3 Audit: Feed Loading Sluggishness (Render/Orchestration Deep Dive)

Date: 2026-02-24  
Scope: Feed fetch + reduction + render path (review only, no code changes)

## Files Reviewed (Pass 3)

- src/app/shared/Feed.svelte
- src/app/shared/NoteReducer.svelte
- src/app/shared/FeedItem.svelte
- src/app/shared/NotificationItem.svelte
- src/engine/feed-data-service.ts
- src/engine/cache.ts
- src/util/misc.ts

## Pass 3 Goal

Validate whether sluggishness is primarily relay/network-bound, or whether client-side orchestration and reduction are the dominant latency source.

---

## Findings

### 1) Sequential parent-resolution in NoteReducer can serialize feed processing (Critical)

In `NoteReducer.svelte`, event reduction is async and optionally awaited per event:

- `addEvents` loops events and does `await addEvent(event)` when `shouldAwait` is true.
- `addEvent` can call `getParent(event)`.
- `getParent(event)` may invoke network (`myLoad`) when parent is not in repository.

`Feed.svelte` uses `<NoteReducer shouldAwait ...>` and `NotificationItem.svelte` also uses `shouldAwait`.

Why this is critical:
- One missing parent can stall the processing of subsequent events in the same batch.
- Under reply-heavy feeds, this can turn event handling into effectively serial network waits.
- Perceived “loading sluggishness” can occur even when event fetch itself is healthy.

### 2) Reactive re-entry can trigger overlapping async reduction work (High)

`NoteReducer.svelte` uses reactive invocation: `$: addEvents(events)`.

There is no explicit cancellation token or generation guard around async `addEvents/addEvent` execution.

Why this matters:
- Rapid `events` updates may create interleaved async reductions.
- This can amplify duplicate work, introduce ordering jitter, and inflate time-to-settled-render.

### 3) Feed pipeline currently has two expensive reduction layers before stable UI (High)

Layer A (service): `feed-data-service.ts` dedupe/sort/slice on each incoming event.  
Layer B (UI): `Feed.svelte` performs buffer sorting/deduping in `loadMore`, then passes events into `NoteReducer`, which may walk parents and sort/insert contextually.

Why this matters:
- Multiple O(N log N) and context-building passes stack in the hot path.
- CPU cost and GC pressure rise with bursty relay inputs and larger buffers.

### 4) Feed reducer does on-demand parent fetches per event without batching (High)

`NoteReducer.getParent` computes parent IDs per event and calls `myLoad` for misses.

Why this matters:
- Similar parent lookups across nearby events are not obviously coalesced in reducer scope.
- Request fanout can increase tail latency and perceived sluggishness in threads/reply-rich streams.

### 5) Instrumentation exists but is insufficient for reduction/render bottleneck visibility (Medium)

`startCacheMetric` tracks query phases (`query_start`, `first_event`, `query_exhausted`) and elapsed time.  
However:
- Metrics are not consumed outside `cache.ts` (store is never read elsewhere).
- Current metrics emphasize fetch/query lifecycle, not reducer/render time.

Why this matters:
- You can’t distinguish “network slow” vs “reducer/render slow” from current telemetry.
- Optimization decisions risk targeting the wrong layer.

### 6) Scroller strategy likely contributes secondary latency but is not primary root cause (Medium)

`createScroller` uses periodic checks and threshold-based loading. In feed, it runs with `delay: 300`, `threshold: 3000`.

Why this matters:
- Can introduce small “wait gaps” before next fetch/load-more trigger.
- Important, but likely secondary compared to serialized reduction and repeated sorting.

### 7) FeedItem/child derivations can compound work on large trees (Contextual)

`FeedItem` derives replies and builds hidden/visible sets reactively. Combined with deep contexts from `NoteReducer`, reply-heavy trees may amplify render work.

Why this matters:
- Even after fetch completes, UI can feel slow while local derivations settle.

---

## Pass 3 Diagnosis

Primary bottleneck class appears to be:

1. Serialized async reduction with parent lookup (`shouldAwait` + per-event parent fetch).
2. Repeated multi-layer reduction (service dedupe/sort, UI dedupe/sort, reducer parent traversal).
3. Missing observability for reducer/render time obscures where latency is actually spent.

This strongly suggests client orchestration/render is at least co-equal with relay latency, and likely dominant in heavy feeds.

---

## Evidence Anchors

- Feed invokes reducer with sequential mode: `src/app/shared/Feed.svelte`
- Notifications do same: `src/app/shared/NotificationItem.svelte`
- Sequential await path and parent network fetch: `src/app/shared/NoteReducer.svelte`
- Event-level dedupe/sort at service layer: `src/engine/feed-data-service.ts`
- Metrics produced but not consumed: `src/engine/cache.ts`

---

## Pass 4 Recommendation (still review-only)

Before coding, run a targeted validation pass with explicit timing slices:

1. Query time: query_start -> first_event (already available).
2. Reduction time: first_event -> first 10 reduced items.
3. Render time: reduced items ready -> first paint of 10 feed cards.
4. Parent fetch pressure:
   - count parent misses per 100 events
   - count parent network calls per reload
   - average parent fetch latency
5. Async overlap:
   - count concurrent `addEvents` executions for same feed key.

If these measurements confirm this pass, optimization priority should begin with reducer serialization and duplicate reduction layers, then tune scroller/load sizing.

---

## Pass 3 Summary

Pass 3 identifies a high-confidence critical issue: the feed reduction path can become serialized on parent lookups due to `shouldAwait` usage in core feed/notification renderers. This is likely a major contributor to perceived sluggishness, independent of relay quality.
