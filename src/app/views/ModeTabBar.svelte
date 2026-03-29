<script lang="ts">
  import {t} from "svelte-i18n"
  import {navcomMode, setMode} from "src/app/navcom-mode"
  import type {NavComMode} from "src/app/navcom-mode"
  import {totalUnreadGroupMessages} from "src/app/groups/state"
  import {router} from "src/app/util/router"

  const tabs: {id: NavComMode; icon: string; labelKey: string}[] = [
    {id: "comms", icon: "fa-comment", labelKey: "mode.tab.comms"},
    {id: "map", icon: "fa-map", labelKey: "mode.tab.map"},
    {id: "ops", icon: "fa-clipboard-list", labelKey: "mode.tab.ops"},
  ]

  const openSettings = () => router.at("/settings").open()
</script>

<nav
  class="px-sai pb-sai bg-nc-shell-deep/95 fixed bottom-0 left-0 right-0 z-nav border-t border-nc-shell-border backdrop-blur-sm lg:left-72">
  <div
    class="flex h-14 items-center justify-around"
    role="tablist"
    aria-label={$t("mode.tablist.aria")}>
    {#each tabs as tab}
      <button
        class="relative flex flex-col items-center gap-0.5 px-6 py-2 transition-colors"
        class:text-accent={$navcomMode === tab.id}
        class:text-nc-text-muted={$navcomMode !== tab.id}
        role="tab"
        aria-selected={$navcomMode === tab.id}
        aria-label={$t("mode.tab.aria", {values: {label: $t(tab.labelKey)}})}
        on:click={() => setMode(tab.id)}>
        <span class="relative text-lg">
          <i class="fa {tab.icon}" />
          {#if tab.id === "comms" && $totalUnreadGroupMessages > 0}
            <span
              class="absolute -right-2.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-neutral-900">
              {$totalUnreadGroupMessages > 99
                ? $t("common.badge.overflow")
                : $totalUnreadGroupMessages}
            </span>
          {/if}
        </span>
        <span class="text-xs uppercase tracking-wide">{$t(tab.labelKey)}</span>
        {#if $navcomMode === tab.id}
          <span class="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded bg-accent" />
        {/if}
      </button>
    {/each}
    <button
      class="flex flex-col items-center gap-0.5 px-6 py-2 text-nc-text-muted transition-colors hover:text-nc-text lg:hidden"
      aria-label={$t("mode.settings.aria")}
      on:click={openSettings}>
      <span class="text-lg"><i class="fa fa-gear" /></span>
      <span class="text-xs uppercase tracking-wide">{$t("mode.tab.settings")}</span>
    </button>
  </div>
</nav>
