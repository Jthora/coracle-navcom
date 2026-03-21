<script lang="ts">
  import type {Route} from "src/util/router"
  import {
    activeLoaderStatus,
    enterLoaderStatus,
    exitLoaderStatus,
    updateLoaderStatus,
  } from "src/app/status/loader-status"

  export let route: Route
  export let props: Record<string, any> = {}

  let component: any = null
  let loading = false
  let slow = false
  let error: string | null = null
  let loadToken = 0
  const ROUTE_LOAD_OPERATION_PREFIX = "route-load"
  let activeRouteLoadOperationId: string | null = null
  const SLOW_THRESHOLD_MS = 5_000
  const TIMEOUT_MS = 30_000

  const clearActiveRouteLoadStatus = () => {
    if (!activeRouteLoadOperationId) {
      return
    }

    exitLoaderStatus(activeRouteLoadOperationId)
    activeRouteLoadOperationId = null
  }

  const resolveComponent = async (targetRoute: Route) => {
    if (targetRoute.component) {
      component = targetRoute.component
      loading = false
      error = null
      clearActiveRouteLoadStatus()
      return
    }

    if (!targetRoute.loadComponent) {
      component = null
      loading = false
      error = "Route is not configured with a component."
      clearActiveRouteLoadStatus()
      return
    }

    loading = true
    slow = false
    error = null
    const token = ++loadToken
    const operationId = `${ROUTE_LOAD_OPERATION_PREFIX}-${token}`
    const routeLabel = targetRoute.path || "this screen"

    clearActiveRouteLoadStatus()
    activeRouteLoadOperationId = operationId
    enterLoaderStatus("route.resolve.import.start", operationId, {routeLabel})

    const slowTimer = setTimeout(() => {
      if (token === loadToken) slow = true
    }, SLOW_THRESHOLD_MS)

    try {
      const loaded = await Promise.race([
        targetRoute.loadComponent(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Page took too long to load.")), TIMEOUT_MS),
        ),
      ])
      const next = (loaded as any)?.default || loaded

      if (token !== loadToken) return

      targetRoute.component = next
      component = next
    } catch (e) {
      if (token !== loadToken) return

      component = null
      error = e instanceof Error ? e.message : "Failed to load route."
      updateLoaderStatus(operationId, {detail: "Route module download failed."})
    } finally {
      clearTimeout(slowTimer)
      exitLoaderStatus(operationId)

      if (token === loadToken) {
        loading = false
        slow = false
        if (activeRouteLoadOperationId === operationId) {
          activeRouteLoadOperationId = null
        }
      }
    }
  }

  $: if (route) {
    void resolveComponent(route)
  }

  const retry = () => {
    if (!route) return

    void resolveComponent(route)
  }
</script>

{#if component}
  <svelte:component this={component} {...props} />
{:else if error}
  <div class="panel p-6 text-center text-neutral-200">
    <p>{error}</p>
    <div class="mt-3">
      <button class="btn" type="button" on:click={retry}>Retry</button>
    </div>
  </div>
{:else if loading}
  <div class="panel p-6 text-center text-neutral-300">
    {$activeLoaderStatus?.operationId?.startsWith(ROUTE_LOAD_OPERATION_PREFIX)
      ? $activeLoaderStatus.message
      : "Fetching page code for this screen..."}
    {#if slow}
      <p class="mt-2 text-sm text-neutral-400">Taking longer than expected&hellip;</p>
    {/if}
  </div>
{/if}
