import {derived, writable} from "svelte/store"

type LoaderStageId =
  | "app.bootstrap.engine"
  | "app.bootstrap.store-settle"
  | "app.bootstrap.user-data"
  | "app.bootstrap.readonly"
  | "groups.hydrate.request"
  | "groups.hydrate.apply"
  | "feed.ingest.stream"
  | "feed.context.resolve"
  | "feed.reduce.apply"
  | "feed.render.first-window"
  | "intel.map.module"
  | "intel.map.init"
  | "intel.map.feed.fetch"
  | "intel.map.feed.settle"
  | "post.submit.wait-upload"
  | "post.submit.validate"
  | "post.submit.shape-default"
  | "post.submit.shape-geoint"
  | "post.submit.pow"
  | "post.submit.sign"
  | "post.submit.relay-select"
  | "post.submit.publish"
  | "post.submit.delayed-window"
  | "relay.fetch.batch.next"
  | "relay.fetch.lookup.start"
  | "route.resolve.import.start"

type LoaderStageContext = {
  routeLabel?: string
  relayCount?: number
  detail?: string
}

type ActiveStage = {
  stageId: LoaderStageId
  operationId: string
  startedAt: number
  priority: number
  blocking: boolean
  slowAfterMs: number
  context: LoaderStageContext
}

type StageTemplate = {
  priority: number
  blocking: boolean
  slowAfterMs: number
  message: (context: LoaderStageContext) => string
  slowMessage: (context: LoaderStageContext) => string
}

const stageTemplates: Record<LoaderStageId, StageTemplate> = {
  "app.bootstrap.engine": {
    priority: 100,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Connecting app core services...",
    slowMessage: () => "Still initializing app core services...",
  },
  "app.bootstrap.store-settle": {
    priority: 95,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Stabilizing local app state...",
    slowMessage: () => "Finalizing local startup state...",
  },
  "app.bootstrap.user-data": {
    priority: 90,
    blocking: true,
    slowAfterMs: 4000,
    message: () => "Loading your account data...",
    slowMessage: () => "Still waiting for account data from relays...",
  },
  "app.bootstrap.readonly": {
    priority: 80,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Preparing read-only mode...",
    slowMessage: () => "Still preparing read-only mode...",
  },
  "groups.hydrate.request": {
    priority: 70,
    blocking: true,
    slowAfterMs: 4000,
    message: context =>
      context.relayCount
        ? `Requesting group updates from ${context.relayCount} relays...`
        : "Requesting group updates from relays...",
    slowMessage: () => "Still waiting for slower relays to respond...",
  },
  "groups.hydrate.apply": {
    priority: 70,
    blocking: true,
    slowAfterMs: 4000,
    message: () => "Applying group updates...",
    slowMessage: () => "Still processing group updates...",
  },
  "feed.ingest.stream": {
    priority: 72,
    blocking: true,
    slowAfterMs: 3500,
    message: () => "Receiving feed events from relays...",
    slowMessage: () => "Still waiting for feed events from relays...",
  },
  "feed.context.resolve": {
    priority: 74,
    blocking: true,
    slowAfterMs: 3500,
    message: () => "Resolving post context...",
    slowMessage: () => "Still resolving post context...",
  },
  "feed.reduce.apply": {
    priority: 73,
    blocking: true,
    slowAfterMs: 3500,
    message: () => "Processing feed items...",
    slowMessage: () => "Still processing feed items...",
  },
  "feed.render.first-window": {
    priority: 71,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Rendering feed items...",
    slowMessage: () => "Still rendering feed items...",
  },
  "intel.map.module": {
    priority: 85,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Loading map engine...",
    slowMessage: () => "Still downloading map engine...",
  },
  "intel.map.init": {
    priority: 80,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Initializing map view...",
    slowMessage: () => "Still initializing map view...",
  },
  "intel.map.feed.fetch": {
    priority: 75,
    blocking: true,
    slowAfterMs: 4000,
    message: () => "Fetching latest map events...",
    slowMessage: () => "Still waiting for map feed responses...",
  },
  "intel.map.feed.settle": {
    priority: 70,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Finalizing feed snapshot...",
    slowMessage: () => "Still finalizing map feed snapshot...",
  },
  "post.submit.wait-upload": {
    priority: 65,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Waiting for media upload to finish...",
    slowMessage: () => "Still uploading media...",
  },
  "post.submit.validate": {
    priority: 65,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Validating post content...",
    slowMessage: () => "Still validating post content...",
  },
  "post.submit.shape-default": {
    priority: 65,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Preparing post payload...",
    slowMessage: () => "Still preparing post payload...",
  },
  "post.submit.shape-geoint": {
    priority: 65,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Preparing GEOINT payload...",
    slowMessage: () => "Still preparing GEOINT payload...",
  },
  "post.submit.pow": {
    priority: 60,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Generating proof-of-work for this post...",
    slowMessage: () => "Still generating proof-of-work...",
  },
  "post.submit.sign": {
    priority: 60,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Requesting signature from your signer...",
    slowMessage: () => "Still waiting for signer confirmation...",
  },
  "post.submit.relay-select": {
    priority: 58,
    blocking: true,
    slowAfterMs: 2500,
    message: () => "Selecting destination relays...",
    slowMessage: () => "Still selecting destination relays...",
  },
  "post.submit.publish": {
    priority: 58,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Sending post to relays...",
    slowMessage: () => "Still waiting for relay confirmations...",
  },
  "post.submit.delayed-window": {
    priority: 55,
    blocking: true,
    slowAfterMs: 3000,
    message: () => "Post queued. You can cancel before send.",
    slowMessage: () => "Still waiting for send delay window...",
  },
  "relay.fetch.batch.next": {
    priority: 50,
    blocking: false,
    slowAfterMs: 4000,
    message: () => "Requesting next event batch...",
    slowMessage: () => "Still fetching event batches...",
  },
  "relay.fetch.lookup.start": {
    priority: 50,
    blocking: false,
    slowAfterMs: 4000,
    message: () => "Looking up this item on relays...",
    slowMessage: () => "Still searching relays for this item...",
  },
  "route.resolve.import.start": {
    priority: 90,
    blocking: true,
    slowAfterMs: 2000,
    message: context =>
      context.routeLabel
        ? `Fetching page code for ${context.routeLabel}...`
        : "Fetching page code for this screen...",
    slowMessage: () => "Still downloading page code...",
  },
}

