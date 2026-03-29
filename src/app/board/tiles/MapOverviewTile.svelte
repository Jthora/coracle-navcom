<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {mapViewport, mapTileSet} from "src/app/navcom-mode"
  import type {TileSetId} from "src/app/navcom-mode"
  import {isSovereign} from "src/engine/connection-state"
  import {setMode} from "src/app/navcom-mode"

  export let config: Record<string, unknown> | undefined = undefined

  type LeafletLike = typeof import("leaflet")

  const TILE_URLS: Record<TileSetId, {url: string; attribution: string}> = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenTopoMap contributors",
    },
  }

  let container: HTMLDivElement
  let leaflet: LeafletLike | null = null
  let map: any = null

  async function initMap() {
    if (!container) return
    try {
      const mod = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      leaflet = (mod as any).default ?? mod

      const vp = $mapViewport
      map = leaflet.map(container, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: false,
        attributionControl: false,
      })
      map.setView(vp.center, Math.max(vp.zoom - 1, 2))

      const ts = TILE_URLS[$mapTileSet]
      leaflet.tileLayer(ts.url, {maxZoom: 19}).addTo(map)
    } catch {
      // Leaflet load failure — container stays blank with fallback text
    }
  }

  onMount(() => {
    initMap()
  })

  onDestroy(() => {
    if (map) {
      map.remove()
      map = null
    }
  })
</script>

<button
  class="relative flex h-full w-full flex-col overflow-hidden"
  on:click={() => setMode("map")}>
  <div bind:this={container} class="h-full w-full bg-nc-shell-deep" />
  {#if $isSovereign}
    <div class="bg-nc-shell-deep/70 absolute inset-0 flex items-center justify-center">
      <span class="text-xs text-nc-text-muted">Map data cached — offline</span>
    </div>
  {/if}
  <div
    class="bg-nc-shell-bg/80 absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1">
    <span class="text-[10px] uppercase tracking-wider text-nc-text-muted">Map Overview</span>
    <i class="fa fa-arrow-right text-[10px] text-nc-text-muted" />
  </div>
</button>
