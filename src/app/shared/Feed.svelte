<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {WEEK, now, ago, hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {synced, localStorageProvider} from "@welshman/store"
  import type {Feed as FeedDefinition} from "@welshman/feeds"
  import type {QueryKey} from "src/engine/cache"
  import {
    isRelayFeed,
    makeKindFeed,
    makeIntersectionFeed,
    isKindFeed,
    walkFeed,
  } from "@welshman/feeds"
  import {createScroller} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import {fly, fade} from "src/util/transition"
  import Button from "src/partials/Button.svelte"
  import Card from "src/partials/Card.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NoteReducer from "src/app/shared/NoteReducer.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import {getAdaptiveFeedLoadPlan} from "src/app/shared/feed/load-sizing"
  import {zap} from "src/app/util"
  import type {Feed} from "src/domain"
  import {
    createFeedDataStream,
    createQueryKey,
    env,
    getCachePolicy,
    queryKeyToString,
    startCacheMetric,
  } from "src/engine"
  import {enterLoaderStatus, exitLoaderStatus} from "src/app/status/loader-status"
  import FeedItem from "src/app/shared/FeedItem.svelte"

  export let feed: Feed
  export let anchor = null
  export let showControls = false
  export let hideSpinner = false
  export let shouldSort = false
  export let maxDepth = 2
  export let showGeoThumb = false

  let abortController = new AbortController()
  const FEED_LOAD_OPERATION_PREFIX = "feed-load"
  let feedLoadToken = 0
  let activeFeedLoadOperationId: string | null = null

  const startZap = () => zap({splits: [["zap", env.PLATFORM_PUBKEY, "", "1"]]})

  const promptDismissed = synced({
    key: "feed/promptDismissed",
    defaultValue: 0,
    storage: localStorageProvider,
  })

  const shouldHideReplies = showControls
    ? synced({
        key: "Feed.shouldHideReplies",
        defaultValue: false,
        storage: localStorageProvider,
      })
    : writable(false)

  const reload = () => {
    clearActiveFeedLoadStatus()

    abortController.abort()
    abortController = new AbortController()
    activeFeedLoadOperationId = `${FEED_LOAD_OPERATION_PREFIX}-${++feedLoadToken}`
    enterLoaderStatus("feed.ingest.stream", activeFeedLoadOperationId)
    exhausted = false
    useWindowing = true
    events = []
    buffer = []
    latestEvents = []
    renderCount = 10
    didRecordFirstEvent = false
    didRecordFirstTenRendered = false

    let hasKinds = false

    walkFeed(feed.definition, (subFeed: FeedDefinition) => {
      hasKinds = hasKinds || isKindFeed(subFeed)
      useWindowing = useWindowing && !isRelayFeed(subFeed)
    })

    activeLoadPlan = getAdaptiveFeedLoadPlan(useWindowing)

    const definition = hasKinds
      ? feed.definition
      : makeIntersectionFeed(makeKindFeed(...noteKinds), feed.definition)
    const intelTag = env.INTEL_TAG || "starcom_intel"
    const isIntelQuery = JSON.stringify(definition).includes(intelTag)

    const queryKey = createQueryKey({
      surface: "feed",
      feedDefinition: definition,
      options: {
        shouldSort,
        showControls,
        maxDepth,
        hideReplies: $shouldHideReplies,
      },
    })
    activeQueryKey = queryKey

    stopCacheMetric = startCacheMetric(queryKey, "query_start", {
      policy: getCachePolicy("feed"),
      useWindowing,
      loadPlan: activeLoadPlan,
    })

    ctrl = createFeedDataStream({
      key: queryKey,
      sharedKey: isIntelQuery
        ? queryKeyToString(
            createQueryKey({
              surface: "map",
              feedDefinition: definition,
              options: {intelTag},
            }),
          )
        : undefined,
      feed: definition,
      useWindowing,
      signal: abortController.signal,
      onResult: result => {
        if (result.events.length === 0) {
          return
        }

        latestEvents = result.events
        syncVisibleEvents()

        if (!didRecordFirstTenRendered) {
          enterFeedStage("feed.render.first-window")
        }

        if (!didRecordFirstEvent) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: latestEvents.length})
        }

        maybeRecordFirstTenRendered()
      },
      onEvent: event => {
        if (!didRecordFirstEvent && event) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: 1})
        }
      },
      onExhausted: () => {
        exhausted = true
        stopCacheMetric?.("query_exhausted", {
          eventCount: events.length + buffer.length,
          exhausted: true,
        })

        if (didRecordFirstTenRendered) {
          clearActiveFeedLoadStatus()
        }
      },
    })

    ctrl.load(activeLoadPlan.initialLoadSize)
  }

  const toggleReplies = () => {
    $shouldHideReplies = !$shouldHideReplies
  }

  const updateFeed = newFeed => {
    feed = newFeed
  }

  const loadMore = async () => {
    renderCount += 10
    syncVisibleEvents()
    maybeRecordFirstTenRendered()

    if (useWindowing && buffer.length < activeLoadPlan.prefetchThreshold) {
      ctrl?.load(activeLoadPlan.incrementalLoadSize)
    }
  }

  let element
  let depth = 0
  let exhausted = false
  let useWindowing = true
  let ctrl: ReturnType<typeof createFeedDataStream> | null = null
  let events: TrustedEvent[] = []
  let buffer: TrustedEvent[] = []
  let latestEvents: TrustedEvent[] = []
  let renderCount = 10
  let stopCacheMetric: ReturnType<typeof startCacheMetric> | null = null
  let didRecordFirstEvent = false
  let didRecordFirstTenRendered = false
  let activeQueryKey: QueryKey | null = null
  let activeLoadPlan = getAdaptiveFeedLoadPlan(true)
  let reloadSignature = ""

  const maybeRecordFirstTenRendered = () => {
    if (didRecordFirstTenRendered || events.length < 10) {
      return
    }

    didRecordFirstTenRendered = true
    stopCacheMetric?.("first_10_rendered", {eventCount: 10})
    clearActiveFeedLoadStatus()
  }

  const clearActiveFeedLoadStatus = () => {
    if (!activeFeedLoadOperationId) {
      return
    }

    exitLoaderStatus(activeFeedLoadOperationId)
    activeFeedLoadOperationId = null
  }

  const enterFeedStage = (
    stageId:
      | "feed.ingest.stream"
      | "feed.context.resolve"
      | "feed.reduce.apply"
      | "feed.render.first-window",
  ) => {
    if (!activeFeedLoadOperationId) {
      return
    }

    enterLoaderStatus(stageId, activeFeedLoadOperationId)
  }

  const handleReducerPhaseChange = (phase: "context-resolve" | "reduce-apply" | "idle") => {
    if (didRecordFirstTenRendered) {
      return
    }

    if (phase === "context-resolve") {
      enterFeedStage("feed.context.resolve")
      return
    }

    if (phase === "reduce-apply") {
      enterFeedStage("feed.reduce.apply")
      return
    }

    enterFeedStage("feed.render.first-window")
  }

  const syncVisibleEvents = () => {
    const nextRenderCount = Math.max(10, renderCount)

    events = latestEvents.slice(0, nextRenderCount)
    buffer = latestEvents.slice(nextRenderCount)
  }

  $: {
    depth = $shouldHideReplies ? 0 : maxDepth

    const nextReloadSignature = JSON.stringify({
      feedDefinition: feed?.definition,
      shouldSort,
      showControls,
      maxDepth,
      hideReplies: $shouldHideReplies,
    })

    if (nextReloadSignature !== reloadSignature) {
      reloadSignature = nextReloadSignature
      reload()
    }
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element,
      delay: 300,
      threshold: 3000,
    })

    return () => {
      if (!exhausted) {
        stopCacheMetric?.("query_exhausted", {
          eventCount: events.length + buffer.length,
          exhausted: false,
        })
      }

      scroller.stop()
      abortController.abort()
      clearActiveFeedLoadStatus()
    }
  })
