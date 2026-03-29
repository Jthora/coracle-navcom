# 00-03: Route Loading Safety

> Add timeout and deduplication to lazy route loading.

**Priority**: Do before two-mode rewrite — more routes = more loading failure surface.  
**Effort**: LOW (half day)  
**Depends on**: Nothing  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §9

---

## Problem

`LazyRouteHost.svelte` loads route chunks on demand via `registerLazy()` with retry logic, but:

1. **No timeout** — on a bad network, the loading spinner hangs indefinitely
2. **No deduplication** — clicking 5 links fast queues 5 concurrent chunk downloads
3. **No user feedback** — spinner rotates forever with no "this is taking too long" message

---

## Implementation

### 1. Add Timeout to Dynamic Imports

Wrap the dynamic import in a race with a timeout promise:

```typescript
function importWithTimeout(importFn: () => Promise<any>, ms = 30000) {
  return Promise.race([
    importFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Route load timed out")), ms)
    ),
  ])
}
```

Apply in `LazyRouteHost.svelte` where route chunks are loaded.

### 2. Deduplicate In-Flight Requests

Keep a `Map<string, Promise>` of in-flight chunk loads. If the same chunk is requested while one is pending, return the existing promise:

```typescript
const inflight = new Map<string, Promise<any>>()

function deduplicatedImport(key: string, importFn: () => Promise<any>) {
  if (!inflight.has(key)) {
    const promise = importFn().finally(() => inflight.delete(key))
    inflight.set(key, promise)
  }
  return inflight.get(key)!
}
```

### 3. User Feedback on Slow Load

After 5 seconds, show "Taking longer than expected..." below the spinner. After 30 seconds (timeout), show error state with retry button.

---

## Files to Modify

- `src/app/LazyRouteHost.svelte` — add timeout wrapper and dedup map
- Possibly `src/app/router.ts` — if `registerLazy` needs the dedup key

---

## Verification

- [ ] Simulate slow network (Chrome DevTools throttling: Slow 3G)
- [ ] Confirm 5-second "slow" message appears
- [ ] Confirm 30-second timeout triggers error state (not infinite spinner)
- [ ] Click same link 5 times rapidly — confirm only 1 network request fires
- [ ] After timeout, confirm retry button works
