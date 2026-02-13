<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import Link from "src/partials/Link.svelte"
  import {groupProjections, groupsHydrated} from "src/app/groups/state"
  import {buildGroupDetailViewModel, getGroupRouteSection} from "src/app/groups/selectors"

  export let groupId: string

  $: projection = $groupProjections.get(groupId)
  $: detail = projection ? buildGroupDetailViewModel(projection) : null
  $: section = getGroupRouteSection(window.location.pathname)
  $: sectionTitle =
    section === "overview" ? "Overview" : section[0].toUpperCase() + section.slice(1)
  $: document.title = detail ? `${detail.title} · Groups` : "Group · Groups"

  const toRoute = (nextSection: "overview" | "members" | "moderation" | "settings") => {
    const base = `/groups/${encodeURIComponent(groupId)}`

    return nextSection === "overview" ? base : `${base}/${nextSection}`
  }

  const asShortKey = (pubkey: string) => `${pubkey.slice(0, 8)}…${pubkey.slice(-8)}`
</script>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-neutral-300">Loading group details…</div>
{:else if !detail}
  <div class="panel p-6 text-center text-neutral-200">
    <p>Group not found.</p>
    <p class="mt-2 text-sm text-neutral-400">Check the link or return to the groups list.</p>
    <div class="mt-4">
      <Link class="btn" href="/groups">Back to Groups</Link>
    </div>
  </div>
{:else}
  <div class="panel p-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-neutral-50">{detail.title}</h2>
        <p class="mt-1 text-sm text-neutral-300">
          {detail.description || "No group description yet."}
        </p>
      </div>
      <div class="flex flex-wrap justify-end gap-2 text-xs">
        <span class="rounded border border-neutral-700 px-2 py-1 text-neutral-300">
          {detail.protocol.toUpperCase()}
        </span>
        <span class="rounded border border-neutral-700 px-2 py-1 text-neutral-300">
          {detail.transportMode}
        </span>
        <span class="rounded border border-neutral-700 px-2 py-1" class:text-warning={detail.stale}>
          {detail.stale ? "Stale" : "Live"}
        </span>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm">
      <Link class="btn" href={toRoute("overview")}>Overview</Link>
      <Link class="btn" href={toRoute("members")}>Members</Link>
      <Link class="btn" href={toRoute("moderation")}>Moderation</Link>
      <Link class="btn" href={toRoute("settings")}>Settings</Link>
    </div>

    <div class="mt-4 grid gap-2 text-sm text-neutral-300 sm:grid-cols-3">
      <div class="rounded border border-neutral-700 px-3 py-2">Members: {detail.memberCount}</div>
      <div class="rounded border border-neutral-700 px-3 py-2">
        Active: {detail.activeMemberCount}
      </div>
      <div class="rounded border border-neutral-700 px-3 py-2">
        Pending: {detail.pendingMemberCount}
      </div>
    </div>
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">
      {sectionTitle} · Membership Preview
    </h3>
    {#if detail.memberPreview.length === 0}
      <p class="mt-3 text-sm text-neutral-400">No membership records yet.</p>
    {:else}
      <div class="mt-3 space-y-2">
        {#each detail.memberPreview as member (member.pubkey)}
          <div
            class="flex items-center justify-between rounded border border-neutral-700 px-3 py-2 text-sm">
            <div class="font-mono text-neutral-200">{asShortKey(member.pubkey)}</div>
            <div class="flex items-center gap-3 text-neutral-300">
              <span class="uppercase">{member.role}</span>
              <span class="capitalize">{member.status}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Recent Timeline</h3>
    {#if detail.auditPreview.length === 0}
      <p class="mt-3 text-sm text-neutral-400">No moderation events yet.</p>
    {:else}
      <div class="mt-3 space-y-2">
        {#each detail.auditPreview as entry, i (`${entry.action}-${entry.createdAt}-${i}`)}
          <div class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-neutral-100">{entry.action}</span>
              <span class="text-xs text-neutral-400">{formatTimestamp(entry.createdAt)}</span>
            </div>
            <div class="mt-1 text-xs text-neutral-400">Actor {asShortKey(entry.actor)}</div>
            {#if entry.reason}
              <div class="mt-1 text-neutral-300">{entry.reason}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
