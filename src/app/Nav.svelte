<script lang="ts">
  import {pubkey, signer} from "@welshman/app"
  import {slide, fly} from "src/util/transition"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchTerm} from "src/app/state"
  import {router} from "src/app/util/router"
  import {env} from "src/engine"

  let innerWidth = 0
  let searching = false
  let searchInput

  const {page} = router

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
      class="border-nc-shell-border/70 ml-72 flex h-16 items-center border-b bg-[radial-gradient(circle_at_12%_0%,rgba(var(--accent-rgb),0.12),transparent_30%),linear-gradient(180deg,var(--neutral-900),var(--neutral-950))] pl-6 pr-8 text-nc-text shadow-[0_10px_26px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div class="flex w-full items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <h1 class="staatliches text-tinted-50 text-2xl uppercase tracking-[0.2em]">NAVCOM</h1>
        </div>
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="flex items-center gap-2">
              <Input
                dark
                class="!border-nc-shell-border !bg-nc-shell-deep"
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
                      class="hover:bg-nc-shell-bg cursor-pointer px-4 py-2 transition-colors">
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
                    class="flex justify-center gap-2 bg-nc-shell-deep px-4 py-2 text-nc-text">
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
