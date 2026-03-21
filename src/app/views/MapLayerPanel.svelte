<script lang="ts">
  import {t} from "svelte-i18n"
  import {createEventDispatcher} from "svelte"
  import {mapLayers, mapTileSet, mapTimeRange} from "src/app/navcom-mode"
  import type {TileSetId, TimeRange} from "src/app/navcom-mode"
  import MapDrawTools from "src/app/views/MapDrawTools.svelte"

  const dispatch = createEventDispatcher<{
    close: void
    drawSubmit: {content: string; geoType: string; geojson: string; label: string}
  }>()

  const tileSets: {id: TileSetId; labelKey: string}[] = [
    {id: "street", labelKey: "map.tileset.street"},
    {id: "satellite", labelKey: "map.tileset.satellite"},
    {id: "terrain", labelKey: "map.tileset.terrain"},
  ]

  const timeRanges: {id: TimeRange; labelKey: string}[] = [
    {id: "1h", labelKey: "map.timerange.1h"},
    {id: "24h", labelKey: "map.timerange.24h"},
    {id: "7d", labelKey: "map.timerange.7d"},
    {id: "all", labelKey: "map.timerange.all"},
  ]

  function toggleLayer(key: keyof typeof $mapLayers) {
    mapLayers.update(l => ({...l, [key]: !l[key]}))
  }
</script>

<div
  class="z-30 bg-neutral-900/95 absolute right-3 top-3 w-56 rounded-xl border border-neutral-700 shadow-xl backdrop-blur-sm"
  role="dialog"
  aria-label={$t("map.layerPanel.aria")}>
  <header class="flex items-center justify-between border-b border-neutral-700 px-3 py-2">
    <span class="text-xs font-semibold uppercase tracking-wider text-neutral-400"
      >{$t("map.layerPanel.heading")}</span>
    <button
      class="text-neutral-400 transition-colors hover:text-neutral-200"
      on:click={() => dispatch("close")}
      aria-label={$t("map.layerPanel.close.aria")}>
      <i class="fa fa-xmark text-sm" />
    </button>
  </header>

  <div class="space-y-1 px-3 py-2">
    <label class="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-200">
      <input
        type="checkbox"
        checked={$mapLayers.checkIns}
        on:change={() => toggleLayer("checkIns")}
        class="accent-green-500" />
      <span style="color:#22c55e">📍</span>
      {$t("map.layer.checkIns")}
    </label>
    <label class="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-200">
      <input
        type="checkbox"
        checked={$mapLayers.alerts}
        on:change={() => toggleLayer("alerts")}
        class="accent-red-500" />
      <span style="color:#ef4444">🚨</span>
      {$t("map.layer.alerts")}
    </label>
    <label class="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-200">
      <input
        type="checkbox"
        checked={$mapLayers.spotreps}
        on:change={() => toggleLayer("spotreps")}
        class="accent-cyan-500" />
      <span style="color:#22d3ee">📌</span>
      {$t("map.layer.spotreps")}
    </label>
    <label class="flex cursor-pointer items-center gap-2 py-1 text-sm text-neutral-200">
      <input
        type="checkbox"
        checked={$mapLayers.memberPositions}
        on:change={() => toggleLayer("memberPositions")}
        class="accent-neutral-400" />
      <i class="fa fa-users w-4 text-center text-xs text-neutral-400" />
      {$t("map.layer.members")}
    </label>
  </div>

  <div class="border-t border-neutral-700 px-3 py-2">
    <p class="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
      {$t("map.layerPanel.baseMap")}
    </p>
    {#each tileSets as ts (ts.id)}
      <label class="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-neutral-200">
        <input
          type="radio"
          name="tileset"
          value={ts.id}
          checked={$mapTileSet === ts.id}
          on:change={() => mapTileSet.set(ts.id)}
          class="accent-accent" />
        {$t(ts.labelKey)}
      </label>
    {/each}
  </div>

  <div class="border-t border-neutral-700 px-3 py-2">
    <p class="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
      {$t("map.layerPanel.timeRange")}
    </p>
    <div class="flex flex-wrap gap-1">
      {#each timeRanges as tr (tr.id)}
        <button
          class="rounded-md px-2 py-0.5 text-xs transition-colors
            {$mapTimeRange === tr.id
            ? 'bg-accent font-semibold text-neutral-900'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}"
          on:click={() => mapTimeRange.set(tr.id)}>
          {$t(tr.labelKey)}
        </button>
      {/each}
    </div>
  </div>

  <div class="border-t border-neutral-700 px-3 py-2">
    <MapDrawTools on:submit={e => dispatch("drawSubmit", e.detail)} on:close />
  </div>
</div>