const activeByOperation = writable<Record<string, ActiveStage>>({})
const clock = writable(Date.now())

setInterval(() => {
  clock.set(Date.now())
}, 1000)

const pickVisibleStage = (stages: ActiveStage[]) => {
  if (stages.length === 0) {
    return null
  }

  return stages.slice().sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority
    }

    return left.startedAt - right.startedAt
  })[0]
}

export const activeLoaderStatus = derived(
  [activeByOperation, clock],
  ([$activeByOperation, $now]) => {
    const activeStages = Object.values($activeByOperation)
    const selected = pickVisibleStage(activeStages)

    if (!selected) {
      return null
    }

    const template = stageTemplates[selected.stageId]
    const elapsedMs = $now - selected.startedAt
    const message =
      elapsedMs >= selected.slowAfterMs
        ? template.slowMessage(selected.context)
        : template.message(selected.context)

    return {
      operationId: selected.operationId,
      stageId: selected.stageId,
      message,
      detail: selected.context.detail || null,
      blocking: selected.blocking,
      elapsedMs,
    }
  },
)

export const enterLoaderStatus = (
  stageId: LoaderStageId,
  operationId: string,
  context: LoaderStageContext = {},
) => {
  const template = stageTemplates[stageId]

  activeByOperation.update(state => ({
    ...state,
    [operationId]: {
      stageId,
      operationId,
      startedAt: Date.now(),
      priority: template.priority,
      blocking: template.blocking,
      slowAfterMs: template.slowAfterMs,
      context,
    },
  }))
}

export const updateLoaderStatus = (operationId: string, context: LoaderStageContext) => {
  activeByOperation.update(state => {
    const stage = state[operationId]

    if (!stage) {
      return state
    }

    return {
      ...state,
      [operationId]: {
        ...stage,
        context: {
          ...stage.context,
          ...context,
        },
      },
    }
  })
}

export const exitLoaderStatus = (operationId: string) => {
  activeByOperation.update(state => {
    if (!state[operationId]) {
      return state
    }

    const next = {...state}
    delete next[operationId]

    return next
  })
}
