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
  let error: string | null = null
  let loadToken = 0
  const ROUTE_LOAD_OPERATION = "route-load"

  const resolveComponent = async (targetRoute: Route) => {
    if (targetRoute.component) {
      component = targetRoute.component
      loading = false
      error = null
      exitLoaderStatus(ROUTE_LOAD_OPERATION)
      return
    }

    if (!targetRoute.loadComponent) {
      component = null
      loading = false
      error = "Route is not configured with a component."
      exitLoaderStatus(ROUTE_LOAD_OPERATION)
      return
    }

    loading = true
    error = null
    const token = ++loadToken
    const routeLabel = targetRoute.path || "this screen"

    enterLoaderStatus("route.resolve.import.start", ROUTE_LOAD_OPERATION, {routeLabel})

    try {
      const loaded = await targetRoute.loadComponent()
      const next = loaded?.default || loaded

      if (token !== loadToken) return

      targetRoute.component = next
      component = next
    } catch (e) {
      if (token !== loadToken) return

      component = null
      error = e instanceof Error ? e.message : "Failed to load route."
      updateLoaderStatus(ROUTE_LOAD_OPERATION, {detail: "Route module download failed."})
    } finally {
      if (token === loadToken) {
        loading = false
        exitLoaderStatus(ROUTE_LOAD_OPERATION)
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
    {$activeLoaderStatus?.operationId === ROUTE_LOAD_OPERATION
      ? $activeLoaderStatus.message
      : "Fetching page code for this screen..."}
  </div>
{/if}
