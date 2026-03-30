<style>
  :global(.navcom-marker-icon) {
    background: transparent;
    border: 0;
  }
  :global(.navcom-marker-shell) {
    display: flex;
    height: 28px;
    width: 28px;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1.5px solid;
    font-size: 13px;
    background: linear-gradient(
      180deg,
      rgba(var(--nc-shell-bg-rgb), 0.96),
      rgba(var(--nc-shell-deep-rgb), 0.96)
    );
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.3),
      0 4px 8px rgba(0, 0, 0, 0.35);
  }
  :global(.navcom-popup-shell .leaflet-popup-content-wrapper) {
    border: 1px solid rgba(var(--nc-shell-border-rgb), 0.9);
    border-radius: 8px;
    background: rgba(var(--nc-shell-deep-rgb), 0.97);
    color: var(--nc-text);
  }
  :global(.navcom-popup-shell .leaflet-popup-tip) {
    background: rgba(var(--nc-shell-deep-rgb), 0.97);
  }
</style>

<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {t} from "svelte-i18n"
  import {
    activeChannel,
    setActiveChannel,
    setMode,
    selectedMarkerId,
    selectedMessageId,
    mapLayers,
    mapTimeRange,
    mapViewport,
    mapTileSet,
  } from "src/app/navcom-mode"
  import type {MapLayerConfig, TimeRange, TileSetId} from "src/app/navcom-mode"
  import {groupProjections, groupSummaries, unreadGroupMessageCounts} from "src/app/groups/state"
  import {router} from "src/app/util/router"
  import {
    deriveMarkers,
    MARKER_STYLES,
    deriveMemberPositions,
  } from "src/app/views/marker-derivation"
  import type {ChannelMarker} from "src/app/views/marker-derivation"
  import {clusterMarkers, zoomToPrecision, CLUSTER_COLORS} from "src/app/views/marker-clustering"
  import MapLayerPanel from "src/app/views/MapLayerPanel.svelte"
  import {repository} from "@welshman/app"
  import {publishGroupMessage} from "src/engine"
  import {attestationsByTarget} from "src/engine/trust/attestation"

  type LeafletLike = typeof import("leaflet")

  let innerWidth = 0
  $: isMobile = innerWidth < 1024

  let showLayerPanel = false
  let mapContainer: HTMLDivElement
  let leaflet: LeafletLike | null = null
  let map: any = null
  let markerLayerGroup: any = null
  let memberPositionLayerGroup: any = null
  let tileLayer: any = null
  let userLocationMarker: any = null
  let userCoords: [number, number] | null = null
  let gpsAvailable = true

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

  $: projection = $activeChannel ? $groupProjections.get($activeChannel) : null
  $: channelTitle = projection?.group?.title || $t("map.header.selectChannel")

  // Derive markers from all group messages that have location data
  $: channelMessages = $activeChannel
    ? repository.query([{kinds: [445], "#h": [$activeChannel]}])
    : []
  $: allMarkers = deriveMarkers(channelMessages, $attestationsByTarget)

  // Apply layer + time filters
  $: markers = filterMarkers(allMarkers, $mapLayers, $mapTimeRange)

  // Cluster markers for map display (use city-level precision for overview)
  $: clusters = markers.length > 20 ? clusterMarkers(markers, zoomToPrecision(8)) : []

  // Member positions: latest check-in per member
  $: memberPositions = $mapLayers.memberPositions ? deriveMemberPositions(allMarkers) : []

  // Sync member position layer
  $: if (leaflet && map && memberPositionLayerGroup) syncMemberPositions(memberPositions)

  function syncMemberPositions(positions: ChannelMarker[]) {
    if (!leaflet || !memberPositionLayerGroup) return
    memberPositionLayerGroup.clearLayers()
    for (const m of positions) {
      const icon = leaflet.divIcon({
        className: "navcom-marker-icon",
        html: `<div class="navcom-marker-shell" style="border-color: #6366f1; color: #6366f1">👤</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 26],
        popupAnchor: [0, -20],
      })
      const pin = leaflet
        .marker([m.lat, m.lng], {icon})
        .bindPopup(`<div class="text-xs text-nc-text">Member: ${m.author.slice(0, 8)}…</div>`, {
          className: "navcom-popup-shell",
          maxWidth: 260,
        })
      memberPositionLayerGroup.addLayer(pin)
    }
  }

  function filterMarkers(
    all: ChannelMarker[],
    layers: MapLayerConfig,
    range: TimeRange,
  ): ChannelMarker[] {
    const now = Math.floor(Date.now() / 1000)
    const cutoff =
      range === "1h"
        ? now - 3600
        : range === "24h"
          ? now - 86400
          : range === "7d"
            ? now - 604800
            : 0

    return all.filter(m => {
      // Layer filter
      if (m.type === "check-in" && !layers.checkIns) return false
      if (m.type === "alert" && !layers.alerts) return false
      if (m.type === "sitrep" && !layers.sitreps) return false
      if (m.type === "spotrep" && !layers.spotreps) return false
      // Time filter
      if (cutoff > 0 && m.timestamp < cutoff) return false
      return true
    })
  }

  // Sync markers onto Leaflet map whenever they change
  $: if (leaflet && map && markerLayerGroup) syncMarkers(markers)

  function syncMarkers(mkrs: ChannelMarker[]) {
    if (!leaflet || !markerLayerGroup) return
    markerLayerGroup.clearLayers()
    for (const m of mkrs) {
      const style = MARKER_STYLES[m.type]
      const opacity = m.attested ? 1.0 : 0.5
      const borderStyle = m.attested
        ? "border: 2px solid rgba(34,197,94,0.8)"
        : "border: 2px dashed rgba(156,163,175,0.6)"
      const icon = leaflet.divIcon({
        className: "navcom-marker-icon",
        html: `<div class="navcom-marker-shell" style="border-color: ${style.color}; color: ${style.color}; opacity: ${opacity}; ${borderStyle}">${style.icon}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 26],
        popupAnchor: [0, -20],
      })
      const attestLabel = m.attested
        ? "✦ Attested"
        : "<span style='opacity:0.6'>Not attested</span>"
      const pin = leaflet
        .marker([m.lat, m.lng], {icon})
        .bindPopup(
          `<div class="text-xs text-nc-text">${m.preview || m.type}<div class="mt-1">${attestLabel}</div></div>`,
          {
            className: "navcom-popup-shell",
            maxWidth: 260,
          },
        )
      pin.on("click", () => handleMarkerClick(m))
      markerLayerGroup.addLayer(pin)
    }
    // Fit bounds if markers exist and map hasn't been manually positioned
    if (mkrs.length > 0) {
      const bounds = leaflet.latLngBounds(mkrs.map(m => [m.lat, m.lng]))
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), {maxZoom: 14})
    }
  }

  function switchTileSet(id: TileSetId) {
    if (!leaflet || !map) return
    if (tileLayer) map.removeLayer(tileLayer)
    const ts = TILE_URLS[id]
    tileLayer = leaflet.tileLayer(ts.url, {attribution: ts.attribution, maxZoom: 19}).addTo(map)
  }

  async function initMap() {
    const mod = await import("leaflet")
    await import("leaflet/dist/leaflet.css")
    leaflet = (mod as any).default ?? mod

    const vp = $mapViewport
    map = leaflet.map(mapContainer, {zoomControl: true, minZoom: 2})
    map.setView(vp.center, vp.zoom)

    switchTileSet($mapTileSet)
    markerLayerGroup = leaflet.layerGroup().addTo(map)
    memberPositionLayerGroup = leaflet.layerGroup().addTo(map)

    // Persist viewport on move
    map.on("moveend", () => {
      if (!map) return
      const c = map.getCenter()
      mapViewport.set({center: [c.lat, c.lng], zoom: map.getZoom()})
    })

    // Sync markers after init
    syncMarkers(markers)
  }

  // React to tile set changes
  const unsubTileSet = mapTileSet.subscribe(id => {
    if (map && leaflet) switchTileSet(id)
  })

  onMount(() => {
    initMap()
    acquireUserLocation()
    const handleResize = () => map?.invalidateSize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  function acquireUserLocation() {
    if (!navigator.geolocation) {
      gpsAvailable = false
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        userCoords = [pos.coords.latitude, pos.coords.longitude]
        showUserLocationOnMap()
      },
      () => {
        gpsAvailable = false
      },
      {timeout: 8000},
    )
  }

  function showUserLocationOnMap() {
    if (!leaflet || !map || !userCoords) return
    if (userLocationMarker) {
      map.removeLayer(userLocationMarker)
    }
    userLocationMarker = leaflet
      .circleMarker(userCoords, {
        radius: 8,
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
        color: "#93c5fd",
        weight: 3,
        opacity: 0.6,
      })
      .bindPopup('<div class="text-xs text-nc-text">Your location</div>', {
        className: "navcom-popup-shell",
      })
      .addTo(map)
  }

  function centerOnMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        userCoords = [pos.coords.latitude, pos.coords.longitude]
        showUserLocationOnMap()
        if (map) map.flyTo(userCoords, 14)
      },
      () => {},
      {timeout: 5000},
    )
  }

  // Update user marker when map/leaflet become available
  $: if (leaflet && map && userCoords) showUserLocationOnMap()

  onDestroy(() => {
    unsubTileSet()
    if (map) {
      map.remove()
      map = null
    }
  })

  function handleMarkerClick(marker: ChannelMarker) {
    selectedMessageId.set(marker.id)
    if (isMobile) drawerState = "half"
  }

  // Drawer state for mobile
  type DrawerState = "peek" | "half" | "full"
  let drawerState: DrawerState = "peek"
  let dragging = false
  let startY = 0
  let startHeight = 0

  const PEEK = 60
  $: HALF = typeof window !== "undefined" ? window.innerHeight * 0.5 : 400
  $: FULL = typeof window !== "undefined" ? window.innerHeight * 0.85 : 700
  $: drawerHeight = drawerState === "peek" ? PEEK : drawerState === "half" ? HALF : FULL

  function snapToNearest(y: number): DrawerState {
    const distances: [number, DrawerState][] = [
      [Math.abs(y - PEEK), "peek"],
      [Math.abs(y - HALF), "half"],
      [Math.abs(y - FULL), "full"],
    ]
    distances.sort((a, b) => a[0] - b[0])
    return distances[0][1]
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true
    startY = e.clientY
    startHeight = drawerHeight
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    const delta = startY - e.clientY
    const next = Math.max(PEEK, Math.min(FULL, startHeight + delta))
    drawerState = snapToNearest(next)
  }

  function onPointerUp() {
    dragging = false
  }

  function selectChannelFromMap(id: string) {
    setActiveChannel(id)
    drawerState = "half"
  }

  function openChannelChat() {
    if ($activeChannel) {
      setMode("comms")
      router.at(`/groups/${$activeChannel}/chat`).open()
    }
  }

  function getUnread(id: string): number {
    return $unreadGroupMessageCounts.get(id) || 0
  }

  async function handleDrawSubmit(
    e: CustomEvent<{content: string; geoType: string; geojson: string; label: string}>,
  ) {
    if (!$activeChannel) return
    const {content, geoType, geojson, label} = e.detail
    const extraTags: string[][] = [
      ["msg-type", "geo-annotation"],
      ["geo-type", geoType],
      ["geojson", geojson],
    ]
    if (label) extraTags.push(["label", label])
    await publishGroupMessage({groupId: $activeChannel, content, extraTags})
    showLayerPanel = false
  }
