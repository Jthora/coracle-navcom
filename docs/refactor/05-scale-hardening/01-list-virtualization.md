# 05-01: List Virtualization

> Render only visible items in long lists — messages, channels, members.

**Priority**: CRITICAL at 100+ items per list.  
**Effort**: MEDIUM  
**Depends on**: 01-03 (Comms View — message stream exists)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §1

---

## Problem

All list components render every DOM node. At 50 items this is acceptable. At 1,000 messages in a busy channel, the browser renders 1,000 DOM nodes simultaneously → 2+ second initial paint on desktop, frozen UI on mobile.

Affected components:
- Message stream (highest impact — channels can have thousands of messages)
- Channel sidebar (moderate — 20-50 channels typical)
- Member lists (high impact — groups can have hundreds of members)
- Suggestions/autocomplete lists (already capped at 30 items)

---

## Solution

Integrate a virtual scroller that renders only the items visible in the viewport plus a small overscan buffer.

### Library Options

| Library | Pros | Cons |
|---------|------|------|
| `svelte-virtual-list` | Svelte-native, simple API | Less maintained |
| `@tanstack/svelte-virtual` | Active maintenance, flexible | More complex API |
| Custom implementation | No dependency, exact control | More work |

Recommend: `@tanstack/svelte-virtual` — well-maintained, handles variable-height rows (important for messages with different content lengths).

### Where to Apply

| Component | Priority | Row Height |
|-----------|----------|------------|
| Message stream (Feed/FeedReverse) | P0 | Variable (messages have different lengths) |
| Member list | P1 | Fixed (~48px per row) |
| Channel sidebar | P2 | Fixed (~56px per row) |

### Variable-Height Messages

Messages have different heights (text-only vs. image vs. SITREP card). The virtual scroller needs to measure each row dynamically. `@tanstack/svelte-virtual` supports `estimateSize` + `measureElement` for this.

---

## Implementation Notes

- The existing `createScroller()` utility handles pagination/infinite scroll — virtualization wraps around this, not replaces it
- `FeedReverse.svelte` (for chat-style newest-at-bottom) needs special handling: the scroll anchor is at the bottom, not the top
- New messages arriving should not cause scroll jumps — maintain scroll position relative to current view

---

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add virtual scroll library |
| Feed/message list components | Wrap in virtual scroller |
| Member list component | Wrap in virtual scroller |
| `ChannelSidebar.svelte` (from 01-02) | Optional: virtual scroll if > 30 channels |

---

## Verification

- [ ] Load 1,000 messages in a channel → DOM contains ~30 nodes (viewport + overscan), not 1,000
- [ ] Scroll through 1,000 messages smoothly (no jank)
- [ ] New message added at bottom → scroll position maintained (no jump)
- [ ] Variable-height messages (text, image, SITREP cards) render correctly
- [ ] Scroll-to-message (from marker-message linking) still works with virtualization
