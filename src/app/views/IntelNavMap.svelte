<style>
  :global(.intel-marker-icon) {
    background: transparent;
    border: 0;
  }

  :global(.intel-marker-shell) {
    display: flex;
    height: 32px;
    width: 32px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(163, 230, 53, 0.65);
    background: linear-gradient(180deg, rgba(39, 39, 42, 0.96), rgba(17, 24, 39, 0.96));
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.35),
      0 6px 12px rgba(0, 0, 0, 0.38);
    color: rgba(217, 249, 157, 1);
    font-size: 14px;
  }

  :global(.intel-popup) {
    color: rgb(229, 231, 235);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  :global(.leaflet-popup.intel-popup-shell .leaflet-popup-content-wrapper) {
    border: 1px solid rgba(64, 72, 86, 0.95);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(34, 40, 49, 0.98), rgba(27, 31, 39, 0.98));
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.35),
      0 14px 24px rgba(0, 0, 0, 0.55);
    color: rgb(229, 231, 235);
  }

  :global(.leaflet-popup.intel-popup-shell .leaflet-popup-tip) {
    background: rgba(27, 31, 39, 0.98);
  }

  :global(.leaflet-popup.intel-popup-shell .leaflet-popup-content) {
    margin: 10px 12px;
  }

  :global(.intel-popup-meta) {
    margin-bottom: 0.45rem;
    color: rgb(163, 163, 163);
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  :global(.intel-popup-content) {
    max-height: 210px;
    overflow: auto;
    white-space: normal;
    word-break: break-word;
  }

  :global(.intel-popup-content a) {
    color: rgb(125, 211, 252);
    text-decoration: underline;
  }

  :global(.intel-popup-actions) {
    margin-top: 0.55rem;
    border-top: 1px solid rgba(82, 82, 91, 0.7);
    padding-top: 0.45rem;
  }

  :global(.intel-popup-link) {
    display: inline-flex;
    align-items: center;
    border-radius: 0.4rem;
    border: 1px solid rgba(100, 116, 139, 0.7);
    padding: 0.2rem 0.5rem;
    color: rgb(226, 232, 240);
    text-decoration: none;
  }

  :global(.intel-popup-link:hover) {
    border-color: rgba(148, 163, 184, 0.9);
    color: rgb(255, 255, 255);
  }
</style>

<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import NavMapStatusBar from "src/app/views/NavMapStatusBar.svelte"
  import NavMapToolBar from "src/app/views/NavMapToolBar.svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {
    isKindFeed,
    isRelayFeed,
    makeIntersectionFeed,
    makeKindFeed,
    makeTagFeed,
    walkFeed,
  } from "@welshman/feeds"
  import "leaflet/dist/leaflet.css"
  import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
  import markerIcon from "leaflet/dist/images/marker-icon.png"
  import markerShadow from "leaflet/dist/images/marker-shadow.png"
  import {parse, renderAsHtml} from "@welshman/content"
  import {extractGeointPoint, stripGeoJsonFromContent} from "src/app/util/geoint"
  import {noteKinds} from "src/util/nostr"
  import {
    createFeedDataStream,
    createQueryKey,
    env,
    getCachePolicy,
    startCacheMetric,
  } from "src/engine"
  import {makeFeed} from "src/domain"

  type LeafletLike = typeof import("leaflet")

  type GeointMarker = {
    lat: number
    lon: number
    id: string
    createdAt: number
    contentHtml: string
    contentPreview: string
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
  let feedLoading = true
  let lastEventAt: number | null = null

  let leaflet: LeafletLike | null = null
  let map: any = null
  let markerLayer: any = null
  let markerBounds: any = null
  let ctrl: ReturnType<typeof createFeedDataStream> | null = null
  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let settleLoadingTimer: ReturnType<typeof setTimeout> | null = null
  let stopCacheMetric: ReturnType<typeof startCacheMetric> | null = null
  let didRecordFirstEvent = false
  const abortController = new AbortController()
  const eventById = new Map<string, GeointMarker>()
  const REFRESH_INTERVAL_MS = 10000
  const SETTLE_LOAD_MS = 1800
  let refreshSize = 120

  const settleFeedLoading = () => {
    if (settleLoadingTimer) {
      clearTimeout(settleLoadingTimer)
    }

    settleLoadingTimer = setTimeout(() => {
      feedLoading = false
      settleLoadingTimer = null
    }, SETTLE_LOAD_MS)
  }

  const requestFeedLoad = (size = refreshSize) => {
    if (!ctrl) {
      return
    }

    feedLoading = true
    ctrl.load(size)
    settleFeedLoading()
  }

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")

  const renderIntelContentHtml = (event: TrustedEvent) => {
    const stripped = stripGeoJsonFromContent(event.content || "")
    const parsed = parse({...event, content: stripped})
    const html = parsed
      .slice(0, 80)
      .map(part => renderAsHtml(part))
      .join("")

    return html.trim()
  }

  const toPreviewText = (event: TrustedEvent) => {
    const stripped = stripGeoJsonFromContent(event.content || "")
      .replace(/\s+/g, " ")
      .trim()

    if (!stripped) {
      return "(No text content)"
    }

    return stripped.length > 140 ? `${stripped.slice(0, 139)}…` : stripped
  }

  const refreshMarkers = (event?: TrustedEvent) => {
    if (event) {
      const point = extractGeointPoint(event)

      if (point) {
        eventById.set(event.id, {
          id: event.id,
          lat: point.lat,
          lon: point.lon,
          createdAt: event.created_at,
          contentHtml: renderIntelContentHtml(event),
          contentPreview: toPreviewText(event),
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

    markerBounds = null

    if (markers.length === 0) {
      return
    }

    const bounds = leaflet.latLngBounds([])

    const intelIcon = leaflet.divIcon({
      className: "intel-marker-icon",
      html: '<div class="intel-marker-shell"><i class="fa fa-file-lines" aria-hidden="true"></i></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 30],
      popupAnchor: [0, -22],
    })

    for (const marker of markers) {
      const createdAt = new Date(marker.createdAt * 1000).toLocaleString()
      const popup = `
        <div class="intel-popup">
          <div class="intel-popup-meta">#${escapeHtml(intelTag)} · ${escapeHtml(createdAt)}</div>
          <div class="intel-popup-content">${marker.contentHtml || escapeHtml(marker.contentPreview)}</div>
          <div class="intel-popup-actions">
            <a class="intel-popup-link" href="/notes/${marker.id}" target="_blank" rel="noreferrer">Open full message</a>
          </div>
        </div>
      `

      const pin = leaflet.marker([marker.lat, marker.lon], {icon: intelIcon}).bindPopup(popup, {
        className: "intel-popup-shell",
        maxWidth: 360,
        minWidth: 280,
      })

      markerLayer.addLayer(pin)
      bounds.extend([marker.lat, marker.lon])
    }

    if (bounds.isValid()) {
      markerBounds = bounds
      map.fitBounds(bounds.pad(0.15), {maxZoom: 12})
    }
  }

  const fitToMarkers = () => {
    if (!map || !markerBounds?.isValid?.()) {
      return
    }

    map.fitBounds(markerBounds.pad(0.15), {maxZoom: 12})
  }

  const subscribe = () => {
    didRecordFirstEvent = false

    let useWindowing = true
    let hasKinds = false

    walkFeed(intelFeed.definition, subFeed => {
      hasKinds = hasKinds || isKindFeed(subFeed)
      useWindowing = useWindowing && !isRelayFeed(subFeed)
    })

    const definition = hasKinds
      ? intelFeed.definition
      : makeIntersectionFeed(makeKindFeed(...noteKinds), intelFeed.definition)
    const queryKey = createQueryKey({
      surface: "map",
      feedDefinition: definition,
      options: {
        intelTag,
      },
    })

    stopCacheMetric = startCacheMetric(queryKey, "query_start", {
      policy: getCachePolicy("map"),
      useWindowing,
    })

    let didApplySnapshot = false

    ctrl = createFeedDataStream({
      key: queryKey,
      feed: definition,
      useWindowing,
      signal: abortController.signal,
      onResult: result => {
        if (didApplySnapshot || result.source !== "cache" || result.events.length === 0) {
          return
        }

        didApplySnapshot = true

        for (const event of result.events) {
          refreshMarkers(event)
        }

        if (!didRecordFirstEvent) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: result.events.length})
        }

        feedLoading = false
      },
      onEvent: event => {
        if (!didRecordFirstEvent) {
          didRecordFirstEvent = true
          stopCacheMetric?.("first_event", {eventCount: 1})
        }

        lastEventAt = event.created_at
        feedLoading = false
        refreshMarkers(event)
      },
      onExhausted: () => {
        exhausted = true
        feedLoading = false
        stopCacheMetric?.("query_exhausted", {
          eventCount: markers.length,
          exhausted: true,
        })
      },
    })

    const burstSize = useWindowing ? 400 : 1000
    refreshSize = useWindowing ? 120 : 300

    requestFeedLoad(burstSize)
    requestFeedLoad(refreshSize)

    refreshTimer = setInterval(() => {
      requestFeedLoad(refreshSize)
    }, REFRESH_INTERVAL_MS)
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
    if (!exhausted) {
      stopCacheMetric?.("query_exhausted", {
        eventCount: markers.length,
        exhausted: false,
      })
    }

    abortController.abort()
    ctrl?.abort()
    ctrl = null
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    if (settleLoadingTimer) {
      clearTimeout(settleLoadingTimer)
      settleLoadingTimer = null
    }
    window.removeEventListener("resize", handleResize)

    if (map) {
      map.remove()
      map = null
      markerLayer = null
    }
  })
</script>

<div class="relative h-full min-h-0 w-full overflow-hidden">
  <div
    bind:this={mapContainer}
    class="h-full w-full bg-neutral-900"
    aria-label="GEOINT map"
    aria-busy={!connected || feedLoading} />

  <div class="pointer-events-none absolute inset-0 z-[410]">
    <NavMapToolBar
      markerCount={markers.length}
      {intelTag}
      loading={feedLoading}
      onRefresh={() => requestFeedLoad(refreshSize)}
      onFitMarkers={fitToMarkers} />
    <NavMapStatusBar
      {connected}
      {exhausted}
      loading={feedLoading}
      markerCount={markers.length}
      {loadError}
      {lastEventAt} />
  </div>
</div>
