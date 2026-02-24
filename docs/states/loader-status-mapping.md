# Loader Status Mapping (Current Code Reality)

Date: 2026-02-23
Owner: App UX + Frontend Platform
Status: Draft baseline mapped to current implementation

## Purpose

This document maps real asynchronous loader/wait operations to explicit user-facing status text.

Constraints:
- Every status must correspond to an actual technical activity already present in code.
- Avoid generic copy like "Loading..." unless paired with a dependency.
- Prefer dependency-specific language (route code, signer, relay response, upload, publish ack).

## Mapping Table

## A) Route Component Loading

Source:
- src/app/LazyRouteHost.svelte

Current technical steps:
1. Route has inline component (no dynamic import).
2. Route starts loadComponent dynamic import.
3. Route import resolves and component mounts.
4. Route import fails.

Status keys and copy:
- route.resolve.inline
  - Opening page from local cache...
- route.resolve.import.start
  - Fetching page code for this screen...
- route.resolve.import.named
  - Fetching page code for {routeLabel}...
- route.resolve.import.slow
  - Still downloading this page module...
- route.resolve.import.error
  - Could not load this screen. Tap Retry.

## B) App Bootstrap

Source:
- src/app/App.svelte (initPending, ready.then, sleep, loadUserData)

Current technical steps:
1. Waiting for engine ready.
2. Waiting for store throttle settle delay.
3. Optional user session data load.
4. Bootstrap finalize.

Status keys and copy:
- app.bootstrap.engine
  - Connecting app core services...
- app.bootstrap.store-settle
  - Stabilizing local app state...
- app.bootstrap.user-data
  - Loading your account data...
- app.bootstrap.readonly
  - Preparing read-only mode...
- app.bootstrap.slow
  - Still initializing app services...
- app.bootstrap.done
  - Initialization complete.

## C) Route Access and Guard Flow

Source:
- src/app/Routes.svelte

Current technical steps:
1. Require user check.
2. Require signer check.
3. Required parameter validation.
4. Route guard evaluation.
5. Redirect on guard/validation failure.

Status keys and copy:
- route.guard.require-user
  - This page needs a signed-in account. Redirecting...
- route.guard.require-signer
  - This action needs your signer key. Redirecting...
- route.guard.missing-param
  - This link is missing required data. Redirecting...
- route.guard.evaluate
  - Checking access rules for this page...
- route.guard.blocked
  - This page is blocked by access policy. Redirecting...

## D) Group Hydration and Projection Build

Source:
- src/app/groups/state.ts

Current technical steps:
1. ensureGroupsHydrated starts first run.
2. Subscribe to derived group events.
3. Start relay request with myRequest.
4. Projection map rebuild from events.
5. groupsHydrated true.

Status keys and copy:
- groups.hydrate.start
  - Starting group sync...
- groups.hydrate.projection
  - Building your group list from local events...
- groups.hydrate.request
  - Requesting group updates from relays...
- groups.hydrate.request-count
  - Requesting group updates from {relayCount} relays...
- groups.hydrate.apply
  - Applying group updates from relays...
- groups.hydrate.slow
  - Still waiting for slower relays to respond...
- groups.hydrate.done
  - Group data is ready.

## E) Generic Relay Request Lifecycle

Source:
- src/engine/requests.ts

Current technical steps:
1. loadAll starts and loading store true.
2. controller loads event chunks.
3. onExhausted closes request loop.
4. deriveEvent miss triggers network fetch.

Status keys and copy:
- relay.fetch.batch.start
  - Fetching event batches...
- relay.fetch.batch.next
  - Requesting next batch of events...
- relay.fetch.batch.done
  - All requested events received.
- relay.fetch.lookup.start
  - Looking up this item on relays...
- relay.fetch.lookup.slow
  - Still searching relays for this item...

## F) Post Create / Publish Pipeline

Source:
- src/app/views/NoteCreate.svelte
- src/app/views/note-create/NoteCreateComposer.svelte

Current technical steps:
1. Uploading media guard.
2. Content validation and shaping.
3. GEOINT payload shaping.
4. Optional PoW generation.
5. Signature request.
6. Relay selection.
7. Publish thunk dispatch.
8. Optional delayed send cancel window.
9. Completion and relay broadcast.

Status keys and copy:
- post.submit.wait-upload
  - Waiting for media upload to finish...
- post.submit.validate
  - Validating post content...
- post.submit.shape-default
  - Preparing post payload...
- post.submit.shape-geoint
  - Preparing GEOINT payload...
- post.submit.pow
  - Generating proof-of-work for this post...
- post.submit.sign
  - Requesting signature from your signer...
- post.submit.relay-select
  - Selecting destination relays...
- post.submit.publish
  - Sending post to relays...
- post.submit.delayed-window
  - Post queued. You can cancel before send.
- post.submit.done
  - Post submitted. Syncing relay preferences...

## G) Intel Map Loader Path

Source:
- src/app/views/IntelNavMap.svelte

Current technical steps:
1. Dynamic import of Leaflet.
2. Map initialization.
3. Feed loading and settle timer.

Status keys and copy:
- intel.map.module
  - Loading map engine...
- intel.map.init
  - Initializing map view...
- intel.map.feed.connect
  - Waiting for live feed connection...
- intel.map.feed.fetch
  - Fetching latest map events...
- intel.map.feed.settle
  - Finalizing feed snapshot...

## Required UX Rules

1. Do not show plain "Loading..." by itself.
2. Include a dependency noun in each message (route, signer, relay, upload, map engine, etc.).
3. For waits beyond threshold, show slow variant tied to the same active state.
4. If counts are available (relay responses, chunks, files), include them.
5. Status should change only on real state changes to avoid fake progress.

## Gaps to Wire

Not all mapped keys are currently emitted by centralized status infrastructure. The spec document defines how to wire them consistently.