<script lang="ts">
  import {groupProjections} from "src/app/groups/state"
  import {classifyGroupEventKind} from "src/domain/group-kinds"
  import {displayProfileByPubkey} from "@welshman/app"

  export let config: Record<string, unknown> | undefined = undefined

  const maxItems = (config?.maxItems as number) ?? 8

  const MSG_TYPE_ICONS: Record<string, string> = {
    alert: "🚨",
    sitrep: "📋",
    "check-in": "📍",
    spotrep: "🔭",
    message: "💬",
  }

  type ActivityItem = {
    id: string
    groupTitle: string
    msgType: string
    author: string
    timestamp: number
  }

  $: recentActivity = (() => {
    const items: ActivityItem[] = []
    for (const [, proj] of $groupProjections.entries()) {
      for (const event of proj.sourceEvents) {
        if (classifyGroupEventKind(event.kind) !== "message") continue
        const msgType = event.tags?.find((t: string[]) => t[0] === "msg-type")?.[1] || "message"
        items.push({
          id: event.id,
          groupTitle: proj.group.title || "Unknown",
          msgType,
          author: event.pubkey,
          timestamp: event.created_at,
        })
      }
    }
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems)
  })()

  function relativeTime(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="shrink-0 px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Activity
  </h4>
  <div class="flex-1 overflow-y-auto px-2 pb-2">
    {#each recentActivity as item (item.id)}
      <div class="border-nc-shell-border/30 flex items-center gap-2 border-b py-1 text-xs">
        <span class="w-10 shrink-0 tabular-nums text-nc-text-muted"
          >{relativeTime(item.timestamp)}</span>
        <span>{MSG_TYPE_ICONS[item.msgType] || "💬"}</span>
        <span class="flex-1 truncate text-nc-text">{displayProfileByPubkey(item.author)}</span>
        <span class="shrink-0 truncate text-nc-text-muted">{item.groupTitle}</span>
      </div>
    {:else}
      <p class="py-4 text-center text-xs text-nc-text-muted">No recent activity</p>
    {/each}
  </div>
</div>
