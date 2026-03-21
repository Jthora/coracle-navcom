# 08 - Loader UX Behavior Spec

Status: In Progress
Owner: App UX + Frontend Platform
Last Updated: 2026-02-24

## Stage Taxonomy

Global stage taxonomy is defined in `src/app/status/loader-status.ts` and rendered by `src/app/shared/LoaderStatusBanner.svelte`.

Stage families:

- App bootstrap: `app.bootstrap.engine`, `app.bootstrap.store-settle`, `app.bootstrap.user-data`, `app.bootstrap.readonly`
- Route loading: `route.resolve.import.start`
- Groups hydration: `groups.hydrate.request`, `groups.hydrate.apply`
- Feed loading: `feed.ingest.stream`, `feed.context.resolve`, `feed.reduce.apply`, `feed.render.first-window`
- Intel map: `intel.map.module`, `intel.map.init`, `intel.map.feed.fetch`, `intel.map.feed.settle`
- Post submission: `post.submit.wait-upload`, `post.submit.validate`, `post.submit.shape-default`, `post.submit.shape-geoint`, `post.submit.pow`, `post.submit.sign`, `post.submit.relay-select`, `post.submit.publish`, `post.submit.delayed-window`
- Relay fetch utilities: `relay.fetch.batch.next`, `relay.fetch.lookup.start`

Arbitration contract:

- Banner displays the highest-priority active stage.
- Tie-break for equal priority selects earliest started stage.
- Stage detail text is optional and only shown when an emitter provides `context.detail`.

## Message Rules

Message behavior contract:

- Base message: shown while elapsed time is below stage `slowAfterMs` threshold.
- Slow message: shown once elapsed time reaches/exceeds `slowAfterMs`.
- Error copy: emitted by operation owner (screen/component) when failure occurs; do not fabricate synthetic errors in banner state.

### Base + Slow + Error Copy Matrix

| Stage | Base Message | Slow Message | Error Path (owner-rendered) |
|---|---|---|---|
| app.bootstrap.engine | Connecting app core services... | Still initializing app core services... | App-level initialization error (`engine init failed` console/error handling) |
| app.bootstrap.store-settle | Stabilizing local app state... | Finalizing local startup state... | Falls through to bootstrap failure handling |
| app.bootstrap.user-data | Loading your account data... | Still waiting for account data from relays... | Falls through to bootstrap failure handling |
| app.bootstrap.readonly | Preparing read-only mode... | Still preparing read-only mode... | Falls through to bootstrap failure handling |
| route.resolve.import.start | Fetching page code for {routeLabel}... | Still downloading page code... | `LazyRouteHost.svelte` renders explicit retry/error panel |
| groups.hydrate.request | Requesting group updates from relays... | Still waiting for slower relays to respond... | Hydration teardown/exit path; no dedicated user error panel |
| groups.hydrate.apply | Applying group updates... | Still processing group updates... | Hydration teardown/exit path; no dedicated user error panel |
| feed.ingest.stream | Receiving feed events from relays... | Still waiting for feed events from relays... | Feed load operation exits on exhaustion/teardown; no dedicated error banner copy currently |
| feed.context.resolve | Resolving post context... | Still resolving post context... | Feed phase transitions back to render stage or exit |
| feed.reduce.apply | Processing feed items... | Still processing feed items... | Feed phase transitions back to render stage or exit |
| feed.render.first-window | Rendering feed items... | Still rendering feed items... | Feed exits status when first 10 rendered or exhausted |
| intel.map.module | Loading map engine... | Still downloading map engine... | `IntelNavMap.svelte` sets `loadError` and exits loader status |
| intel.map.init | Initializing map view... | Still initializing map view... | `IntelNavMap.svelte` sets `loadError` and exits loader status |
| intel.map.feed.fetch | Fetching latest map events... | Still waiting for map feed responses... | Map feed can settle/exit or surface `loadError` |
| intel.map.feed.settle | Finalizing feed snapshot... | Still finalizing map feed snapshot... | Settles to exited state after initial map feed settle |
| post.submit.wait-upload | Waiting for media upload to finish... | Still uploading media... | Submit flow exits on failure/abort and owner UI handles failure |
| post.submit.validate | Validating post content... | Still validating post content... | Submit flow exits on validation failure |
| post.submit.shape-default | Preparing post payload... | Still preparing post payload... | Submit flow exits on shaping failure |
| post.submit.shape-geoint | Preparing GEOINT payload... | Still preparing GEOINT payload... | Submit flow exits on shaping failure |
| post.submit.pow | Generating proof-of-work for this post... | Still generating proof-of-work... | Submit flow exits on POW failure/cancel |
| post.submit.sign | Requesting signature from your signer... | Still waiting for signer confirmation... | Submit flow exits on signer failure/cancel |
| post.submit.relay-select | Selecting destination relays... | Still selecting destination relays... | Submit flow exits on selection failure |
| post.submit.publish | Sending post to relays... | Still waiting for relay confirmations... | Submit flow exits on publish failure |
| post.submit.delayed-window | Post queued. You can cancel before send. | Still waiting for send delay window... | Owner action allows cancellation during delay window |
| relay.fetch.batch.next | Requesting next event batch... | Still fetching event batches... | Utility load exits on stop/error; typically non-blocking |
| relay.fetch.lookup.start | Looking up this item on relays... | Still searching relays for this item... | Lookup exits when event found or request completes |

### Transition Guards and Precedence Rules

- Guard G-01: every operation must call `exitLoaderStatus(operationId)` on completion and teardown paths.
- Guard G-02: route and feed operations must rotate operation IDs per reload/navigation to avoid stale status leakage.
- Guard G-03: feed phase transitions are one-way per reducer phase callback: ingest -> context resolve/reduce apply -> render first-window -> exit.
- Guard G-04: operation update details (`updateLoaderStatus`) should only add factual progress details, never override stage semantics.


