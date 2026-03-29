# NavCom Interface Design Synthesis

## Extracting the DNA from the Roster

> _Forty references. One interface. Here's how to build it._

This document dissects the 40+ references from the roster into **concrete, stealable design elements** — organized not by source, but by where they land in the NavCom interface. Each element is tagged with its origin, its function, and how it maps to a known gap.

---

## Part 1: The Shell — Overall Layout Architecture

The Coracle layout is: **left sidebar nav → single content pane → modal overlays.** This is the standard social-client layout (Twitter, Mastodon, every Nostr client). It assumes the user does one thing at a time and navigates between activities.

Every operational reference rejects this pattern. Here's what they do instead:

### Layout Concept A: "The Cockpit" (Elite: Dangerous / DCS World / Star Citizen)

```
┌──────────────────────────────────────────────────────┐
│              STATUS STRIP (always visible)            │
├────────┬─────────────────────────────┬───────────────┤
│        │                             │               │
│  LEFT  │      CENTER VIEWPORT        │    RIGHT      │
│ PANEL  │   (map / dashboard / feed)  │    PANEL      │
│        │                             │  (context)    │
│ comms  │                             │  details,     │
│ channels│                            │  intel,       │
│ roster │                             │  actions      │
│        │                             │               │
├────────┴─────────────────────────────┴───────────────┤
│              ACTION BAR / COMPOSE (contextual)        │
└──────────────────────────────────────────────────────┘
```

**Stolen from:**
- **Elite: Dangerous** — left panel (nav), center (cockpit), right panel (systems/contacts). All accessible via key combo without leaving the view.
- **DCS World** — MFD (multi-function display) concept: each panel is a mode that can be toggled between data views.
- **Star Citizen mobiGlas** — overlay panel system that doesn't navigate away from the primary context.

**Why it fits NavCom:** The operator never leaves "the cockpit." The center viewport changes (map, dashboard, feed) but the comms sidebar and status strip persist. No page navigation for core functions.

**Replaces:** Coracle's `Routes.svelte` → `Menu.svelte` → single-content-pane pattern.

**Addresses gaps:** #1 (no dashboard), #4 (map isolated from comms).

---

