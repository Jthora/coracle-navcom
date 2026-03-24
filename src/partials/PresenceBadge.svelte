<script lang="ts">
  import Popover from "src/partials/Popover.svelte"
  import {groupMemberPresence, getMemberPresence} from "src/app/groups/presence"
  import type {PresenceStatus} from "src/app/groups/presence"

  export let pubkey: string
  export let groupId: string

  $: status = pubkey && groupId ? getMemberPresence($groupMemberPresence, groupId, pubkey) : "unknown"

  const colorMap: Record<PresenceStatus, string> = {
    active: "bg-success",
    recent: "bg-warning",
    cold: "bg-neutral",
    unknown: "bg-transparent",
  }

  function formatDuration(presenceMap: Map<string, Map<string, {lastSeen: number; status: string}>>, gId: string, pk: string): string {
    const lastSeen = presenceMap.get(gId)?.get(pk)?.lastSeen || 0
    if (lastSeen <= 0) return "No activity"

    const delta = Math.floor(Date.now() / 1000) - lastSeen
    if (delta < 60) return "Just now"
    if (delta < 3600) return `${Math.floor(delta / 60)} min ago`
    if (delta < 86400) return `${Math.floor(delta / 3600)} hr ago`
    return `${Math.floor(delta / 86400)} days ago`
  }

  $: duration = pubkey && groupId ? formatDuration($groupMemberPresence, groupId, pubkey) : "No activity"
</script>

{#if pubkey && groupId}
  <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
    <span slot="trigger">
      <span
        class="inline-block h-2.5 w-2.5 rounded-full {colorMap[status]}"
        role="img"
        aria-label="{status} — {duration}" />
    </span>
    <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
      {duration}
    </div>
  </Popover>
{/if}
