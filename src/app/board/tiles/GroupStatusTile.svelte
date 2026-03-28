<script lang="ts">
  import {groupSummaries, unreadGroupMessageCounts} from "src/app/groups/state"
  import GroupHealthBadge from "src/partials/GroupHealthBadge.svelte"
  import {setActiveChannel, setMode} from "src/app/navcom-mode"
  import {router} from "src/app/util/router"

  export let config: Record<string, unknown> | undefined = undefined

  function openChannel(id: string) {
    setActiveChannel(id)
    setMode("comms")
    router.at(`groups/${id}`).open()
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="shrink-0 px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Groups
  </h4>
  <div class="flex-1 overflow-y-auto px-2 pb-2">
    {#each $groupSummaries as ch (ch.id)}
      {@const unread = $unreadGroupMessageCounts.get(ch.id) || 0}
      <button
        on:click={() => openChannel(ch.id)}
        class="hover:bg-nc-shell-bg/60 flex w-full items-center gap-2 rounded p-1.5 text-left text-xs">
        <GroupHealthBadge groupId={ch.id} />
        <span class="flex-1 truncate font-medium text-nc-text"
          >{ch.title || ch.id.slice(0, 8)}</span>
        {#if unread > 0}
          <span
            class="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-neutral-900">
            {unread > 99 ? "99+" : unread}
          </span>
        {/if}
      </button>
    {:else}
      <p class="py-4 text-center text-xs text-nc-text-muted">No groups</p>
    {/each}
  </div>
</div>
