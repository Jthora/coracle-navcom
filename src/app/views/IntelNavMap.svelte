<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {makeFeedController} from "@welshman/app"
  import {
    isKindFeed,
    isRelayFeed,
    makeIntersectionFeed,
    makeKindFeed,
    makeTagFeed,
    walkFeed,
  } from "@welshman/feeds"
  import type {FeedController} from "@welshman/feeds"
  import "leaflet/dist/leaflet.css"
  import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
  import markerIcon from "leaflet/dist/images/marker-icon.png"
  import markerShadow from "leaflet/dist/images/marker-shadow.png"
  import {extractGeointPoint} from "src/app/util/geoint"
  import {noteKinds} from "src/util/nostr"
  import {env} from "src/engine"
  import {makeFeed} from "src/domain"

  type LeafletLike = typeof import("leaflet")

  type GeointMarker = {
    lat: number
    lon: number
    id: string
    createdAt: number
  }

  const intelTag = env.INTEL_TAG || "starcom_intel"
  const mapZoom = 2
  const mapCenter: [number, number] = [18, 0]
  const intelFeed = makeFeed({definition: makeTagFeed("#t", intelTag)})

  let mapContainer: HTMLDivElement
  let exhausted = false
  let loadError: string | null = null
  let markers: GeointMarker[] = []
  let connected = false

  let leaflet: LeafletLike | null = null
  let map: any = null
  let markerLayer: any = null
  let ctrl: FeedController | null = null
  const abortController = new AbortController()
  const eventById = new Map<string, GeointMarker>()

  const refreshMarkers = (event?: TrustedEvent) => {
    if (event) {
      const point = extractGeointPoint(event)

      if (point) {
        eventById.set(event.id, {
          id: event.id,
          lat: point.lat,
          lon: point.lon,
          createdAt: event.created_at,
        })
      }
    }

    markers = Array.from(eventById.values()).sort((a, b) => b.createdAt - a.createdAt)
    syncMapMarkers()
  }

  const initLeaflet = async () => {
    const mod = await import("leaflet")
    leaflet = (mod as any).default ?? mod

    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    })
  }

  const initMap = () => {
    if (!leaflet || !mapContainer || map) {
      return
    }

    map = leaflet.map(mapContainer, {
      zoomControl: true,
      minZoom: 2,
    })

    map.setView(mapCenter, mapZoom)

    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      })
      .addTo(map)

    markerLayer = leaflet.layerGroup().addTo(map)
  }

  const syncMapMarkers = () => {
    if (!leaflet || !map || !markerLayer) {
      return
    }

    markerLayer.clearLayers()

    if (markers.length === 0) {
      return
    }

    const bounds = leaflet.latLngBounds([])

    for (const marker of markers) {
      const pin = leaflet
        .marker([marker.lat, marker.lon])
        .bindPopup(
          `<a href="/notes/${marker.id}" target="_blank" rel="noreferrer">Open message</a>`,
        )

      markerLayer.addLayer(pin)
      bounds.extend([marker.lat, marker.lon])
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), {maxZoom: 12})
    }
  }

  const subscribe = () => {
    let useWindowing = true
    let hasKinds = false

    walkFeed(intelFeed.definition, subFeed => {
      hasKinds = hasKinds || isKindFeed(subFeed)
      useWindowing = useWindowing && !isRelayFeed(subFeed)
    })

    const definition = hasKinds
      ? intelFeed.definition
      : makeIntersectionFeed(makeKindFeed(...noteKinds), intelFeed.definition)

    ctrl = makeFeedController({
      feed: definition,
      useWindowing,
      signal: abortController.signal,
      onEvent: event => {
        refreshMarkers(event)
      },
      onExhausted: () => {
        exhausted = true
      },
    })

    if (useWindowing) {
      ctrl.load(400)
    } else {
      ctrl.load(1000)
    }
  }

  const handleResize = () => {
    map?.invalidateSize()
  }

  onMount(async () => {
    try {
      document.title = "GEOINT Nav Map"
      await initLeaflet()
      initMap()
      subscribe()
      connected = true
      window.addEventListener("resize", handleResize)
      handleResize()
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Failed to load GEOINT map"
    }
  })

  onDestroy(() => {
    abortController.abort()
    ctrl = null
    window.removeEventListener("resize", handleResize)

    if (map) {
      map.remove()
      map = null
      markerLayer = null
    }
  })
</script>

<div
  bind:this={mapContainer}
  class="h-[calc(100dvh-8rem)] w-full bg-neutral-900 lg:h-[calc(100dvh-4rem)]"
  aria-label="GEOINT map"
  aria-busy={!connected} />

{#if loadError}
  <div
    class="border-red-500/40 bg-red-500/90 pointer-events-none fixed bottom-4 right-4 rounded border px-3 py-2 text-xs text-white">
    {loadError}
  </div>
{:else if connected && markers.length === 0 && exhausted}
  <div
    class="bg-neutral-900/85 pointer-events-none fixed bottom-4 right-4 rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-200">
    No mapped #starcom_intel GEOINT events yet
  </div>
{/if}
