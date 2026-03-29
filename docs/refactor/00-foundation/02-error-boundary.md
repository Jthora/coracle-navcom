# 00-02: Error Boundary

> Add a global crash recovery wrapper so unhandled errors don't blank the screen.

**Priority**: Do before two-mode rewrite — adding new components increases crash surface.  
**Effort**: LOW (half day)  
**Depends on**: Nothing  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §5

---

## Problem

No global error boundary exists. `LazyRouteHost.svelte` has retry logic for chunk-load failures, but an unhandled runtime error in any deeply nested component crashes the entire app. Users see a blank page with no recovery path. On mobile PWA, there's no visible way to recover.

---

## Implementation

### Option A: Svelte `<svelte:boundary>` (Svelte 5+)

If the project is on Svelte 5, use the built-in boundary:

```svelte
<!-- src/app/ErrorBoundary.svelte -->
<svelte:boundary onerror={handleError}>
  <slot />
  {#snippet failed(error, reset)}
    <div class="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h2 class="staatliches text-2xl text-danger">Something went wrong</h2>
      <p class="text-neutral-300 text-center max-w-md">
        An unexpected error occurred. Your data is safe.
      </p>
      <button class="btn btn-accent" on:click={reset}>Try Again</button>
      <button class="btn btn-low" on:click={() => location.reload()}>Reload App</button>
    </div>
  {/snippet}
</svelte:boundary>
```

### Option B: Try/Catch Wrapper (Svelte 4)

If still on Svelte 4, create a wrapper component using `onMount` + `window.onerror` + `window.onunhandledrejection`.

### Placement

Wrap the route content area in `App.svelte`, inside the layout but outside the route renderer:

```svelte
<ErrorBoundary>
  <Routes />
</ErrorBoundary>
```

The nav, sidebar, and tab bar remain outside the boundary — if the content crashes, the user can still navigate away.

---

## Verification

- [ ] Deliberately throw an error in a nested component
- [ ] Confirm error boundary catches it and shows recovery UI
- [ ] Confirm nav/sidebar remain functional during error state
- [ ] Confirm "Try Again" re-renders the failed component
- [ ] Confirm "Reload App" does a full page reload
