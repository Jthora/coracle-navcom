<script lang="ts">
  import {setMode} from "src/app/navcom-mode"

  export let config: Record<string, unknown> | undefined = undefined
</script>

<div class="flex h-full flex-col p-2">
  <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">Quick Actions</h4>
  <div class="mt-2 grid grid-cols-2 gap-2">
    <button
      on:click={() => setMode("comms")}
      class="bg-nc-shell-bg/50 flex flex-col items-center gap-1 rounded-lg border border-nc-shell-border p-2 text-xs hover:border-accent">
      <i class="fa fa-comments text-sm text-nc-text" />
      <span class="text-nc-text-muted">Comms</span>
    </button>
    <button
      on:click={() => setMode("map")}
      class="bg-nc-shell-bg/50 flex flex-col items-center gap-1 rounded-lg border border-nc-shell-border p-2 text-xs hover:border-accent">
      <i class="fa fa-map text-sm text-nc-text" />
      <span class="text-nc-text-muted">Map</span>
    </button>
  </div>
</div>
