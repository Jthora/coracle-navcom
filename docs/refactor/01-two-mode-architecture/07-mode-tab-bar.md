# 01-07: Mode Tab Bar

> Bottom navigation that switches between Comms, Map, and Ops modes.

**Priority**: CRITICAL — the tab bar IS the mode switch mechanism.  
**Effort**: LOW (~50 lines)  
**Depends on**: 01-01 (mode store)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md)

---

## Design

A bottom tab bar, always visible, consistent across mobile and desktop.

```
┌─────────────────────────────────────┐
│  💬 Chat   |   🗺 Map   |   📋 Ops  │
└─────────────────────────────────────┘
```

### States

- **Active tab**: accent color text + accent underline/indicator
- **Inactive tabs**: neutral-400 text, no indicator
- **Unread badge on Chat tab**: shows total unread count across channels (optional, add later)

### Placement

- **Mobile**: bottom of screen, above safe area inset. Replaces the current mobile bottom nav.
- **Desktop**: bottom of content area (same position). Or optionally in the sidebar — but bottom is consistent and doesn't require learning two navigation patterns.

### Size

- Height: 48–56px (matches current mobile bottom nav ~56px)
- Touch target: each tab is minimum 48×48px
- Safe area: `pb-sai` below the bar

---

## Implementation

### New Component: `src/app/views/ModeTabBar.svelte`

```svelte
<script>
  import {navcomMode, setMode} from "src/app/navcom-mode"
  
  const tabs = [
    {id: "comms", icon: "💬", label: "Chat"},
    {id: "map",   icon: "🗺",  label: "Map"},
    {id: "ops",   icon: "📋", label: "Ops"},
  ]
</script>

<nav class="flex items-center justify-around h-14 bg-neutral-900 border-t border-neutral-700">
  {#each tabs as tab}
    <button
      class="flex flex-col items-center gap-0.5 px-4 py-2"
      class:text-accent={$navcomMode === tab.id}
      class:text-neutral-400={$navcomMode !== tab.id}
      on:click={() => setMode(tab.id)}
    >
      <span class="text-lg">{tab.icon}</span>
      <span class="text-xs uppercase tracking-wide">{tab.label}</span>
    </button>
  {/each}
</nav>
```

### Settings Access

Settings moves to a gear icon in the sidebar header (desktop) or a 4th tab / hamburger within the tab bar (mobile). Not a mode — it opens as an overlay/route.

Options:
- **Option A**: Fourth tab (⚙ Settings) — simple, always visible
- **Option B**: Gear icon in top bar — keeps tab count to 3, less crowded

Recommend **Option A** for mobile (4 tabs is standard), **Option B for desktop** (settings in sidebar header).

---

## Replaces

| Current | New |
|---------|-----|
| `MenuMobile.svelte` bottom nav (hamburger-driven) | `ModeTabBar` (mode tabs) |
| `ForegroundButtons.svelte` floating action buttons | Removed (quick actions move to CommsView) |

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/ModeTabBar.svelte` | Bottom tab bar | ~50 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` or `NavComShell.svelte` | Render `ModeTabBar` at bottom of viewport |
| `src/app/Nav.svelte` | Remove or adapt mobile bottom nav |

---

## Verification

- [ ] Three tabs visible on both mobile and desktop
- [ ] Active tab highlighted with accent color
- [ ] Tapping tab switches mode instantly (no loading state)
- [ ] Tab bar stays fixed at bottom during scroll
- [ ] Tab bar respects safe area inset (notch devices)
- [ ] Settings is accessible from some visible UI element
