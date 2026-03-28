<script lang="ts">
  import {boardLayout, addTile, removeTile, type TileType} from "src/app/board/board-state"

  import MapOverviewTile from "src/app/board/tiles/MapOverviewTile.svelte"
  import GroupStatusTile from "src/app/board/tiles/GroupStatusTile.svelte"
  import PersonnelStatusTile from "src/app/board/tiles/PersonnelStatusTile.svelte"
  import ActivityFeedTile from "src/app/board/tiles/ActivityFeedTile.svelte"
  import ConnectionStatusTile from "src/app/board/tiles/ConnectionStatusTile.svelte"
  import SecurityStatusTile from "src/app/board/tiles/SecurityStatusTile.svelte"
  import QuickActionsTile from "src/app/board/tiles/QuickActionsTile.svelte"
  import TrustOverviewTile from "src/app/board/tiles/TrustOverviewTile.svelte"
  import TilePicker from "src/app/board/TilePicker.svelte"

  let editMode = false
  let innerWidth = 0

  $: layout = $boardLayout
  $: columns = innerWidth >= 1280 ? 4 : innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1
  $: rowHeight = innerWidth >= 1280 ? 200 : innerWidth >= 1024 ? 180 : innerWidth >= 768 ? 160 : 140

  $: gridStyle = `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    grid-auto-rows: ${rowHeight}px;
    gap: 0.75rem;
  `

  const TILE_COMPONENTS: Record<TileType, any> = {
    "map-overview": MapOverviewTile,
    "group-status": GroupStatusTile,
    "personnel-status": PersonnelStatusTile,
    "activity-feed": ActivityFeedTile,
    "connection-status": ConnectionStatusTile,
    "security-status": SecurityStatusTile,
    "quick-actions": QuickActionsTile,
    "trust-overview": TrustOverviewTile,
  }

  function handleRemove(index: number) {
    removeTile(index)
  }

  function handleAdd(e: CustomEvent<TileType>) {
    addTile(e.detail)
  }

  // Drag-and-drop state
  let dragIndex: number | null = null

  function onDragStart(e: DragEvent, index: number) {
    dragIndex = index
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move"
    }
  }

  function onDrop(e: DragEvent, toIndex: number) {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== toIndex) {
      boardLayout.update(l => {
        const tiles = [...l.tiles]
        const [moved] = tiles.splice(dragIndex!, 1)
        tiles.splice(toIndex, 0, moved)
        return {...l, tiles}
      })
    }
    dragIndex = null
  }

  function onDragEnd() {
    dragIndex = null
  }
</script>

<svelte:window bind:innerWidth />

<div class="relative" data-testid="board-view">
  <!-- Edit mode toggle -->
  <button
    on:click={() => (editMode = !editMode)}
    class="bg-nc-shell-bg/80 absolute right-0 top-0 z-feature rounded-md px-2 py-1 text-xs text-nc-text-muted transition-colors hover:text-nc-text"
    data-testid="board-edit-toggle">
    {editMode ? "✓ Done" : "⚙ Edit"}
  </button>

  <!-- Board grid -->
  <div style={gridStyle} class="pt-6" data-testid="board-grid">
    {#each layout.tiles as tile, index (tile.id)}
      {@const Component = TILE_COMPONENTS[tile.type]}
      {@const effectiveCols = Math.min(tile.colSpan, columns)}
      <div
        style="grid-column: {columns === 1
          ? 'auto'
          : `${Math.min(tile.col, columns)} / span ${effectiveCols}`}; grid-row: {columns === 1
          ? 'auto'
          : `${tile.row} / span ${tile.rowSpan}`};"
        class="bg-nc-shell-bg/50 relative overflow-hidden rounded-xl border border-nc-shell-border"
        class:ring-2={editMode}
        class:ring-accent={editMode}
        draggable={editMode}
        on:dragstart={editMode ? e => onDragStart(e, index) : undefined}
        on:dragover={editMode ? onDragOver : undefined}
        on:drop={editMode ? e => onDrop(e, index) : undefined}
        on:dragend={editMode ? onDragEnd : undefined}
        data-testid="board-tile"
        data-tile-type={tile.type}>
        {#if editMode}
          <button
            on:click={() => handleRemove(index)}
            class="bg-danger/80 absolute right-1 top-1 z-feature flex h-5 w-5 items-center justify-center rounded text-xs text-white"
            data-testid="tile-remove">✕</button>
        {/if}
        {#if Component}
          <svelte:component this={Component} config={tile.config} />
        {:else}
          <div class="flex h-full items-center justify-center text-xs text-nc-text-muted">
            Unknown tile: {tile.type}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Tile Picker (edit mode only) -->
  {#if editMode}
    <TilePicker on:add={handleAdd} />
  {/if}
</div>
