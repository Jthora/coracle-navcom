<script lang="ts">
  import {insertAt, addToMapKey, parseJson} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {
    getIdOrAddress,
    getIdFilters,
    getParentIdsAndAddrs,
    getParentIdOrAddr,
    verifyEvent,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {repository} from "@welshman/app"
  import {repostKinds, reactionKinds} from "src/util/nostr"
  import {isEventMuted, myLoad, startCacheMetric} from "src/engine"
  import type {QueryKey} from "src/engine/cache"
  import {getValidZap} from "src/app/util"

  type GetContext = (event: TrustedEvent) => TrustedEvent[]
  type ShouldAddEvent = (event: TrustedEvent, getContext: GetContext) => boolean
  type ReducerPhase = "context-resolve" | "reduce-apply" | "idle"
  type ContextLink = {parent: TrustedEvent; child: TrustedEvent}
  type PreparedEvent = {
    original: TrustedEvent
    display: TrustedEvent | null
    links: ContextLink[]
    invalidZap: boolean
  }

  export let events: TrustedEvent[]
  export let depth = 0
  export let showMuted = false
  export let hideReplies = false
  export let showDeleted = false
  export let shouldSort = false
  export let shouldAwait = false
  export let shouldAddEvent: ShouldAddEvent = undefined
  export let items: TrustedEvent[] = []
  export let metricKey: QueryKey = null
  export let onPhaseChange: (phase: ReducerPhase) => void = () => {}

  const timestamps = new Map<string, number>()
  const context = new Map<string, Set<TrustedEvent>>()
  let applyQueue: Promise<void> = Promise.resolve()

  const shouldSkip = (event: TrustedEvent, strict: boolean) => {
    if (!showMuted && $isEventMuted(event, strict)) return true
    if (!showDeleted && repository.isDeleted(event)) return true
    if (hideReplies && getParentIdOrAddr(event)) return true
    if (timestamps.has(getIdOrAddress(event))) return true

    return false
  }

  const getParent = async (event: TrustedEvent) => {
    if (repostKinds.includes(event.kind)) {
      const parent = parseJson(event.content)

      if (parent && verifyEvent(parent)) {
        return parent
      }
    }

    const parentIds = getParentIdsAndAddrs(event)

    if (parentIds.length > 0) {
      const filters = getIdFilters(parentIds)
      const [cached] = repository.query(filters)

      if (cached) return cached

      const relays = Router.get().EventParents(event).policy(addMaximalFallbacks).getUrls()
      const [parent] = await myLoad({filters, relays})

      return parent
    }
  }

  const prepareEvent = async (event: TrustedEvent): Promise<PreparedEvent> => {
    const original = event
    let display = event
    let currentDepth = depth
    const links: ContextLink[] = []
    let invalidZap = false

    while (currentDepth > 0) {
      const parent = await getParent(display)

      if (!parent) {
        break
      }

      if (display.kind === ZAP_RESPONSE && !(await getValidZap(display, parent))) {
        invalidZap = true
        break
      }

      links.push({parent, child: display})
      display = parent
      currentDepth--
    }

    return {
      original,
      display,
      links,
      invalidZap,
    }
  }

  const applyPreparedEvent = ({original, display, links, invalidZap}: PreparedEvent) => {
    if (invalidZap || !display) {
      return
    }

    const originalId = getIdOrAddress(original)

    if (timestamps.has(originalId)) {
      return
    }

    timestamps.set(originalId, original.created_at)

    for (const {parent, child} of links) {
      addToMapKey(context, getIdOrAddress(parent), child)

      if (shouldSkip(parent, true)) {
        return
      }

      timestamps.set(getIdOrAddress(parent), original.created_at)
    }

    if ([...repostKinds, ...reactionKinds].includes(display.kind)) {
      return
    }

    if (shouldAddEvent && !shouldAddEvent(display, getContext)) {
      return
    }

    let inserted = false

    if (shouldSort) {
      for (let i = 0; i < items.length; i++) {
        if (timestamps.get(getIdOrAddress(items[i])) < original.created_at) {
          items = insertAt(i, display, items)
          inserted = true
          break
        }
      }
    }

    if (!inserted) {
      items = [...items, display]
    }
  }

  const addEvent = async (event: TrustedEvent) => {
    onPhaseChange("context-resolve")
    const prepared = await prepareEvent(event)

    onPhaseChange("reduce-apply")
    applyQueue = applyQueue.then(() => {
      applyPreparedEvent(prepared)
    })

    await applyQueue
  }

  const addEvents = async (events: TrustedEvent[]) => {
    const stopReducerMetric = metricKey
      ? startCacheMetric(metricKey, "reducer_start", {
          shouldAwait,
          incomingCount: events.length,
        })
      : null
    let processedCount = 0

    const pending: Promise<void>[] = []

    for (const event of events) {
      if (shouldSkip(event, false)) {
        continue
      }

      processedCount++
      const promise = addEvent(event)

      if (shouldAwait) {
        pending.push(promise)
      }
    }

    if (shouldAwait) {
      await Promise.all(pending)
    }

    onPhaseChange("idle")

    stopReducerMetric?.("reducer_end", {
      eventCount: processedCount,
      details: {
        shouldAwait,
        itemCount: items.length,
      },
    })
  }

  const getContext = (event: TrustedEvent) => Array.from(context.get(getIdOrAddress(event)) || [])

  $: addEvents(events)
</script>

{#each items as event, i (event.id)}
  <slot {i} {event} {getContext} />
{/each}
