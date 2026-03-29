# NavCom Transmutation: From Coracle Clone to Operational Platform

> _The problem is not what NavCom has. The problem is what NavCom **is**._

---

## The Coracle DNA Problem

NavCom's front-end is **85–90% unmodified Coracle**. This is not an exaggeration — it is a file-by-file finding.

### What Was Changed

| Addition | Files | % of App |
|----------|-------|----------|
| Logo + typography (Aldrich, Staatliches) | MenuDesktop, MenuMobile, tailwind.config.cjs | ~2% |
| Tag filters (`#starcom_ops`, `#starcom_intel`) | Home.svelte, Feeds.svelte, env vars | ~1% |
| GEOINT map + posting | ~~IntelNavMap.svelte~~ _(removed — replaced by native MapView Leaflet integration)_, GeoModal, GeoSummary, GeoThumbnail, geoint.ts, NavMapToolBar, NavMapStatusBar | ~5% |
| PQC crypto engine | src/engine/pqc/\*, crypto-provider, epoch-key-manager | ~5% |
| Group encryption extensions | group-tier-policy, group-epoch-\*, group-key-\*, group-secure-storage | ~3% |
| Announcements system | announcements.ts, Announcements.svelte | ~1% |
| Loader telemetry | loader-status.ts, LoaderStatusBanner | ~1% |

### What Was NOT Changed

Everything else. Which means:

- **69 shared UI components** (src/partials/) — all Coracle, untouched
- **Every social feature** — zaps (Bitcoin tips), emoji reactions, reposts/quotes, follow graphs, mute lists, profiles with bios, wallet integration — all fully functional, all prominently surfaced
- **Layout architecture** — left sidebar nav, single content pane, modal overlays — Coracle's exact layout
- **Onboarding** — Coracle's 4-step key ceremony, unchanged
- **Note system** — Coracle's kind:1 notes with kind:7 reactions
- **Person/profile system** — Coracle's kind:0 social profiles
- **Notification system** — "Mentions & Replies" + "Reactions" tabs
- **Search** — Coracle's QR scanner + text search
- **Feeds** — Coracle's composable feed system (repurposed with tags, but structurally identical)
- **DMs** — Coracle's NIP-44 channels
- **Relay management** — Coracle's relay list UI

### The Consequence

When an operator opens NavCom, they are using a **social media client**. The information architecture, the interaction patterns, the visual language, the mental model — all of it says "this is a place where you post notes, follow people, react to things, and tip with Bitcoin."

The GEOINT map and the PQC engine are **additions to a social client**, not the **foundation of an operational platform**. The map is one route among dozens. The encryption engine is invisible. The announcements feed is the landing page — a passive consumption experience, not an operational display.

This is not a criticism of Coracle. Coracle is an excellent Nostr social client. But a NavCom is not a social client. Using Coracle's interface for NavCom is like using Gmail's interface for air traffic control — the protocol underneath might be capable, but the interface is built for a fundamentally different job.

---

## The Transmutation Required

The word is deliberate. This is not a reskin, not a refactor, not a feature addition. It is a **transmutation** — a change in the fundamental nature of the thing.

### What Needs to Die

| Social Client Concept | Why It Doesn't Belong | Alternative |
|-----------------------|----------------------|-------------|
| **Feed as landing page** | Passive consumption is not operational awareness | Operational dashboard |
| **Notes as primary content** | Unstructured kind:1 is not reporting | Structured message types (SITREP, SPOTREP, ALERT, CHECK-IN) |
| **Reactions (emoji/likes)** | "Liking" a field report is not a meaningful action | Acknowledge / Flag / Escalate / Action |
| **Zaps (Bitcoin tipping)** | Tipping operators is not an operational function | Remove or bury in settings |
| **Follow/mute as social graph** | Social follow ≠ operational trust chain | Role-based access, unit assignment, chain of trust |
| **Profile as social identity** | Bio + avatar + website is not operator credentials | Callsign, role, unit, clearance tier, PQC key status |
| **Repost/quote** | Social sharing is not intelligence dissemination | Forward-to-group, Escalate-to-command |
| **Wallet** | Lightning wallet is not operational infrastructure | Remove or bury |
| **"Notes" terminology** | Nobody in ops calls their comms "notes" | Messages, reports, intel, alerts |
| **Notification: "Reactions" tab** | Who reacted to your post is not actionable intel | Notification categories: ALERT, MESSAGE, TASK, SYSTEM |

