<script lang="ts">
  export let intelTag = "starcom_intel"
  export let markerCount = 0
  export let loading = false
  export let onRefresh: () => void = () => null
  export let onFitMarkers: () => void = () => null
</script>

<div
  class="bg-black/72 pointer-events-auto absolute left-20 right-2 top-2 z-[420] flex h-10 items-center justify-between gap-2 rounded-md border border-black/80 px-2 text-[11px] text-neutral-100 shadow-lg backdrop-blur-sm md:right-4 md:px-3 md:text-xs">
  <div class="flex items-center gap-2 overflow-hidden">
    <span
      class="border-lime-400/35 bg-lime-500/12 text-lime-200 rounded border px-1.5 py-0.5 font-semibold tracking-wide">
      #{intelTag}
    </span>
    <span class="truncate text-neutral-300">{markerCount} mapped</span>
  </div>

  <div class="flex items-center gap-1.5">
    <button
      type="button"
      class="rounded border border-neutral-600 px-2 py-1 text-neutral-200 hover:border-neutral-400 hover:text-white"
      on:click={onFitMarkers}
      disabled={markerCount === 0}
      aria-label="Fit markers in view">
      Fit
    </button>
    <button
      type="button"
      class="rounded border border-neutral-600 px-2 py-1 text-neutral-200 hover:border-neutral-400 hover:text-white disabled:opacity-55"
      on:click={onRefresh}
      disabled={loading}
      aria-label="Refresh map data">
      {#if loading}
        Syncing
      {:else}
        Refresh
      {/if}
    </button>
  </div>
</div>
