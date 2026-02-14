# Cache Architecture Spec

Status: Draft for implementation
Owner: Copilot + Core Team
Last Updated: 2026-02-13

## 1) Goals

- Provide near-instant first render for preloaded feed/map data.
- Keep data freshness high using background revalidation.
- Eliminate inconsistent cache behavior across Feed pages and Intel Nav Map.
- Preserve correctness for mute/delete/reply ordering and user/session boundaries.
- Establish measurable UX and reliability targets.

## 2) Non-Goals

- Replacing existing repository/store primitives.
- Rewriting relay routing or transport policies.
- Solving all startup payload concerns in this effort.

## 3) Current-State Summary

- Feed and nav-map loading use separate controller/lifecycle paths.
- Cache usage differs by callsite (`skipCache: true` is common in important loaders).
- Existing persisted events retention is selective and not tuned for feed/map warm starts.
- Groups UI has projection state helpers but no clear bootstrap hydration path.

## 4) Target Architecture

## 4.1 Core Model

Introduce a **query-keyed cache orchestration layer** called `FeedDataService` with:

- **Read path**: local snapshot first (repository/persisted event set).
- **Revalidate path**: network refresh in background, merged into same stream.
- **Delivery model**: shared stream for all consumers (Feed pages, Intel map projections).
- **Policy engine**: per-surface freshness, retention, invalidation, and ordering controls.

## 4.2 Interaction Diagram (logical)

1. View requests data with a canonical `QueryKey`.
2. `FeedDataService` emits immediate snapshot from local state.
3. `FeedDataService` starts async revalidate using feed/network adapter.
4. Incoming events merge through dedupe + ordering + mute/delete guards.
5. Updated stream notifies view; persisted retention updated per policy.

## 4.3 New Interfaces

```ts
type QuerySurface = "feed" | "map" | "notifications" | "thread" | "groups"

type QueryKey = {
  surface: QuerySurface
  accountPubkey?: string
  feedHash: string
  optionsHash?: string
}

type CachePolicy = {
  mode: "swr" | "network-first" | "cache-first"
  ttlSeconds: number
  maxItems: number
  retainKinds?: number[]
  allowStale: boolean
}

type QueryResult<TEvent> = {
  source: "cache" | "network" | "mixed"
  stale: boolean
  lastSyncAt?: number
  events: TEvent[]
}
```

## 4.4 Canonical Query Key Rules

`feedHash` is deterministic hash of normalized feed definition + relay scope + required kind constraints.

Rules:

- Normalize feed definition before hashing.
- Sort object keys, arrays where semantic order is irrelevant.
- Include user context where result differs by user.
- Include surface options that alter result shape (e.g., `hideReplies`, map geo extraction mode).

## 5) Surface Policies

## 5.1 Feed Views (home/topics/person/relay)

- Mode: `swr`
- Initial behavior: local snapshot immediately, then revalidate.
- TTL: short (e.g., 45–120s by route class).
- Ordering: preserve stable sort while appending/merging new events.

## 5.2 Intel Nav Map

- Mode: `swr`
- Initial behavior: emit cached GEOINT-capable events immediately and render markers.
- TTL: short (e.g., 30–90s) + periodic background refresh.
- Projection: geo extraction performed after shared event stream (not in fetch layer).

## 5.3 Notifications

- Mode: `network-first` with stale fallback for fast paint.
- TTL: very short.
- Must preserve unread/read correctness and avoid duplicate increments.

## 5.4 Thread/Parent resolution

- Mode: `swr` with local parent probe first.
- Fallback: targeted network fetch for missing ancestors.

## 5.5 Groups

- Temporary mode: explicit "deferred integration" until projection hydration source-of-truth is finalized.
- Requirement before integration: single bootstrap path that hydrates group projections from persisted/network event stream.

## 6) Invalidation and Consistency

## 6.1 Invalidation Triggers

- User/session change (login/logout/account switch).
- Relay selection changes affecting route scenario.
- Mute list / delete list updates.
- Feed-definition edit or list mutation.
- Explicit user refresh action.

## 6.2 Merge Rules

- Dedupe by event id.
- Apply deletion/mute filters before view emission.
- Preserve deterministic ordering:
  - Primary: `created_at DESC` (or route-specific policy)
  - Secondary: `id` tie-breaker
- Keep local “seen/read” metadata separate from event payload cache.

## 6.3 Staleness Rules

- Expose `stale` and `lastSyncAt` to all consuming views.
- Never block initial render waiting for network unless policy requires it.

## 7) Retention Strategy

Current selective ranking should be expanded for warm-start UX.

## 7.1 Retention Classes

