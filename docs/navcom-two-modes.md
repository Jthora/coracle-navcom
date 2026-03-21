# NavCom Fundamental Fix: Two Modes, One App

> _Signal by default. ATAK when you need it._

---

## The Problem Restated

NavCom serves two distinct jobs:

1. **"Go to navcom.app and join our group chat."** — A person who wants to communicate. They need: find group → join → read messages → send messages. Their mental model is Signal, WhatsApp, Telegram. They want to talk.

2. **"What's the operational picture?"** — A coordinator who wants situational awareness. They need: see all groups at once → see the map → see recent intel → understand system health. Their mental model is ATAK, a CIC dashboard, Grafana. They want to *see*.

These are not the same job. Coracle's interface serves neither — it serves "browse a social feed." The synthesis proposed an interface that serves Job 2 while neglecting Job 1. The fix is an interface that serves **both, with Job 1 as the default**.

---

## The Two Modes

### Comms Mode (Default)

**Mental model:** Signal / Telegram / WhatsApp  
**Primary view:** Channel list → message stream → compose  
**Who uses it:** Everyone. New operators, casual members, field personnel checking in quickly.  
**When:** Most of the time. Quick message, read what's new, check in, leave.

### Ops Mode

**Mental model:** ATAK / CIC dashboard / Grafana  
**Primary view:** Map + channel activity + system status, composited  
**Who uses it:** Coordinators, admins, anyone who needs the big picture.  
**When:** Briefings, active operations, coordination tasks, reviewing intel.

### What Does NOT Change Between Modes

- The same groups/channels
- The same messages
- The same map data
- The same engine (PQC, relays, tier policies)
- The same identity
- The same compose bar

The modes change **how information is arranged on screen**, not what information exists.

---

## Comms Mode — Detailed Design

### Mobile (< 1024px)

```
┌──────────────────────────────────┐
│ ● Connected          ⚠ 2 alerts │  ← minimal status (2 items only)
├──────────────────────────────────┤
│                                  │
│  CHANNEL LIST                    │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔒 HQ Command        3 new│  │
│  │    "Alpha copies, moving…" │  │
│  ├────────────────────────────┤  │
│  │ 🔒 Alpha Team        1 new│  │
│  │    "Check-in: all green"   │  │
│  ├────────────────────────────┤  │
│  │ 🔐 Intel              ·   │  │
│  │    "SPOTREP filed at 14:32"│  │
│  ├────────────────────────────┤  │
│  │    Announcements       ·   │  │
│  │    "System update v2.1…"   │  │
│  └────────────────────────────┘  │
│                                  │
│  [📍 Check-In]   [⚠ Alert]      │  ← quick actions (2, not 7)
│                                  │
├──────┬──────┬──────┬─────────────┤
│  💬  │  🗺  │  📋  │     ⚙      │  ← bottom tab bar
│ Chat │ Map  │ Ops  │  Settings   │
└──────┴──────┴──────┴─────────────┘
```

**Tapping a channel** → Full-screen conversation view (same as Signal):

```
┌──────────────────────────────────┐
│  ← Back   HQ Command   🔒 T2  3 │  ← channel header with back arrow
├──────────────────────────────────┤
│                                  │
│  Viper-6                  14:31  │
│  Alpha team moving to Point B.   │
│  📍 [inline map thumb]          │
│                                  │
│  Phoenix                  14:32  │
│  ✓ ACK                          │
│                                  │
│  Raven-3                  14:35  │
│  ⚠ ALERT: Route blocked at…     │
│  📍 [inline map thumb]          │
│                                  │
│                                  │
├──────────────────────────────────┤
│  [📎] Type a message…   [📍][➤] │  ← compose with geo + send
└──────────────────────────────────┘
```

**Key decisions:**
- Channel list IS the home screen (not a feed, not a map)
- Encryption shown once in the channel header (`🔒 T2`), not per message
- Only non-default message types get badges (ALERT gets `⚠`, CHECK-IN gets `✓`)
- Quick actions at the bottom of channel list: only Check-In and Alert (universally understood)
- Bottom tab bar: the `🗺 Map` tab switches to Ops Mode's map. The `📋 Ops` tab switches to Ops Mode's dashboard. Tapping them IS the mode switch.
- The `💬 Chat` tab returns to Comms Mode (this channel list)

