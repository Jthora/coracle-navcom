<!--
  MarkerPopup.svelte — Map marker popup card for geo-tagged messages.

  Shows a compact card with message type icon, author, timestamp,
  and a truncated content preview. Includes "View in chat" link.
-->

<script lang="ts">
  import {displayProfileByPubkey} from "@welshman/app"
  import {MARKER_STYLES} from "src/app/views/marker-derivation"
  import type {ChannelMarker} from "src/app/views/marker-derivation"
  import {createEventDispatcher} from "svelte"

  export let marker: ChannelMarker

  const dispatch = createEventDispatcher<{viewInChat: {messageId: string}}>()

  $: style = MARKER_STYLES[marker.type]
  $: displayName = displayProfileByPubkey(marker.author) || marker.author.slice(0, 8) + "..."
  $: time = new Date(marker.timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
  $: typeLabel =
    marker.type === "check-in"
      ? "CHECK-IN"
      : marker.type === "alert"
        ? "ALERT"
        : marker.type === "spotrep"
          ? "SPOTREP"
          : "MESSAGE"
</script>

<div
  class="w-56 rounded-lg border border-nc-shell-border bg-nc-shell-bg p-3 text-nc-text shadow-xl">
  <div class="mb-1.5 flex items-center gap-2">
    <span style="color: {style.color}">{style.icon}</span>
    <span class="text-xs font-bold uppercase tracking-wide" style="color: {style.color}"
      >{typeLabel}</span>
  </div>
  <div class="mb-2 flex items-center gap-1.5 text-[11px] text-nc-text-muted">
    <span class="truncate">{displayName}</span>
    <span>•</span>
    <span>{time}</span>
  </div>
  {#if marker.preview}
    <p class="mb-2 line-clamp-2 text-xs leading-relaxed text-nc-text">
      "{marker.preview}"
    </p>
  {/if}
  <button
    class="text-xs text-accent hover:underline"
    on:click={() => dispatch("viewInChat", {messageId: marker.id})}>
    View in chat →
  </button>
</div>
