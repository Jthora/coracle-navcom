<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {t} from "svelte-i18n"
  import {setMode, setActiveChannel, mapViewport, mapTileSet} from "src/app/navcom-mode"
  import type {TileSetId} from "src/app/navcom-mode"
  import {groupSummaries, unreadGroupMessageCounts} from "src/app/groups/state"
  import {router} from "src/app/util/router"
  import type {GroupSummaryListItem} from "src/domain/group-selectors"

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

  let innerWidth = 0
  $: isMobile = innerWidth < 1024

  let thumbnailContainer: HTMLDivElement
  let leaflet: LeafletLike | null = null
  let thumbnailMap: any = null

  async function initThumbnail() {
    if (!thumbnailContainer) return
    const mod = await import("leaflet")
    await import("leaflet/dist/leaflet.css")
    leaflet = (mod as any).default ?? mod

    const vp = $mapViewport
    thumbnailMap = leaflet.map(thumbnailContainer, {
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
    thumbnailMap.setView(vp.center, Math.max(vp.zoom - 1, 2))

    const ts = TILE_URLS[$mapTileSet]
    leaflet.tileLayer(ts.url, {maxZoom: 19}).addTo(thumbnailMap)
  }

  onMount(() => {
    initThumbnail()
  })
  onDestroy(() => {
    if (thumbnailMap) {
      thumbnailMap.remove()
      thumbnailMap = null
    }
  })

  function getUnread(id: string): number {
    return $unreadGroupMessageCounts.get(id) || 0
  }

  function getEncryptionLabel(item: GroupSummaryListItem): string {
    if (item.transportMode === "secure-nip-ee") return $t("encryption.label.e2e")
    return $t("encryption.label.open")
  }

  function openMapMode() {
    setMode("map")
  }

  function openChannel(id: string) {
    setActiveChannel(id)
    setMode("comms")
    router.at(`/groups/${id}/chat`).open()
  }

  // Activity feed: basic stub pulling from groupSummaries as proxy
  // Real implementation in Phase 3 will use typed message events
  $: recentActivity = $groupSummaries
    .filter(ch => ch.lastUpdated)
    .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
    .slice(0, 8)
    .map(ch => ({
      id: ch.id,
      title: ch.title || $t("ops.activity.defaultTitle"),
      lastUpdated: ch.lastUpdated || 0,
      type: "activity" as const,
    }))
</script>

<svelte:window bind:innerWidth />

<div class={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
  <!-- Map Thumbnail -->
  <button
    class="bg-neutral-800/50 overflow-hidden rounded-xl border border-neutral-700 text-left transition-colors hover:border-neutral-600"
    on:click={openMapMode}>
    <div bind:this={thumbnailContainer} class="h-48 w-full bg-neutral-900" />
    <div class="flex items-center justify-between px-3 py-2">
      <span class="text-xs uppercase tracking-wider text-neutral-400">{$t("ops.map.label")}</span>
      <i class="fa fa-arrow-right text-xs text-neutral-500" />
    </div>
  </button>

  <!-- Channel Status Grid -->
  <div class="bg-neutral-800/50 overflow-hidden rounded-xl border border-neutral-700">
    <div class="border-b border-neutral-700 px-3 py-2">
      <span class="text-xs uppercase tracking-wider text-neutral-400"
        >{$t("ops.channels.label")}</span>
    </div>
    <div class="divide-neutral-800/40 divide-y">
      {#each $groupSummaries as ch (ch.id)}
        {@const unread = getUnread(ch.id)}
        <button
          class="hover:bg-neutral-800/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
          on:click={() => openChannel(ch.id)}>
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-700 text-neutral-300">
            {#if ch.picture}
              <img src={ch.picture} alt="" class="h-8 w-8 rounded object-cover" />
            {:else}
              <i class="fa fa-users text-xs" />
            {/if}
          </div>
          <div class="min-w-0 flex-1">
            <span class="block truncate text-sm text-neutral-100"
              >{ch.title || $t("channel.title.unnamed")}</span>
            <span class="text-[11px] text-neutral-500"
              >{getEncryptionLabel(ch)} · {$t("ops.channel.members", {
                values: {count: ch.memberCount},
              })}</span>
          </div>
          {#if unread > 0}
            <span
              class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-neutral-900">
              {unread > 99 ? $t("common.badge.overflow") : unread}
            </span>
          {/if}
        </button>
      {:else}
        <div class="px-3 py-4 text-center text-xs text-neutral-500">{$t("ops.channels.empty")}</div>
      {/each}
    </div>
  </div>

  <!-- Recent Activity Feed (spans full width on desktop) -->
  <div class={isMobile ? "" : "col-span-2"}>
    <div class="bg-neutral-800/50 overflow-hidden rounded-xl border border-neutral-700">
      <div class="border-b border-neutral-700 px-3 py-2">
        <span class="text-xs uppercase tracking-wider text-neutral-400"
          >{$t("ops.activity.label")}</span>
      </div>
      <div class="divide-neutral-800/40 divide-y">
        {#each recentActivity as item (item.id + item.lastUpdated)}
          <button
            class="hover:bg-neutral-800/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
            on:click={() => openChannel(item.id)}>
            <span class="w-12 shrink-0 text-[11px] tabular-nums text-neutral-500">
              {new Date(item.lastUpdated * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <i class="fa fa-comment text-xs text-neutral-500" />
            <span class="truncate text-sm text-neutral-200"
              >{$t("ops.activity.description", {values: {title: item.title}})}</span>
          </button>
        {:else}
          <div class="px-3 py-4 text-center text-xs text-neutral-500">
            {$t("ops.activity.empty")}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
