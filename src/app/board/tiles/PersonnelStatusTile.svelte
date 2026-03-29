<script lang="ts">
  import {groupProjections} from "src/app/groups/state"
  import {groupMemberPresence, getMemberPresence} from "src/app/groups/presence"
  import type {PresenceStatus} from "src/app/groups/presence"
  import {displayProfileByPubkey} from "@welshman/app"
  import {activeChannel} from "src/app/navcom-mode"

  export let config: Record<string, unknown> | undefined = undefined

  const presenceOrder: Record<PresenceStatus, number> = {
    active: 0,
    recent: 1,
    cold: 2,
    unknown: 3,
  }

  const badgeColor: Record<PresenceStatus, string> = {
    active: "bg-success",
    recent: "bg-warning",
    cold: "bg-neutral",
    unknown: "bg-transparent",
  }

  type MemberEntry = {
    pubkey: string
    name: string
    role: string
    status: PresenceStatus
  }

  $: selectedGroup = $activeChannel
  $: proj = selectedGroup ? $groupProjections.get(selectedGroup) : null

  $: members = (() => {
    if (!proj) return [] as MemberEntry[]
    const entries: MemberEntry[] = []
    for (const [pk, m] of Object.entries(proj.members)) {
      if (m.status !== "active") continue
      const status = getMemberPresence($groupMemberPresence, selectedGroup || "", pk)
      entries.push({
        pubkey: pk,
        name: displayProfileByPubkey(pk) || pk.slice(0, 8),
        role: m.role,
        status,
      })
    }
    entries.sort(
      (a, b) => presenceOrder[a.status] - presenceOrder[b.status] || a.name.localeCompare(b.name),
    )
    return entries
  })()
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="shrink-0 px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Personnel
  </h4>
  {#if !selectedGroup}
    <p class="px-2 py-4 text-center text-xs text-nc-text-muted">Select a group to view personnel</p>
  {:else}
    <div class="flex-1 overflow-y-auto px-2 pb-2">
      {#each members as member (member.pubkey)}
        <div class="flex items-center gap-2 py-1 text-xs">
          <span class="h-2 w-2 shrink-0 rounded-full {badgeColor[member.status]}" />
          <span class="flex-1 truncate text-nc-text">{member.name}</span>
          <span class="text-nc-text-muted">{member.role}</span>
        </div>
      {:else}
        <p class="py-4 text-center text-xs text-nc-text-muted">No members</p>
      {/each}
    </div>
  {/if}
</div>
