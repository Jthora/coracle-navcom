<script lang="ts">
  import {onMount} from "svelte"
  import "leaflet/dist/leaflet.css"
  import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
  import markerIcon from "leaflet/dist/images/marker-icon.png"
  import markerShadow from "leaflet/dist/images/marker-shadow.png"

  export let lat: number | null = null
  export let lon: number | null = null
  export let onClose: () => void
  export let onSave: (coords: {lat: number; lon: number}) => void

  let mapContainer: HTMLDivElement
  let closeButton: HTMLButtonElement
  let loading = true
  let loadError: string | null = null
  let markerLat = lat ?? 0
  let markerLon = lon ?? 0
  let ready = false
  let leaflet: any = null
  const LEAFLET_TIMEOUT_MS = 8000
  const leafletSources = [
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  ]

  const loadLeafletLocal = async () => {
    const mod = await import("leaflet")
    leaflet = (mod as any).default ?? mod

    if (leaflet?.Icon?.Default) {
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
      })
    }

    return leaflet
  }

  const ensureLeaflet = async () => {
    if (typeof window === "undefined") return

    if ((window as any).L) {
      leaflet = (window as any).L
      return
    }

    try {
      await loadLeafletLocal()
      return
    } catch (err) {
      // fall through to CDN
      console.warn("Local leaflet load failed; trying CDN", err)
    }

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("leaflet-js")
        if (existing) existing.remove()

        const script = document.createElement("script")
        script.id = "leaflet-js"
        script.src = src
        script.async = true
        const timeout = window.setTimeout(
          () => reject(new Error("Map library timed out while loading")),
          LEAFLET_TIMEOUT_MS,
        )
        script.onload = () => {
          leaflet = (window as any).L
          window.clearTimeout(timeout)
          if (leaflet) {
            resolve()
          } else {
            reject(new Error("Map library unavailable after load"))
          }
        }
        script.onerror = () => {
          window.clearTimeout(timeout)
          reject(new Error("Failed to load map library"))
        }
        document.body.appendChild(script)
      })

    let lastError: Error | null = null

    for (const src of leafletSources) {
      try {
        await loadScript(src)
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
      }
    }

    throw lastError ?? new Error("Failed to load map library")
  }

  onMount(async () => {
    try {
      await ensureLeaflet()
      initMap()
      closeButton?.focus()
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load map"
      loading = false
    }
  })

  const initMap = () => {
    if (typeof window === "undefined" || !leaflet) return
    if (!mapContainer) {
      loadError = "Map container unavailable"
      loading = false
      return
    }

    const startLat = lat ?? 0
    const startLon = lon ?? 0

    const map = leaflet
      .map(mapContainer)
      .setView([startLat, startLon], lat !== null && lon !== null ? 10 : 2)

    const tiles = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    })
    tiles.on("tileerror", () => {
      loadError = "Map tiles could not be loaded. Check network or allow OpenStreetMap tiles."
      loading = false
    })
    tiles.addTo(map)

    const marker = leaflet.marker([startLat, startLon], {draggable: true}).addTo(map)

    const updateFromLatLng = (latlng: {lat: number; lng: number}) => {
      markerLat = Number(latlng.lat.toFixed(6))
      markerLon = Number(latlng.lng.toFixed(6))
    }

    marker.on("dragend", () => {
      updateFromLatLng(marker.getLatLng())
    })

    map.on("click", (e: {latlng: {lat: number; lng: number}}) => {
      marker.setLatLng(e.latlng)
      updateFromLatLng(e.latlng)
    })

    ready = true
    loading = false
  }

  const save = () => {
    if (!ready) return
    onSave?.({lat: markerLat, lon: markerLon})
  }

  const retry = async () => {
    loading = true
    loadError = null
    await ensureLeaflet()
    initMap()
    closeButton?.focus()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose?.()
    }
  }
</script>

<div
  class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-2 md:p-4"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  on:keydown={handleKeydown}>
  <div
    class="h-full max-h-full w-full overflow-y-auto rounded-2xl bg-neutral-900 p-4 shadow-2xl md:h-auto md:max-h-[90vh] md:max-w-3xl">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-lg font-semibold text-white">Pick location</p>
        <p class="text-sm text-neutral-300">
          Use the draggable pin or click the map to set coordinates.
        </p>
      </div>
      <button
        class="flex h-11 w-11 items-center justify-center text-neutral-300 md:h-auto md:w-auto"
        bind:this={closeButton}
        on:click={onClose}
        aria-label="Close map picker">
        <i class="fa fa-times" />
      </button>
    </div>

    {#if loadError}
      <div class="text-red-400 flex flex-col gap-2 text-sm">
        <p>{loadError}</p>
        <button
          class="w-fit rounded border border-neutral-600 px-3 py-2 text-xs text-white hover:border-neutral-400"
          on:click={retry}>
          Retry loading map
        </button>
      </div>
    {:else}
      <div class="relative">
        {#if loading}
          <div
            class="z-10 bg-neutral-900/70 pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl text-neutral-200">
            Loading map…
          </div>
        {/if}
        <div
          bind:this={mapContainer}
          class="h-[52dvh] min-h-[280px] w-full overflow-hidden rounded-xl bg-neutral-800 md:h-[420px]"
          aria-busy={loading} />
      </div>
    {/if}

    <div
      class="sticky bottom-0 mt-3 flex flex-wrap items-center justify-between gap-3 bg-neutral-900 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-2 md:static md:bg-transparent md:pb-0 md:pt-0">
      <div class="text-xs text-neutral-200 sm:text-sm">
        <span class="font-semibold">Lat:</span>
        {markerLat.toFixed(6)}
        <span class="ml-3 font-semibold">Lon:</span>
        {markerLon.toFixed(6)}
      </div>
      <div class="flex gap-2">
        <button class="rounded border border-neutral-600 px-4 py-2 text-sm" on:click={onClose}
          >Cancel</button>
        <button
          class="rounded bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          disabled={!ready || loading}
          on:click={save}>
          Use this location
        </button>
      </div>
    </div>
  </div>
</div>
