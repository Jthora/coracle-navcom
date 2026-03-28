<script lang="ts">
  import {onDestroy} from "svelte"
  import {fade} from "src/util/transition"
  import {connectionState} from "src/engine/connection-state"

  $: mode = $connectionState.mode
  $: queuedCount = $connectionState.queuedCount
  $: sinceTs = $connectionState.since

  function formatElapsed(sinceSeconds: number): string {
    const seconds = Math.max(0, Math.floor(Date.now() / 1000) - sinceSeconds)
    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Tick every 30s to update elapsed time
  let tick = 0
  const interval = setInterval(() => tick++, 30_000)
  onDestroy(() => clearInterval(interval))

  // Reactive: re-evaluate when tick changes
  $: elapsed = tick !== undefined ? formatElapsed(sinceTs) : ""
</script>

{#if mode === "sovereign"}
  <div
    transition:fade={{duration: 200}}
    class="border-red-500 bg-red-900/90 fixed left-0 right-0 top-0 z-popover flex
           items-center justify-between border-b px-4 py-1.5 font-mono text-xs text-nc-text
           backdrop-blur-sm"
    role="status"
    aria-live="polite">
    <div class="flex items-center gap-2">
      <span class="animate-pulse text-sm">◆</span>
      <span class="font-bold tracking-wider">SOVEREIGN</span>
      <span class="opacity-70">— operating independently for {elapsed}</span>
    </div>
    <div class="flex items-center gap-3">
      {#if queuedCount > 0}
        <span class="rounded bg-white/10 px-2 py-0.5">
          {queuedCount} queued
        </span>
      {:else}
        <span class="opacity-50">Nothing to send</span>
      {/if}
      <span class="opacity-50">awaiting relay connection</span>
    </div>
  </div>
{/if}
