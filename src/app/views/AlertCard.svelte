<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {asShortKey} from "src/util/nostr"

  export let message: TrustedEvent

  $: priorityTag = message.tags.find(t => t[0] === "priority")
  $: priority = (priorityTag ? priorityTag[1] : "medium") as "low" | "medium" | "high"

  const borderColor: Record<string, string> = {
    high: "border-red-500/60 bg-red-900/20",
    medium: "border-amber-500/60 bg-amber-900/20",
    low: "border-yellow-600/40 bg-yellow-900/10",
  }

  const labelColor: Record<string, string> = {
    high: "text-red-400",
    medium: "text-amber-400",
    low: "text-yellow-400",
  }

  $: colors = borderColor[priority] || borderColor.medium
  $: label = labelColor[priority] || labelColor.medium

  function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
  }
</script>

<div class="rounded border px-3 py-2 text-sm {colors}">
  <div class="flex items-center gap-2 text-xs font-semibold {label}">
    <span>🚨 ALERT — {priority.toUpperCase()} PRIORITY</span>
  </div>
  <div class="mt-1 flex items-center gap-2 text-xs text-nc-text-muted">
    <span class="font-mono">{asShortKey(message.pubkey)}</span>
    <span>•</span>
    <span>{formatTimestamp(message.created_at)}</span>
  </div>
  <div class="mt-1 whitespace-pre-wrap break-words text-nc-text">{message.content}</div>
</div>
