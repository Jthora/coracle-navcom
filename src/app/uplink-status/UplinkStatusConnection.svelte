<style>
  .status-pulse {
    animation: status-pulse 1.6s ease-in-out infinite;
  }

  @keyframes status-pulse {
    0%,
    100% {
      transform: translateY(-1px) scale(1);
      box-shadow: 0 0 0 0 currentColor;
    }

    50% {
      transform: translateY(-1px) scale(1.08);
      box-shadow: 0 0 0 6px transparent;
    }
  }
</style>

<script lang="ts">
  export let connected = false
</script>

<div class="aldrich flex items-center gap-2 whitespace-nowrap text-[11px] tracking-[0.12em]">
  <span
    class="relative h-2 w-2 -translate-y-[1px] rounded-full"
    class:bg-success={connected}
    class:status-pulse={connected}
    class:bg-neutral-500={!connected} />
  <span class="font-semibold uppercase text-neutral-300">Uplink:</span>
  <span class="font-semibold" class:text-accent={connected} class:text-neutral-400={!connected}
    >{connected ? "Connected" : "Disconnected"}</span>
</div>
