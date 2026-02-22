<script lang="ts">
  import {onMount} from "svelte"
  import Link from "src/partials/Link.svelte"
  import {
    ensureGroupsHydrated,
    groupSummaries,
    groupsHydrated,
    unreadGroupMessageCounts,
  } from "src/app/groups/state"
  import {resolveGroupSecurityState} from "src/app/groups/security-state"

  export let guardMessage = ""
  export let guardFrom = ""

  const toGroupHref = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/chat`
  const getUnreadCount = (groupId: string) => $unreadGroupMessageCounts.get(groupId) || 0
  const getSecurityState = (transportMode: "baseline-nip29" | "secure-nip-ee") =>
    resolveGroupSecurityState({transportMode})

  onMount(() => {
    ensureGroupsHydrated()
    document.title = "Groups"
  })
</script>

<div class="panel p-4">
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <i class="fa fa-users text-accent" />
      <h2 class="text-lg uppercase tracking-[0.08em]">Groups</h2>
    </div>
    <Link class="btn btn-accent" href="/groups/create">
      <i class="fa-solid fa-plus" /> Create
    </Link>
  </div>
  <p class="mt-3 text-neutral-300">Relay-managed groups you can browse, join, and administer.</p>
  {#if guardMessage}
    <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
      <div>{guardMessage}</div>
      {#if guardFrom}
        <div class="mt-1 text-xs text-neutral-300">Redirected from {guardFrom}</div>
      {/if}
      <div class="mt-2">
        <Link class="btn" href="/groups/create">Open Join Flow</Link>
      </div>
    </div>
  {/if}
</div>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-neutral-300">Loading groups…</div>
{:else}
  {#each $groupSummaries as group (group.id)}
    <Link class="panel block p-4" href={toGroupHref(group.id)}>
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="font-semibold text-neutral-50">{group.title}</h3>
          <p class="mt-1 text-sm text-neutral-300">{group.description || "No description yet."}</p>
        </div>
        <div class="text-right text-xs text-neutral-400">
          {#if getUnreadCount(group.id) > 0}
            <div
              class="mb-1 inline-flex items-center gap-1 rounded border border-accent px-2 py-0.5 text-accent">
              <i class="fa fa-bell" />
              {getUnreadCount(group.id)}
            </div>
          {/if}
          <div>{group.memberCount} members</div>
          <div>{group.protocol.toUpperCase()}</div>
          <div>{getSecurityState(group.transportMode).label}</div>
        </div>
      </div>
    </Link>
  {:else}
    <div class="panel p-6 text-center text-neutral-200">
      <p>No groups available yet.</p>
      <p class="mt-2 text-sm text-neutral-400">
        Create a group or open a shared invite link to begin.
      </p>
    </div>
  {/each}
{/if}