### Desktop (≥ 1024px)

```
┌───────────────────────────────────────────────────────────────┐
│  ● Connected     NAVCOM     🔒 T2  HQ Command     ⚠ 2       │
├──────────────┬────────────────────────────────────────────────┤
│              │                                                │
│ CHANNELS     │  MESSAGE STREAM (selected channel)             │
│              │                                                │
│ ┌──────────┐ │  Viper-6                             14:31    │
│ │🔒 HQ   3│ │  Alpha team moving to Point B.                 │
│ │🔒 Alpha 1│ │  📍 [inline map thumb]                        │
│ │🔐 Intel  │ │                                                │
│ │  Announce│ │  Phoenix                              14:32    │
│ │  DMs ›   │ │  ✓ ACK                                        │
│ └──────────┘ │                                                │
│              │  Raven-3                              14:35    │
│ ┌──────────┐ │  ⚠ ALERT: Route blocked at grid ref…          │
│ │ Check-In │ │  📍 [inline map thumb]                        │
│ │ Alert    │ │                                                │
│ └──────────┘ │                                                │
│              ├────────────────────────────────────────────────┤
│ [callsign]   │  [📎] Type a message…              [📍] [➤]  │
│ [role badge] │                                                │
├──────────────┴────────────────────────────────────────────────┤
│  [💬 Comms]  [🗺 Map]  [📋 Ops Dashboard]                    │
└───────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- Persistent sidebar with channels (replaces Coracle's nav links)
- Center pane is always the active channel's messages
- Mode switch is the bottom bar: `Comms | Map | Ops Dashboard`
- On desktop, the mode switch can also be keyboard shortcut (Ctrl+1/2/3)
- Channel list shows encryption tier inline (🔒/🔐), not per message
- DMs are a sub-list within channels, not a separate route

---

## Ops Mode — Detailed Design

### Tab 1: Map View

#### Mobile

```
┌──────────────────────────────────┐
│ ● Connected     T2     ⚠ 2      │
├──────────────────────────────────┤
│                                  │
│          FULL MAP                │
│    (markers, operator positions, │
│     GEOINT pins)                 │
│                                  │
│                                  │
│                     [🔧 Tools]   │  ← expand: layers, draw, measure
│                                  │
│    ┌─────────────────────────┐   │
│    │ ↕ HQ Command       3   │   │  ← pull-up comms drawer (peek)
│    │   "Alpha copies…"       │   │
│    └─────────────────────────┘   │
│                                  │
├──────┬──────┬──────┬─────────────┤
│  💬  │  🗺  │  📋  │     ⚙      │
│ Chat │ Map  │ Ops  │  Settings   │
└──────┴──────┴──────┴─────────────┘
```

**Pull-up comms drawer:**
- Default state: "peek" — shows channel name + last message, occupies ~60px
- Drag up to half-screen: shows last N messages of active channel
- Drag to full-screen: effectively becomes Comms Mode conversation view
- Horizontal swipe between channels within the drawer
- Tapping a map marker scrolls the drawer to the linked message

**Tools button:**
- Tap to expand a toolbar overlay: layer toggles, time filter ([1h] [6h] [24h]), draw mode, measure
- ATAK-style progressive disclosure — clean map by default, power tools on demand

#### Desktop

```
┌───────────────────────────────────────────────────────────────┐
│  ● Connected     NAVCOM     🔒 T2  HQ Command     ⚠ 2       │
├──────────────┬──────────────────────────┬─────────────────────┤
│              │                          │                     │
│ CHANNELS     │       MAP               │  ACTIVE CHANNEL     │
│              │  (Leaflet, full-height)  │  COMMS              │
│ ┌──────────┐ │                          │                     │
│ │🔒 HQ   3│ │  ● Viper-6              │  Viper-6    14:31   │
│ │🔒 Alpha 1│ │  ● Phoenix              │  Moving to B…       │
│ │🔐 Intel  │ │  △ ALERT @ grid ref     │                     │
│ │  Announce│ │  ◆ SPOTREP 14:32        │  Phoenix    14:32   │
│ └──────────┘ │                          │  ✓ ACK              │
│              │         [🔧]            │                     │
│ ┌──────────┐ │                          │  Raven-3    14:35   │
│ │ Check-In │ │                          │  ⚠ ALERT: Route…   │
│ │ Alert    │ │                          │                     │
│ └──────────┘ │                          ├─────────────────────┤
│              │                          │ [📎] Message… [📍]➤│
│ [callsign]   │                          │                     │
├──────────────┴──────────────────────────┴─────────────────────┤
│  [💬 Comms]  [🗺 Map]  [📋 Ops Dashboard]                    │
└───────────────────────────────────────────────────────────────┘
```

**This is the "ATAK moment":** Map + comms side by side. Clicking a marker highlights the message. Sending a geo-tagged message drops a pin. The channel sidebar persists — you can switch channels and the map filters to that channel's GEOINT.

**Key decisions:**
- On desktop, the three-column layout only appears in Map view (not in Comms Mode)
- The right panel is the same comms pane from Comms Mode, just narrower
- The map resizes to fill the center column
- No separate "right status panel" — that density was the over-engineering critique

### Tab 2: Ops Dashboard

#### Mobile

```
┌──────────────────────────────────┐
│ ● Connected     T2     ⚠ 2      │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🗺 MAP THUMBNAIL          │  │
│  │ (last 5 GEOINT markers)   │  │
│  │ [Tap to open full map]     │  │
│  └────────────────────────────┘  │
│                                  │
│  YOUR CHANNELS                   │
│  🔒 HQ Command ●3 online  3 new │
│  🔒 Alpha Team  ●5 online 1 new │
│  🔐 Intel       ●2 online  ·    │
│                                  │
│  RECENT ACTIVITY                 │
│  ⚠ 14:35 Raven-3: Route blocked │
│  ✓ 14:32 Phoenix: ACK           │
│  📍14:30 Viper-6: Moving to B   │
│                                  │
│  [📍 Check-In]   [⚠ Alert]      │
│                                  │
├──────┬──────┬──────┬─────────────┤
│  💬  │  🗺  │  📋  │     ⚙      │
│ Chat │ Map  │ Ops  │  Settings   │
└──────┴──────┴──────┴─────────────┘
```

**Three items, not eight.** Map thumbnail, channels with status, recent activity. That's the mobile dashboard. Scrollable, scannable, actionable. Each item is a tap to drill deeper.

#### Desktop

```
┌───────────────────────────────────────────────────────────────┐
│  ● Connected     NAVCOM     UTC 14:37     ⚠ 2                │
├──────────────┬──────────────────────────┬─────────────────────┤
│              │                          │                     │
│ CHANNELS     │  MAP THUMBNAIL           │  RECENT ACTIVITY    │
│              │  (auto-fit to markers)   │                     │
│ ┌──────────┐ │  [Click: full map]       │  ⚠ 14:35 Raven-3   │
│ │🔒 HQ   3│ │                          │    Route blocked    │
│ │🔒 Alpha 1│ ├──────────────────────────┤  ✓ 14:32 Phoenix   │
│ │🔐 Intel  │ │                          │    ACK              │
│ │  Announce│ │  CHANNEL STATUS          │  📍14:30 Viper-6   │
│ └──────────┘ │  HQ  ●3 🔒T2  3 unread  │    Moving to B     │
│              │  Alpha ●5 🔒T1  1 unread │  📍14:28 Raven-3   │
│              │  Intel ●2 🔐   0 unread  │    SPOTREP filed   │
│ ┌──────────┐ │                          │                     │
│ │ Check-In │ ├──────────────────────────┤  SYSTEM STATUS      │
│ │ Alert    │ │  ANNOUNCEMENTS           │  Relays: 4/4 ●     │
│ └──────────┘ │  "System update v2.1…"   │  Encryption: T2 PQC│
│              │                          │  Queued: 0          │
│ [callsign]   │                          │                     │
├──────────────┴──────────────────────────┴─────────────────────┤
│  [💬 Comms]  [🗺 Map]  [📋 Ops Dashboard]                    │
└───────────────────────────────────────────────────────────────┘
```

**Desktop gets the full picture** because it has the real estate. Map thumbnail (upper-center), channel status cards (lower-center), recent activity (right column), system status (right bottom), announcements (lower-center). The channel sidebar is shared with all modes — clicking a channel from Dashboard switches to Comms Mode conversation view.

**Note:** UTC clock appears in the status bar ONLY in Ops Dashboard mode. In Comms Mode, it's absent. The interface adapts.

---

## The Mode Switch Mechanism

### How It Works

The bottom bar has three tabs: **💬 Comms** | **🗺 Map** | **📋 Ops**

- These are not page navigations. They change the **center viewport** while preserving persistent state (selected channel, scroll position, compose draft).
- On mobile, they are the standard bottom tab bar (iOS/Android pattern — universally understood).
- On desktop, they appear at the bottom of the center pane (or optionally as keyboard shortcuts: Ctrl+1/2/3).
- The channel sidebar is shared across all modes. Selecting a channel works the same everywhere.

### What Persists Across Mode Switches

| State | Persists? | Why |
|-------|-----------|-----|
| Selected channel | Yes | Switching to Map shows that channel's GEOINT. Switching back shows that channel's messages. |
| Compose draft | Yes | If you're mid-message and switch to check the map, your draft is waiting when you return. |
| Scroll position | Yes | Return to exactly where you were in the conversation. |
| Map viewport (zoom/center) | Yes | Don't reset the map every time you tab back. |
| Dashboard state | No | Dashboard always renders fresh (it's a summary view). |

### Existing Code Pattern to Extend

The codebase already has a mode system in `src/app/groups/admin-mode.ts`:

```ts
export type GroupAdminMode = "guided" | "expert"

