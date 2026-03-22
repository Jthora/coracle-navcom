<script lang="ts">
  import cx from "classnames"
  import {signer, pubkey} from "@welshman/app"
  import {isMobile} from "src/util/html"
  import {showWarning} from "src/partials/Toast.svelte"
  import Modal from "src/partials/Modal.svelte"
  import LazyRouteHost from "src/app/LazyRouteHost.svelte"
  import {menuIsOpen} from "src/app/state"
  import {buildRouteRecoveryRedirectContext} from "src/app/groups/route-recovery"
  import {router} from "src/app/util/router"
  import {navcomMode} from "src/app/navcom-mode"
  import CommsView from "src/app/views/CommsView.svelte"
  import MapView from "src/app/views/MapView.svelte"
  import OpsView from "src/app/views/OpsView.svelte"
  import StatusBar from "src/app/views/StatusBar.svelte"

  const {current, page, modals} = router
  const fullBleedPaths = new Set(["/intel/map"])
  const modePaths = new Set(["/"])

  let prevPage
  let isCurrentFullBleed = false
  let isModePage = false

  $: {
    isCurrentFullBleed = Boolean($page && fullBleedPaths.has($page.path))
    isModePage = Boolean($page && modePaths.has($page.path))
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
          router.go({
            path: "/groups",
            replace: true,
            context: buildRouteRecoveryRedirectContext({
              fromPath: $current.path,
              message:
                "This route is missing required data, so we redirected you to Groups. Open a valid group link or invite to continue.",
              reason: `ROUTE_REQUIRED_PARAM_MISSING:${k}`,
              props,
            }),
          })
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

          const recoveryReason =
            "reason" in result && typeof result.reason === "string"
              ? result.reason
              : "ROUTE_GUARD_FAILED"

          const path =
            result.redirectTo && result.redirectTo !== $current.path ? result.redirectTo : "/"

          router.go({
            path,
            replace: true,
            context: buildRouteRecoveryRedirectContext({
              fromPath: $current.path,
              message: result.message || "You can’t open that page right now.",
              reason: recoveryReason,
              props: router.getProps($current),
            }),
          })
        }
      }
    }
  }
</script>

{#key $pubkey}
  <div
    id="page"
    class={cx("m-sai scroll-container relative text-nc-text lg:pl-72 lg:pt-16", {
      "pointer-events-none": $menuIsOpen,
      "overflow-auto": !isCurrentFullBleed && !($navcomMode === "map" && isModePage),
      "overflow-hidden": isCurrentFullBleed || ($navcomMode === "map" && isModePage),
      "pb-32": !isCurrentFullBleed && !($navcomMode === "map" && isModePage),
      "pb-0": isCurrentFullBleed || ($navcomMode === "map" && isModePage),
    })}>
    <StatusBar />
    {#if $page}
      {#if isModePage}
        {#if $navcomMode === "comms"}
          <div class="m-auto w-full max-w-2xl">
            <div class="flex max-w-2xl flex-grow flex-col gap-4 p-4">
              <CommsView />
            </div>
          </div>
        {:else if $navcomMode === "map"}
          <div
            class="h-[calc(100dvh-8rem)] w-full lg:h-[calc(100dvh-4rem-var(--main-status-height))]">
            <MapView />
          </div>
        {:else if $navcomMode === "ops"}
          <div class="m-auto w-full max-w-4xl">
            <div class="flex max-w-4xl flex-grow flex-col gap-4 p-4">
              <OpsView />
            </div>
          </div>
        {/if}
      {:else}
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
