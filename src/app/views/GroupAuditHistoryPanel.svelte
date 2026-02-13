<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import type {GroupProjection} from "src/domain/group"
  import {
    createDefaultGroupAuditFilter,
    createGroupAuditHistoryView,
    DEFAULT_AUDIT_PAGE_SIZE,
    type GroupAuditActorFilter,
  } from "src/app/groups/audit-history"

  export let projection: GroupProjection
  export let actorPubkey: string | undefined = undefined

  let auditFilter = createDefaultGroupAuditFilter()
  let auditVisibleCount = DEFAULT_AUDIT_PAGE_SIZE

  $: auditHistoryView = createGroupAuditHistoryView(projection, {
    actorPubkey,
    cursor: 0,
    pageSize: auditVisibleCount,
    filter: auditFilter,
  })

  const onChangeAuditActionFilter = (value: string) => {
    auditFilter = {
      ...auditFilter,
      action: value,
    }
    auditVisibleCount = DEFAULT_AUDIT_PAGE_SIZE
  }

  const onChangeAuditActorFilter = (value: string) => {
    auditFilter = {
      ...auditFilter,
      actor: value as GroupAuditActorFilter,
    }
    auditVisibleCount = DEFAULT_AUDIT_PAGE_SIZE
  }

  const onLoadMoreAudit = () => {
    auditVisibleCount += DEFAULT_AUDIT_PAGE_SIZE
  }
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Audit & Event History</h3>
  {#if auditHistoryView.total === 0}
    <p class="mt-3 text-sm text-neutral-400">No audit events yet.</p>
  {:else}
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <label class="text-sm text-neutral-300">
        Action filter
        <select
          class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
          bind:value={auditFilter.action}
          on:change={e => onChangeAuditActionFilter(e.currentTarget.value)}>
          {#each auditHistoryView.actions as option}
            <option value={option.value}>{option.label} ({option.count})</option>
          {/each}
        </select>
      </label>

      <label class="text-sm text-neutral-300">
        Actor filter
        <select
          class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
          bind:value={auditFilter.actor}
          on:change={e => onChangeAuditActorFilter(e.currentTarget.value)}>
          {#each auditHistoryView.actors as option}
            <option value={option.value}>{option.label} ({option.count})</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="mt-3 space-y-2">
      {#each auditHistoryView.items as entry, i (`audit-${entry.action}-${entry.createdAt}-${i}`)}
        <div class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-neutral-100">{entry.action}</span>
            <span class="text-xs text-neutral-400">{formatTimestamp(entry.createdAt)}</span>
          </div>
          <div class="mt-1 text-xs text-neutral-400">Actor {entry.actorLabel}</div>
          {#if entry.reason}
            <div class="mt-1">{entry.reason}</div>
          {/if}
        </div>
      {/each}
    </div>

    {#if auditHistoryView.hasMore}
      <div class="mt-3 flex justify-end">
        <button class="btn" type="button" on:click={onLoadMoreAudit}>Load More</button>
      </div>
    {/if}
  {/if}
</div>