export const getGroupAdminMode = (groupId: string): GroupAdminMode => {
  const stored = window.localStorage.getItem(`group_admin_mode:${groupId}`)
  return stored === "expert" ? "expert" : "guided"
}
```

The app-wide mode follows the same pattern:

```ts
export type NavComMode = "comms" | "map" | "ops"

export const navcomMode = writable<NavComMode>(
  (localStorage.getItem("navcom_mode") as NavComMode) || "comms"
)

navcomMode.subscribe(mode => {
  localStorage.setItem("navcom_mode", mode)
})
```

This lives at the app level, not per-group. It controls which center viewport component renders.

---

## Progressive Disclosure Within Each Mode

The two-mode structure IS progressive disclosure at the top level. But within each mode, the principle continues:

### Comms Mode Progression

| First Visit (minute 0) | Regular Use (day 2+) | Power Use (week 2+) |
|------------------------|----------------------|---------------------|
| Channel list with one channel (the group they were invited to) | Multiple channels, unread counts, DMs | Custom channel categories, notification tuning |
| Simple compose bar: text + send | Compose bar + attachment + geo pin | Message type selector (CHECK-IN, ALERT, SITREP) |
| No quick actions visible | Quick actions appear after first check-in usage | Quick actions customizable |
| Encryption shown as lock icon, no explanation | Tap lock icon for explanation | PQC key management in settings |

### Ops Mode Progression

| First Contact | Regular Use | Power Use |
|--------------|-------------|-----------|
| Map with markers, clean | Map with layer toggle button visible | Full layer panel, temporal slider, draw tools |
| Dashboard with 3 panels | Dashboard with customizable layout | Dashboard with relay health, encryption status, full roster |
| Comms drawer at "peek" height | Comms drawer at half-height default | Comms drawer position remembered per channel |

The key: **nothing is hidden permanently.** Everything is accessible. But the first encounter is always the simplest possible version. Complexity reveals itself as the operator needs it.

---

## The Enrollment Flow in a Two-Mode World

The current Coracle onboarding:
1. Generate key / import key / connect extension
2. Set profile (name, avatar)
3. Add relays
4. Follow starter accounts
5. Land on `/notes`

The NavCom enrollment, informed by the two-mode design:

### Path A: Invite Link (Most Common)

1. Operator taps invite link → NavCom opens
2. **One screen:** "Choose a name (your callsign)" + [optional avatar] + [Create Account]
3. Keys generated silently. Relays set from group's relay hints. Profile set.
4. **Auto-join the invited group.**
5. **Land in Comms Mode, inside that group's conversation.**

Three seconds from link to chat. The operator sees messages immediately. They can type immediately. Everything else (key backup, PQC upgrade, profile completion) is deferred.

### Path B: Direct Visit (No Invite)

1. Operator opens navcom.app
2. **Landing page:** Comms Mode channel list (empty state). Above: "Looking for a group? [Paste an invite link]" + "Or [browse public groups]".
3. Below: "New to NavCom? [Create an account]" → same one-screen enrollment.
4. After enrollment: return to this landing page. They can now paste/browse/wait for an invite.

No announcements feed. No social feed. The empty state communicates the purpose: NavCom is for group communication. If you're not in a group yet, the interface helps you find one.

### Path C: Existing Nostr Identity

1. Browser extension or mobile signer detected
2. "Welcome back. Use your existing identity?" → [Yes, continue] → load groups, land in Comms Mode.
3. No ceremony. If they have groups, show them. If not, show the empty state from Path B.

---

## How This Maps to the Existing Architecture

### What Changes

| Current Component | Change Required |
|-------------------|----------------|
| **App.svelte** | Add `NavComMode` store subscription. Center viewport conditionally renders Comms/Map/Ops component. |
| **Nav.svelte** | Replace mobile bottom bar (search/post/hamburger) with mode tabs (Chat/Map/Ops/Settings). Replace desktop top bar with integrated mode tabs. |
| **MenuDesktop.svelte** | Becomes the channel sidebar. Persistent across all modes. Nav links (Announcements, Ops Feed, etc.) become channels in the list. |
| **MenuMobile.svelte** | Simplified. Almost everything from the hamburger menu moves into the Settings tab or the channel sidebar. |
| **Routes.svelte** | Center viewport becomes mode-driven instead of route-driven for the main views. Sub-routes (group settings, profiles, etc.) remain route-based but open as modals. |
| **Announcements.svelte** | Becomes a channel in the channel list and a card on the Ops Dashboard. No longer the landing page. |
| **Home.svelte** | Replaced by Comms Mode channel list. Ops Feed and Intel Feed become channels. |
| **GroupConversation.svelte** | Becomes the reusable message stream component for both Comms Mode (full-screen) and Map Mode (side panel). |
| **IntelNavMap.svelte** | Becomes the Map Mode center viewport. Gains: comms drawer (mobile), side panel (desktop), layer controls, marker↔message linking. |

### What Stays Exactly the Same

| Component | Why |
|-----------|-----|
| `src/engine/*` | The entire engine layer. PQC, tiers, groups, relays — untouched. |
| `src/domain/*` | All domain logic. Feeds, group control, capability probe. |
| `src/partials/*` | All UI primitives (Button, Input, Modal, Card, etc.) — reused. |
| `src/app/shared/Message.svelte` | Message rendering — reused in both modes. |
| `src/app/shared/Channel.svelte` | DM rendering — becomes a channel type in the unified list. |
| `src/app/shared/GeoModal.svelte` | Geo-tagging — reused in compose bar. |
| `src/app/shared/Feed*.svelte` | Feed components — reused within channels and dashboard. |
| `src/app/views/Login.svelte` | Auth methods — simplified labels, but same mechanics. |
| `src/app/views/GroupDetail.svelte` | Group info — opens as modal from channel header. |
| `src/app/views/RelayList.svelte` | Relay management — lives in Settings tab. |
| `src/app/util/router.ts` | Router — still needed for sub-routes, modals, deep links. |

### New Components Needed

| Component | Purpose | Size |
|-----------|---------|------|
| **NavComShell.svelte** | Root layout: status bar + sidebar + center viewport + mode tabs | ~150 lines |
| **ChannelSidebar.svelte** | Channel list with unread, encryption, status | ~200 lines |
| **CommsView.svelte** | Channel list (mobile) or message stream (desktop) | ~100 lines (wraps existing) |
| **MapView.svelte** | Wraps IntelNavMap + comms drawer/side panel | ~200 lines |
| **OpsView.svelte** | Dashboard with map thumbnail, channel cards, activity feed | ~250 lines |
| **CommsDrawer.svelte** | Mobile pull-up drawer for messages over the map | ~150 lines |
| **StatusBar.svelte** | Minimal: connection + alerts (Comms), expanded in Ops | ~80 lines |
| **QuickActions.svelte** | Check-In + Alert buttons | ~60 lines |
| **ModeTabBar.svelte** | Bottom tab bar: Chat / Map / Ops / Settings | ~50 lines |

**Total new code: ~1,200 lines of Svelte.** Not 10,000 — because it's composing existing components into a new layout, not rebuilding them.

---

## The User Journey, End to End

### Minute 0: Someone texts you "join our group: navcom.app/invite/abc123"

1. You tap the link. NavCom loads.
2. One screen: "Choose a name" → you type "Sarah" → [Create Account]
3. You're in HQ Command group chat. Messages are loading. You see people talking.
4. You type "Hey, I'm here" and send.
5. The bottom tab bar shows: 💬 Chat (active) | 🗺 Map | 📋 Ops | ⚙ Settings

**Total time: <15 seconds. Zero jargon. Zero key ceremony. Zero confusion.**

### Day 3: You're comfortable

6. You notice the Map tab. You tap it. A map appears with pins where people have posted GEOINT. A drawer at the bottom shows the active chat — you can peek at it or pull it up.
7. You tap a pin. The drawer scrolls to that message. "Oh, that's where Viper-6 saw the roadblock."
8. You go back to Chat. You notice the [📍 Check-In] button. You tap it. It sends "✓ Sarah: All green" with your location (you approved the prompt).
9. An admin pinned a message at the top of HQ Command. You see it.

### Week 2: You're an active operator

10. You hold the compose bar and notice the message type selector: MESSAGE / CHECK-IN / ALERT. You file an ALERT about something urgent.
11. The alert has a red badge in other people's tab bars. The coordinator sees it on their Ops Dashboard.
12. You get a notification: "Back up your identity key." You tap it, save the backup. Done.
13. You join a second group (Intel). Both appear in your channel list. Unread counts visible.

### Month 1: You're a coordinator

14. You live in Ops Mode. The dashboard shows all channels, map thumbnail, recent activity, relay health.
15. You use Map Mode frequently: map + chat side by side on desktop. You toggle GEOINT layers, filter by time.
16. You see an operator's check-in on the map and send them a direct message from the drawer.
17. The system prompts you to enable PQC — your group is Tier 2 and needs quantum-safe keys. You generate them from Settings → Identity.

**Every feature was available from day 1.** The interface just didn't push it at you until you needed it.

---

## Why This Works

1. **Comms Mode as default answers the actual user scenario.** "Join our group chat" → see the group chat. Not a dashboard, not a map, not a feed.

2. **Ops Mode as a tab means zero training cost.** It's there when you're curious. It's there when you need it. You don't need to know it exists on day one.

3. **One layout adapts to both screen sizes.** Mobile: full-screen center viewport with bottom tabs. Desktop: sidebar + center viewport + optional right panel. No separate "mobile app" vs "desktop app" design.

4. **The channel sidebar unifies all communication.** Groups, DMs, feeds, announcements — all channels. No more separate routes for separate communication types.

5. **The mode switch preserves context.** Draft messages, scroll positions, selected channels — nothing lost when you glance at the map and come back.

6. **The enrollment flow respects the invite scenario.** Invite link → callsign → you're in the group. Everything else is deferred. The system figures out relays, generates keys, and sets defaults silently.

7. **Progressive disclosure at every level.** The app-level mode switch is the macro level. Within each mode, features reveal themselves based on use. Quick actions appear after you use them once. Structured reporting appears when your group enables it. PQC prompts appear when you need them.

8. **The existing engine is fully reused.** PQC crypto, tier policies, relay probing, group commands, GEOINT pipeline, feeds — all the engine work from previous phases connects directly. The transmutation is purely at the interface layer: ~1,200 lines of new Svelte wrapping existing components in a new layout.

Signal by default. ATAK when you need it. That's NavCom.
