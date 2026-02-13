<script lang="ts">
  import type {Route} from "src/util/router"

  export let route: Route
  export let props: Record<string, any> = {}

  let component: any = null
  let loading = false
  let error: string | null = null
  let loadToken = 0

  const resolveComponent = async (targetRoute: Route) => {
    if (targetRoute.component) {
      component = targetRoute.component
      loading = false
      error = null
      return
    }

    if (!targetRoute.loadComponent) {
      component = null
      loading = false
      error = "Route is not configured with a component."
      return
    }

    loading = true
    error = null
    const token = ++loadToken

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
    } finally {
      if (token === loadToken) {
        loading = false
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
  <div class="panel p-6 text-center text-neutral-300">Loading…</div>
{/if}
