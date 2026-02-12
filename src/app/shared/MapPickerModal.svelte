<script lang="ts">
  import {onMount} from "svelte"

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
  const leafletSources = [
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  ]

  const ensureLeaflet = async () => {
    if (typeof window === "undefined") return

    const existingCss = document.getElementById("leaflet-css") as HTMLLinkElement | null
    if (!existingCss) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    if ((window as any).L) {
      leaflet = (window as any).L
      return
    }

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("leaflet-js")
        if (existing) existing.remove()

        const script = document.createElement("script")
        script.id = "leaflet-js"
        script.src = src
        script.async = true
        script.onload = () => {
          leaflet = (window as any).L
          if (leaflet) {
            resolve()
          } else {
            reject(new Error("Map library unavailable after load"))
          }
        }
        script.onerror = () => reject(new Error("Failed to load map library"))
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

    const startLat = lat ?? 0
    const startLon = lon ?? 0

    const map = leaflet
      .map(mapContainer)
      .setView([startLat, startLon], lat !== null && lon !== null ? 10 : 2)

    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      })
      .addTo(map)

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
  class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  on:keydown={handleKeydown}>
  <div class="w-full max-w-3xl rounded-2xl bg-neutral-900 p-4 shadow-2xl">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-lg font-semibold text-white">Pick location</p>
        <p class="text-sm text-neutral-300">
          Use the draggable pin or click the map to set coordinates.
        </p>
      </div>
      <button
        class="text-neutral-300"
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
          class="h-[420px] w-full overflow-hidden rounded-xl bg-neutral-800"
          aria-busy={loading} />
      </div>
    {/if}

    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-neutral-200">
        <span class="font-semibold">Lat:</span>
        {markerLat.toFixed(6)}
        <span class="ml-3 font-semibold">Lon:</span>
        {markerLon.toFixed(6)}
      </div>
      <div class="flex gap-2">
        <button class="rounded border border-neutral-600 px-3 py-2 text-sm" on:click={onClose}
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
