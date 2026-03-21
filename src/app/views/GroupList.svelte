<script lang="ts">
  import {onMount} from "svelte"
  import Link from "src/partials/Link.svelte"
  import Popover from "src/partials/Popover.svelte"
  import {
    ensureGroupsHydrated,
    groupSummaries,
    groupsHydrated,
    unreadGroupMessageCounts,
  } from "src/app/groups/state"
  import GroupBreadcrumbs from "src/app/groups/GroupBreadcrumbs.svelte"
  import {buildGroupBreadcrumbItems} from "src/app/groups/breadcrumbs"
  import {resolveGroupSecurityState} from "src/app/groups/security-state"

  export let guardMessage = ""
  export let guardFrom = ""

  const toGroupOverviewHref = (groupId: string) => `/groups/${encodeURIComponent(groupId)}`
  const toGroupChatHref = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/chat`
  const getUnreadCount = (groupId: string) => $unreadGroupMessageCounts.get(groupId) || 0
  const isOpaqueGroupId = (value: string) => /^[a-f0-9]{32,}$/i.test(value)
  const getGroupTitle = (group: (typeof $groupSummaries)[number]) =>
    group.title === group.id && isOpaqueGroupId(group.id)
      ? `${group.id.slice(0, 12)}…${group.id.slice(-8)}`
      : group.title
  const showFullGroupId = (group: (typeof $groupSummaries)[number]) =>
    group.title === group.id && isOpaqueGroupId(group.id)
  const breadcrumbs = buildGroupBreadcrumbItems({section: "list"})
  const getSecurityState = (transportMode: "baseline-nip29" | "secure-nip-ee") =>
    resolveGroupSecurityState({transportMode})

  onMount(() => {
    ensureGroupsHydrated()
    document.title = "Groups | NavCom"
  })
</script>

<div class="panel p-4">
  <GroupBreadcrumbs items={breadcrumbs} />
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <i class="fa fa-users text-accent" />
      <h2 class="text-lg uppercase tracking-[0.08em]">Groups</h2>
      <Popover triggerType="mouseenter" placement="bottom-start" opts={{maxWidth: 320}}>
        <button
          slot="trigger"
          class="text-neutral-400 transition hover:text-neutral-200"
          type="button"
          aria-label="Groups info">
          <i class="fa fa-info-circle" />
        </button>
        <div slot="tooltip" class="space-y-2 text-sm text-neutral-200">
          <p>Relay-managed groups you can browse, join, and administer.</p>
          <p>Security labels are shown on each group card and expanded in Chat/Settings.</p>
        </div>
      </Popover>
    </div>
    <div class="flex items-center gap-2">
      <Link class="btn" href="/groups/create?flow=join">
        <i class="fa-solid fa-right-to-bracket" /> Join
      </Link>
      <Link class="btn btn-accent" href="/groups/create">
        <i class="fa-solid fa-plus" /> Create
      </Link>
    </div>
  </div>
  {#if guardMessage}
    <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
      <div>{guardMessage}</div>
      {#if guardFrom}
        <div class="mt-1 text-xs text-neutral-300">Redirected from {guardFrom}</div>
      {/if}
      <div class="mt-1 text-xs text-neutral-300">
        Next step: create a new group, join from invite, or select an existing group below.
      </div>
      <div class="mt-2 flex gap-2">
        <Link class="btn" href="/groups/create?flow=join">Join from Invite</Link>
        <Link class="btn" href="/groups/create">Create Group</Link>
      </div>
    </div>
  {/if}
</div>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-neutral-300">Loading groups…</div>
{:else}
  {#each $groupSummaries as group (group.id)}
    <div class="panel p-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <Link
            class="font-semibold text-neutral-50 hover:text-neutral-200"
            href={toGroupOverviewHref(group.id)}>{getGroupTitle(group)}</Link>
          {#if showFullGroupId(group)}
            <p class="mt-1 font-mono text-xs text-neutral-500">{group.id}</p>
          {/if}
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
          <div>
            <span
              class="inline-flex rounded border border-neutral-700 px-2 py-0.5 text-neutral-300"
              title={getSecurityState(group.transportMode).hint}>
              {getSecurityState(group.transportMode).label}
            </span>
          </div>
        </div>
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <Link class="btn" href={toGroupOverviewHref(group.id)}>Overview</Link>
        <Link class="btn btn-accent" href={toGroupChatHref(group.id)}>Open Chat</Link>
      </div>
    </div>
  {:else}
    <div class="panel p-6 text-center text-neutral-200">
      <p>No groups available yet.</p>
      <p class="mt-2 text-sm text-neutral-400">Join from invite or create a group to begin.</p>
    </div>
  {/each}
{/if}