### What Needs to Be Born

| Operational Concept | What It Replaces | Purpose |
|--------------------|-----------------|---------|
| **Operational Dashboard** | Announcements feed landing page | Composite view: group status + map thumbnail + recent intel + relay health + unread counts |
| **Message Types** | Unstructured kind:1 notes | Structured: CHECK-IN, SITREP, SPOTREP, ALERT, REQUEST, ACK |
| **Operator Card** | Social profile | Callsign, role, unit affiliation, last check-in, PQC key status, trust score |
| **Fused Map+Comms** | Isolated map page | Split-pane: map on one side, group chat on the other, with markers linked to messages |
| **Unit / Channel Sidebar** | Social feed sidebar | Groups organized by unit/function, with unread counts and status indicators |
| **Action Bar** | Like/Zap/Repost/Quote | Acknowledge / Escalate / Forward / Flag / Mark Position |
| **Status Board** | None (doesn't exist) | Relay health, operator online/offline, group encryption tier, last activity |
| **Intake Flow** | 4-step key ceremony | "Choose a callsign → Join group → You're in" (keys generated silently) |

---

## The Interface Ancestry: A Roster of NavCom Precedents

What does a real NavCom interface look like? The answer exists across dozens of implementations — real and fictional — that share the same DNA: **a composite operational view fusing communications, spatial awareness, and status into a single surface.**

### Real-World Operational Platforms

| System | Domain | What NavCom Should Learn From It |
|--------|--------|--------------------------------|
| **ATAK** (Android Team Awareness Kit) | US Military / First Responders | The gold standard. Map-centric interface with team positions, chat overlay, drawing tools, measurement, offline tiles, plugin architecture. Every operator sees the same picture. Chat and map are fused — not separate pages. |
| **TAK Server / WinTAK / iTAK** | TAK Ecosystem | Cross-platform awareness. Cursor-on-Target (CoT) protocol for standardized position reports. Proves that map + chat + structured reporting can work on mobile. |
| **Palantir Gotham** | Intelligence Analysis | Graph-based intelligence correlation. Shows how to link entities, track relationships, and surface patterns across unstructured data. The "INTEL processing" NavCom lacks. |
| **Blue Force Tracker (BFT)** | US Army | Real-time friendly force positions on a map. The minimum viable "NAV" pillar — know where your people are, always. |
| **GCCS-J** (Global Command & Control System — Joint) | US DoD | The military's actual command dashboard. Multi-source intelligence fused onto a common operational picture. Too complex for NavCom, but the *concept* — fused COP — is the north star. |
| **CPOF** (Command Post of the Future) | US Army | Multi-pane collaborative workspace. Multiple operators viewing/annotating the same map. Shared whiteboards. The collaborative ops workspace NavCom should aspire to. |
| **ForeFlight / Garmin Pilot** | Aviation | Pilots' operational interface: moving map + weather + NOTAMs + flight plan + comms frequencies — all on one screen. Proves you can fuse spatial + status + comms on a tablet form factor. |
| **Windy.app / Ventusky** | Weather/Environmental | Beautiful real-time geospatial data rendering. Layer toggles, time sliders, confidence visualization. A model for how NavCom's map could display temporal intel data. |
| **Zello / ESChat** | Push-to-Talk Comms | Channel-based voice + text comms for field teams. Simple, fast, low-friction. The comms UX ceiling NavCom should hit: pick a channel, talk. |
| **Signal / Element (Matrix)** | Encrypted Messaging | End-to-end encrypted group messaging done right. What NavCom's COMMS pillar should feel like if you strip away the social media DNA. |
| **Prometheus / Grafana** | Infrastructure Monitoring | Dashboard paradigm: panels, alerts, time-series, status indicators. A model for NavCom's relay health and operational status displays. |
| **Home Assistant** | IoT Dashboard | Customizable operational dashboard with real-time sensor data, status cards, map, controls. Proves that composite dashboards work for non-engineers. |

### Video Games — Operational Interfaces

| Game | Interface | What NavCom Should Learn From It |
|------|-----------|--------------------------------|
| **EVE Online** | Fleet Commander Overview | The deepest real-time operational interface in gaming. Overview (filtered entity list), local chat, d-scan (directional scanner), star map, fleet broadcast, watchlist. An FC manages 200+ pilots through a *dashboard*, not a feed. Every element is actionable. |
| **Elite: Dangerous** | Ship Cockpit Panels | Four info panels surrounding the pilot: navigation, comms, systems status, contacts. All accessible without leaving the cockpit. The lesson: **don't make the operator navigate away from their primary view to access any core function.** |
| **Star Citizen** | mobiGlas + Ship MFDs | The mobiGlas is a wrist-mounted PDA: map, comms, contracts, status — all in one device. Ship MFDs (multi-function displays) show power, shields, radar, comms as configurable panels. |
| **Homeworld** | Mothership Command | The original "command your fleet from a 3D map" interface. Sensors manager shows the entire battlefield. The lesson: the map IS the interface. Everything else is overlay. |
| **XCOM: Enemy Unknown** | Geoscape + Situation Room | Strategic map with real-time events (alien contacts, research complete, soldiers ready). The Geoscape is a dashboard masquerading as a map. Status, alerts, and geography fused. |
| **Stellaris** | Galaxy Map + Situation Log | Outliner (sidebar asset list), galaxy map (spatial awareness), situation log (active events/tasks). Three-column layout: assets | map | events. Clean information hierarchy. |
| **FTL: Faster Than Light** | Ship Systems Overview | Every system visible at a glance: weapons, shields, engines, oxygen, doors, crew positions. The entire operational state of a ship on one screen. Damage is visible IMMEDIATELY. |
| **Kerbal Space Program** | Mission Control + Tracking Station | Map view + resource readouts + trajectory planning + comms link status. Shows that operational displays need to convey *system health*, not just content. |
| **ARMA 3** | Tactical Map + ACRE Radio | Military sim with proper map (markers, drawing, measurement) and radio simulation (different nets, encryption, range). The closest game to ATAK. |
| **Escape From Tarkov** | Tactical Map | Annotatable offline maps with extraction points, loot locations, team positions. Proves that even a game audience wants ATAK-like spatial tools. |
| **Command: Modern Operations** | Naval/Air Ops | Professional-grade wargame with genuine C2 interfaces: layered map, contact tracks, engagement zones, time compression. What a "serious" NavCom map looks like. |
| **DCS World** | Avionics Suite | Simulated military avionics: SA page (situational awareness), datalink, RWR (radar warning), tactical display. Each MFD is a composited data view. Toggle between modes without leaving the cockpit. |

### Film & Television — Command Interfaces

| Source | Interface | What NavCom Should Learn From It |
|--------|-----------|--------------------------------|
| **Star Trek** (TNG/DS9/VOY) | LCARS | The most iconic operational interface in fiction. Color-coded function areas, text-heavy status panels, touch-responsive, always visible bridge displays. The lesson: **operational status should be ambient — visible without asking for it.** |
| **The Expanse** | CIC Displays (Rocinante, Donnager, Behemoth) | Hard sci-fi tactical displays: radar contacts with trajectory intercepts, torpedo tracking, PDC engagement zones, reactor status, hull integrity. Fused nav + weapons + comms + ship status. The most *technically plausible* NavCom interface in TV. |
| **Battlestar Galactica** | CIC / DRADIS | The low-tech version: analog status boards + DRADIS (radar) + voice comms + physical plotting table. Proves that a NavCom can function with minimal graphics if the *information hierarchy is right*. Voice comms + radar + status board = minimum viable CIC. |
| **Star Wars** | Rebel/Resistance Command Centers | Holographic tactical display (Death Star plans), large-format shared map, voice comms, status indicators. The lesson: the **shared tactical display** is the center of the room. Everything faces it. |
| **Iron Man / Avengers** | JARVIS / FRIDAY HUD | Augmented reality overlay: status, comms, intel, mapping, system health — all layered on the operator's field of view. The aspiration for wearable/AR NavCom. |
| **Pacific Rim** | LOCCENT Mission Control | Split focus: giant shared map showing Kaiju tracks + individual Jaeger status panels + voice comms + deployment controls. A multi-operator CIC where each station has a role. |
| **Ender's Game** | Battle Room / Command School | The *ultimate* NavCom interface in fiction: a 3D space where unit formations are visible, commands are issued gesturally, and the latency of communication is the central tactical constraint. |
| **Avatar** | RDA Operations Center | Military ops center with holographic terrain map, unit positions, comm channels. Interesting because it shows *corporate* ops using military-grade C2 — exactly NavCom's position (not military, but operationally serious). |
| **Aliens** | Marine Tactical Displays | Dropship HUD, motion tracker overlay, APC tactical screen showing marine bio-monitors (heartbeat, location). The bio-monitor concept = operator check-in / presence status. |
| **Top Gun: Maverick** | E-2 Hawkeye AWACS | Radar picture with labeled contacts, engagement zones, voice callouts. The lesson: the voice channel + the shared picture = the operational interface. NavCom needs both. |

### Literature & Lore

| Source | Concept | What NavCom Should Learn From It |
|--------|---------|--------------------------------|
| **Ender's Game** (Orson Scott Card) | The ansible + battle room command | Faster-than-light communication fused with tactical display. The commander sees the battle and commands simultaneously — comms and spatial awareness are the same thing. |
| **The Expanse** (James S.A. Corey) | Tightbeam protocol + CIC culture | Encrypted point-to-point comms ("tightbeam"), relay delay awareness, tactical discipline. The books describe *operational culture around comms* — something NavCom needs to foster, not just facilitate. |
| **The Culture** (Iain M. Banks) | Ship Mind interfaces | AI-mediated communication where the Ship Mind handles routing, priority, translation, and context. The aspiration: NavCom should eventually *help operators process intel*, not just display it. |
| **Dune** (Frank Herbert) | Mentats + no-computers rule | Human-as-computer: when you can't trust machines, you rely on trained human judgment. NavCom's PQC adversary model implies a similar distrust of infrastructure — the protocol must be trustless. |
| **Old Man's War** (John Scalzi) | BrainPal neural interface | Direct neural comms with HUD overlay: map, team status, health, threat indicators — all in the operator's visual field. The far-future NavCom: zero-UI, direct neural integration. |
| **Starship Troopers** (Robert Heinlein) | Powered armor HUD + command net | Structured military communications: "suit radio" channels, command authority, squad/platoon/company hierarchy. The lesson: **comms follow organizational structure**, not social graphs. |
| **Foundation** (Isaac Asimov) | Psychohistory + Encyclopedia Galactica | Intelligence processing at civilizational scale: pattern detection, trend prediction, knowledge accumulation. The far-future INTEL pillar. |
| **Halo** (novels + games) | UNSC tactical net / FLEETCOM | Multi-tier comms (squad → company → fleet → HIGHCOM), Spartan neural link, tactical overlay in MJOLNIR HUD. Hierarchical comms with automatic escalation — what NavCom's tier system should mature into. |

---

## The Pattern That Emerges

Every single reference above shares a common pattern. Whether it's ATAK in a soldier's hand, the Rocinante's CIC, EVE's fleet commander view, or LCARS on the Enterprise bridge, they all converge on the same interface architecture:

### The NavCom Interface Pattern

```
┌──────────────────────────────────────────────────────────┐
│  STATUS BAR: relay health | encryption tier | time/UTC   │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│  CHANNELS   │         PRIMARY OPERATIONAL VIEW           │
│             │                                            │
│  ┌────────┐ │    ┌──────────────────────────────────┐    │
│  │ HQ     │ │    │                                  │    │
│  │ Alpha  │ │    │    MAP / DASHBOARD / FEED         │    │
│  │ Bravo  │ │    │    (context-dependent)            │    │
│  │ Intel  │ │    │                                  │    │
│  │ Ops    │ │    └──────────────────────────────────┘    │
│  │        │ │                                            │
│  │ ● 3 on │ │    ┌──────────────────────────────────┐    │
│  │ ○ 2 off│ │    │  ACTIVE COMMS / CHAT PANE         │    │
│  │        │ │    │  (selected channel messages)       │    │
│  └────────┘ │    │  [compose bar]                     │    │
│             │    └──────────────────────────────────┘    │
│  OPERATOR   │                                            │
│  [callsign] │  ACTIONS: Check-In | Report | Alert | Map  │
│  [role]     │                                            │
├─────────────┴────────────────────────────────────────────┤
│  ALERT BAR: critical notifications / escalations          │
└──────────────────────────────────────────────────────────┘
```

**Key principles:**

1. **The map and the comms are the same screen.** You don't navigate between them. ATAK, EVE, Elite Dangerous, the Rocinante — they all put spatial awareness and communications in the same view.

2. **Channels replace feeds.** Operators don't scroll a timeline. They switch between channels (groups/units/topics) with unread indicators. Signal, Zello, military radio nets, Star Trek comms — all channel-based.

3. **Status is ambient.** Relay health, encryption tier, operator presence, group activity — all visible at a glance without opening a settings page. FTL, LCARS, Grafana — status is always on screen.

4. **Actions are operational, not social.** "Acknowledge" instead of "Like." "Escalate" instead of "Repost." "Check-In" instead of "Post a Note." The vocabulary shapes the culture.

5. **Identity is credential, not profile.** Callsign + role + last-seen + trust score — not bio + avatar + website + follower count. Operator cards, not social profiles.

6. **Onboarding is enrollment, not ceremony.** ATAK: open the app, enter your callsign, connect to the server, see the map. No 4-step key ritual. Keys exist but the operator never touches them.

---

## The Transmutation Sequence

Given that ~85% of the current UI is Coracle social-client DNA, the transmutation is not incremental modification — it is a parallel construction. The engine stays. The protocol stays. The crypto stays. The relay infrastructure stays. **The front-end interface layer is rebuilt from operational first principles.**

### Phase 0: Preserve the Engine
The engine layer (`src/engine/`) is genuinely valuable. PQC crypto, tier policies, group commands, epoch management, relay probing — this is real operational infrastructure. It stays.

### Phase 1: Build the Operational Shell
A new layout component that replaces the Coracle sidebar+content pattern with the NavCom pattern: status bar + channel sidebar + primary view + comms pane + action bar. This is the structural transmutation.

### Phase 2: Build the Dashboard
The composite landing page: group status cards, map thumbnail (last N GEOINT markers), recent intel feed, relay health indicators, unread counts. This replaces Announcements as the default route.

### Phase 3: Fuse Map + Comms
Split-pane view: map on top/left, group chat on bottom/right. Clicking a map marker scrolls to the associated message. Sending a geo-tagged message drops a pin. This is the "ATAK moment."

### Phase 4: Replace Social Actions with Operational Actions
Remove reaction/zap/repost UI. Replace with Acknowledge (seen it), Escalate (forward up the chain), Flag (mark for attention), Action (assign as task). These map to different Nostr event kinds.

### Phase 5: Operator Identity
Replace social profile with operator card: callsign, role, unit, last check-in, PQC key status, trust level. The profile page becomes a credential page.

### Phase 6: Structured Reporting
Replace free-text note composer with message type selector: CHECK-IN (I'm here, I'm fine), SITREP (situation report with template fields), SPOTREP (location + observation), ALERT (urgent notification), REQUEST (need something). Each type has a form and maps to tagged Nostr events.

### Phase 7: Rapid Enrollment
Replace 4-step key ceremony with: (1) Choose callsign, (2) Auto-generate keys silently, (3) If invite link: join that group immediately, else: show group browser. Three screens max. Key backup prompt deferred to 24h later.

---

## The Core Insight

NavCom's back-end is **already building toward the right thing**. ML-KEM-768 encryption, epoch-based key rotation, tier policies with audit trails, GEOINT with GeoJSON and geohash, relay capability probing with automatic fallback — these are genuine operational capabilities.

But the front-end is still wearing Coracle's clothes. It presents these operational capabilities through a social media interface. The operator must *know* they're using an ops platform — the interface never tells them. The map is a side feature. The groups are behind a signer gate. The encryption is invisible. The structured data (GeoJSON, tiers, roles) is hidden behind unstructured kind:1 notes.

The transmutation is this: **take the operational engine that already exists and give it an interface that matches its mission.** Not a social client with ops features bolted on, but an operational platform that happens to use Nostr's social infrastructure underneath.

Every reference in the roster above — ATAK, the Rocinante's CIC, EVE's fleet command, LCARS, Battlestar's DRADIS — they all prove the same thing: **the interface IS the capability.** An F-16's radar is useless if the cockpit displays a Facebook feed. NavCom's PQC encryption is useless if the operator is looking at emoji reactions and Bitcoin tips.

The engine is ready. The interface is not. That is the transmutation.
