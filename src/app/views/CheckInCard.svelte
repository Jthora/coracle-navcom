<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {asShortKey} from "src/util/nostr"

  export let message: TrustedEvent

  $: locationTag = message.tags.find(t => t[0] === "location")
  $: location = locationTag ? locationTag[1] : null
  $: note = message.content || null

  function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
  }
</script>

<div class="border-green-800/50 bg-green-900/20 rounded border px-3 py-2 text-sm">
  <div class="text-green-400 flex items-center gap-2 text-xs font-semibold">
    <span>📍 CHECK-IN</span>
  </div>
  <div class="mt-1 flex items-center gap-2 text-xs text-nc-text-muted">
    <span class="font-mono">{asShortKey(message.pubkey)}</span>
    <span>•</span>
    <span>{formatTimestamp(message.created_at)}</span>
  </div>
  {#if note}
    <div class="mt-1 whitespace-pre-wrap break-words text-nc-text">{note}</div>
  {/if}
  {#if location}
    <div class="text-green-300/70 mt-1 text-xs">📍 {location}</div>
  {/if}
</div>
