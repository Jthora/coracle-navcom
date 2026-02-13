<script lang="ts">
  import {pubkey, signer} from "@welshman/app"
  import {slide, fly} from "src/util/transition"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {hasUnreadGroupMessages} from "src/app/groups/state"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {menuIsOpen, searchTerm} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications, env} from "src/engine"

  let innerWidth = 0
  let searching = false
  let searchInput

  const {page} = router

  const openMenu = () => menuIsOpen.set(true)

  const openSearch = () => router.at("/search").open()

  const onSearchBlur = () => searchTerm.set(null)

  const onSearchKeydown = e => {
    if (e.key === "Escape") {
      searchTerm.set(null)
    }
  }

  const createNote = () => {
    if (!$pubkey) {
      if (env.ENABLE_GUIDED_SIGNUP) {
        return router.at("/signup").qp({returnTo: "/notes/create"}).open()
      }

      return router.at("/login").qp({returnTo: "/notes/create"}).open()
    }

    const params = {} as any
    const props = router.getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
    }

    router.at("notes/create").qp(params).open()
  }
</script>

<svelte:window bind:innerWidth />

<!-- top nav -->
{#if innerWidth >= 1024}
  <div class="top-sai left-sai right-sai fixed z-nav">
    <div
      class="border-neutral-700/70 ml-72 flex h-16 items-center border-b bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,var(--neutral-900),var(--neutral-950))] pl-6 pr-8 text-neutral-100 shadow-[0_10px_26px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div class="flex w-full items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <h1 class="staatliches text-tinted-50 text-2xl uppercase tracking-[0.2em]">NAVCOM</h1>
        </div>
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="flex items-center gap-2">
              <Input
                dark
                class="!border-neutral-700 !bg-neutral-900"
                on:blur={onSearchBlur}
                on:keydown={onSearchKeydown}
                bind:element={searchInput}
                bind:value={$searchTerm} />
              <Button class="btn btn-low z-feature -ml-1">Search</Button>
            </div>
            {#if $searchTerm}
              <div
                on:mousedown|preventDefault
                out:fly|local={{y: 20, duration: 200}}
                class="absolute right-0 top-10 w-96 rounded opacity-100 shadow-2xl transition-colors">
                <div class="max-h-[70vh] overflow-auto rounded bg-tinted-700">
                  <SearchResults bind:searching term={searchTerm}>
                    <div
                      slot="result"
                      let:result
                      class="cursor-pointer px-4 py-2 transition-colors hover:bg-neutral-800">
                      {#if result.type === "topic"}
                        #{result.topic.name}
                      {:else if result.type === "profile"}
                        <PersonBadge inert pubkey={result.id} />
                      {/if}
                    </div>
                  </SearchResults>
                </div>
                {#if searching}
                  <div
                    transition:slide|local={{duration: 200, delay: 100}}
                    class="flex justify-center gap-2 bg-neutral-900 px-4 py-2 text-neutral-200">
                    <div>
                      <i class="fa fa-circle-notch fa-spin" />
                    </div>
                    Loading more options...
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          {#if $signer}
            <Button class="btn btn-accent" on:click={createNote}>Post +</Button>
          {:else if !$pubkey}
            {#if env.ENABLE_GUIDED_SIGNUP}
              <Link modal class="btn btn-accent" href="/signup">Get started</Link>
            {:else}
              <Link modal class="btn btn-accent" href="/login">Log in</Link>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- bottom nav -->
{#if innerWidth < 1024}
  <div
    class="px-sai pb-sai fixed bottom-0 left-0 right-0 z-nav border-t border-tinted-600 bg-[linear-gradient(180deg,rgba(15,17,20,0.92),rgba(5,6,8,0.96))] shadow-[0_-8px_26px_rgba(0,0,0,0.45)] backdrop-blur-sm">
    <div class="flex items-center justify-between rounded-t-xl px-4 py-2">
      <div class="w-1/3">
        <div
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-accent shadow-[0_0_0_1px_rgba(99,230,255,0.2),0_0_12px_rgba(34,211,238,0.25)]"
          on:click={openSearch}>
          <i class="fa fa-search -mb-1 -mr-1 text-xl" />
        </div>
      </div>
      <div>
        {#if $signer}
          <Button class="btn btn-accent" on:click={createNote}>Post +</Button>
        {:else if !$pubkey}
          {#if env.ENABLE_GUIDED_SIGNUP}
            <Link modal class="btn btn-accent" href="/signup">Get started</Link>
          {:else}
            <Link modal class="btn btn-accent" href="/login">Log in</Link>
          {/if}
        {/if}
      </div>
      <div class="relative flex w-1/3 justify-end">
        <div class="flex cursor-pointer items-center" on:click={openMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            fill="currentColor"
            class="pt-1 text-neutral-600 dark:text-tinted-600"
            width="36"
            height="36">
            <path
              fill="currentColor"
              d="M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H424c13.3 0 24 10.7 24 24z" />
          </svg>
          {#if $signer}
            <PersonCircle
              class="-ml-4 h-11 w-11 border-4 border-white dark:border-black"
              pubkey={$pubkey} />
            {#if $hasNewNotifications || $hasNewMessages || $hasUnreadGroupMessages}
              <div class="absolute right-1 top-1 h-2 w-2 rounded bg-accent" />
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