- Class A (high): feed notes, intel-tagged notes with geo payload, notifications kinds.
- Class B (medium): thread ancestors/replies recently viewed.
- Class C (low): infrequent metadata and discovery noise.

## 7.2 Budget and Eviction

- Keep hard per-class caps + global cap.
- Evict by `(class priority, recency, freshness utility)`.
- Persist minimal query index metadata for warm key lookup.

## 8) Migration Plan

## Phase 1 — Contracts + Instrumentation

Deliverables:

- `QueryKey` + `CachePolicy` types.
- Canonical hash/normalization utility.
- Metrics hooks (hit/miss, stale age, first-data latency).

Acceptance:

- No behavior change yet.
- Metrics visible in debug logs/telemetry.

## Phase 2 — Shared Read Service for Feed + Map

Deliverables:

- `FeedDataService` read path with local snapshot + revalidate.
- Adapt Feed and Intel map to consume shared query stream.

Acceptance:

- Feed and map show cached data before network completion when available.
- No duplicate events beyond existing dedupe tolerances.

## Phase 3 — Retention and Policy Tuning

Deliverables:

- Expanded event retention classing.
- Surface-specific TTL and mode policies.

Acceptance:

- Improved warm-start hit rate and faster first-contentful-data metrics.

## Phase 4 — Bypass Cleanup

Deliverables:

- Audit and reduce unnecessary `skipCache: true` usage.
- Document exceptions requiring strict freshness.

Acceptance:

- Consistent policy adherence across views.

Current strict-freshness exceptions after Stage 3 audit:

- Targeted event/address miss fetches (`deriveEvent`) remain network-first.
- Search typeahead profile queries remain network-first.
- Live notifications and direct-message listeners remain network-first.
- Secure group transport subscribe/reconcile flows remain network-first.

## Phase 5 — Groups Integration

Deliverables:

- Finalize group projection hydration source of truth.
- Wire groups to shared cache substrate or dedicated projection cache lane.

Acceptance:

- Group list/chat/details hydrate predictably without manual hydration flags.

Stage 4 decision implemented:

- Groups use a dedicated projection hydration lane (`src/app/groups/state.ts`) that is repository-first and revalidates in the background via relay request.

## 9) Acceptance Metrics

- p50 first-contentful-data for feed/map from warm cache: significant reduction vs baseline.
- Cache hit ratio by surface reaches target (set during Phase 1 baseline).
- Stale display age remains under policy thresholds.
- No regressions in mute/delete/thread ordering correctness.
- No increase in duplicate-render artifacts.

## 10) Risk Register

- **Stale ordering glitches**: mitigated by deterministic merge and tie-break rules.
- **Incorrect unread counts**: keep read-state independent from event cache.
- **Over-retention storage growth**: enforce class caps + global cap + eviction.
- **Policy drift by callsite**: centralize through `FeedDataService` and lint checks/tests.
- **Groups data ambiguity**: block Phase 5 until hydration source is explicit.

## 11) Required Test Plan

- Unit:
  - query-key normalization/hash stability
  - merge/dedupe/order behavior
  - invalidation triggers
  - retention eviction logic
- Integration:
  - feed warm start + revalidate
  - nav map warm marker bootstrap + revalidate
  - thread parent fallback from local then network
- Regression:
  - mute/delete correctness
  - unread notification/group counters
  - route transitions between cached and uncached surfaces

## 12) Open Decisions

- Exact TTL values by route class.
- Final retention caps per class/device profile.
- Whether notifications remain network-first or move to SWR.
- Final groups integration path (shared query stream vs dedicated projection cache).

## 13) Implementation Readiness Checklist

- [ ] Query key contract approved
- [ ] Surface policy matrix approved
- [ ] Retention budgets approved
- [ ] Groups hydration source-of-truth documented
- [ ] Metrics baseline captured
- [ ] Phase 2 implementation scope frozen

## 14) Stage 5 (Post-Phase) — Stabilization and Acceptance

Purpose:

- Provide an explicit acceptance gate after implementation phases complete.
- Convert current cache architecture work into measurable operational confidence.

Deliverables:

- Integration validation for feed, map, and groups warm-start + background revalidate.
- Regression validation for mute/delete/order correctness and unread counters.
- Baseline cache metrics snapshot (hit ratio, first-data latency, stale age).
- Runtime smoke checklist covering core cached routes.
- Acceptance report with pass/fail outcomes and follow-up backlog items.

Acceptance:

- Core routes demonstrate cache-first paint with successful revalidation.
- No regressions in ordering, unread counting, or duplicate artifact tolerances.
- Metrics are captured and documented for future tuning comparisons.
