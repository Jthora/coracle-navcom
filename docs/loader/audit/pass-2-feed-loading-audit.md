# Pass 2 Audit: Feed Loading Sluggishness

Date: 2026-02-24  
Scope: Relay-backed feed loading path (no code changes, review only)

## Files Reviewed

- `src/app/shared/Feed.svelte`
- `src/engine/feed-data-service.ts`
- `src/engine/cache.ts`
- `src/engine/requests.ts`
- `src/engine/state.ts`
- `src/util/misc.ts`
- `src/app/shared/FeedControls.svelte`

## Pass 2 Focus

Pass 1 identified likely hotspots in sorting/deduping and reload behavior.  
Pass 2 focuses on architectural causes and policy/runtime mismatches that can make feeds feel slow even when relays are responsive.

---

## Findings

### 1) Cache policy is mostly declarative, not operationalized (High)

`cache.ts` defines rich policy (`mode`, `ttlSeconds`, `maxItems`, `allowStale`), but `feed-data-service.ts` only uses `ttlSeconds` in `toStale` and `maxItems` for slicing. There is no observable branching on `mode` (`swr`, `network-first`, `cache-first`) and no guard that uses `allowStale` to alter behavior.

**Why this matters**
- The system advertises cache strategy control, but runtime behaves nearly the same across modes.
- This can lead to unnecessary network loads and repeated reconciliation work on hot paths, making perceived performance inconsistent.

### 2) Event-level cache updates do O(N log N) work per event (High)

In `createFeedDataStream`, every incoming event executes:
- `entry.events.concat(event)`
- full dedupe via `Map`
- full sort by `created_at`
- slice to `maxItems`

This means bursty relay traffic repeatedly reprocesses large arrays.

**Why this matters**
- Throughput collapses under heavy event bursts.
- UI gets delayed by CPU churn, even if network is fast.

### 3) Feed UI performs a second full dedupe/sort layer on buffer (High)

`Feed.svelte` pushes each event into `buffer` (`buffer.push(event)`), then `loadMore` runs:
- `buffer = uniqBy(e => e.id, sortEventsDesc(buffer))`

This duplicates expensive work already done in the data service.

**Why this matters**
- Same event sets are reprocessed twice (service + UI).
- Increased main-thread load during scroll and initial hydration contributes to sluggishness.

### 4) Reload strategy likely over-resets feed stream (High)

`Feed.svelte` has a reactive block that always calls `reload()` when reactive deps change. In addition, explicit calls also invoke `reload()` (e.g., `toggleReplies`, `updateFeed`).

**Why this matters**
- Frequent abort/recreate cycles increase cold-start windows.
- Repeated cache snapshot replay + stream restart can make feed feel jumpy and slow.

### 5) `FeedDataStream.abort` is a no-op (Medium)

`createFeedDataStream` returns `abort: () => {}`. Consumers mostly rely on external `AbortController`, so behavior still works, but the stream API is misleading and easy to misuse.

**Why this matters**
- Creates lifecycle ambiguity and future leak risk.
- Makes cancellation guarantees weaker at abstraction boundaries.

### 6) Scroller pull model can introduce idle gaps (Medium)

`createScroller` uses periodic checks (`sleep(delay)` + threshold checks) rather than demand-driven signals from stream/backpressure state.

**Why this matters**
- Underfilled viewports can wait for next check cycle before requesting more.
- Users perceive this as sluggishness/stalling near viewport boundaries.

### 7) Local relay append may increase duplicate pressure (Medium)

`myRequest`/`myLoad` append `LOCAL_RELAY_URL` whenever `skipCache` is false.

**Why this matters**
- Depending on relay topology and local persistence, this can increase duplicate event ingress.
- Duplicate ingress amplifies sort/dedupe CPU costs in both service and UI layers.

### 8) Initial feed load size is conservative in windowing mode (Low/Contextual)

`Feed.svelte` initializes with `ctrl.load(useWindowing ? 25 : 1000)`.

**Why this matters**
- Good for bandwidth, but can increase time-to-first-meaningful-list for high-latency relay sets.
- Especially visible if early events are sparse or filtered out.

---

## Cross-Cutting Diagnosis

The sluggishness pattern appears to be **compounded CPU + lifecycle churn** more than a single network bottleneck:

1. Relay events arrive.
2. Data service repeatedly dedupes/sorts whole arrays.
3. UI buffers then dedupes/sorts again.
4. Reactive reloads can restart this pipeline.

Even with acceptable relay latency, this architecture can still feel slow.

---

## Risk Prioritization

1. **High impact / high confidence**
   - Per-event full-array processing in `feed-data-service.ts`
   - UI second-pass sorting/deduping in `Feed.svelte`
   - Over-eager reload/reset behavior

2. **Medium impact / medium confidence**
   - No-op `abort` in stream API
   - Periodic scroller pull strategy
   - Local relay append duplicate pressure

3. **Policy/architecture debt**
   - Cache modes not materially enforced despite policy model

---

## Pass 3 Suggested Validation Targets (No implementation yet)

For the next pass, validate with measurements before changing code:

- Count sort/dedupe invocations per 100 incoming events.
- Measure time from `reload()` start to first 10 rendered items.
- Measure event throughput under a synthetic burst (e.g., 500 events).
- Track number of stream restarts per minute during normal feed interactions.
- Compare CPU time spent in:
  - `dedupeAndSortEvents` (service)
  - `uniqBy + sortEventsDesc` (UI)

If these numbers confirm expectations, optimization should prioritize reducing duplicate array reprocessing and reload churn before tuning relay/network strategy.

---

## Pass 2 Summary

Pass 2 confirms the feed path is likely slowed by **algorithmic and orchestration overhead** (service+UI duplicate processing and stream lifecycle resets), with relay/network behavior acting as a multiplier rather than the primary root cause.
