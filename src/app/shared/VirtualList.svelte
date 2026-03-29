<!--
  VirtualList.svelte — Reusable virtual scroll wrapper using @tanstack/svelte-virtual.
  Renders only visible items + overscan buffer for efficient large-list rendering.
-->

<script lang="ts">
  import {tick} from "svelte"
  import {createVirtualizer} from "@tanstack/svelte-virtual"

  /** Total number of items in the list */
  export let count: number

  /** Estimated height in px for each row (used before measurement) */
  export let estimateSize: number = 56

  /** Overscan: how many extra items to render outside viewport */
  export let overscan: number = 5

  /** If true, scroll anchor is at the bottom (chat-style) */
  export let reverse: boolean = false

  /** CSS class for the scroll container */
  export let containerClass: string = ""

  /** CSS class for the inner spacer (total height placeholder) */
  export let innerClass: string = ""

  let scrollElement: HTMLDivElement

  $: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    count,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
    ...(reverse ? {initialOffset: 999999} : {}),
  })

  $: items = $virtualizer.getVirtualItems()
  $: totalSize = $virtualizer.getTotalSize()

  /** Expose scrollToIndex for external callers (e.g., scroll-to-message) */
  export function scrollToIndex(index: number, options?: {align?: "start" | "center" | "end"}) {
    $virtualizer.scrollToIndex(index, options)
  }

  /** Expose the virtualizer for advanced usage */
  export function getVirtualizer() {
    return $virtualizer
  }

  /** Re-measure element after dynamic content changes */
  export function measureElement(el: HTMLDivElement) {
    $virtualizer.measureElement(el)
  }

  // When reverse and count changes (new messages), stick to bottom
  let previousCount = count
  $: if (reverse && count !== previousCount) {
    previousCount = count
    tick().then(() => {
      if (scrollElement) {
        const isNearBottom =
          scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 150
        if (isNearBottom) {
          $virtualizer.scrollToIndex(count - 1, {align: "end"})
        }
      }
    })
  }
</script>

<div
  bind:this={scrollElement}
  class="overflow-y-auto {containerClass}"
  style="position: relative; will-change: transform;">
  <div style="height: {totalSize}px; width: 100%; position: relative;" class={innerClass}>
    {#each items as row (row.index)}
      <div
        data-index={row.index}
        style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({row.start}px);">
        <slot index={row.index} virtualRow={row} />
      </div>
    {/each}
  </div>
</div>
