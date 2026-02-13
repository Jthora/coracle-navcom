<script lang="ts">
  export let side: "left" | "right" = "left"
</script>

<div
  class="from-neutral-800/90 via-neutral-900/90 to-neutral-950/95 border-neutral-700/80 z-0 pointer-events-none absolute inset-y-0 flex w-9 items-center border-y bg-gradient-to-b"
  class:left-0={side === "left"}
  class:right-0={side === "right"}
  class:border-r={side === "left"}
  class:border-l={side === "right"}>
  <div
    class="border-neutral-700/70 h-full w-full border-l border-r px-1.5 py-[3px]"
    aria-hidden="true">
    <div
      class="bg-neutral-900/80 border-neutral-700/70 flex h-full w-full items-center justify-center gap-[2px] border px-1">
      <div class="bg-neutral-500/95 h-full w-px" />
      <div class="bg-neutral-500/80 h-full w-px" />
      <div class="bg-neutral-500/65 h-full w-px" />
      <div class="bg-neutral-500/50 h-full w-px" />
      <div class="bg-neutral-500/35 h-full w-px" />
    </div>
  </div>
</div>
