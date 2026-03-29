<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {TILE_REGISTRY, type TileType} from "src/app/board/board-state"

  const dispatch = createEventDispatcher<{add: TileType}>()

  const tileTypes = Object.entries(TILE_REGISTRY) as [TileType, (typeof TILE_REGISTRY)[TileType]][]
</script>

<div class="bg-nc-shell-bg/50 mt-4 rounded-lg border border-nc-shell-border p-3">
  <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-nc-text-muted">Add Tile</h3>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    {#each tileTypes as [type, info]}
      <button
        on:click={() => dispatch("add", type)}
        class="bg-nc-shell-bg/50 flex flex-col items-center gap-1 rounded-md border
               border-nc-shell-border p-2 text-xs transition-colors hover:border-accent">
        <span class="text-lg">{info.icon}</span>
        <span class="font-medium text-nc-text">{info.name}</span>
      </button>
    {/each}
  </div>
</div>
