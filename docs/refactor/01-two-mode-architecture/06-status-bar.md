# 01-06: Status Bar

> Minimal ambient information strip — connection state and alerts only.

**Priority**: MEDIUM — important for operational awareness, but not blocking.  
**Effort**: LOW (~80 lines)  
**Depends on**: 01-01 (mode store)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-ux-critique.md](../../navcom-ux-critique.md) §3

---

## Design Principle

Per the UX critique: "Status strip overload (7 indicators is illegible on 375px)." The status bar shows exactly **two things**:

1. **Connection state**: ● Connected / ○ Disconnected / ◌ Connecting
2. **Alert count**: ⚠ N (only when alerts exist)

That's it. Relay health, queue depth, member count, encryption mode — all available in Settings or channel header, not the ambient bar.

---

## Layout

### All Modes, All Viewports

A thin strip (28–32px) at the top of the content area, below any system status bar / safe area inset:

```
● Connected                    ⚠ 2
```

Or on disconnect:
```
○ Reconnecting...              ⚠ 2
```

### Styling

- Background: `bg-neutral-900` (matches app background, nearly invisible)
- Text: `text-neutral-400` (subdued, not attention-grabbing)
- Alert badge: `text-warning` when alerts exist
- Connection dot: `text-success` when connected, `text-danger` when disconnected

---

## Implementation

### New Component: `src/app/views/StatusBar.svelte`

```svelte
<script>
  // Derive connection state from relay pool/network state
  // Derive alert count from unread alerts across channels
</script>

<div class="flex items-center justify-between px-3 h-8 text-sm text-neutral-400">
  <div class="flex items-center gap-2">
    <span class={connected ? "text-success" : "text-danger"}>●</span>
    <span>{connectionLabel}</span>
  </div>
  {#if alertCount > 0}
    <div class="flex items-center gap-1 text-warning">
      <span>⚠</span>
      <span>{alertCount}</span>
    </div>
  {/if}
</div>
```

### Connection State Source

Derive from existing relay connection state (whatever drives the current relay status indicators in the app). The status bar doesn't manage connections — it reads from the existing network state.

### Alert Count Source

Count of unread ALERT-type messages across all channels. Until message types are implemented (Phase 3), this can count any unread messages or be stubbed at 0.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/StatusBar.svelte` | Connection + alert strip | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` or `NavComShell.svelte` | Render `StatusBar` at top of content area |

---

## Verification

- [ ] Shows "Connected" with green dot when relays are healthy
- [ ] Shows "Reconnecting..." with red dot when disconnected
- [ ] Alert count appears only when > 0
- [ ] Visually unobtrusive (doesn't compete with content)
- [ ] Renders correctly in all three modes
- [ ] Respects safe area insets on mobile
