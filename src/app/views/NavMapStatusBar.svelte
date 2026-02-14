<style>
  .nav-map-loader-track {
    position: relative;
    overflow: hidden;
  }

  .nav-map-loader-track::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 42%;
    background: linear-gradient(
      90deg,
      rgba(148, 163, 184, 0),
      rgba(148, 163, 184, 0.9),
      rgba(148, 163, 184, 0)
    );
    animation: nav-map-loader 1.4s ease-in-out infinite;
  }

  @keyframes nav-map-loader {
    0% {
      transform: translateX(-120%);
    }
    100% {
      transform: translateX(250%);
    }
  }
</style>

<script lang="ts">
  export let connected = false
  export let exhausted = false
  export let loading = false
  export let markerCount = 0
  export let loadError: string | null = null
  export let lastEventAt: number | null = null

  $: statusLabel = loadError
    ? "Feed error"
    : loading
      ? "Loading Nostr feed"
      : exhausted && markerCount === 0
        ? "No GEOINT events"
        : connected
          ? "Feed active"
          : "Connecting"

  $: detailsLabel = loadError
    ? loadError
    : markerCount > 0
      ? `${markerCount} intel annotations`
      : "Waiting for #starcom_intel GEOINT notes"

  $: lastSeenLabel =
    lastEventAt === null
      ? "No events yet"
      : `Last event ${new Date(lastEventAt * 1000).toLocaleTimeString()}`
</script>

<div
  class="border-neutral-700/90 bg-neutral-900/88 pointer-events-auto absolute bottom-2 left-2 right-2 z-[420] flex h-10 items-center gap-2 rounded-md border px-2 text-[11px] text-neutral-200 shadow-lg backdrop-blur-sm md:bottom-4 md:left-4 md:right-4 md:px-3 md:text-xs">
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <span class="font-semibold text-neutral-100">{statusLabel}</span>
      <span class="truncate text-neutral-300">{detailsLabel}</span>
    </div>
    <div class="truncate text-neutral-400">{lastSeenLabel}</div>
  </div>

  {#if loading && !loadError}
    <div class="w-20 shrink-0">
      <div class="nav-map-loader-track h-1.5 rounded-full bg-neutral-700" />
    </div>
  {/if}
</div>
