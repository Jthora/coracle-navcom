<script lang="ts">
  import cx from "classnames"
  import {signer, pubkey} from "@welshman/app"
  import {isMobile} from "src/util/html"
  import {showWarning} from "src/partials/Toast.svelte"
  import Modal from "src/partials/Modal.svelte"
  import LazyRouteHost from "src/app/LazyRouteHost.svelte"
  import {menuIsOpen} from "src/app/state"
  import {router} from "src/app/util/router"

  const {current, page, modals} = router
  const fullBleedPaths = new Set(["/intel/map"])

  let prevPage
  let isCurrentFullBleed = false

  $: {
    isCurrentFullBleed = Boolean($page && fullBleedPaths.has($page.path))
  }

  $: {
    if ($page && $page.path !== prevPage?.path) {
      window.scrollTo(0, 0)
      prevPage = $page
    }
  }

  // Redirect if we have no user
  $: {
    if (!$pubkey && $page && router.getMatch($page.path).route.requireUser) {
      router.go({path: "/", replace: true})
    }
  }

  // Redirect if we need a signer
  $: {
    if (!$signer && $page && router.getMatch($page.path).route.requireSigner) {
      router.go({path: "/", replace: true})
    }
  }

  // Redirect if we're missing required parameters. This is usually due to a malformed url.
  $: {
    if ($current) {
      const props = router.getProps($current)

      for (const k of router.getMatch($current.path).route.required || []) {
        if (!props[k]) {
          router.go({path: "/", replace: true})
          break
        }
      }
    }
  }

  // Route-level guards for route-specific checks (e.g. group tier/access constraints)
  $: {
    if ($current) {
      const {route} = router.getMatch($current.path)

      if (route.guard) {
        const result = route.guard({path: $current.path, route, props: router.getProps($current)})

        if (!result.ok) {
          showWarning(result.message || "You can’t open that page right now.")

          const path =
            result.redirectTo && result.redirectTo !== $current.path ? result.redirectTo : "/"

          router.go({path, replace: true})
        }
      }
    }
  }
</script>

{#key $pubkey}
  <div
    id="page"
    class={cx("m-sai scroll-container relative text-neutral-100 lg:pl-72 lg:pt-16", {
      "pointer-events-none": $menuIsOpen,
      "overflow-auto": !isCurrentFullBleed,
      "overflow-hidden": isCurrentFullBleed,
      "pb-32": !isCurrentFullBleed,
      "pb-0": isCurrentFullBleed,
    })}>
    {#if $page}
      {@const {route} = router.getMatch($page.path)}
      {@const isFullBleed = fullBleedPaths.has($page.path)}
      {#key router.getKey($page)}
        {#if isFullBleed}
          <div
            class="h-[calc(100dvh-8rem)] w-full lg:h-[calc(100dvh-4rem-var(--main-status-height))]">
            <LazyRouteHost {route} props={router.getProps($page)} />
          </div>
        {:else}
          <div class="m-auto w-full max-w-2xl">
            <div class="flex max-w-2xl flex-grow flex-col gap-4 p-4">
              <LazyRouteHost {route} props={router.getProps($page)} />
            </div>
          </div>
        {/if}
      {/key}
    {/if}
  </div>
{/key}

{#each [...$modals].reverse().filter(m => !m.virtual) as m, i (router.getKey(m) + i)}
  {@const {route} = router.getMatch(m.path)}
  <Modal
    mini={m.mini}
    overlay={m.overlay}
    drawer={!isMobile && m.drawer}
    virtual={false}
    canClose={!m.noEscape}>
    <LazyRouteHost {route} props={router.getProps(m)} />
  </Modal>
{/each}