</script>

{#if showControls}
  <FeedControls {feed} {updateFeed}>
    <div slot="controls">
      {#if $shouldHideReplies}
        <Button class="btn btn-low border-none opacity-50" on:click={toggleReplies}>Replies</Button>
      {:else}
        <Button class="btn btn-accent border-none" on:click={toggleReplies}>Replies</Button>
      {/if}
    </div>
  </FeedControls>
{/if}

<FlexColumn bind:element>
  {#key abortController}
    <NoteReducer
      {shouldSort}
      {depth}
      {events}
      shouldAwait
      metricKey={activeQueryKey}
      onPhaseChange={handleReducerPhaseChange}
      hideReplies={$shouldHideReplies}
      let:event
      let:getContext
      let:i>
      <div in:fly={{y: 20}}>
        <FeedItem showMeta topLevel {getContext} {depth} {anchor} note={event} {showGeoThumb} />
      </div>
      {#if i > 20 && hash(event.id) % 100 === 0 && $promptDismissed < ago(WEEK)}
        <Card class="panel-interactive group flex items-center justify-between">
          <p class="text-xl">Enjoying Navcom?</p>
          <div class="flex gap-2">
            <Button
              class="hidden text-neutral-400 opacity-0 transition-all group-hover:opacity-100 sm:visible"
              on:click={() => promptDismissed.set(now())}>
              Dismiss
            </Button>
            <Button class="btn btn-accent" on:click={startZap}>Zap the developer</Button>
          </div>
        </Card>
      {/if}
    </NoteReducer>
  {/key}
</FlexColumn>

{#if !hideSpinner}
  {#if exhausted}
    <div transition:fly|local={{y: 20, delay: 500}} class="flex flex-col items-center py-24">
      <img alt="" class="h-20 w-20" src="/images/CommanderIcon-80-alpha.png" loading="lazy" />
    </div>
  {:else}
    <div out:fade|local>
      <Spinner />
    </div>
  {/if}
{/if}