## Slow-State Escalation

Escalation thresholds (derived from stage templates):

- Tier A (2000-2500ms): route/module/init and validation-oriented stages.
- Tier B (3000ms): app bootstrap engine/store, feed render, post submit publish/pow/delayed-window.
- Tier C (3500ms): feed ingest/context/reduce pipeline stages.
- Tier D (4000ms): group request/apply, intel feed fetch, relay utility fetches.

Escalation behavior:

1. Switch base -> slow copy at `slowAfterMs`.
2. Preserve same stage ID unless emitter advances phase or exits operation.
3. If owner UI has explicit recovery action (route retry, post cancel, etc.), keep that control visible/available.


## Actionable Recovery UX

Supported action affordances (current behavior):

- Route loading (`route.resolve.import.start`): explicit Retry action in `LazyRouteHost.svelte`.
- Post delayed window (`post.submit.delayed-window`): user can cancel before send (owner flow behavior).
- Intel map initialization/feed: owner view reports explicit load error; user can retry by re-opening/reloading screen.

Fallback behavior for stages without explicit CTA:

- Continue truthful progress messaging with slow-state copy.
- Exit stale operations on teardown/navigation to avoid persistent false loading states.
- Avoid claiming unavailable actions (no synthetic “retry” button copy unless implemented in owner view).


## Accessibility and Consistency Requirements

- Banner text must remain concise, action-oriented, and stage-truthful.
- Detail line should provide factual incremental context only (e.g., batch count), not speculative diagnostics.
- Blocking stages should avoid abrupt copy churn; keep phase copy stable until real transition occurs.
- Non-blocking relay utility stages must not mask higher-priority blocking stages.

## Stage-to-Emitter Mapping

| Stage Family | Primary Emitter(s) | Operation ID Pattern | Notes |
|---|---|---|---|
| App bootstrap | `src/app/App.svelte` | `app-bootstrap` | Enters bootstrap phases and exits on initialization completion/failure path.
| Route loading | `src/app/LazyRouteHost.svelte` | `route-load-{token}` | Per-navigation token prevents stale operation collisions.
| Feed loading phases | `src/app/shared/Feed.svelte` | `feed-load-{token}` | Reducer phase callback drives context/reduce/render stages.
| Groups hydration | `src/app/groups/state.ts` | `groups-hydration` | Request/apply stages entered around relay hydration request lifecycle.
| Intel map | `src/app/views/IntelNavMap.svelte` | `intel-map` | Module/init/feed-fetch/feed-settle transitions bound to map startup + feed settle.
| Post submit | `src/app/views/NoteCreate.svelte` | `post-submit` | Stage-by-stage submit pipeline instrumentation across validate/shape/sign/publish flow.
| Relay utility fetch | `src/engine/requests.ts` | `relay-batch:{n}`, `relay-lookup:{id}` | Non-blocking relay fetch progress with detail updates for batch count.

## Missing Status Emissions Inventory

Scope: identify missing or weak enter/update/exit emissions that materially affect truthful UX messaging or recovery clarity.

| Gap ID | Type | Surface / Flow | Current Issue | User Impact | Priority |
|---|---|---|---|---|---|
| EM-01 | Missing `enter` granularity | Intel map feed lifecycle | `intel.map.feed.fetch` is entered, but refresh-loop transitions are coarse and do not distinguish refresh attempt vs settle-wait | Users see prolonged generic fetch wording during periodic refresh windows | P1 |
| EM-02 | Missing `update` progress details | Feed phase transitions | Feed phases change via reducer callbacks, but no per-phase detail payload (batch size / context-resolve depth) is surfaced | Limited operator insight during slow feed phases | P1 |
| EM-03 | Missing explicit failure-stage exit context | Groups hydration | Request/apply stages exit cleanly, but no detail is emitted when relay hydration yields no meaningful updates | Ambiguous “done” state when hydration produced minimal/no group delta | P2 |
| EM-04 | Missing retry-attempt signal | Route/module failures | Retry exists in route host UI, but retry attempt count/reason is not emitted into loader detail | Harder to differentiate first failure from repeated failure loops | P2 |
| EM-05 | Missing fallback-reason detail consistency | Relay utility fetches | `relay.fetch.batch.next` includes batch counts, but failure/stop reasons are not consistently mapped into detail | Reduced diagnosability for non-blocking fetch degradation | P3 |

### Prioritization by User Impact

- P1: impacts primary feed/map loading clarity and perceived trust during slow states.
- P2: impacts recovery confidence and reduces ambiguity after failures or low-yield hydration.
- P3: primarily operational diagnosability; lower direct end-user urgency.

### Implementation Ticket Seeds

- `TKT-STAGE4-EM-01`: add map refresh-phase detail emission (`attempt`, `refreshSize`, `pending settle`) for `intel.map.feed.fetch` transitions.
- `TKT-STAGE4-EM-02`: add feed reducer-phase detail updates via `updateLoaderStatus` (context-resolve depth, reduce batch metadata).
- `TKT-STAGE4-EM-03`: add groups hydration completion detail to distinguish no-op vs applied projection updates.
- `TKT-STAGE4-EM-04`: add route retry metadata (attempt count + last failure reason) to route load operation detail.
- `TKT-STAGE4-EM-05`: standardize relay utility exit/failure reason detail payload (`timeout`, `abort`, `not-found`, `network-error`).

Verification checklist for emission tickets:

1. Each new detail field is factual and sourced from real runtime state.
2. No emission leaves operation status active on teardown/error paths.
3. New details do not increase message churn frequency beyond meaningful state transitions.
