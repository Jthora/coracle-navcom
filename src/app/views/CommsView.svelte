<script lang="ts">
  import {t} from "svelte-i18n"
  import {activeChannel, setActiveChannel} from "src/app/navcom-mode"
  import ChannelSidebar from "src/app/views/ChannelSidebar.svelte"
  import EncryptionIndicator from "src/app/shared/EncryptionIndicator.svelte"
  import {groupProjections} from "src/app/groups/state"
  import {router} from "src/app/util/router"

  let innerWidth = 0
  $: isMobile = innerWidth < 1024

  $: projection = $activeChannel ? $groupProjections.get($activeChannel) : null
  $: channelTitle = projection?.group?.title || $t("comms.header.defaultTitle")
  $: transportMode = projection?.group?.transportMode || "baseline-nip29"

  function handleChannelSelect(id: string) {
    setActiveChannel(id)
    // Also open the group route so the existing conversation renders
    router.at(`/groups/${id}/chat`).open()
  }

  function goBackToList() {
    setActiveChannel(null)
  }

  function openCheckIn() {
    // Stub: will send check-in message type in Phase 3
    if ($activeChannel) {
      router.at(`/groups/${$activeChannel}/chat`).open()
    }
  }

  function openAlert() {
    // Stub: will send alert message type in Phase 3
    if ($activeChannel) {
      router.at(`/groups/${$activeChannel}/chat`).open()
    }
  }
</script>

<svelte:window bind:innerWidth />

<div class="-m-4 flex h-full flex-col">
  {#if isMobile}
    {#if $activeChannel && projection}
      <!-- Mobile: Conversation view -->
      <div class="flex h-full flex-col">
        <!-- Channel header -->
        <div class="flex items-center gap-3 border-b border-neutral-700 px-4 py-3">
          <button
            class="text-neutral-400 transition-colors hover:text-neutral-200"
            on:click={goBackToList}>
            <i class="fa fa-arrow-left text-lg" />
          </button>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-neutral-100">{channelTitle}</span>
              <EncryptionIndicator {transportMode} channelId={$activeChannel} compact />
            </div>
          </div>
        </div>
        <!-- Conversation content rendered via router -->
      </div>
    {:else}
      <!-- Mobile: Channel list + quick actions -->
      <ChannelSidebar onChannelSelect={handleChannelSelect} />
      <div class="flex gap-2 border-t border-neutral-700 bg-neutral-900 px-4 py-2.5">
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-800 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
          on:click={openCheckIn}>
          <i class="fa fa-map-pin text-xs text-success" />
          <span>{$t("comms.action.checkIn")}</span>
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-800 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
          on:click={openAlert}>
          <i class="fa fa-triangle-exclamation text-xs text-danger" />
          <span>{$t("comms.action.alert")}</span>
        </button>
      </div>
    {/if}
  {:else}
    <!-- Desktop: Conversation area (sidebar handled by Menu.svelte) -->
    {#if $activeChannel && projection}
      <div class="flex h-full flex-col">
        <div class="flex items-center gap-3 border-b border-neutral-700 px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-neutral-100">{channelTitle}</span>
              <EncryptionIndicator {transportMode} channelId={$activeChannel} />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
              on:click={openCheckIn}>
              <i class="fa fa-map-pin text-success" />
              {$t("comms.action.checkIn")}
            </button>
            <button
              class="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
              on:click={openAlert}>
              <i class="fa fa-triangle-exclamation text-danger" />
              {$t("comms.action.alert")}
            </button>
          </div>
        </div>
        <!-- Conversation content rendered via router in the page area -->
      </div>
    {:else}
      <div class="flex h-full items-center justify-center text-neutral-400">
        <div class="text-center">
          <i class="fa fa-comment mb-3 text-3xl text-neutral-600" />
          <p class="text-sm">{$t("comms.empty.hint")}</p>
        </div>
      </div>
    {/if}
  {/if}
</div>
