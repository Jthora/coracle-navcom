# 01-03: Comms View

> The default mode — a Signal/Telegram-like messaging interface.

**Priority**: CRITICAL — this is what 90% of users interact with 90% of the time.  
**Effort**: LOW–MEDIUM (~100 lines, mostly composing existing components)  
**Depends on**: 01-01 (mode store), 01-02 (channel sidebar)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-ux-critique.md](../../navcom-ux-critique.md) §1-2

---

## Design Principle

Comms Mode is Signal for groups. No jargon, no military concepts, no map — just a channel list and a message stream. A new user should understand it in 3 seconds.

---

## Layout

### Mobile (<1024px)

**State A — Channel List** (default):
```
┌─────────────────────────┐
│ [Status: ● Connected]   │
├─────────────────────────┤
│                         │
│   CHANNEL LIST          │
│   (full screen)         │
│                         │
├─────────────────────────┤
│ [Quick: Check-In|Alert] │
├─────────────────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops │
└─────────────────────────┘
```

**State B — Conversation** (after tapping channel):
```
┌─────────────────────────┐
│ [← Back] HQ Command 🔒 │  ← Channel name + encryption
├─────────────────────────┤
│                         │
│   MESSAGE STREAM        │
│   (full screen)         │
│                         │
├─────────────────────────┤
│ [Compose bar + Send]    │
├─────────────────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops │
└─────────────────────────┘
```

Transition: channel list → conversation is a push navigation (back button returns to list).

### Desktop (≥1024px)

```
┌──────────┬──────────────────────────┐
│ Sidebar  │ [HQ Command] 🔒 T2      │  ← Channel header
│ (channels│                          │
│  list)   │   MESSAGE STREAM         │
│          │                          │
│          │                          │
│          ├──────────────────────────┤
│          │ [Compose bar + Send]     │
├──────────┴──────────────────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops           │
└─────────────────────────────────────┘
```

Sidebar is `ChannelSidebar` (01-02). Message stream is the existing `GroupConversation.svelte` (or `Channel.svelte`).

---

## Implementation

### New Component: `src/app/views/CommsView.svelte`

This is a thin orchestrator — it selects between channel list and conversation based on whether a channel is active.

```svelte
<script>
  import {activeChannel} from "src/app/navcom-state"
  import ChannelSidebar from "./ChannelSidebar.svelte"
  // Import existing conversation component
  
  let innerWidth = 0
  $: isMobile = innerWidth < 1024
</script>

<svelte:window bind:innerWidth />

{#if isMobile}
  {#if $activeChannel}
    <!-- Full-screen conversation -->
  {:else}
    <ChannelSidebar />
  {/if}
{:else}
  <!-- Desktop: sidebar is handled by the shell, just render conversation -->
  {#if $activeChannel}
    <!-- Conversation -->
  {:else}
    <!-- Empty state: "Select a channel" -->
  {/if}
{/if}
```

### Active Channel Store

**New addition to** `src/app/navcom-mode.ts` (or separate file):

```typescript
import {writable} from "svelte/store"

// The currently selected channel/group identifier
export const activeChannel = writable<string | null>(null)
```

This store persists across mode switches so switching from Comms → Map → Comms retains the selected channel.

### Quick Actions

Two buttons at the bottom of the channel list (mobile) or in the channel header (desktop):

- **Check-In** — sends a standardized "I'm here, I'm fine" message to the active channel
- **Alert** — sends a priority alert to the active channel (opens a one-field form: "What's happening?")

These are the only two universally-understood quick actions. More message types are added in Phase 3 (Structured Comms).

### Encryption Display

Show once in the channel header, not per message:
- **No icon**: unencrypted (T0)
- **🔒**: encrypted (T1)
- **🔒 with label "End-to-End Encrypted"**: on first visit to explain the icon
- **🔐**: enforced encryption (T2), shown with "Enforced E2E" label

---

## Components Reused

| Existing Component | How It's Used |
|-------------------|---------------|
| `GroupConversation.svelte` | Message stream (the main content) |
| `Channel.svelte` | Message rendering |
| `Feed.svelte` / `FeedReverse.svelte` | Message list rendering |
| `Compose.svelte` or equivalent | Message composition bar |
| `ChannelSidebar.svelte` | Channel list (new, from 01-02) |

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/CommsView.svelte` | Orchestrator: channel list ↔ conversation | ~100 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/navcom-mode.ts` | Add `activeChannel` store |
| `src/app/App.svelte` | Render `CommsView` when mode is "comms" |

---

## Verification

- [ ] Mobile: channel list fills screen, tapping opens conversation, back returns to list
- [ ] Desktop: sidebar + conversation side-by-side, selecting channel updates conversation
- [ ] Empty state shows when no channel is selected (desktop)
- [ ] Quick actions (Check-In, Alert) work from channel list
- [ ] Encryption indicator shows correct tier for each channel
- [ ] Switching to Map/Ops mode and back preserves selected channel
- [ ] Compose draft is preserved across mode switches
