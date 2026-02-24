# Loader Status State Machine Spec (Draft)

Date: 2026-02-23
Owner: Frontend Platform
Status: Draft v1

## Goal

Provide deterministic, truthful, and user-readable progress text for asynchronous waits.

The machine standardizes:
- Stage IDs
- Transition rules
- Timeout-based slow variants
- Priority arbitration across concurrent waits
- Payload and rendering contract

## Scope

Applies to:
- App bootstrap
- Route module loading
- Route guard/redirect checks
- Group hydration
- Relay request lifecycle
- Note create publish pipeline
- Intel map initialization/feed wait

## Data Model

## Stage Event (input)

Type:
- type: "enter" | "update" | "exit" | "error"
- stageId: string
- operationId: string
- startedAt: number
- at: number
- blocking: boolean
- priority: number
- context?:
  - routeLabel?: string
  - relayCount?: number
  - relayDone?: number
  - relayTotal?: number
  - chunkIndex?: number
  - chunkTotal?: number
  - fileDone?: number
  - fileTotal?: number
  - detail?: string

## Render State (output)

Type:
- visible: boolean
- operationId: string | null
- stageId: string | null
- message: string | null
- detail: string | null
- sinceMs: number
- blocking: boolean

## Stage Registry

Each stage defines:
- baseMessage(context) -> string
- slowMessage(context) -> string
- slowAfterMs: number
- priority: number
- blockingDefault: boolean

## Suggested priorities

- 100: App bootstrap blockers
- 90: Route module loading/guard redirect blockers
- 80: Auth/signer blockers
- 70: Group hydration blockers
- 60: Publish critical stages (sign, send)
- 50: Non-blocking request progress
- 40: Cosmetic settle/finalization

## Transition Rules

1. enter
- Create/update active stage for operationId.
- Set startedAt if not present.

2. update
- Merge context deltas.
- Keep startedAt unchanged.

3. exit
- Remove stage for operationId + stageId.
- If no active stages remain for operationId, operation closes.

4. error
- Replace current stage with error stage for same operation.
- Keep blocking true if operation is blocking.

## Selection (what user sees)

At render time:
1. Collect all active stages.
2. Pick highest priority stage.
3. If tie, pick earliest startedAt.
4. Compute elapsed = now - startedAt.
5. If elapsed >= slowAfterMs, show slowMessage, else baseMessage.

## Timeout behavior

No fake percentages.
Only switch copy when same real stage persists.

Default thresholds:
- route/module: 2000ms
- app/bootstrap: 3000ms
- relay/group waits: 4000ms
- publish/sign/send: 2500ms

## Message Template Rules

1. Every message must include a real dependency noun.
2. If count fields exist, include progress detail:
   - "Waiting on relays ({relayDone}/{relayTotal})"
3. Avoid internal protocol jargon unless no user-safe synonym exists.
4. Never display plain "Loading" without a dependency.

## Stage IDs and Templates

## App bootstrap

- app.bootstrap.engine
  - base: Connecting app core services...
  - slow: Still initializing app core services...
- app.bootstrap.store-settle
  - base: Stabilizing local app state...
  - slow: Finalizing local startup state...
- app.bootstrap.user-data
  - base: Loading your account data...
  - slow: Still waiting for account data from relays...

## Route loading and guards

- route.resolve.import.start
  - base: Fetching page code for {routeLabel|"this screen"}...
  - slow: Still downloading page code...
- route.guard.evaluate
  - base: Checking page access rules...
  - slow: Still validating access requirements...
- route.guard.require-signer
  - base: Verifying signer access for this page...
  - slow: Waiting for signer availability...

## Group hydration

- groups.hydrate.request
  - base: Requesting group updates from relays...
  - slow: Still waiting for slower relays to respond...
- groups.hydrate.apply
  - base: Applying group updates...
  - slow: Still processing group updates...

## Relay requests

- relay.fetch.batch.next
  - base: Requesting next event batch...
  - slow: Still fetching event batches...
- relay.fetch.lookup.start
  - base: Looking up this item on relays...
  - slow: Still searching relays for this item...

## Post submit

- post.submit.wait-upload
  - base: Waiting for media upload to finish...
  - slow: Still uploading media...
- post.submit.pow
  - base: Generating proof-of-work for this post...
  - slow: Still generating proof-of-work...
- post.submit.sign
  - base: Requesting signature from your signer...
  - slow: Still waiting for signer confirmation...
- post.submit.publish
  - base: Sending post to relays...
  - slow: Still waiting for relay confirmations...

## Intel map

- intel.map.module
  - base: Loading map engine...
  - slow: Still downloading map engine...
- intel.map.feed.fetch
  - base: Fetching latest map events...
  - slow: Still waiting for map feed responses...

## API Contract (proposed)

## Status Store

- createStatusMachine(registry)
- enter(stageId, operationId, context?, overrides?)
- update(stageId, operationId, context)
- exit(stageId, operationId)
- fail(stageId, operationId, errorMessage?)
- clearOperation(operationId)
- subscribe(renderState)

## Rendering Component

- GlobalStatusBanner.svelte
  - subscribes to machine render state
  - shows message + optional detail line
  - respects blocking flag for pointer-events/overlay behavior

## Instrumentation Guidance

When wiring each flow:
1. Emit enter at async boundary start.
2. Emit update on measurable increments (relay counts, chunk counts).
3. Emit exit in finally blocks to avoid stale states.
4. Emit fail in catches before rethrow or toast.

## Acceptance Criteria

1. No generic "Loading..." without dependency text.
2. Message transitions align with actual state transitions.
3. Long waits show slow variants after threshold.
4. Parallel waits choose deterministic highest-priority stage.
5. No stale status remains after completion/error cleanup.

## Rollout Plan

Phase 1:
- Route loading + app bootstrap

Phase 2:
- Group hydration + relay requests

Phase 3:
- Note create publish pipeline + map feed

Phase 4:
- Tune copy and thresholds from QA telemetry/feedback