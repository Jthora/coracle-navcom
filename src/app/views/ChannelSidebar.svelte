<script lang="ts">
  import {t} from "svelte-i18n"
  import {groupSummaries, unreadGroupMessageCounts} from "src/app/groups/state"
  import {router} from "src/app/util/router"
  import type {GroupSummaryListItem} from "src/domain/group-selectors"
  import {appName} from "src/partials/state"
  import VirtualList from "src/app/shared/VirtualList.svelte"

  export let onChannelSelect: ((id: string) => void) | undefined = undefined

  $: channels = $groupSummaries

  function getEncryptionIcon(item: GroupSummaryListItem): string {
    if (item.transportMode === "secure-nip-ee") return "🔐"
    return ""
  }

  function getUnread(id: string): number {
    return $unreadGroupMessageCounts.get(id) || 0
  }

  function selectChannel(id: string) {
    if (onChannelSelect) {
      onChannelSelect(id)
    } else {
      router.at(`/groups/${id}`).open()
    }
  }

  function openCreateJoin() {
    router.at("/groups").open()
  }
</script>

<nav class="flex h-full flex-col bg-neutral-900" aria-label={$t("sidebar.channel.aria")}>
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
    <h2 class="staatliches text-lg uppercase tracking-widest text-neutral-200">{$appName}</h2>
    <button
      class="hidden h-8 w-8 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200 lg:flex"
      on:click={() => router.at("/settings").open()}>
      <i class="fa fa-gear text-sm" />
    </button>
  </div>

  <!-- Channel list -->
  <div class="flex-1 overflow-y-auto">
    {#if channels.length === 0}
      <div class="flex flex-col items-center justify-center px-4 py-12 text-center">
        <p class="text-sm text-neutral-400">{$t("sidebar.empty.title")}</p>
        <p class="mt-1 text-xs text-neutral-500">{$t("sidebar.empty.hint")}</p>
      </div>
    {:else if channels.length > 30}
      <!-- Virtualized for large channel lists -->
      <VirtualList count={channels.length} estimateSize={56} overscan={5} containerClass="h-full">
        <div slot="default" let:index>
          {@const channel = channels[index]}
          {@const unread = getUnread(channel.id)}
          {@const encIcon = getEncryptionIcon(channel)}
          <button
            class="hover:bg-neutral-800/60 border-neutral-800/40 flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors"
            on:click={() => selectChannel(channel.id)}>
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              {#if channel.picture}
                <img src={channel.picture} alt="" class="h-10 w-10 rounded-lg object-cover" />
              {:else}
                <i class="fa fa-users text-sm" />
              {/if}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                {#if encIcon}
                  <span
                    class="text-xs"
                    title={channel.transportMode === "secure-nip-ee"
                      ? $t("encryption.tooltip.e2e")
                      : ""}>{encIcon}</span>
                {/if}
                <span class="truncate text-sm font-medium text-neutral-100"
                  >{channel.title || $t("channel.title.unnamed")}</span>
              </div>
              <div class="mt-0.5 truncate text-xs text-neutral-500">
                {$t("channel.members.count", {values: {count: channel.memberCount}})}
              </div>
            </div>
            {#if unread > 0}
              <span
                class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none text-neutral-900">
                {unread > 99 ? $t("common.badge.overflow") : unread}
              </span>
            {/if}
          </button>
        </div>
      </VirtualList>
    {:else}
      {#each channels as channel (channel.id)}
        {@const unread = getUnread(channel.id)}
        {@const encIcon = getEncryptionIcon(channel)}
        <button
          class="hover:bg-neutral-800/60 border-neutral-800/40 flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors"
          on:click={() => selectChannel(channel.id)}>
          <!-- Avatar / icon -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
            {#if channel.picture}
              <img src={channel.picture} alt="" class="h-10 w-10 rounded-lg object-cover" />
            {:else}
              <i class="fa fa-users text-sm" />
            {/if}
          </div>

          <!-- Title + encryption -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              {#if encIcon}
                <span
                  class="text-xs"
                  title={channel.transportMode === "secure-nip-ee"
                    ? $t("encryption.tooltip.e2e")
                    : ""}>{encIcon}</span>
              {/if}
              <span class="truncate text-sm font-medium text-neutral-100"
                >{channel.title || $t("channel.title.unnamed")}</span>
            </div>
            <div class="mt-0.5 truncate text-xs text-neutral-500">
              {$t("channel.members.count", {values: {count: channel.memberCount}})}
            </div>
          </div>

          <!-- Unread badge -->
          {#if unread > 0}
            <span
              class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold leading-none text-neutral-900">
              {unread > 99 ? $t("common.badge.overflow") : unread}
            </span>
          {/if}
        </button>
      {/each}
    {/if}
  </div>

  <!-- Add channel button -->
  <div class="border-t border-neutral-700 p-3">
    <button
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-600 py-2.5 text-sm text-neutral-400 transition-colors hover:border-accent hover:text-accent"
      on:click={openCreateJoin}>
      <i class="fa fa-plus text-xs" />
      <span>{$t("sidebar.action.joinCreate")}</span>
    </button>
  </div>
</nav>
