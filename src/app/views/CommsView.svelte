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
      showInfo("Signal transmitted")
    } catch {
      showWarning("Signal failed — no relay connection")
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
        <div class="flex items-center gap-3 border-b border-nc-shell-border px-4 py-3">
          <button
            class="text-nc-text-muted transition-colors hover:text-nc-text"
            on:click={goBackToList}>
            <i class="fa fa-arrow-left text-lg" />
          </button>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-nc-text">{channelTitle}</span>
              <EncryptionIndicator {transportMode} channelId={$activeChannel} compact />
            </div>
          </div>
        </div>
        <!-- Conversation content rendered via router -->
      </div>
    {:else}
      <!-- Mobile: Channel list + quick actions -->
      <ChannelSidebar onChannelSelect={handleChannelSelect} />
      <div class="flex gap-2 border-t border-nc-shell-border bg-nc-shell-deep px-4 py-2.5">
        <button
          class="bg-nc-shell-bg flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm text-nc-text transition-colors hover:bg-nc-input"
          on:click={sendCheckIn}
          disabled={checkInLoading || !$signer}>
          <i class="fa fa-satellite-dish text-xs text-success" />
          <span>{checkInLoading ? "Sending…" : "Signal"}</span>
        </button>
        <div class="relative flex-1">
          <button
            class="bg-nc-shell-bg flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-nc-text transition-colors hover:bg-nc-input"
            on:click={togglePrioritySelector}
            disabled={alertLoading || !$signer}>
            <i class="fa fa-triangle-exclamation text-xs text-danger" />
            <span>{alertLoading ? "Sending…" : $t("comms.action.alert")}</span>
          </button>
          {#if showPrioritySelector}
            <div
              class="bg-nc-shell-bg absolute bottom-full left-0 mb-1 w-full rounded-lg border border-nc-shell-border p-2 shadow-lg"
              on:click|stopPropagation>
              <p class="mb-1.5 text-[11px] text-nc-text-muted">Priority</p>
              <div class="flex gap-1">
                {#each [["low", "Low"], ["medium", "Med"], ["high", "High"]] as [val, label]}
                  <button
                    class="flex-1 rounded py-1 text-xs font-medium transition-colors
                      {selectedPriority === val
                      ? val === 'high'
                        ? 'bg-red-900/50 text-red-200'
                        : val === 'medium'
                          ? 'bg-amber-900/50 text-amber-200'
                          : 'bg-nc-input text-accent'
                      : 'text-nc-text-muted hover:text-nc-text'}"
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
        <div class="flex items-center gap-3 border-b border-nc-shell-border px-4 py-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-nc-text">{channelTitle}</span>
              <EncryptionIndicator {transportMode} channelId={$activeChannel} />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="bg-nc-shell-bg flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-nc-text transition-colors hover:bg-nc-input"
              on:click={sendCheckIn}
              disabled={checkInLoading || !$signer}>
              <i class="fa fa-satellite-dish text-success" />
              {checkInLoading ? "Sending…" : "Signal"}
            </button>
            <div class="relative">
              <button
                class="bg-nc-shell-bg flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-nc-text transition-colors hover:bg-nc-input"
                on:click={togglePrioritySelector}
                disabled={alertLoading || !$signer}>
                <i class="fa fa-triangle-exclamation text-danger" />
                {alertLoading ? "Sending…" : $t("comms.action.alert")}
              </button>
              {#if showPrioritySelector}
                <div
                  class="bg-nc-shell-bg absolute right-0 top-full z-popover mt-1 w-48 rounded-lg border border-nc-shell-border p-2 shadow-lg"
                  on:click|stopPropagation>
                  <p class="mb-1.5 text-[11px] text-nc-text-muted">Priority</p>
                  <div class="flex gap-1">
                    {#each [["low", "Low"], ["medium", "Med"], ["high", "High"]] as [val, label]}
                      <button
                        class="flex-1 rounded py-1 text-xs font-medium transition-colors
                          {selectedPriority === val
                          ? val === 'high'
                            ? 'bg-red-900/50 text-red-200'
                            : val === 'medium'
                              ? 'bg-amber-900/50 text-amber-200'
                              : 'bg-nc-input text-accent'
                          : 'text-nc-text-muted hover:text-nc-text'}"
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
      <div class="flex h-full items-center justify-center text-nc-text-muted">
        <div class="text-center">
          <i class="fa fa-comment mb-3 text-3xl text-nc-text-muted" />
          <p class="text-sm">{$t("comms.empty.hint")}</p>
        </div>
      </div>
    {/if}
  {/if}
</div>
