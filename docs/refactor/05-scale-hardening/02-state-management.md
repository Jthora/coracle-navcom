# 05-02: State Management Audit

> Inventory, normalize, and enforce cleanup patterns for the fragmented store system.

**Priority**: HIGH — growing store count increases bug surface with every feature.  
**Effort**: HIGH  
**Depends on**: Nothing (can parallelize with other phases)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §2

---

## Problem

State is distributed across 20+ files with multiple cache strategies (SWR, network-first, cache-first) managed independently. Duplicate data exists across stores (e.g., `userFollowList` → `userFollows` → `userNetwork`). Subscription cleanup patterns exist but aren't enforced. Adding a new feature requires reading 5+ state files.

---

## Phase A: Inventory

Map every store in the codebase:

| Store | File | Type | Cache Strategy | Cleanup |
|-------|------|------|---------------|---------|
| (enumerate all stores) | | writable / derived / synced | SWR / network / cache / none | manual / auto / none |

Tools: `grep -r "writable\|derived\|synced\|readable" src/ --include="*.ts" --include="*.svelte" | wc -l`

### Deliverable
A spreadsheet or markdown table of every store: name, file, type, dependencies, cache strategy, subscription cleanup status.

---

## Phase B: Categorize

Group stores into domains:

| Domain | Stores | Owner |
|--------|--------|-------|
| **Identity** | user keys, profile, follows | `src/engine/` |
| **Groups** | group metadata, members, tiers | `src/app/groups/` |
| **Messages** | feeds, channel messages, unread counts | `src/app/` + `src/engine/` |
| **Network** | relay connections, relay status | `src/engine/` |
| **UI** | theme, mode, active channel, map state | `src/app/` |
| **Crypto** | keys, epoch keys, encryption capability | `src/engine/pqc/` |

---

## Phase C: Normalize

Identify and eliminate duplicated state:
- If data can be derived from another store, use `derived()` not a separate `writable()`
- If two stores hold the same data with different access patterns, pick one source of truth
- Document which store is the source of truth for each data domain

---

## Phase D: Enforce Cleanup

Create a pattern for subscription lifecycle:

```typescript
// Pattern: auto-cleanup on component destroy
import {onDestroy} from "svelte"

export function useSubscription(store) {
  const unsub = store.subscribe(/* ... */)
  onDestroy(unsub)
  return store
}
```

Audit existing subscriptions for cleanup. Flag any `subscribe()` call without a corresponding `unsubscribe()` or `onDestroy()`.

---

## Deliverables

1. **Store inventory document** — every store cataloged
2. **Dependency graph** — which stores derive from which
3. **Normalization plan** — which duplicates to eliminate
4. **Cleanup audit** — which subscriptions lack cleanup
5. **Convention document** — rules for new stores (where to put them, naming, cleanup requirements)

---

## Verification

- [ ] Every store is cataloged with owner domain
- [ ] No two stores hold the same data (or clear source-of-truth documented)
- [ ] Every `subscribe()` has a cleanup path
- [ ] Convention document added to `docs/refactor/` or contributing guide
