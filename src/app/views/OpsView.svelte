<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import {t} from "svelte-i18n"
  import {displayProfileByPubkey} from "@welshman/app"
  import {setMode, setActiveChannel, mapViewport, mapTileSet} from "src/app/navcom-mode"
  import type {TileSetId} from "src/app/navcom-mode"
  import {groupSummaries, unreadGroupMessageCounts, groupProjections} from "src/app/groups/state"
  import {classifyGroupEventKind} from "src/domain/group-kinds"
  import GroupHealthBadge from "src/partials/GroupHealthBadge.svelte"
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

  // Activity feed: derive real events from group projections
  const MSG_TYPE_ICONS: Record<string, string> = {
    alert: "🚨",
    sitrep: "📋",
    "check-in": "📍",
    spotrep: "📌",
  }

  type ActivityItem = {
    id: string
    groupId: string
    groupTitle: string
    msgType: string | null
    author: string
    timestamp: number
  }

  $: recentActivity = (() => {
    const items: ActivityItem[] = []
    for (const [gid, proj] of $groupProjections.entries()) {
      const title = proj.group.title || gid
      for (const ev of proj.sourceEvents) {
        if (classifyGroupEventKind(ev.kind) !== "message") continue
        const msgTypeTag = ev.tags.find(t => t[0] === "msg-type")
        items.push({
          id: ev.id,
          groupId: gid,
          groupTitle: title,
          msgType: msgTypeTag ? msgTypeTag[1] : null,
          author: ev.pubkey,
          timestamp: ev.created_at,
        })
      }
    }
    items.sort((a, b) => b.timestamp - a.timestamp)
    return items.slice(0, 8)
  })()

  function getActivityIcon(msgType: string | null): string {
    if (msgType && MSG_TYPE_ICONS[msgType]) return MSG_TYPE_ICONS[msgType]
    return "💬"
  }

  function getActivityLabel(msgType: string | null): string {
    if (msgType) return msgType.replace("-", " ")
    return "message"
  }

  // Per-group message type counts
  function getMsgTypeCounts(groupId: string): Record<string, number> {
    const proj = $groupProjections.get(groupId)
    if (!proj) return {}
    const counts: Record<string, number> = {}
    for (const ev of proj.sourceEvents) {
      if (classifyGroupEventKind(ev.kind) !== "message") continue
      const tag = ev.tags.find(t => t[0] === "msg-type")
      const key = tag ? tag[1] : "message"
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }

  // Per-group member role distribution
  function getRoleCounts(groupId: string): Record<string, number> {
    const proj = $groupProjections.get(groupId)
    if (!proj) return {}
    const counts: Record<string, number> = {}
    for (const m of Object.values(proj.members)) {
      if (m.status !== "active") continue
      counts[m.role] = (counts[m.role] || 0) + 1
    }
    return counts
  }

  function relativeTime(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }
</script>

<svelte:window bind:innerWidth />

<div class={isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"}>
  <!-- Map Thumbnail -->
  <button
    class="bg-nc-shell-bg/50 overflow-hidden rounded-xl border border-nc-shell-border text-left transition-colors hover:border-nc-shell-border"
    on:click={openMapMode}>
    <div bind:this={thumbnailContainer} class="h-48 w-full bg-nc-shell-deep" />
    <div class="flex items-center justify-between px-3 py-2">
      <span class="text-xs uppercase tracking-wider text-nc-text-muted">{$t("ops.map.label")}</span>
      <i class="fa fa-arrow-right text-xs text-nc-text-muted" />
    </div>
  </button>

  <!-- Channel Status Grid -->
  <div class="bg-nc-shell-bg/50 overflow-hidden rounded-xl border border-nc-shell-border">
    <div class="border-b border-nc-shell-border px-3 py-2">
      <span class="text-xs uppercase tracking-wider text-nc-text-muted"
        >{$t("ops.channels.label")}</span>
    </div>
    <div class="divide-nc-shell-border/40 divide-y">
      {#each $groupSummaries as ch (ch.id)}
        {@const unread = getUnread(ch.id)}
        {@const typeCounts = getMsgTypeCounts(ch.id)}
        {@const roleCounts = getRoleCounts(ch.id)}
        <button
          class="hover:bg-nc-shell-bg/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
          on:click={() => openChannel(ch.id)}>
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-nc-input text-nc-text">
            {#if ch.picture}
              <img src={ch.picture} alt="" class="h-8 w-8 rounded object-cover" />
            {:else}
              <i class="fa fa-users text-xs" />
            {/if}
          </div>
          <div class="min-w-0 flex-1">
            <span class="block truncate text-sm text-nc-text">
              {ch.title || $t("channel.title.unnamed")}
              <GroupHealthBadge groupId={ch.id} />
            </span>
            <span class="text-[11px] text-nc-text-muted"
              >{getEncryptionLabel(ch)} · {$t("ops.channel.members", {
                values: {count: ch.memberCount},
              })}</span>
            <div class="mt-0.5 flex flex-wrap gap-1">
              {#each Object.entries(typeCounts) as [type, count]}
                <span class="bg-nc-input/60 rounded px-1 py-0.5 text-[10px] text-nc-text-muted">
                  {MSG_TYPE_ICONS[type] || "💬"}{count}
                </span>
              {/each}
              {#each Object.entries(roleCounts) as [role, count]}
                <span class="bg-nc-input/40 rounded px-1 py-0.5 text-[10px] text-nc-text-muted">
                  {role}:{count}
                </span>
              {/each}
            </div>
          </div>
          {#if unread > 0}
            <span
              class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-neutral-900">
              {unread > 99 ? $t("common.badge.overflow") : unread}
            </span>
          {/if}
        </button>
      {:else}
        <div class="px-3 py-4 text-center text-xs text-nc-text-muted">{$t("ops.channels.empty")}</div>
      {/each}
    </div>
  </div>

  <!-- Recent Activity Feed (spans full width on desktop) -->
  <div class={isMobile ? "" : "col-span-2"}>
    <div class="bg-nc-shell-bg/50 overflow-hidden rounded-xl border border-nc-shell-border">
      <div class="border-b border-nc-shell-border px-3 py-2">
        <span class="text-xs uppercase tracking-wider text-nc-text-muted"
          >{$t("ops.activity.label")}</span>
      </div>
      <div class="divide-nc-shell-border/40 divide-y">
        {#each recentActivity as item (item.id)}
          <button
            class="hover:bg-nc-shell-bg/60 flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
            on:click={() => openChannel(item.groupId)}>
            <span class="w-12 shrink-0 text-[11px] tabular-nums text-nc-text-muted">
              {relativeTime(item.timestamp)}
            </span>
            <span class="text-sm">{getActivityIcon(item.msgType)}</span>
            <div class="min-w-0 flex-1">
              <span class="truncate text-sm text-nc-text">
                {displayProfileByPubkey(item.author)} · {getActivityLabel(item.msgType)}
              </span>
              <span class="block truncate text-[11px] text-nc-text-muted">{item.groupTitle}</span>
            </div>
          </button>
        {:else}
          <div class="px-3 py-4 text-center text-xs text-nc-text-muted">
            {$t("ops.activity.empty")}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