</script>

<svelte:window bind:innerWidth />

<div class="relative h-full w-full overflow-hidden">
  <!-- Map container with real Leaflet -->
  <div class="absolute inset-0 bg-nc-shell-deep">
    <!-- Tools button -->
    <button
      class="bg-nc-shell-bg/90 absolute right-3 top-3 z-nav rounded-lg border border-nc-shell-border px-3 py-2 text-xs text-nc-text backdrop-blur-sm transition-colors hover:bg-nc-shell-border"
      class:hidden={showLayerPanel}
      on:click={() => (showLayerPanel = true)}
      aria-label={$t("map.tools.aria")}>
      <i class="fa fa-sliders mr-1 text-sm" />
      {$t("map.tools.label")}
    </button>

    {#if gpsAvailable}
      <button
        class="bg-nc-shell-bg/90 text-blue-400 absolute bottom-3 left-3 z-nav rounded-lg border border-nc-shell-border px-2.5 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-nc-shell-border"
        on:click={centerOnMe}
        title="Center on my location"
        style={isMobile ? "margin-bottom: var(--mode-tab-height)" : ""}>
        <i class="fa fa-crosshairs" />
      </button>
    {/if}

    {#if showLayerPanel}
      <MapLayerPanel on:close={() => (showLayerPanel = false)} on:drawSubmit={handleDrawSubmit} />
    {/if}

    <div
      bind:this={mapContainer}
      class="h-full w-full"
      aria-label={$t("map.header.selectChannel")}
      aria-busy={!map} />

    <!-- Marker summary strip -->
    {#if markers.length > 0}
      <div
        class="bg-nc-shell-deep/80 absolute bottom-0 left-0 right-0 z-feature flex gap-2 overflow-x-auto border-t border-nc-shell-border px-3 py-2 backdrop-blur-sm"
        style={isMobile ? "margin-bottom: var(--mode-tab-height)" : ""}>
        {#if clusters.length > 0}
          {#each clusters as cl, i (i)}
            <button
              class="bg-nc-shell-bg flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-nc-shell-border"
              style="border-color: {CLUSTER_COLORS[cl.style]}"
              on:click={() => {
                if (cl.markers[0]) handleMarkerClick(cl.markers[0])
              }}
              aria-label={$t("map.cluster.aria", {values: {count: cl.count}})}>
              <span class="font-bold" style="color: {CLUSTER_COLORS[cl.style]}">{cl.count}</span>
              <span class="text-nc-text-muted">{$t("map.cluster.markerLabel")}</span>
            </button>
          {/each}
        {:else}
          {#each markers.slice(0, 12) as m (m.id)}
            {@const style = MARKER_STYLES[m.type]}
            <button
              class="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors
              {$selectedMarkerId === m.id
                ? 'bg-nc-shell-border ring-1 ring-accent'
                : 'bg-nc-shell-bg hover:bg-nc-shell-border'}"
              on:click={() => handleMarkerClick(m)}
              on:mouseenter={() => selectedMarkerId.set(m.id)}
              on:mouseleave={() => selectedMarkerId.set(null)}>
              <span style="color: {style.color}">{style.icon}</span>
              <span class="max-w-[80px] truncate text-nc-text">{m.preview || m.type}</span>
            </button>
          {/each}
          {#if markers.length > 12}
            <span class="flex-shrink-0 self-center px-2 text-xs text-nc-text-muted"
              >+{markers.length - 12} {$t("map.markers.more")}</span>
          {/if}
        {/if}
      </div>
    {/if}
  </div>

  {#if isMobile}
    <!-- Mobile: Bottom sheet drawer -->
    <div
      class="absolute bottom-0 left-0 right-0 z-nav rounded-t-xl border-t border-nc-shell-border bg-nc-shell-deep transition-all"
      style="height: {drawerHeight}px; margin-bottom: var(--mode-tab-height);">
      <!-- Drag handle -->
      <div
        class="flex h-8 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}>
        <div class="h-1 w-10 rounded-full bg-nc-shell-border" />
      </div>

      {#if drawerState === "peek"}
        <!-- Peek: channel name + unread -->
        <button
          class="flex w-full items-center justify-between px-4 text-left"
          on:click={() => (drawerState = "half")}>
          <span class="truncate text-sm text-nc-text">{channelTitle}</span>
          {#if $activeChannel}
            {@const unread = getUnread($activeChannel)}
            {#if unread > 0}
              <span
                class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-neutral-900">
                {unread}
              </span>
            {/if}
          {/if}
        </button>
      {:else}
        <!-- Half / Full: channel list or conversation preview -->
        <div class="flex h-[calc(100%-2rem)] flex-col overflow-y-auto px-4">
          {#if $activeChannel && projection}
            <div
              class="mb-2 flex items-center justify-between border-b border-nc-shell-border pb-2">
              <span class="text-sm font-medium text-nc-text">{channelTitle}</span>
              <button class="text-xs text-accent hover:underline" on:click={openChannelChat}
                >{$t("map.action.openChat")}</button>
            </div>
            <p class="text-xs text-nc-text-muted">{$t("map.hint.openChat")}</p>
          {:else}
            <p class="mb-2 text-xs text-nc-text-muted">{$t("map.drawer.selectChannel")}</p>
            {#each $groupSummaries as ch (ch.id)}
              {@const u = getUnread(ch.id)}
              <button
                class="border-nc-shell-border/40 hover:bg-nc-shell-border/40 flex w-full items-center justify-between border-b py-2 text-left text-sm"
                on:click={() => selectChannelFromMap(ch.id)}>
                <span class="truncate text-nc-text">{ch.title || $t("channel.title.unnamed")}</span>
                {#if u > 0}
                  <span
                    class="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-neutral-900"
                    >{u}</span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Desktop: Fixed right comms pane -->
    <aside
      class="absolute bottom-0 right-0 top-0 z-feature flex w-80 flex-col border-l border-nc-shell-border bg-nc-shell-deep">
      <header class="flex items-center justify-between border-b border-nc-shell-border px-3 py-3">
        <span class="truncate text-sm font-medium text-nc-text">{channelTitle}</span>
        {#if $activeChannel}
          <button class="text-xs text-accent hover:underline" on:click={openChannelChat}
            >{$t("map.action.openShort")}</button>
        {/if}
      </header>
      <div class="flex-1 overflow-y-auto p-3">
        {#if $activeChannel && projection}
          <p class="text-xs text-nc-text-muted">{$t("map.hint.openComms")}</p>
        {:else}
          <p class="mb-2 text-xs text-nc-text-muted">{$t("map.sidebar.channelsLabel")}</p>
          {#each $groupSummaries as ch (ch.id)}
            {@const u = getUnread(ch.id)}
            <button
              class="border-nc-shell-border/40 hover:bg-nc-shell-border/40 flex w-full items-center justify-between rounded border-b px-1 py-2 text-left text-sm"
              on:click={() => {
                setActiveChannel(ch.id)
              }}>
              <span class="truncate text-nc-text">{ch.title || $t("channel.title.unnamed")}</span>
              {#if u > 0}
                <span
                  class="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-neutral-900"
                  >{u}</span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </aside>
  {/if}
</div>
