<script lang="ts">
  import {t} from "svelte-i18n"
  import {pubkey, signer} from "@welshman/app"
  import {navcomMode, setMode} from "src/app/navcom-mode"
  import type {NavComMode} from "src/app/navcom-mode"
  import {totalUnreadGroupMessages, hasUnreadGroupMessages} from "src/app/groups/state"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications, env} from "src/engine"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Link from "src/partials/Link.svelte"

  const tabs: {id: NavComMode; icon: string; labelKey: string}[] = [
    {id: "comms", icon: "fa-comment", labelKey: "mode.tab.comms"},
    {id: "map", icon: "fa-map", labelKey: "mode.tab.map"},
    {id: "ops", icon: "fa-clipboard-list", labelKey: "mode.tab.ops"},
  ]

  const openSearch = () => router.at("/search").open()
  const openMenu = () => menuIsOpen.set(true)

  const createNote = () => {
    if (!$pubkey) {
      if (env.ENABLE_GUIDED_SIGNUP) {
        return router.at("/signup").qp({returnTo: "/notes/create"}).open()
      }
      return router.at("/login").qp({returnTo: "/notes/create"}).open()
    }
    router.at("notes/create").open()
  }
</script>

<nav
  class="px-sai pb-sai bg-nc-shell-deep/95 fixed bottom-0 left-0 right-0 z-nav border-t border-nc-shell-border backdrop-blur-sm lg:left-72"
  class:pointer-events-none={$menuIsOpen}>
  <div
    class="flex h-14 items-center justify-around"
    role="tablist"
    aria-label={$t("mode.tablist.aria")}>
    <!-- Mobile: Search button -->
    <button
      class="flex flex-col items-center gap-0.5 px-3 py-2 text-nc-text-muted transition-colors hover:text-nc-text lg:hidden"
      aria-label={$t("common.search")}
      on:click={openSearch}>
      <span class="text-lg"><i class="fa fa-search" /></span>
      <span class="text-xs uppercase tracking-wide">{$t("common.search")}</span>
    </button>

    <!-- Mode tabs (always visible) -->
    {#each tabs as tab}
      <button
        class="relative flex flex-col items-center gap-0.5 px-4 py-2 transition-colors lg:px-6"
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

    <!-- Mobile: Post / Get started -->
    <div class="flex flex-col items-center lg:hidden">
      {#if $signer}
        <button
          class="flex flex-col items-center gap-0.5 px-3 py-2 text-accent transition-colors"
          on:click={createNote}>
          <span class="text-lg"><i class="fa fa-plus" /></span>
          <span class="text-xs uppercase tracking-wide">Post</span>
        </button>
      {:else if !$pubkey}
        {#if env.ENABLE_GUIDED_SIGNUP}
          <Link
            href="/signup"
            class="flex flex-col items-center gap-0.5 px-3 py-2 text-accent transition-colors">
            <span class="text-lg"><i class="fa fa-right-to-bracket" /></span>
            <span class="text-xs uppercase tracking-wide">Join</span>
          </Link>
        {:else}
          <Link
            href="/login"
            class="flex flex-col items-center gap-0.5 px-3 py-2 text-accent transition-colors">
            <span class="text-lg"><i class="fa fa-right-to-bracket" /></span>
            <span class="text-xs uppercase tracking-wide">Log in</span>
          </Link>
        {/if}
      {/if}
    </div>

    <!-- Mobile: Menu / Avatar -->
    <button
      class="relative flex flex-col items-center gap-0.5 px-3 py-2 text-nc-text-muted transition-colors hover:text-nc-text lg:hidden"
      aria-label={$t("mode.settings.aria")}
      on:click={openMenu}>
      {#if $signer}
        <PersonCircle class="h-7 w-7 border-2 border-nc-shell-border" pubkey={$pubkey} />
        <span class="text-xs uppercase tracking-wide">Menu</span>
        {#if $hasNewNotifications || $hasNewMessages || $hasUnreadGroupMessages}
          <span class="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-accent" />
        {/if}
      {:else}
        <span class="text-lg"><i class="fa fa-bars" /></span>
        <span class="text-xs uppercase tracking-wide">Menu</span>
      {/if}
    </button>

    <!-- Desktop: Settings gear (desktop only, since mobile now has Menu above) -->
    <button
      class="hidden flex-col items-center gap-0.5 px-6 py-2 text-nc-text-muted transition-colors hover:text-nc-text lg:flex"
      aria-label={$t("mode.settings.aria")}
      on:click={() => router.at("/settings").open()}>
      <span class="text-lg"><i class="fa fa-gear" /></span>
      <span class="text-xs uppercase tracking-wide">{$t("mode.tab.settings")}</span>
    </button>
  </div>
</nav>
