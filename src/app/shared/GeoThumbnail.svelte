<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {extractGeointPoint} from "src/app/util/geoint"

  export let event

  const zoom = 5
  const tileSize = 256
  let point = extractGeointPoint(event)
  let mapEl: HTMLDivElement
  let mapW = 0
  let mapH = 0
  let tiles: Array<{key: string; url: string; left: number; top: number}> = []
  let tilesError = false
  let resizeObserver: ResizeObserver | null = null

  const toFixed = (value: number) => Number(value).toFixed(4)

  const clampLat = (lat: number) => Math.max(-85.05112878, Math.min(85.05112878, lat))
  const wrapX = (x: number, n: number) => ((x % n) + n) % n

  const latLonToWorldPx = (lat: number, lon: number, z: number) => {
    const n = 2 ** z
    const latRad = (clampLat(lat) * Math.PI) / 180
    const x = ((lon + 180) / 360) * n * tileSize
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * tileSize

    return {x, y}
  }

  const buildTiles = () => {
    tilesError = false

    if (!point || !mapEl) {
      tiles = []
      return
    }

    const rect = mapEl.getBoundingClientRect()
    mapW = Math.max(1, Math.floor(rect.width))
    mapH = Math.max(1, Math.floor(rect.height))

    const n = 2 ** zoom
    const {x: worldX, y: worldY} = latLonToWorldPx(point.lat, point.lon, zoom)

    const topLeftWorldX = worldX - mapW / 2
    const topLeftWorldY = worldY - mapH / 2

    const x0 = Math.floor(topLeftWorldX / tileSize)
    const y0 = Math.floor(topLeftWorldY / tileSize)
    const x1 = Math.floor((topLeftWorldX + mapW) / tileSize)
    const y1 = Math.floor((topLeftWorldY + mapH) / tileSize)

    const nextTiles: typeof tiles = []

    for (let ty = y0; ty <= y1; ty++) {
      if (ty < 0 || ty >= n) continue

      for (let tx = x0; tx <= x1; tx++) {
        const wrappedX = wrapX(tx, n)

        nextTiles.push({
          key: `${zoom}/${wrappedX}/${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          left: tx * tileSize - topLeftWorldX,
          top: ty * tileSize - topLeftWorldY,
        })
      }
    }

    tiles = nextTiles
  }

  const handleTileError = () => {
    tilesError = true
    tiles = []
  }

  $: point = extractGeointPoint(event)
  $: mapUrl =
    point &&
    `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=${zoom}/${point.lat}/${point.lon}`

  $: if (point) {
    // Defer until DOM has bound mapEl and sized.
    queueMicrotask(buildTiles)
  }

  onMount(() => {
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => buildTiles())
      if (mapEl) resizeObserver.observe(mapEl)
    }
  })

  onDestroy(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
</script>

{#if point}
  <div class="bg-neutral-900/40 mt-3 rounded-lg border border-neutral-700 p-2">
    <div class="mb-2 flex items-center justify-between text-xs text-neutral-300">
      <span class="font-semibold">GEOINT location</span>
      <a class="underline" href={mapUrl} target="_blank" rel="noreferrer">Open map</a>
    </div>

    <div
      bind:this={mapEl}
      class="relative h-28 w-full overflow-hidden rounded bg-neutral-800"
      aria-label={`Map preview at lat ${toFixed(point.lat)}, lon ${toFixed(point.lon)}`}
      aria-busy={tiles.length === 0 && !tilesError}>
      {#if tilesError}
        <div class="absolute inset-0 flex items-center justify-center text-xs text-neutral-300">
          Map preview unavailable
        </div>
      {:else}
        {#each tiles as tile (tile.key)}
          <img
            class="absolute select-none"
            alt=""
            src={tile.url}
            style={`left:${tile.left}px;top:${tile.top}px;width:${tileSize}px;height:${tileSize}px;`}
            loading="lazy"
            draggable="false"
            on:error={handleTileError} />
        {/each}

        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-900 bg-white/90"
          style="width:12px;height:12px;" />
      {/if}
    </div>

    <p class="mt-2 text-xs text-neutral-300">
      Lat {toFixed(point.lat)} · Lon {toFixed(point.lon)}
    </p>
  </div>
{/if}