### Layout Concept B: "The CIC" (The Expanse / Battlestar Galactica / Pacific Rim)

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────────────┐  ┌────────┐ │
│  │ CHANNEL │  │                      │  │ SYSTEM │ │
│  │  LIST   │  │   MAIN TACTICAL      │  │ STATUS │ │
│  │         │  │     DISPLAY          │  │        │ │
│  │ ● HQ    │  │  (map + overlays)    │  │ relays │ │
│  │ ● Alpha │  │                      │  │ crypto │ │
│  │ ○ Bravo │  │                      │  │ peers  │ │
│  │   Intel │  │                      │  │ queue  │ │
│  │   Ops   │  │                      │  │        │ │
│  ├─────────┤  ├──────────────────────┤  ├────────┤ │
│  │ ACTIVE  │  │   COMMS TRANSCRIPT   │  │ DETAIL │ │
│  │ OPERATOR│  │   (selected channel) │  │ PANEL  │ │
│  │ callsign│  │                      │  │(marker │ │
│  │ role    │  │   [compose bar]      │  │ /person│ │
│  │ status  │  │                      │  │ /event)│ │
│  └─────────┘  └──────────────────────┘  └────────┘ │
└─────────────────────────────────────────────────────┘
```

**Stolen from:**
- **The Expanse CIC** — split between tactical display (top) and comms (bottom). The Rocinante's CIC has radar contacts above, ship systems to the right, comms below.
- **BSG CIC** — DRADIS (radar) as centerpiece, status boards flanking, comms below. Minimal. Works with degraded displays.
- **Pacific Rim LOCCENT** — giant shared tactical display as center focus, individual station panels surrounding it.

**Why it fits NavCom:** The three-column layout gives channel selection, tactical view, and system status simultaneously. The bottom split gives comms and detail without navigating. This is the "desktop command" layout.

**Where it excels:** Large screens, multi-monitor setups, desktop operators at a fixed station.

---

### Layout Concept C: "The ATAK" (Mobile-First)

```
┌──────────────────────────────────┐
│ ≡  HQ          ●5  ◐2  ⚡3  🔒T2│  ← status bar
├──────────────────────────────────┤
│                                  │
│          FULL MAP                │
│      (markers, overlays,         │
│       team positions)            │
│                                  │
│                                  │
│    ┌─────────────────────────┐   │
│    │ PULL-UP COMMS DRAWER    │   │
│    │ (drag to expand)        │   │
│    └─────────────────────────┘   │
├────┬────┬────┬────┬──────────────┤
│ 📍 │ 💬 │ ⚠️ │ 📋 │     ≡       │  ← action bar
│Map │Chat│Alert│Rpt │   More      │
└────┴────┴────┴────┴──────────────┘
```

**Stolen from:**
- **ATAK** — Full-screen map is the default. Chat is an overlay drawer. Team positions are always visible. Action bar at bottom for quick operations.
- **ForeFlight** — Map-centric with pull-up panels for weather, NOTAMs, frequencies. The map is never hidden.
- **Zello/ESChat** — Bottom action bar for push-to-talk, channel switch, status.

**Why it fits NavCom:** Mobile operators in the field. The map IS the app. Everything else is an overlay. One-thumb operation.

**Key insight:** On mobile, the map is the dashboard. The pull-up drawer replaces page navigation entirely.

**Addresses gaps:** #4 (map isolated), #9 (no layer controls — the ATAK drawer IS the layer control).

---

## Part 2: Specific UI Components — The Parts Catalog

Organized by function, not source. Each component is a concrete, buildable thing.

---

### 2.1 CHANNEL SIDEBAR — Replacing the Coracle Nav Menu

**Current Coracle:** Left sidebar with static nav links (Announcements, Ops Feed, Intel Feed, Nav Map, Open Feed, Relays, Notifications, DMs, Groups). Each is a page navigation.

**The replacement:**

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Channel List** | Signal / Element / EVE Fleet Chat | Vertical list of groups/channels with: unread badge, encryption indicator (🔒/🔓), last-message preview, timestamp. Active channel highlighted. Clicking doesn't navigate — it loads that channel's messages into the comms pane. |
| **Channel Status Indicators** | EVE Online Overview | Each channel shows: ● online members, encryption tier (color-coded), last activity timestamp. Green dot = active, amber = stale (>1h), red = no activity (>24h). |
| **Channel Categories** | Discord / Stellaris Outliner | Group channels by function: `COMMAND` (HQ, Admin), `OPERATIONS` (Alpha, Bravo, field teams), `INTELLIGENCE` (Intel, GEOINT, Analysis), `GENERAL` (Open, Social). Collapsible sections. |
| **Quick Actions** | ATAK Quick-Access Buttons | Below channel list: [Check-In] [Alert] [Report] — one-tap structured messages sent to the active channel. |
| **Operator Card** (self) | Halo MJOLNIR HUD / FTL Crew | At sidebar bottom: own callsign, role badge, last check-in time, PQC key status icon, connection quality indicator. |

**Addresses gaps:** #1 (dashboard), #5 (onboarding ignores group context — channels are visible immediately), #7 (no jargon — channels, not "NIP-29 groups").

---

### 2.2 STATUS STRIP — Replacing Nothing (Coracle Has No Status Bar)

This component doesn't exist in Coracle. It's the single most universal element across all 40 references.

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Relay Health Indicator** | Grafana Status Panels / FTL Systems | Colored bar or dots: green (all relays connected), amber (degraded), red (disconnected). Click to expand relay detail. Shows R0–R4 readiness level from the existing probe system. |
| **Encryption Tier Badge** | The Expanse CIC Panels | Active group's tier shown as colored badge: `T0` (grey), `T1` (amber), `T2` (green). If PQC active: additional 🔐 icon. |
| **UTC Clock** | Every military ops center | Persistent UTC time display. Operational time reference. All timestamps in the app should reference UTC. |
| **Operator Count** | EVE Fleet Window / ATAK Team List | `●5 online` — number of operators currently connected to the active group's relays. |
| **Connection Quality** | ForeFlight / Cell Signal Bars | Signal-strength style indicator for relay latency. Derived from the existing capability probe system. |
| **Offline Queue Indicator** | (new concept) | If messages are queued for send: `⏳ 3 queued` with amber indicator. Clears when sent. |
| **Alert Badge** | Every notification system ever | Red badge with count for unread alerts/escalations across all channels. |

**Addresses gaps:** #1 (dashboard — status strip IS the always-visible dashboard summary), #8 (offline queue — makes queue state visible).

---

### 2.3 TACTICAL MAP — Upgrading IntelNavMap

The existing Leaflet map works but is view-only with identical markers and no layers.

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Layer Toggle Panel** | ATAK / Command: Modern Operations | Slide-out panel with toggle switches: GEOINT markers, operator positions, alert zones, historical tracks. Each layer has opacity slider. |
| **Marker Clustering** | ATAK / Leaflet.markercluster | At zoom-out, markers aggregate into clusters with count badges. Click to zoom in. Standard for any map at scale. |
| **Marker Type Icons** | ATAK / ARMA 3 / MIL-STD-2525 | Different icons per GEOINT subtype: 📍 report, ⚠️ alert, 👁 observation, 📷 media, ✅ check-in. Color-coded by age (fresh = bright, stale = dim). |
| **Temporal Slider** | Windy.app / Command: Modern Ops | Time slider at bottom of map to scrub through historical data. "Show markers from last: [1h] [6h] [24h] [All]" filter. |
| **Draw Tools** | ATAK / ARMA 3 / Leaflet.draw | Toolbar: point, line, polygon, circle, text label. Drawn features shared to the active channel as GeoJSON events. For planning, perimeters, routes. |
| **Measurement Tool** | ATAK / ForeFlight | Click-and-drag distance/area measurement overlay. Shows bearing and distance. |
| **Marker → Message Link** | ATAK Chat Integration | Clicking a map marker scrolls the comms pane to the associated message. Hovering a geo-tagged message in chat highlights the marker on the map. **This is the fusion.** |
| **Offline Tile Cache** | ATAK / Maps.me | Pre-download tile regions for field use. Store in IndexedDB. Select region + zoom levels, cache for offline. |
| **Operator Position Markers** | ATAK Blue Force Tracker | If the operator shares location (opt-in check-in), their position appears as a distinct icon with callsign label and last-update timestamp. |
| **Heat Map Layer** | Palantir / Windy.app | Density overlay for high-volume GEOINT data. Toggle on when point markers become too dense. |

**Addresses gaps:** #4 (map isolated — now fused with comms), #9 (no layer controls — full layer system), plus structured reporting via draw tools (#6).

---

### 2.4 COMMS PANE — Replacing Coracle's Group Chat + DMs + Notes

Currently NavCom has three separate systems: GroupConversation.svelte (NIP-29 group chat), ChannelsList.svelte (NIP-44 DMs), and Home.svelte (kind:1 notes/feeds). These need to become one unified comms pane.

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Unified Message Stream** | Signal / Element / The Expanse CIC | All messages from the selected channel in one chronological stream. No separate "notes" vs "chat" vs "DMs" — it's all comms. |
| **Message Type Indicators** | Starship Troopers Command Net / ATAK | Each message has a type badge: `MSG` (normal), `CHK` (check-in), `SIT` (SITREP), `SPT` (SPOTREP), `ALR` (alert), `REQ` (request), `ACK` (acknowledgment). Color-coded. |
| **Encryption Indicator per Message** | Signal / The Expanse "Tightbeam" | Each message shows its encryption status: 🔒 PQC, 🔐 NIP-44, 🔓 cleartext. This makes the invisible crypto engine visible. |
| **Geo-Link in Messages** | ATAK Chat | Messages with geo data show an inline mini-map thumbnail. Click to center the tactical map on that location. |
| **Thread/Reply** | Signal / Slack | Reply to a specific message with quoted context. Replaces Coracle's "repost/quote" with tactical utility. |
| **Sender Operator Card** | Halo / BSG CIC | Clicking a sender's callsign shows a hover card: role, unit, last check-in, PQC key status, trust level. Not a social profile — an operator credential. |
| **Action Buttons per Message** | (replaces reactions/zaps) | `ACK` (acknowledge — I've seen this), `ESC` (escalate — forward to command), `FLAG` (mark for review), `PIN` (pin to channel). Replaces 👍😂⚡ |
| **Compose Bar** | Signal + ATAK Structured Reports | Text input with attachment (image, file), plus a **message type selector**: normal message, check-in, SITREP, SPOTREP, alert. Selecting a structured type opens a form template. |
| **Presence Indicators** | Slack / EVE Fleet Window | Small colored dots next to callsigns in the message stream: green (online now), amber (last seen <1h), grey (offline). |

**Addresses gaps:** #1 (dashboard — comms pane shows operational activity), #2 (PQC into message path — encryption indicator per message), #6 (structured reporting — message type selector + form templates), #10 (chain of trust — trust level visible on operator card).

---

### 2.5 OPERATIONAL DASHBOARD — Replacing the Announcements Landing Page

This is the #1 gap. It doesn't exist. Every single reference has some version of it.

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Map Thumbnail** | XCOM Geoscape / Home Assistant | Miniature map showing last N GEOINT markers. Click to enter full tactical map. Auto-zoomed to show all recent markers. |
| **Channel Status Cards** | Grafana Dashboard Panels / FTL Ship Systems | Grid of cards, one per active channel: name, unread count, encryption tier, member count, last message preview. Color border: green (active), amber (stale), red (alert). Click to select channel. |
| **Recent Intel Feed** | Stellaris Situation Log | Scrollable list of last N structured events (SITREPs, alerts, check-ins) across ALL channels. Each entry: type badge, timestamp, source channel, one-line summary. |
| **Relay Health Panel** | Grafana / Prometheus | Compact relay status: connected count, average latency, capability readiness (R0–R4). Green/amber/red coding. |
| **Operator Roster** | EVE Fleet Window / Blue Force Tracker | List of known operators with online/offline status, last check-in time, role. Sortable by last-seen. |
| **Announcements Banner** | LCARS / Any alert system | System-wide announcements collapsed to a single banner at the top. Expandable. Not the entire landing page — just one card. |
| **Quick Actions** | ATAK Quick-Access / FTL Pause Controls | Prominent buttons: [Check-In] [New Alert] [SITREP] [Open Map]. One-tap to the most common operational actions. |
| **Encryption Status Summary** | The Expanse CIC Panel | "PQC: Active | Classical: Fallback | Key age: 12h | Next rotation: 36h" — makes the invisible crypto visible at the dashboard level. |

**Addresses gaps:** #1 (operational dashboard — this IS it), #2 (PQC visibility — encryption status shown), #4 (map on dashboard), #5 (onboarding — dashboard shows groups immediately).

---

### 2.6 OPERATOR IDENTITY — Replacing Coracle's Social Profile

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Operator Card** | Halo MJOLNIR HUD / Military ID | Callsign (primary identifier), role badge (OWNER/ADMIN/MOD/MEMBER), unit affiliations (group list), last check-in timestamp + location. |
| **PQC Key Status** | PKI Management UIs | Key type (ML-KEM-768), publication status (published/unpublished), key age, rotation schedule. Visual: green lock (published, fresh), amber lock (aging), red lock (expired/missing). |
| **Trust Level** | EVE Online Standing / WoT | Numeric or tiered trust score: verified by N operators, endorsed by N admins. Not a social follower count — a credentialing chain. |
| **Availability Status** | Slack / Discord / Military duty status | Operational / On Break / Offline / Do Not Disturb. Manually set or auto-derived from last check-in. |
| **Credential Page** (replaces profile page) | Military personnel file | Full credential view: all keys, all group memberships, full check-in history, trust endorsements. This is what you see when you inspect another operator. It is NOT a social profile with a bio and links. |

**Addresses gaps:** #3 (PQC key generation/publication — need UI to show/manage PQC keys), #7 (jargon — callsign replaces npub, role replaces "signer"), #10 (chain of trust — trust score visible).

---

### 2.7 STRUCTURED REPORTING — Replacing Free-Text Notes

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Message Type Selector** | ATAK Quick-Reports / Military form system | Tabs or radio buttons in the compose area: `MESSAGE` / `CHECK-IN` / `SITREP` / `SPOTREP` / `ALERT` / `REQUEST`. Selecting a type changes the compose form. |
| **CHECK-IN Form** | ATAK CoT / Blue Force Tracker | One-tap send: "I'm here, I'm status X." Auto-attaches current location (if permitted), timestamp, operator ID. Minimal fields: status dropdown (GREEN/AMBER/RED), optional text note. |
| **SITREP Template** | NATO SITREP format / ARMA 3 | Structured fields: Date-Time Group, Location (map picker), Situation Summary, Activity Observed, Actions Taken, Requests. Each field tagged for structured query later. |
| **SPOTREP Template** | NATO SPOTREP / ATAK | Structured fields: Size, Activity, Location (map picker), Unit/Uniform, Time, Equipment. Generates both a tagged Nostr event AND a map marker. |
| **ALERT Form** | Every alerting system | Priority selector (ROUTINE/PRIORITY/FLASH), subject line, body, optional location. FLASH-priority alerts trigger visual + audio notification on all connected operators. |
| **Inline Form Rendering** | Home Assistant Cards / Grafana Panel Config | Structured reports render in the comms stream as formatted cards, not raw text. SITREP shows all fields labeled. SPOTREP shows mini-map. CHECK-IN shows status badge + location. |

**Addresses gaps:** #6 (structured reporting — this IS it). Also #4 (SPOTREPs auto-generate map markers), #1 (structured events feed into dashboard intel panel).

---

### 2.8 RAPID ENROLLMENT — Replacing the 4-Step Key Ceremony

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **Callsign Entry** | ATAK Device Setup / EVE Character Creation | Single screen: "Choose your callsign" + optional avatar upload. That's it. Keys generated silently in the background. |
| **Invite Auto-Join** | Signal Group Link / WhatsApp Invite | If the operator arrived via an invite URL, the group is joined automatically after enrollment. No intermediate steps. The operator lands IN the group chat. |
| **Deferred Key Backup** | Signal PIN / 1Password | 24 hours after first use: "Your identity key needs backup. [Back up now] [Remind me later]". Not during onboarding. Uses existing BackupReminder infrastructure but delays trigger. |
| **Progressive Capability** | (composite concept) | Start with basic comms. After 1 day: prompt for PQC key generation. After 1 week: prompt for trust endorsements. Capabilities unlock progressively, not all-at-once during onboarding. |
| **Existing Signer Detection** | Current NIP-07/NIP-55 detection (keep) | If a Nostr extension or mobile signer is detected, offer "Use existing identity" — but describe it as "Use your existing operator credentials" not "Connect your NIP-07 signer." |

**Addresses gaps:** #5 (onboarding ignores group context), #7 (jargon-dense identity UX).

---

### 2.9 ACTION SYSTEM — Replacing Reactions / Zaps / Reposts

| Component | Stolen From | Description |
|-----------|-------------|-------------|
| **ACK (Acknowledge)** | Military comms / radio protocol | "I have received and understood this message." Replaces 👍. Visible as a checkmark count on the message: `✓✓✓ 3 ACK`. |
| **ESC (Escalate)** | Halo FLEETCOM / military escalation protocol | Forward a message to a higher-tier channel (e.g., from Alpha → HQ). Creates a linked copy in the target channel with source attribution. Replaces "repost." |
| **FLAG** | Slack flag/bookmark / email flags | Mark a message for personal review later. Flagged messages appear in a "Flagged" filter on the dashboard. Replaces bookmarks. |
| **PIN** | Slack pin / Discord pin | Pin to the channel for all members to see. Pinned messages appear at the top of the channel or in a "Pinned" section. Admin/mod permission required. |
| **TASK** | Jira / Linear / XCOM task assignment | Convert a message into an actionable task assigned to an operator. Status: OPEN → IN PROGRESS → DONE. Task board view optional (later phase). Replaces nothing — this is new. |
| **GEO-TAG** | ATAK / ForeFlight | Attach/update a geo location on any message post-hoc. "This happened here." Creates/updates a map marker. |

**Addresses gap:** #1 (dashboard — actions feed into operational state), #6 (structured reporting — tasks are structured). Also fundamentally changes the operational vocabulary from social to tactical.

---

## Part 3: Design System — The Visual Language

### Color Language

**Stolen from:** LCARS (Star Trek) + ATAK + The Expanse CIC

| Purpose | Color | Reference |
|---------|-------|-----------|
| **Primary background** | Deep charcoal / near-black (#0C0E14) | The Expanse CIC, DCS cockpit |
| **Active/selected** | Cyan/teal (#00B4D8) | LCARS secondary, ATAK selection highlight |
| **Alert/urgent** | Amber (#FFB703) → Red (#E63946) | Universal — amber warning, red critical |
| **Secure/encrypted** | Green (#2DC653) | Universal — green = good / secure |
| **Degraded/offline** | Dim amber (#CC8800) | Military amber |
| **Text primary** | Near-white (#E8E8E8) | Every dark-mode ops interface |
| **Text secondary** | Mid-grey (#8899AA) | Subtle, scannable |
| **Tier 0** | Grey | Open/unclassified |
| **Tier 1** | Amber | Operational — confirmed secure |
| **Tier 2** | Green | Mission-critical — enforced encryption |

### Typography

**Stolen from:** LCARS + military displays + existing NavCom fonts

| Use | Font | Rationale |
|-----|------|-----------|
| **Headings / Labels** | Staatliches (already in NavCom) | Condensed, military-feel, high contrast |
| **Body / Messages** | Lato or Inter | Clean, legible at small sizes, neutral |
| **Data / Status / Mono** | JetBrains Mono or IBM Plex Mono | Relay addresses, key hashes, timestamps, coordinates |
| **Callsigns** | Aldrich (already in NavCom) | Distinctive, readable, identifies operator names |

### Iconography

**Stolen from:** MIL-STD-2525 (military symbology) + ATAK + Material Design (for general UI)

- **Message types:** Distinct silhouette icons per type (not emoji). MSG (speech bubble), CHK (checkmark circle), SIT (clipboard), SPT (binoculars), ALR (triangle exclamation), REQ (hand raised).
- **Channel status:** Filled circle (online), half-filled (degraded), empty (offline). Standard traffic-light colors.
- **Encryption:** Lock icons with variations: 🔒 closed (encrypted), 🔐 quantum (PQC), 🔓 open (cleartext).
- **Map markers:** MIL-STD-2525 inspired: blue = friendly, red = threat, green = safe, amber = unknown. Shape encodes type.

---

## Part 4: Mobile-Specific Design

### The ATAK Derivative (Mobile Layout)

On mobile, the three-column CIC layout collapses. The references converge on one pattern:

**Map is the home screen.** Everything else is a drawer, bottom sheet, or overlay.

| Element | Implementation | Reference |
|---------|---------------|-----------|
| **Full-screen map** | Default view, always behind overlays | ATAK |
| **Bottom sheet comms** | Drag-up panel showing active channel messages | ATAK chat + Google Maps bottom sheet |
| **Bottom action bar** | 5 buttons: Map / Chat / Alert / Report / Menu | ATAK + iOS tab bar |
| **Swipe between channels** | Horizontal swipe in comms bottom sheet | Signal / Telegram |
| **Quick check-in** | Long-press on map = "I'm here" check-in at that location | ATAK CoT |
| **Notification overlay** | Top-of-screen slide-down for alerts, auto-dismiss for routine | Every mobile OS |

**The critical difference from Coracle mobile:** Coracle mobile is a single-column feed with a hamburger menu. NavCom mobile is a map with overlays. The mental model is completely different.

---

## Part 5: Feature Extraction Matrix

Mapping references → concrete features → known gaps:

| Feature | Primary References | Fills Gap # | Effort | Priority |
|---------|-------------------|-------------|--------|----------|
| **Operational dashboard** | XCOM Geoscape, Grafana, Home Assistant, FTL | #1 | HIGH | CRITICAL |
| **Channel sidebar** | Signal, EVE, Discord, Stellaris | #1, #5 | MEDIUM | CRITICAL |
| **Status strip** | LCARS, FTL, Grafana, every CIC | #1, #2, #8 | LOW | CRITICAL |
| **Fused map+comms** | ATAK, The Expanse, Elite: Dangerous | #4 | HIGH | HIGH |
| **Message type system** | ATAK, NATO formats, Starship Troopers | #6 | MEDIUM | HIGH |
| **Marker ↔ message linking** | ATAK Chat Integration | #4, #6 | MEDIUM | HIGH |
| **ACK/ESC/FLAG/PIN actions** | Military comms, Halo FLEETCOM, Slack | #1 | LOW | HIGH |
| **Rapid enrollment** | ATAK setup, Signal, WhatsApp | #5, #7 | MEDIUM | HIGH |
| **Operator card** | Halo, FTL, military ID | #7, #10 | LOW | MEDIUM |
| **Map layer controls** | ATAK, Command: Modern Ops, Windy | #9 | MEDIUM | MEDIUM |
| **Marker clustering** | ATAK, Leaflet.markercluster | #9 | LOW | MEDIUM |
| **Map draw tools** | ATAK, ARMA 3, Leaflet.draw | #9 | MEDIUM | MEDIUM |
| **Temporal slider** | Windy, Command: Modern Ops | #9 | LOW | MEDIUM |
| **Encryption indicator per msg** | Signal, The Expanse | #2 | LOW | MEDIUM |
| **PQC key status in operator card** | PKI UIs | #3 | LOW | MEDIUM |
| **Structured report forms** | NATO formats, ATAK quick-reports | #6 | MEDIUM | MEDIUM |
| **Offline tile cache** | ATAK, Maps.me | #8 | HIGH | LOWER |
| **Offline message queue** | (new concept) | #8 | HIGH | LOWER |
| **Operator positions on map** | ATAK BFT, Blue Force Tracker | #4 | MEDIUM | LOWER |
| **Trust/endorsement system** | EVE standings, WoT concepts | #10 | HIGH | LOWER |
| **Heat map layer** | Palantir, Windy | #9 | MEDIUM | LOWER |
| **Task assignment from messages** | Jira/Linear, XCOM | #6 | MEDIUM | LOWER |

---

## Part 6: What We Can Build NOW (Mapping to Known Gaps)

These are the gap items from the analysis where we have both:
- A clear design reference to follow
- An existing engine/data layer to connect to

| Gap | Design Reference | Existing Engine Support | Buildable? |
|-----|-----------------|------------------------|------------|
| **#1: No operational dashboard** | XCOM Geoscape + Grafana + Home Assistant | Group data, feed data, relay probe data, GEOINT data — all available in stores | **YES — high impact, medium effort** |
| **#2: PQC not in message path** | Signal encryption indicator | PQC crypto engine exists (556 tests), epoch system exists | **YES — needs plumbing, not invention** |
| **#4: Map isolated from comms** | ATAK map+chat fusion | Leaflet map exists, group chat exists, GeoJSON pipeline exists | **YES — needs layout fusion, not new features** |
| **#5: Onboarding ignores context** | ATAK setup / Signal invite flow | `invite` prop exists but unused, `returnTo` mechanism exists but unwired | **YES — trivial to wire** |
| **#6: No structured reporting** | NATO formats / ATAK quick-reports | GEOINT already has structured posting (GeoJSON, subtype, confidence) — extend pattern | **YES — extend existing GEOINT model** |
| **#7: Jargon-dense identity** | ATAK callsign setup | Signer detection already works — just hide the terminology | **YES — UX rewrite, no engine work** |
| **#9: No map layer controls** | ATAK / Windy | Leaflet supports layers natively, GEOINT subtypes already tagged | **YES — medium effort, pure UI** |
| **#3: No PQC key gen** | PKI management UIs | @noble/post-quantum installed, crypto-provider ready | **NEEDS ENGINE WORK** — kind-10051 implementation |
| **#8: No offline queue** | (new concept) | Service worker exists, IndexedDB available | **NEEDS ENGINE WORK** — new message queue system |
| **#10: No chain of trust** | EVE standings / WoT | No existing infrastructure | **NEEDS DESIGN + ENGINE WORK** |

---

## The Synthesis

The Coracle interface layer is replaceable. The engine layer is not — and doesn't need to be.

The replacement interface is not one reference — it is a **composite** drawn from the convergent pattern across all 40:

- **The shell** = Elite: Dangerous cockpit panels (persistent, non-navigating)
- **The sidebar** = Signal channels + EVE fleet overview + Stellaris outliner
- **The status** = LCARS ambient display + Grafana panels + FTL systems view
- **The map** = ATAK (the gold standard) + Windy (temporal) + Command: Modern Ops (layers)
- **The comms** = Signal message stream + ATAK structured reports + The Expanse tightbeam indicators
- **The dashboard** = XCOM Geoscape + Home Assistant cards + Grafana panels
- **The actions** = Military ACK/ESC protocol + Slack pin/flag + Halo FLEETCOM escalation
- **The identity** = Military credential + Halo MJOLNIR HUD + EVE standings
- **The enrollment** = ATAK 30-second setup + Signal invite auto-join
- **The mobile** = ATAK (map-first, overlays for everything else)

This is not a redesign. It is a **re-genesis** — building an operational interface from operational DNA, connecting it to an operational engine that's already been built, and finally letting NavCom be what it was always supposed to be.
