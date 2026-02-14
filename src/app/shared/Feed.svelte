<script lang="ts">
  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {WEEK, now, ago, uniqBy, hash} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {synced, localStorageProvider} from "@welshman/store"
  import type {Feed as FeedDefinition} from "@welshman/feeds"
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
  import {zap} from "src/app/util"
  import type {Feed} from "src/domain"
  import {
    createFeedDataStream,
    createQueryKey,
    env,
    getCachePolicy,
    sortEventsDesc,
    startCacheMetric,
  } from "src/engine"
  import FeedItem from "src/app/shared/FeedItem.svelte"

  export let feed: Feed
  export let anchor = null
  export let showControls = false
  export let hideSpinner = false
  export let shouldSort = false
  export let maxDepth = 2
  export let showGeoThumb = false

  let abortController = new AbortController()

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
    abortController.abort()
    abortController = new AbortController()
    exhausted = false
    useWindowing = true
    events = []
    buffer = []
    didRecordFirstEvent = false

    let hasKinds = false

    walkFeed(feed.definition, (subFeed: FeedDefinition) => {
      hasKinds = hasKinds || isKindFeed(subFeed)
      useWindowing = useWindowing && !isRelayFeed(subFeed)
    })

    const definition = hasKinds
      ? feed.definition
      : makeIntersectionFeed(makeKindFeed(...noteKinds), feed.definition)

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

    stopCacheMetric = startCacheMetric(queryKey, "query_start", {
      policy: getCachePolicy("feed"),
      useWindowing,
    })

    let didApplySnapshot = false

    ctrl = createFeedDataStream({
      key: queryKey,
      feed: definition,
      useWindowing,
      signal: abortController.signal,
      onResult: result => {
        if (didApplySnapshot || result.source !== "cache" || result.events.length === 0) {
          return
        }

        didApplySnapshot = true
        events = result.events.slice(0, 10)
        buffer = result.events.slice(10)

        if (!didRecordFirstEvent) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: events.length})
        }
      },
      onEvent: event => {
        if (!didRecordFirstEvent) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: 1})
        }

        buffer.push(event)
      },
      onExhausted: () => {
        exhausted = true
        stopCacheMetric?.("query_exhausted", {
          eventCount: events.length + buffer.length,
          exhausted: true,
        })
      },
    })

    ctrl.load(useWindowing ? 25 : 1000)
  }

  const toggleReplies = () => {
    $shouldHideReplies = !$shouldHideReplies
    reload()
  }

  const updateFeed = newFeed => {
    feed = newFeed
    reload()
  }

  const loadMore = async () => {
    buffer = uniqBy(e => e.id, sortEventsDesc(buffer))
    events = [...events, ...buffer.splice(0, 10)]

    if (useWindowing && buffer.length < 25) {
      ctrl?.load(25)
    }
  }

  let element
  let depth = 0
  let exhausted = false
  let useWindowing = true
  let ctrl: ReturnType<typeof createFeedDataStream> | null = null
  let events: TrustedEvent[] = []
  let buffer: TrustedEvent[] = []
  let stopCacheMetric: ReturnType<typeof startCacheMetric> | null = null
  let didRecordFirstEvent = false

  $: {
    depth = $shouldHideReplies ? 0 : maxDepth
    reload()
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
