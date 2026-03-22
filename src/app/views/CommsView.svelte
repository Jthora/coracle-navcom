<script lang="ts">
  import {t} from "svelte-i18n"
  import {signer} from "@welshman/app"
  import {activeChannel, setActiveChannel} from "src/app/navcom-mode"
  import ChannelSidebar from "src/app/views/ChannelSidebar.svelte"
  import EncryptionIndicator from "src/app/shared/EncryptionIndicator.svelte"
  import {groupProjections} from "src/app/groups/state"
  import {router} from "src/app/util/router"
  import {publishGroupMessage} from "src/engine/group-commands"
  import {geohashFromLatLon} from "src/app/util/geoint"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"

  let innerWidth = 0
  $: isMobile = innerWidth < 1024

  $: projection = $activeChannel ? $groupProjections.get($activeChannel) : null
  $: channelTitle = projection?.group?.title || $t("comms.header.defaultTitle")
  $: transportMode = projection?.group?.transportMode || "baseline-nip29"

  let checkInLoading = false
  let alertLoading = false
  let showPrioritySelector = false
  let selectedPriority: "low" | "medium" | "high" = "medium"

  function setPriority(val: string) {
    selectedPriority = val as "low" | "medium" | "high"
  }

  function handleChannelSelect(id: string) {
    setActiveChannel(id)
    router.at(`/groups/${id}/chat`).open()
  }

  function goBackToList() {
    setActiveChannel(null)
  }

  async function sendCheckIn() {
    if (!$signer || !$activeChannel) return
    checkInLoading = true
    try {
      const extraTags: string[][] = [["msg-type", "check-in"]]

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000}),
          )
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          extraTags.push(["location", `${lat.toFixed(4)},${lng.toFixed(4)}`])
          const gh = geohashFromLatLon(lat, lng)
          if (gh) extraTags.push(["g", gh])
        } catch {
          // GPS unavailable — send check-in without location
        }
      }

      await publishGroupMessage({
        groupId: $activeChannel,
        content: "Check-in",
        requestedMode: transportMode as any,
        extraTags,
      })
      showInfo("Check-in sent")
    } catch {
      showWarning("Failed to send check-in")
    } finally {
      checkInLoading = false
    }
  }

  async function sendAlert() {
    if (!$signer || !$activeChannel) return
    alertLoading = true
    showPrioritySelector = false
    try {
      const extraTags: string[][] = [
        ["msg-type", "alert"],
        ["priority", selectedPriority],
      ]

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000}),
          )
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          extraTags.push(["location", `${lat.toFixed(4)},${lng.toFixed(4)}`])
          const gh = geohashFromLatLon(lat, lng)
          if (gh) extraTags.push(["g", gh])
        } catch {
          // GPS unavailable — send alert without location
        }
      }

      await publishGroupMessage({
        groupId: $activeChannel,
        content: `Alert (${selectedPriority} priority)`,
        requestedMode: transportMode as any,
        extraTags,
      })
      showInfo("Alert sent")
    } catch {
      showWarning("Failed to send alert")
    } finally {
      alertLoading = false
    }
  }

  function togglePrioritySelector(e: MouseEvent) {
    e.stopPropagation()
    if (!$signer || !$activeChannel) return
    showPrioritySelector = !showPrioritySelector
  }

  function dismissPrioritySelector() {
    showPrioritySelector = false
  }
</script>

<svelte:window bind:innerWidth on:click={dismissPrioritySelector} />

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
          on:click={sendCheckIn}
          disabled={checkInLoading || !$signer}>
          <i class="fa fa-map-pin text-xs text-success" />
          <span>{checkInLoading ? "Sending…" : $t("comms.action.checkIn")}</span>
        </button>
        <div class="relative flex-1">
          <button
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-800 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
            on:click={togglePrioritySelector}
            disabled={alertLoading || !$signer}>
            <i class="fa fa-triangle-exclamation text-xs text-danger" />
            <span>{alertLoading ? "Sending…" : $t("comms.action.alert")}</span>
          </button>
          {#if showPrioritySelector}
            <div
              class="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 p-2 shadow-lg"
              on:click|stopPropagation>
              <p class="mb-1.5 text-[11px] text-neutral-400">Priority</p>
              <div class="flex gap-1">
                {#each [["low", "Low"], ["medium", "Med"], ["high", "High"]] as [val, label]}
                  <button
                    class="flex-1 rounded py-1 text-xs font-medium transition-colors
                      {selectedPriority === val
                      ? val === 'high'
                        ? 'bg-red-900/50 text-red-200'
                        : val === 'medium'
                          ? 'bg-amber-900/50 text-amber-200'
                          : 'bg-neutral-700 text-accent'
                      : 'text-neutral-400 hover:text-neutral-200'}"
                    on:click={() => {
                      setPriority(val)
                    }}>
                    {label}
                  </button>
                {/each}
              </div>
              <button
                class="bg-danger/20 hover:bg-danger/30 mt-1.5 w-full rounded py-1 text-xs font-medium text-danger transition-colors"
                on:click={sendAlert}>
                Send Alert
              </button>
            </div>
          {/if}
        </div>
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
              on:click={sendCheckIn}
              disabled={checkInLoading || !$signer}>
              <i class="fa fa-map-pin text-success" />
              {checkInLoading ? "Sending…" : $t("comms.action.checkIn")}
            </button>
            <div class="relative">
              <button
                class="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                on:click={togglePrioritySelector}
                disabled={alertLoading || !$signer}>
                <i class="fa fa-triangle-exclamation text-danger" />
                {alertLoading ? "Sending…" : $t("comms.action.alert")}
              </button>
              {#if showPrioritySelector}
                <div
                  class="z-10 absolute right-0 top-full mt-1 w-48 rounded-lg border border-neutral-600 bg-neutral-800 p-2 shadow-lg"
                  on:click|stopPropagation>
                  <p class="mb-1.5 text-[11px] text-neutral-400">Priority</p>
                  <div class="flex gap-1">
                    {#each [["low", "Low"], ["medium", "Med"], ["high", "High"]] as [val, label]}
                      <button
                        class="flex-1 rounded py-1 text-xs font-medium transition-colors
                          {selectedPriority === val
                          ? val === 'high'
                            ? 'bg-red-900/50 text-red-200'
                            : val === 'medium'
                              ? 'bg-amber-900/50 text-amber-200'
                              : 'bg-neutral-700 text-accent'
                          : 'text-neutral-400 hover:text-neutral-200'}"
                        on:click={() => {
                          setPriority(val)
                        }}>
                        {label}
                      </button>
                    {/each}
                  </div>
                  <button
                    class="bg-danger/20 hover:bg-danger/30 mt-1.5 w-full rounded py-1 text-xs font-medium text-danger transition-colors"
                    on:click={sendAlert}>
                    Send Alert
                  </button>
                </div>
              {/if}
            </div>
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
