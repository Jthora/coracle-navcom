<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {makeFeedController} from "@welshman/app"
  import {makeIntersectionFeed, makeKindFeed, makeTagFeed} from "@welshman/feeds"
  import type {FeedController} from "@welshman/feeds"
  import "leaflet/dist/leaflet.css"
  import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
  import markerIcon from "leaflet/dist/images/marker-icon.png"
  import markerShadow from "leaflet/dist/images/marker-shadow.png"
  import Card from "src/partials/Card.svelte"
  import Link from "src/partials/Link.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import {extractGeointPoint, stripGeoJsonFromContent} from "src/app/util/geoint"
  import {noteKinds} from "src/util/nostr"
  import {env} from "src/engine"

  type LeafletLike = typeof import("leaflet")

  type GeointMarker = {
    event: TrustedEvent
    lat: number
    lon: number
    summary: string
  }

  const intelTag = env.INTEL_TAG || "starcom_intel"
  const mapZoom = 3
  const maxSummaryLength = 160

  let mapContainer: HTMLDivElement
  let loading = true
  let exhausted = false
  let loadError: string | null = null
  let markers: GeointMarker[] = []

  let leaflet: LeafletLike | null = null
  let map: any = null
  let markerLayer: any = null
  let ctrl: FeedController | null = null
  const abortController = new AbortController()
  const eventById = new Map<string, TrustedEvent>()

  const normalizeSummary = (event: TrustedEvent) => {
    const text = stripGeoJsonFromContent(event.content || "")
      .replace(/\s+/g, " ")
      .trim()

    if (!text) {
      return "(No description)"
    }

    return text.length > maxSummaryLength ? `${text.slice(0, maxSummaryLength - 1)}…` : text
  }

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")

  const toMarker = (event: TrustedEvent): GeointMarker | null => {
    const point = extractGeointPoint(event)

    if (!point) {
      return null
    }

    return {
      event,
      lat: point.lat,
      lon: point.lon,
      summary: normalizeSummary(event),
    }
  }

  const refreshMarkers = () => {
    const next = Array.from(eventById.values()).map(toMarker).filter(Boolean) as GeointMarker[]

    markers = next.sort((a, b) => b.event.created_at - a.event.created_at)
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

    map.setView([20, 0], mapZoom)

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
      const createdAt = new Date(marker.event.created_at * 1000).toLocaleString()
      const popup = `
        <div style="max-width:260px">
          <div style="font-weight:600;margin-bottom:4px">#${intelTag}</div>
          <div style="font-size:12px;opacity:0.85;margin-bottom:6px">${escapeHtml(createdAt)}</div>
          <div style="margin-bottom:8px">${escapeHtml(marker.summary)}</div>
          <a href="/notes/${marker.event.id}" target="_blank" rel="noreferrer">Open message</a>
        </div>
      `

      const pin = leaflet.marker([marker.lat, marker.lon]).bindPopup(popup)

      markerLayer.addLayer(pin)
      bounds.extend([marker.lat, marker.lon])
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.15), {maxZoom: 12})
    }
  }

  const subscribe = () => {
    const feed = makeIntersectionFeed(makeKindFeed(...noteKinds), makeTagFeed("#t", intelTag))

    ctrl = makeFeedController({
      feed,
      useWindowing: true,
      signal: abortController.signal,
      onEvent: event => {
        eventById.set(event.id, event)
        refreshMarkers()
      },
      onExhausted: () => {
        exhausted = true
        loading = false
      },
    })

    ctrl.load(200)
  }

  const formatCoordinates = (lat: number, lon: number) => `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  onMount(async () => {
    try {
      document.title = "GEOINT Nav Map"
      await initLeaflet()
      initMap()
      subscribe()
      loading = false
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Failed to load GEOINT map"
      loading = false
    }
  })

  onDestroy(() => {
    abortController.abort()
    ctrl = null

    if (map) {
      map.remove()
      map = null
      markerLayer = null
    }
  })
</script>

<Card class="panel p-4">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <div>
      <h1 class="text-xl font-semibold text-neutral-100">GEOINT Nav Map</h1>
      <p class="text-sm text-neutral-300">
        Mapping `#starcom_intel` messages that include GEOINT coordinates.
      </p>
    </div>
    <Link class="btn" href={`/topics/${intelTag}`}>Back to Intel Feed</Link>
  </div>

  {#if loadError}
    <div class="border-red-500/40 bg-red-500/10 text-red-200 rounded border p-3 text-sm">
      {loadError}
    </div>
  {:else}
    <div
      bind:this={mapContainer}
      class="h-[56dvh] min-h-[360px] w-full overflow-hidden rounded border border-neutral-700 bg-neutral-900"
      aria-label="GEOINT map"
      aria-busy={loading} />

    {#if loading && !exhausted}
      <div class="py-4">
        <Spinner />
      </div>
    {/if}

    <div class="mt-4">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-200">
          Plotted Messages ({markers.length})
        </h2>
      </div>

      {#if markers.length === 0 && exhausted}
        <p class="text-sm text-neutral-400">
          No mappable `#starcom_intel` messages found yet. Add GEOINT coordinates to intel posts to
          see markers.
        </p>
      {:else}
        <div class="max-h-64 space-y-2 overflow-auto pr-1">
          {#each markers as marker (marker.event.id)}
            <Link
              class="bg-neutral-800/40 block rounded border border-neutral-700 p-3 hover:border-neutral-500"
              href={`/notes/${marker.event.id}`}>
              <p class="text-sm text-neutral-100">{marker.summary}</p>
              <p class="mt-1 text-xs text-neutral-400">
                {formatCoordinates(marker.lat, marker.lon)} · {new Date(
                  marker.event.created_at * 1000,
                ).toLocaleString()}
              </p>
            </Link>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</Card>
