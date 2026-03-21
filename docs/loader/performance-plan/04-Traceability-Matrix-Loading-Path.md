# 04 - Traceability Matrix: Loading Path

Status: In Progress
Owner: Frontend Platform
Last Updated: 2026-02-24

## Surface -> Async Operations Map

| Surface | Primary Async Flow | Entry Files |
|---|---|---|
| App bootstrap | engine ready -> store settle -> user data | `src/app/App.svelte` |
| Route loading | lazy import + component resolve | `src/app/LazyRouteHost.svelte` |
| Feed | stream load -> cache merge -> buffer -> reducer -> render | `src/app/shared/Feed.svelte`, `src/engine/feed-data-service.ts`, `src/app/shared/NoteReducer.svelte` |
| Relay request lifecycle | `loadAll`, `deriveEvent`, request close | `src/engine/requests.ts` |
| Group hydration | subscribe events + relay request + projection apply | `src/app/groups/state.ts` |
| Note publish | validate -> shape -> pow/sign -> relay publish/delay | `src/app/views/NoteCreate.svelte` |
| Intel map | module import -> map init -> feed stream settle | `src/app/views/IntelNavMap.svelte` |

## Code Ownership Map

| Area | Current Logical Owner | Notes |
|---|---|---|
| Loader state machine | Frontend Platform | global status orchestration |
| Feed orchestration | Frontend Platform + App UX | high-impact bottleneck zone |
| Relay request primitives | Engine maintainers | impacts multiple surfaces |
| UX loader copy | App UX | must map 1:1 to technical states |

## Stage Mapping to User Messages

Implemented stage emissions (current):
- `app.bootstrap.engine`, `app.bootstrap.store-settle`, `app.bootstrap.user-data`, `app.bootstrap.readonly`
- `route.resolve.import.start`
- `groups.hydrate.request`, `groups.hydrate.apply`
- `relay.fetch.batch.next`, `relay.fetch.lookup.start`
- `post.submit.wait-upload`, `post.submit.validate`, `post.submit.shape-default`, `post.submit.shape-geoint`, `post.submit.pow`, `post.submit.sign`, `post.submit.relay-select`, `post.submit.publish`, `post.submit.delayed-window`
- `intel.map.module`, `intel.map.init`, `intel.map.feed.fetch`, `intel.map.feed.settle`

Primary emitter locations:
- `src/app/status/loader-status.ts` (templates + arbitration)
- `src/app/shared/LoaderStatusBanner.svelte` (global rendering)
- `src/app/App.svelte`, `src/app/LazyRouteHost.svelte`, `src/app/groups/state.ts`, `src/engine/requests.ts`, `src/app/views/NoteCreate.svelte`, `src/app/views/IntelNavMap.svelte`

## Unknowns / Missing Coverage

Known gaps to address:
1. Feed reducer phases are not yet explicitly emitted as loader stages (ingest, reduce, context resolve, render-ready).
2. `cacheMetrics` is produced but currently lacks a clear consumer path for operational analysis.
3. Operation ID uniqueness strategy should be tightened for multi-instance safety.
4. Stage arbitration tie-break behavior should be validated against spec expectations.
5. Missing explicit instrumentation for first_10_rendered and reducer duration.

