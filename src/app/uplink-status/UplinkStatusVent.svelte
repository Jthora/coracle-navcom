<script lang="ts">
  export let side: "left" | "right" = "left"
</script>

<div
  class="bg-neutral-900/70 border-neutral-700/70 z-0 pointer-events-none absolute inset-y-0 flex w-8 items-center"
  class:left-0={side === "left"}
  class:right-0={side === "right"}
  class:border-r={side === "left"}
  class:border-l={side === "right"}>
  <div class="flex h-[72%] w-full items-center justify-center gap-[2px] px-1.5" aria-hidden="true">
    <div class="bg-neutral-600/95 h-full w-px" />
    <div class="bg-neutral-600/75 h-full w-px" />
    <div class="bg-neutral-600/50 h-full w-px" />
    <div class="bg-neutral-600/35 h-full w-px" />
  </div>
</div>
