# WS-04: Infrastructure & Documentation

> Completing the structural foundations that support verification and maintenance.

## Status: NOT STARTED

**Priority**: MEDIUM — Unblocks verification items and establishes conventions
**Effort**: ~350 lines across 3 new files + 1 install
**Blocks**: 6 verification items
**Dependencies**: None

---

## Task 1: axe-core Accessibility Testing

### Problem
Verification item (line 685): "axe-core reports zero critical violations"
axe-core is not installed. No automated accessibility test exists.

### Plan

1. Install: `pnpm add -D @axe-core/cli axe-core`
2. Create vitest accessibility test that renders key components and runs axe-core analysis
3. Add npm script: `"test:a11y": "vitest run tests/unit/a11y/"`

**File**: `tests/unit/a11y/critical-violations.spec.ts`

```typescript
// Test approach: render HTML snapshots of key components, run axe-core
import {configureAxe, getViolations} from "./axe-helpers"

describe("Accessibility — zero critical violations", () => {
  it("ModeTabBar has no critical violations", async () => { ... })
  it("ChannelSidebar has no critical violations", async () => { ... })
  it("StatusBar has no critical violations", async () => { ... })
})
```

**Effort**: ~80 lines + install
**Unblocks**: Line 685

---

## Task 2: State Management Conventions Document

### Problem
Step 4.5.2 (State Management Audit) tasks are all checked, but verification (lines 590-593) requires:
- Every store cataloged with owner domain
- No two stores hold same data
- Every `subscribe()` has a cleanup path
- Convention document added to `docs/refactor/`

No such document exists.

### Plan

Create `docs/refactor/conventions/state-management.md` with:

**Section 1: Store Inventory**

| Store | File | Owner Domain | Persistence | Subscribers |
|-------|------|-------------|-------------|-------------|
| `navcomMode` | navcom-mode.ts | Navigation | localStorage | ModeTabBar, App |
| `activeChannelByMode` | navcom-mode.ts | Navigation | localStorage | CommsView, MapView |
| `mapViewport` | navcom-mode.ts | Map | localStorage | MapView, IntelNavMap |
| `mapLayers` | navcom-mode.ts | Map | localStorage | MapView, MapLayerPanel |
| `mapTileSet` | navcom-mode.ts | Map | localStorage | IntelNavMap |
| `mapTimeRange` | navcom-mode.ts | Map | localStorage | MapView |
| `selectedMarkerId` | navcom-mode.ts | Cross-view | memory | MapView, GroupConversation |
| `selectedMessageId` | navcom-mode.ts | Cross-view | memory | MapView, GroupConversation |
| `composeDrafts` | navcom-mode.ts | Comms | localStorage | CommsView |
| `scrollPositions` | navcom-mode.ts | Comms | localStorage | CommsView |
| `groupSummaries` | groups/state.ts | Groups | derived | Sidebar, OpsView, Comms |
| `unreadGroupMessageCounts` | groups/state.ts | Groups | derived | Sidebar, TabBar |
| ... | ... | ... | ... | ... |

**Section 2: Ownership Rules**
- One domain owns writes; others read via derived stores
- Source-of-truth: Nostr events (relay data) → projection stores → component state
- `synced()` stores are the persistence boundary (localStorage)

**Section 3: Subscription Cleanup**
- Components: `onDestroy()` cleanup required for all manual subscriptions
- Derived stores (`$` prefix in templates): auto-cleaned by Svelte
- Manual `store.subscribe()` in `.ts` files: must return unsubscriber, caller must invoke

**Section 4: Naming Conventions**
- Writable stores: camelCase nouns (`navcomMode`, `mapLayers`)
- Derived stores: camelCase with computed-sounding name (`activeChannel`, `groupSummaries`)
- Set functions: `setX()` verb functions (`setMode()`, `setActiveChannel()`)

**Effort**: ~200 lines
**Unblocks**: Lines 590-593

---

## Task 3: i18n PR Checklist

### Problem
Line 709: "New component PR checklist includes 'strings extracted to locale file'"
No such checklist exists.

### Plan

Add to `CONTRIBUTING.md` (or create if absent):

```markdown
## Component Checklist

When creating or modifying NavCom Svelte components:

- [ ] All user-visible strings extracted to `src/locales/en.json`
- [ ] Strings use `$t("key.path")` from `svelte-i18n`
- [ ] Pluralization uses ICU MessageFormat: `{count, plural, one {# item} other {# items}}`
- [ ] Interpolation uses `{values: {varName}}` syntax
- [ ] Run `node scripts/check-locale-parity.mjs` passes
```

**Effort**: ~20 lines
**Unblocks**: Line 709

---

## Task 4: Tracker Accuracy Corrections

### Problem
Two verification items are marked `[x]` but the underlying functionality is stubbed:

1. **Line 722**: "Configure local relay URL → connects alongside internet relays"
   - `connectLocalRelays()` exists but has never been tested against a real relay
   - Unit tests mock `Pool.get()` — they verify the call, not the connection
   - Should be `[ ]` until tested against a running relay

2. **Line 723**: "mDNS discovers local Nostr relay on LAN → auto-connects"
   - `startLocalRelayDiscovery()` sets a 30-second interval that calls `connectLocalRelays()`
   - There is NO actual mDNS scanning — the function name is aspirational
   - `ingestDiscoveredRelays()` exists but nothing calls it
   - Should be `[ ]`

### Fix
Uncheck both items. Update annotations to reflect actual state.

**Net effect**: 214 → 212 done in tracker

---

## Verification Items Unblocked

- [ ] axe-core reports zero critical violations (line 685)
- [ ] Every store cataloged with owner domain (line 590)
- [ ] No two stores hold same data (or clear source-of-truth documented) (line 591)
- [ ] Every `subscribe()` has a cleanup path (line 592)
- [ ] Convention document added to `docs/refactor/` or contributing guide (line 593)
- [ ] New component PR checklist includes "strings extracted to locale file" (line 709)

---

## Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/a11y/critical-violations.spec.ts` | Create | ~80 |
| `docs/refactor/conventions/state-management.md` | Create | ~200 |
| `CONTRIBUTING.md` | Create/Modify | ~20 |
| `docs/refactor/progress-tracker.md` | Fix 2 checkboxes | ~4 |
| `package.json` | Add axe-core devDep | install |
| **Total** | | **~300** |
