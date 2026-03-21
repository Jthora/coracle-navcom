<script lang="ts">
  import {onMount} from "svelte"

  let hasError = false
  let errorMessage = ""

  function handleError(error: unknown) {
    hasError = true
    errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[ErrorBoundary]", error)
  }

  function tryAgain() {
    hasError = false
    errorMessage = ""
  }

  function reloadApp() {
    window.location.reload()
  }

  onMount(() => {
    const onError = (event: ErrorEvent) => {
      handleError(event.error || event.message)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason)
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  })
</script>

{#if hasError}
  <div class="flex h-full w-full items-center justify-center p-8">
    <div class="panel flex max-w-md flex-col gap-4 p-6 text-center">
      <div class="text-xl font-semibold text-neutral-100">Something went wrong</div>
      <div class="text-sm text-neutral-400">{errorMessage}</div>
      <div class="flex justify-center gap-3 pt-2">
        <button class="btn" on:click={tryAgain}>Try Again</button>
        <button class="btn btn-accent" on:click={reloadApp}>Reload App</button>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}
