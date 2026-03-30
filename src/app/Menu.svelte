<script lang="ts">
  import MenuMobile from "src/app/MenuMobile.svelte"
  import ChannelSidebar from "src/app/views/ChannelSidebar.svelte"
  import {navcomMode} from "src/app/navcom-mode"
  import {router} from "src/app/util/router"
  import {appName} from "src/partials/state"

  const {page} = router
  let innerWidth = 0

  $: showChannels =
    $navcomMode === "comms" ||
    ($page?.path?.startsWith("/groups") ?? false) ||
    ($page?.path?.startsWith("/channels") ?? false)
</script>

<svelte:window bind:innerWidth />

{#if innerWidth < 1024}
  <MenuMobile />
{:else}
  <div class="top-sai left-sai bottom-sai fixed z-sidebar flex w-72 flex-col">
    <div class="flex-1 overflow-hidden border-r border-nc-shell-border bg-nc-shell-deep">
      {#if showChannels}
        <ChannelSidebar />
      {:else}
        <nav class="flex h-full flex-col bg-nc-shell-deep">
          <div class="flex items-center border-b border-nc-shell-border px-4 py-3">
            <h2 class="staatliches text-lg uppercase tracking-widest text-nc-text">{appName}</h2>
          </div>
          <div class="flex-1 overflow-y-auto px-3 py-4">
            <div class="flex flex-col gap-1">
              <a
                href="#/announcements"
                class="hover:bg-nc-shell-bg flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nc-text transition-colors">
                <i class="fa fa-satellite-dish w-5 text-center text-nc-text-muted" />
                Announcements
              </a>
              <a
                href="#/open"
                class="hover:bg-nc-shell-bg flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nc-text transition-colors">
                <i class="fa fa-rss w-5 text-center text-nc-text-muted" />
                Open Feed
              </a>
              <a
                href="#/groups"
                class="hover:bg-nc-shell-bg flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nc-text transition-colors">
                <i class="fa fa-users w-5 text-center text-nc-text-muted" />
                Groups
              </a>
              <a
                href="#/topics/starcom_ops"
                class="hover:bg-nc-shell-bg flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nc-text transition-colors">
                <i class="fa fa-clipboard-list w-5 text-center text-nc-text-muted" />
                Ops Feed
              </a>
              <a
                href="#/topics/starcom_intel"
                class="hover:bg-nc-shell-bg flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nc-text transition-colors">
                <i class="fa fa-binoculars w-5 text-center text-nc-text-muted" />
                Intel Feed
              </a>
            </div>
          </div>
        </nav>
      {/if}
    </div>
  </div>
{/if}
