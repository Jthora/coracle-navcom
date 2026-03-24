<script lang="ts">
  import Popover from "src/partials/Popover.svelte"
  import {
    groupMemberPresence,
    getGroupHealth,
    getGroupPresenceSummary,
  } from "src/app/groups/presence"
  import type {GroupHealthLevel} from "src/app/groups/presence"

  export let groupId: string

  $: health = groupId ? getGroupHealth($groupMemberPresence, groupId) : "cold"
  $: summary = groupId ? getGroupPresenceSummary($groupMemberPresence, groupId) : {active: 0, recent: 0, cold: 0, unknown: 0}

  const emojiMap: Record<GroupHealthLevel, string> = {
    healthy: "🟢",
    degraded: "🟡",
    cold: "🔴",
  }
</script>

{#if groupId}
  <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
    <span slot="trigger" role="img" aria-label="Group health: {health}">
      {emojiMap[health]}
    </span>
    <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
      {summary.active} active, {summary.recent} recent, {summary.cold} cold{#if summary.unknown > 0}, {summary.unknown} unknown{/if}
    </div>
  </Popover>
{/if}
