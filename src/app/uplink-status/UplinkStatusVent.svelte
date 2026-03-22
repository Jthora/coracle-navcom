<script lang="ts">
  export let side: "left" | "right" = "left"
</script>

<div
  class="from-nc-shell-bg/90 via-nc-shell-deep/90 to-nc-shell-deep/95 border-nc-shell-border/80 z-0 pointer-events-none absolute inset-y-0 flex w-9 items-center border-y bg-gradient-to-b"
  class:left-0={side === "left"}
  class:right-0={side === "right"}
  class:border-r={side === "left"}
  class:border-l={side === "right"}>
  <div
    class="border-nc-shell-border/70 h-full w-full border-l border-r px-1.5 py-[3px]"
    aria-hidden="true">
    <div
      class="bg-nc-shell-deep/80 border-nc-shell-border/70 flex h-full w-full items-center justify-center gap-[2px] border px-1">
      <div class="bg-nc-shell-border/95 h-full w-px" />
      <div class="bg-nc-shell-border/80 h-full w-px" />
      <div class="bg-nc-shell-border/65 h-full w-px" />
      <div class="bg-nc-shell-border/50 h-full w-px" />
      <div class="bg-nc-shell-border/35 h-full w-px" />
    </div>
  </div>
</div>
