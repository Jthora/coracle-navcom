# State Management Conventions

> NavCom's state architecture: who owns what, how data flows, and how subscriptions are cleaned up.

## 1. Store Inventory

| Store | File | Owner Domain | Persistence | Consumers |
|-------|------|-------------|-------------|-----------|
| `navcomMode` | navcom-mode.ts | Navigation | localStorage (synced) | ModeTabBar, App |
| `activeChannelByMode` | navcom-mode.ts | Navigation | localStorage (synced) | CommsView, MapView |
| `mapViewport` | navcom-mode.ts | Map | localStorage (synced) | MapView, IntelNavMap, OpsView |
| `mapLayers` | navcom-mode.ts | Map | localStorage (synced) | MapView, MapLayerPanel |
| `mapTileSet` | navcom-mode.ts | Map | localStorage (synced) | IntelNavMap, MapView, OpsView |
| `mapTimeRange` | navcom-mode.ts | Map | localStorage (synced) | MapView |
| `selectedMarkerId` | navcom-mode.ts | Cross-view | memory | MapView, GroupConversation |
| `selectedMessageId` | navcom-mode.ts | Cross-view | memory | MapView, GroupConversation |
| `composeDrafts` | navcom-mode.ts | Comms | localStorage (synced) | CommsView |
| `scrollPositions` | navcom-mode.ts | Comms | localStorage (synced) | CommsView |
| `groupSummaries` | groups/state.ts | Groups | derived (relay events) | Sidebar, OpsView, MapView |
| `unreadGroupMessageCounts` | groups/state.ts | Groups | derived (relay events) | Sidebar, TabBar |

### Notes
- `synced()` stores persist to `localStorage` automatically and rehydrate on app start.
- Derived stores are computed from Nostr relay events via `@welshman/app` repository.
- Memory-only stores reset on page reload — suitable for transient UI state.

## 2. Ownership Rules

1. **One domain owns writes.** Other domains read via derived stores or `$` subscriptions.
2. **Source of truth chain:** Nostr relay events → `@welshman/app` repository → projection stores → component state.
3. **`synced()` is the persistence boundary.** If a store uses `synced()`, its value survives page reloads.
4. **No two stores should hold the same data.** If duplication is necessary, document the canonical source.

## 3. Subscription Cleanup

### Svelte Components
- **Template subscriptions** (`$storeName`): auto-cleaned by Svelte's component lifecycle. No action needed.
- **Manual `store.subscribe()`**: must be unsubscribed in `onDestroy()`.

```svelte
<script>
  import {onDestroy} from "svelte"
  import {someStore} from "./state"

  const unsub = someStore.subscribe(value => { /* side effect */ })
  onDestroy(unsub)
</script>
```

### TypeScript modules
- Any `store.subscribe()` call in a `.ts` file must return the unsubscriber and the caller must invoke it.
- Long-lived module subscriptions (e.g. engine bootstrap) should document when they are torn down.

## 4. Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| Writable store | `navcomMode`, `mapLayers` | camelCase noun |
| Derived store | `activeChannel`, `groupSummaries` | camelCase, computed-sounding |
| Set function | `setMode()`, `setActiveChannel()` | `setX()` verb |
| Toggle function | `toggleMapLayer()` | `toggleX()` verb |
| Synced store | `synced("navcom-mode", ...)` | Key prefixed with `navcom-` |

## 5. Adding New Stores

1. Determine the owner domain.
2. Place the store in the appropriate file (e.g. `navcom-mode.ts` for navigation, `groups/state.ts` for group data).
3. Use `synced()` only when persistence across reloads is required.
4. If the store is derived from relay data, implement as a derived store from `@welshman/app` repository.
5. Export `setX()` functions for writes — do not export the writable directly when encapsulation is needed.
6. Document in this table.
