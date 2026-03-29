# NavCom Transmutation Playbook

> *"NavCom is finished when an operator can open it and operate."*
> — [docs/navcom-vision.md](../navcom-vision.md)

This playbook captures the strategic direction for completing NavCom's transmutation from a Nostr social client into an Earth Alliance operational communications platform. It is the single entry point for strategic context, priority sequencing, and implementation status.

**Companion documents:**
- [docs/navcom-vision.md](../navcom-vision.md) — The WHY (foundational doctrine, five pillars, tier model)
- [docs/navcom-gap-analysis.md](../navcom-gap-analysis.md) — The GAP (top-10 ranked gaps, current state audit)
- [docs/navcom-transmutation.md](../navcom-transmutation.md) — The WHAT (social client kill list, interface precedents, target identity)
- This playbook — The HOW (validated gaps, innovations, phase specs, architecture decisions)

**Phase 1 specs:** [01-the-briefing.md](01-the-briefing.md) · [02-presence-from-publishing.md](02-presence-from-publishing.md) · [03-relay-fingerprint-gate.md](03-relay-fingerprint-gate.md)
**Phase 2 spec:** [04-sovereign-mode.md](04-sovereign-mode.md)
**Phase 3 spec:** [05-the-board.md](05-the-board.md)
**Phase 4 spec:** [06-trust-attestation.md](06-trust-attestation.md)
**Cross-cutting:** [architecture-patterns.md](architecture-patterns.md)

---

## Table of Contents

1. [The Doctrine](#the-doctrine)
2. [The Central Elephant](#the-central-elephant)
3. [Operator Archetypes](#operator-archetypes)
4. [The Seven Gaps (Doctrine-Validated)](#the-seven-gaps-doctrine-validated)
5. [Six Innovations](#six-innovations)
6. [Phase Sequence](#phase-sequence)
7. [Dependency Map](#dependency-map)
8. [Status Dashboard](#status-dashboard)
9. [Testing Strategy](#testing-strategy)
10. [Decision Log](#decision-log)

---

## The Doctrine

The vision document establishes five operational pillars. Every feature in NavCom serves exactly one pillar. If a feature doesn't map to a pillar, it's social-client residue and should be removed or buried.

| Pillar | Purpose | Tier 0 | Tier 1 | Tier 2 |
|--------|---------|--------|--------|--------|
| **COMMS** | Tiered encryption, role-based groups, hybrid classical/PQC DMs | Unencrypted NIP-29 groups | Encrypted NIP-EE groups, PQC available | Mandatory PQC, forward secrecy, epoch key rotation |
| **NAV** | Interactive map, GeoJSON markers, layer controls, geohash indexing, offline tiles | Map exists, markers visible | Layer filtering, time range, member positions | Spatial indexing, offline tile cache, draw/measure tools |
| **INTEL** | Typed feeds, structured reporting (SITREP/SPOTREP), correlation, dashboards | Messages with type tags | OPS view with group summaries, activity feed | Full operational dashboard, correlation engine |
| **AUTH** | Self-sovereign identity, multiple signer methods, role hierarchy, chain-of-trust | Basic keypair | WoT scoring, role-based access | PQC key lifecycle, attestation events, trust provenance |
| **INFRA** | Multi-relay with fallback, PWA + native, offline-first, mesh networking | Relay routing works | Health tracking, circuit-breaker, demotion | Dedicated relay sets per group, relay isolation enforcement, background sync |

**Key doctrinal principles:**
- *"Resilience is architecture, not a feature"* — The app must operate THROUGH failure, not error out.
- *"The map is the territory"* — If the map shows stale data without indicating staleness, the map is lying.
- *"Not a reskin, not a refactor — a transmutation"* — The social client DNA must be replaced, not decorated.
- *"The interface should make you feel like you're operating a communications system, not browsing a social app"* — Aesthetic, copy, and interaction patterns all matter.

**What needs to die** (from [navcom-transmutation.md](../navcom-transmutation.md)):
- Feed as landing page → Operational dashboard
- Notes as primary content → Structured messages (SITREP, SPOTREP, ALERT, CHECK-IN)
- Emoji reactions → Acknowledge / Flag / Escalate / Action
- Zaps (Bitcoin tipping) → Remove or bury
- Social profiles → Operator credentials (callsign, role, unit, clearance tier, PQC key status)
- "Follow" as trust → Attestation events with method, confidence, scope, expiry

---

## The Central Elephant

> **The app still thinks it's a social client.**

This is the unifying diagnosis. Every gap in the system traces back to this single root cause. NavCom is 85–90% unmodified Coracle frontend. The changes (~15%) are significant — GEOINT map, PQC crypto engine, group encryption, announcement system, operational theming — but the skeleton is a social media application. The architecture, the navigation patterns, the error handling, the onboarding flow, the landing page — all assume a user who wants to browse, post, react, and socialize.

The transmutation is not about adding features on top of a social client. It's about replacing the social client's assumptions with operational ones:

| Social Client Assumption | Operational Truth |
|--------------------------|-------------------|
| Network is always available | Network is hostile and intermittent |
| Errors mean "try again later" | Errors mean "continue in degraded mode" |
| Feed is the default experience | Situational awareness is the default experience |
| Identity is a profile you curate | Identity is a credential you prove |
| Trust is who you follow | Trust is who you've verified and how |
| "Working" means content loads | "Working" means you can coordinate |
| Relay failure = broken app | Relay failure = sovereign operation |
| Time doesn't matter | Time is the most critical metadata |

The six innovations in this playbook are designed to systematically replace each row.

---

## Operator Archetypes

Three archetypes represent the operator personas NavCom must serve. They are not user stories — they are validation lenses. Every feature and every gap is evaluated through all three perspectives.

### OVERWATCH — The Field Intelligence Analyst

**Operating context:** Works from a forward operating base or secure facility. Monitors 4–6 group feeds simultaneously. Thinks in timelines, map overlays, and correlation. Has a laptop open 8+ hours.

**Primary mode flow:** OPS view → MAP view → individual group when something needs attention.

**What NavCom does right for OVERWATCH today:**
- OPS view exists with group summaries, map thumbnail, and activity feed
- Map view has message-type filtering (check-in/alert/sitrep/spotrep) and time ranges
- Group projections track membership and message counts
- Unread badges surface what needs attention

**Where NavCom fails OVERWATCH:**
- **Map markers don't age.** A check-in from 6 hours ago looks identical to one from 6 minutes ago. OVERWATCH cannot distinguish current positions from historical. The map lies by omission — it shows data without temporal context, violating the "map is the territory" doctrine. This is Gap 7.
- **No cross-group correlation.** Activity feed shows the last 8 events across all groups, but there's no way to see "who hasn't checked in" or "which groups are cold." OVERWATCH builds the situational picture manually.
- **Cannot verify source reliability.** When a spotrep appears on the map, OVERWATCH has no way to assess the reporting operator's trust level. WoT scores exist but show social graph distance, not operational attestation. Map markers from a verified longtime operator render identically to markers from a brand-new, unverified pubkey. This is Gap 4.
- **Dashboard is a sketch.** OPS view has the right data sources (`groupSummaries`, `groupProjections`, `unreadGroupMessageCounts`) but displays them as a list. No configurable tiles, no priority arrangement, no ambient status. This is Gap 1.

**First question on opening NavCom:** *"Can I trust this map data?"*

**Core hope:** "Show me the picture. Let me decide what matters."

---

### SWITCHBLADE — The Mobile Field Operative

**Operating context:** Solo or 2-person team. Moving by foot, vehicle, or public transit through uncertain urban terrain. Phone in pocket. Connectivity drops to 2G, then nothing, then back. Every second of screen-on time is cost — attention is survival.

**Primary mode flow:** COMMS (quick check-in/alert) → MAP (orientation check) → pocket.

**What NavCom does right for SWITCHBLADE today:**
- COMMS view has one-tap "Check-In" that captures GPS and publishes with `["msg-type", "check-in"]` + `["location", "lat,lng"]` + geohash
- Alert button with priority selection (Low/Med/High) adds `["msg-type", "alert"]` + `["priority", level]`
- Mobile layout with bottom drawer for map/chat split (peek/half/full snap states)
- Map centers on "me" with user location marker via `navigator.geolocation`

**Where NavCom fails SWITCHBLADE:**
- **Offline = dead.** When SWITCHBLADE enters a dead zone, check-ins fail silently. The outbox system (`src/engine/offline/outbox.ts`) exists with full IndexedDB persistence and AES-GCM encryption — `enqueue()`, `getPending()`, `updateStatus()`, `dequeue()`, `clearSent()` — but it is **never called from the publishing path.** `publishGroupMessage()` calls `signAndPublish()` which calls `Router.get().PublishEvent()` directly. If that fails, the message is gone. The entire outbox was built and then orphaned. This is the intersection of Gap 2 and Gap 3 — and it's a Pillar 5 (INFRA) doctrine violation, not merely a gap.
- **Error boundary kills the app.** When relay connections fail, the app shows an error state via toast notifications that disappear. There's no fallback to cached data, no "sovereign" operating mode, no queuing. A relay failure is treated as a fatal condition. The doctrine says "Continue operating when components fail." The app does the opposite.
- **No confirmation of delivery.** Check-in takes one tap (good). But there's no persistent status showing "last check-in: 3 min ago" or confirmation that at least one relay acknowledged receipt. SWITCHBLADE doesn't know if the last action succeeded.
- **No battery/bandwidth awareness.** Map tiles load over the network every time. No offline tile cache. On metered connections, the map is a bandwidth drain. The PWA caches static assets (CacheFirst for JS/CSS/WOFF2) but not map tiles.

**First question on opening NavCom:** *"Will this work when signal drops?"*

**Core hope:** "One tap to say I'm here. One tap to say there's trouble. Then back in my pocket."

---

### ARCHITECT — The Cell Commander

**Operating context:** Manages 3–8 operational groups across a geographic region. Each group has different security requirements (Tier 0 for logistics, Tier 2 for operational cells). Responsible for OPSEC posture across the network. Desktop + mobile, but primary work is desktop.

**Primary mode flow:** OPS view (constant) → group settings → relay config → member status.

**What NavCom does right for ARCHITECT today:**
- Group relay policy editor (`GroupRelayPolicyEditor.svelte`) allows per-group relay configuration with role (read/write/read-write), privacy flags, health status
- Tier policy enforcement (`evaluateTierPolicy()`) blocks Tier 2 downgrades, requires explicit confirmation for Tier 1 downgrades, generates audit events for overrides
- Group projections track membership with roles (owner/admin/moderator/member) and status (active/pending/removed/left)
- Encryption indicators show transport mode per group (baseline-nip29 / secure-nip-ee)
- Relay health tracking with circuit-breaker demotion (80% failure rate threshold, ≥5 attempts)

**Where NavCom fails ARCHITECT:**
- **Cells are not isolated.** ARCHITECT creates a Tier 2 group for Cell Alpha on `wss://relay-alpha.example`. Then creates Cell Bravo on `wss://relay-bravo.example`. Good. But then a member joins Cell Charlie and accidentally uses `wss://relay-alpha.example`. Now the relay operator for Alpha can see Charlie traffic — and can infer that the same pubkeys participate in both cells. **There is no check.** `evaluateTierPolicy()` enforces transport mode (must use NIP-EE) but doesn't enforce relay isolation. The Tier 2 badge means "encrypted transport" but not "metadata isolation." The badge is lying about tier compliance. This is Gap 5.
- **Cannot verify operators.** When a new pubkey requests to join a Tier 2 group, ARCHITECT has no mechanism to verify the person behind that key. The identity verification path is: look at WoT score (social graph distance via `getUserWotScore()`), look at profile metadata (self-reported), and… that's it. There's no in-app mechanism for "I've met this person and verified their key fingerprint." The role hierarchy exists (owner/admin/moderator/member) but the initial trust establishment is empty. This is Gap 4.
- **No personnel status board.** ARCHITECT needs to see "Cell Alpha: 6/8 members checked in within 2 hours, 2 cold." This data exists — every event in `sourceEvents` has a pubkey and `created_at` timestamp — but it's not aggregated or displayed. ARCHITECT builds the personnel status picture by scrolling through message history in each group. This combines Gap 7 (temporal currency) with Gap 1 (no dashboard).
- **Relay health is invisible in group context.** `relayHealthTracker` tracks per-relay uptime, demotion, circuit-breaker status. But there's no view showing "Cell Alpha's relay is at 45% uptime and auto-demoted." ARCHITECT discovers relay problems when messages stop arriving.

**First question on opening NavCom:** *"Are my cells truly isolated?"*

**Core hope:** "Show me the health of my network. Let me enforce the rules."

---

### Shared Archetype Needs

All three archetypes share requirements that cut across individual concerns:

1. **"Prove this app is secure."** — The first impression must communicate what NavCom is and why it exists. The current onboarding says "Set up a Navcom key and post in under a minute." This could be any social app. None of the three archetypes would trust it.
2. **Failure must not be fatal.** — Whether it's SWITCHBLADE in a dead zone, OVERWATCH with a flaky relay, or ARCHITECT's group relay going down, the app must continue operating.
3. **Time is the most critical metadata.** — Every piece of information must carry temporal context. The question is never just "what" but "when" and "how fresh."
4. **The app should feel like a workstation, not a social feed.** — EVE Online fleet overview, ATAK team awareness, Star Trek LCARS. Status is ambient. Actions are operational. The vibe is "bridge crew," not "timeline scroll."

---

## The Seven Gaps (Doctrine-Validated)

Each gap was identified through codebase audit, validated against the five-pillar doctrine, and cross-referenced with the official [gap analysis](../navcom-gap-analysis.md). Gaps are ordered by doctrinal severity (how fundamentally they violate the vision), not by implementation difficulty.

### Gap 1: No Operational Dashboard

**Pillar violated:** INTEL
**Official gap analysis rank:** #1
**Archetype impact:** OVERWATCH (primary), ARCHITECT (primary)

**The problem:** The "/" route renders one of three views based on `navcomMode`: `CommsView` (chat), `MapView` (Leaflet map), or `OpsView` (group summaries). This is a mode *switch*, not a dashboard. The operator sees one facet at a time. A dashboard is a composite: you see everything at once at reduced fidelity, and drill into any facet.

**What exists today:** OPS view has three components: a map thumbnail (non-interactive Leaflet mini-map at `$mapViewport.center` with zoom-1), a channel status grid (group cards with member counts + role distributions + message-type tallies + encryption tier badges + unread counts), and a recent activity feed (last 8 events across all groups sorted by timestamp). These are the right data sources. The problem is layout (vertical stack, not tiles) and composability (hard-coded order, no per-operator customization).

**What exists in the codebase that we can build on:**
- `groupSummaries` derived store — group list items with title, picture, memberCount, encryption info
- `groupProjections` — Map<groupId, GroupProjection> with members (role/status/pubkey), sourceEvents, audit log
- `unreadGroupMessageCounts` — Map<groupId, number>
- `totalUnreadGroupMessages` — scalar total
- `mainNotifications` / `hasNewNotifications` — global notification state
- `relayHealthTracker.getAllMetrics()` — array of RelayHealthEntry with url, tier, successes, failures, lastSuccess, lastFailure, demoted flag
- `mapViewport` — persisted center/zoom for thumbnail
- All use `synced()` pattern from `@welshman/store` — reactive and localStorage-persistent

**Resolved by:** Innovation 2 (THE BOARD) in Phase 3.

---

### Gap 2: Silent Offline Data Loss

**Pillar violated:** INFRA
**Official gap analysis rank:** #8
**Archetype impact:** SWITCHBLADE (primary), all archetypes (operational)

**The problem:** When `publishGroupMessage()` calls `signAndPublish()`, the event flows through `sign()` → `Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()` → `publishThunk({event, relays})`. If all relays are unreachable, the publish fails. The message is gone. There is no retry. There is no queue. The user sees "Failed to send check-in" (a toast notification that disappears in seconds).

**The orphaned outbox:** `src/engine/offline/outbox.ts` is a complete, tested offline message queue:

| API | Purpose |
|-----|---------|
| `enqueue(channelId, content)` | Encrypt with AES-GCM + store in IndexedDB with "queued" status |
| `getPending()` | Retrieve queued + sending messages, decrypt, sort by createdAt |
| `updateStatus(id, status, retryCount?)` | Update message state + lastRetryAt |
| `dequeue(id)` | Remove sent/failed messages |
| `getQuarantinedCount()` | Count messages with failed decryption |
| `clearSent()` | Garbage collect sent messages |

It has error-classified drain logic (`queue-drain.ts`): passphrase-needed → stop drain + notify UI; network-down → preserve queue + don't count retry; relay-rejection → exponential backoff 2s→60s, fail after MAX_RELAY_RETRIES. It has background sync scaffolding (`sw-sync.ts`): `"navcom-outbox-drain"` sync tag for ServiceWorker registration when browser regains connectivity.

All of this was built. None of it is wired into `publishGroupMessage()`.

**Resolved by:** Innovation 1 (SOVEREIGN MODE) in Phase 2.

---

### Gap 3: Error Boundary Kills the App

**Pillar violated:** INFRA
**Official gap analysis rank:** Not explicitly ranked (entangled with #8)
**Archetype impact:** SWITCHBLADE (primary), all archetypes (operational)

**The problem:** When relay connections fail, the app's error handling treats this as an unexpected condition. Toast errors appear. If enough relays fail, data stops loading and the UI goes empty. There is no concept of "degraded but operational."

**What exists today:** Error handling follows try/catch → toast notification → optional retry. `relayHealthTracker` has demotion logic and a circuit breaker (never drops to zero relays), but this only affects relay *selection* — it doesn't change UI state or enable offline operation.

**Relationship to Gap 2:** Two sides of the same coin. Gap 2 = outgoing messages lost. Gap 3 = app state broken. Same root cause: network absence treated as error, not mode. Same solution: SOVEREIGN MODE.

**Resolved by:** Innovation 1 (SOVEREIGN MODE) in Phase 2.

---

### Gap 4: Cannot Verify Anyone

**Pillar violated:** AUTH
**Official gap analysis rank:** #10 (chain-of-trust)
**Archetype impact:** ARCHITECT (primary), OVERWATCH (operational)

**The problem:** The identity model: generate keypair → set display name → publish kind-0 metadata. Trust = WoT score = social graph distance via `getUserWotScore()`. This measures "how many hops through your follow graph to reach this person." It does not measure "has anyone operational verified this person's identity."

**What exists today in `WotPopover.svelte`:** Profile name, bio, handle, npub (copyable), WoT score badge. No attestation method, no verification timestamp, no expiry, no confidence level.

**Why "add a verification screen" isn't enough:** The trust primitive (follow) isn't operational. Following means "show me their posts." Operational trust means "I can verify the person behind this key, I know the method used, I know when it expires, and the chain is auditable." This requires a protocol primitive (new Nostr event kind), not just new UI.

**Resolved by:** Innovation 3 (TRUST ATTESTATION EVENTS) in Phase 4.

---

### Gap 5: Relay Operators See Everything

**Pillar violated:** INFRA
**Official gap analysis rank:** Not explicitly ranked (implied by tier model)
**Archetype impact:** ARCHITECT (primary)

**The problem:** Tier 2 requires metadata privacy. `evaluateTierPolicy()` enforces transport mode (must use NIP-EE) but doesn't enforce relay isolation. Two Tier 2 groups can share relays, enabling the relay operator to correlate pubkeys across cells. The Tier 2 badge promises "mandatory encryption" but metadata (which pubkeys, which relays, when, how often) is fully visible.

**Why the badge is lying:** An operator reading "Tier 2" reasonably assumes full protection. But Tier 2 = encrypted content + unprotected metadata structure. The badge overpromises.

**Resolved by:** Innovation 5 (RELAY FINGERPRINT GATE) in Phase 1.

---

### Gap 6: Onboarding Teaches Nothing About Security

**Pillar violated:** AUTH
**Official gap analysis rank:** #5 (onboarding ignores group context), #7 (jargon-dense identity UX)
**Archetype impact:** All archetypes (first impression)

**The problem:** The 4-step onboarding: "Get started" → "Choose your key path" → "Profile (optional)" → "You're ready." Every title reads as social media signup. "Posting" appears 3 times. "Secure," "encrypt," and "sovereign" appear zero times. The final destination is described as "feed." The vision says "immediate operational context." The onboarding promises "post in under a minute." These are in contradiction.

**The deeper conflict:** The onboarding was optimized for minimum friction (get to a feed fast). This is correct for social clients. It's wrong for an operational platform where every archetype's first question is "Prove this app is secure." The onboarding should answer that question, not skip it.

**Resolved by:** Innovation 6 (THE BRIEFING) in Phase 1.

---

### Gap 7: No Temporal Currency

**Pillar violated:** NAV
**Official gap analysis rank:** #4 (map isolated from comms), #9 (no map layer controls — partially addressed)
**Archetype impact:** OVERWATCH (primary), SWITCHBLADE (operational), ARCHITECT (operational)

**The problem:** Every marker on the map has `timestamp: event.created_at` but this is only used for time-range *filtering* (1h/24h/7d/all), not visual *aging*. A 5-minute-old check-in and a 23-hour-old check-in (both within 24h filter) render identically. `MARKER_STYLES` maps message-type to icon/color/cssClass but has no temporal dimension.

**What's needed:** Presence — the temporal dimension of identity and location. Not "where is Operator X" but "where was Operator X, and how fresh is that information." The check-in timestamp exists. The aggregation (per-operator last-seen) and visualization (freshness badges, marker opacity) don't.

**Resolved by:** Innovation 4 (PRESENCE-FROM-PUBLISHING) in Phase 1 + Innovation 3 (TRUST ATTESTATION EVENTS) in Phase 4 for source reliability.

---

## Six Innovations

Instead of treating each gap as a separate workstream, six innovations collapse multiple gaps into single architectural moves. Each leverages existing infrastructure — none starts from zero.

### Innovation 1: SOVEREIGN MODE (Phase 2)

**Collapses:** Gap 2 (offline data loss) + Gap 3 (error boundary)
**Spec:** [04-sovereign-mode.md](04-sovereign-mode.md)
**Effort:** Medium

**The insight:** The app currently has one state axis: which mode are you in (comms/map/ops). It needs a second axis: what is your connection to the network (connected/sovereign). These are independent dimensions. You can be in MAP mode while connected, or in MAP mode while sovereign. The mode doesn't change — the operating posture does.

**Why "SOVEREIGN" and not "offline":** "Offline" implies "waiting to come back online." "Sovereign" implies "operating independently." The framing shapes design: in offline mode, you'd show a spinner; in sovereign mode, you show cached data and queue outgoing messages. The app is not broken — it's operating without infrastructure dependency.

**What already exists that makes this viable:**
- `navcomMode` store pattern — `synced()` persisted to localStorage, drives conditional rendering in Routes.svelte. `connectionState` will follow the identical pattern.
- `outbox.ts` — complete offline message queue with IndexedDB, AES-GCM encryption, status tracking (`"queued" | "sending" | "sent" | "failed" | "quarantined"`), retry counter, quota handling. Fully built. Fully orphaned.
- `queue-drain.ts` — error-classified drain with exponential backoff. Distinguishes passphrase-needed vs. network-down vs. relay-rejection.
- `sw-sync.ts` — ServiceWorker background sync scaffolding with `"navcom-outbox-drain"` tag.
- `relayHealthTracker` — circuit-breaker fires `onDemotion()` callback when relay auto-demoted. Can trigger SOVEREIGN transition.
- `repository` from `@welshman/store` — in-memory event cache queryable via `repository.query([filters])` even when relays are down. Events persist across disconnections.

**The critical wiring change:** One if-statement in `signAndPublish()`:

```typescript
// Current: always goes to relays
export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
  return await publishThunk({event, relays})
}

// SOVEREIGN MODE: queue to outbox when disconnected
export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  if (get(connectionState) === "sovereign") {
    return await enqueue(channelFromEvent(event), JSON.stringify(event))
  }
  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
  return await publishThunk({event, relays})
}
```

**Why Phase 2:** The transition SOVEREIGN → CONNECTED triggers outbox drain, which involves conflict resolution and state reconciliation. Phase 1 innovations are lower-risk. But SOVEREIGN MODE must ship before The Board (Phase 3) because the dashboard must work in both states.

---

### Innovation 2: THE BOARD (Phase 3)

**Collapses:** Gap 1 (no dashboard) + social-residue removal (feed-as-landing-page)
**Spec:** [05-the-board.md](05-the-board.md)
**Effort:** Medium-High

**The insight:** OPS view already has the three components that make a dashboard: map thumbnail, channel status grid, activity feed. But it renders them as a fixed vertical list. A dashboard (The Board) is a configurable tile grid where the operator arranges the components that matter to them. OVERWATCH wants a large map with activity overlay. ARCHITECT wants a grid of group status tiles. SWITCHBLADE wants two buttons.

**Why "The Board" and not "Dashboard":** "Dashboard" has been colonized by analytics SaaS products (charts, metrics, KPIs). "The Board" evokes a physical operations board — a surface where information is arranged for situational awareness. The metaphor is: pin things to your board.

**Tile vocabulary:**
| Tile | Data Source | Per-archetype Priority |
|------|------------|----------------------|
| Map Overview | `mapViewport` + cached markers | OVERWATCH: large; SWITCHBLADE: small; ARCHITECT: medium |
| Group Status | `groupSummaries` + `unreadGroupMessageCounts` + `groupMemberPresence` | ARCHITECT: large; OVERWATCH: medium; SWITCHBLADE: hidden |
| Activity Stream | `groupProjections.sourceEvents` sorted by timestamp | OVERWATCH: medium; ARCHITECT: medium; SWITCHBLADE: hidden |
| Relay Health | `relayHealthTracker.getAllMetrics()` | ARCHITECT: medium; others: small or hidden |
| Connection State | `connectionState` (from Innovation 1) | All: small persistent indicator |
| Quick Actions | Check-in + Alert buttons (from `CommsView`) | SWITCHBLADE: large; others: small |
| Personnel Status | `groupMemberPresence` (from Innovation 4) | ARCHITECT: large; OVERWATCH: medium; SWITCHBLADE: hidden |

**Architectural change:** The mode switch in `Routes.svelte` evolves:

```svelte
<!-- Current: switch between three single-mode views -->
{#if $navcomMode === "comms"}
  <CommsView />
{:else if $navcomMode === "map"}
  <MapView />
{:else if $navcomMode === "ops"}
  <OpsView />
{/if}

<!-- Phase 3: The Board replaces OPS view -->
{#if $navcomMode === "comms"}
  <CommsView />
{:else if $navcomMode === "map"}
  <MapView />
{:else if $navcomMode === "ops"}
  <BoardView tileLayout={$boardLayout} connectionState={$connectionState} />
{/if}
```

**Why Phase 3:** Depends on SOVEREIGN MODE (Phase 2) — tiles must render in both states — and PRESENCE (Phase 1) — group/personnel tiles need freshness data.

---

### Innovation 3: TRUST ATTESTATION EVENTS (Phase 4)

**Collapses:** Gap 4 (can't verify anyone) + Gap 7 (source reliability on map markers)
**Spec:** [06-trust-attestation.md](06-trust-attestation.md)
**Effort:** Low-Medium

**The insight:** Identity verification, source reliability, and temporal provenance are three faces of one problem: "How much should I trust this information?" A single protocol primitive — a signed attestation event with method, confidence, scope, and expiry — collapses all three.

**Event structure (Nostr kind 30078 — parameterized replaceable):**

```json
{
  "kind": 30078,
  "pubkey": "<attestor-pubkey>",
  "created_at": 1711152000,
  "tags": [
    ["d", "attestation:<attested-pubkey>"],
    ["p", "<attested-pubkey>"],
    ["method", "in-person-key-fingerprint"],
    ["confidence", "high"],
    ["scope", "group:<group-id>"],
    ["expires", "1718928000"]
  ],
  "content": "Verified at forward operating base. Key fingerprint matched.",
  "sig": "..."
}
```

**Why kind 30078:** Parameterized replaceable events (kind 30000–39999) allow update-in-place. The `d` tag creates a unique identifier per attestor-per-attestee pair. Re-verification publishes a new event replacing the old — natural trust refresh.

**What this enables at each surface:**
- **Map:** Attested operator markers render full opacity/solid. Unattested render 50% opacity/dashed. OVERWATCH immediately distinguishes trusted from untrusted intel.
- **WoT display:** `WotPopover.svelte` extends with attestation details: who attested, method, when, expires when. Shield badge reflects status.
- **Group management:** ARCHITECT can require attestation before granting roles above "member." (Soft policy, not hard gate.)
- **Natural trust decay:** Expiry forces renewal. A 6-month-old attestation is weaker than a 1-week-old one. Trust relationships are living, not permanent.

**What already exists:**
- `signAndPublish()` publishes any event kind — zero transport changes needed
- `deriveEvents({repository, filters})` reactively queries the store
- `repository.query([{kinds: [30078], "#p": [pubkey]}])` retrieves all attestations for a pubkey
- `WotPopover.svelte` is the natural UI extension point

**Why Phase 4:** Attestation badges create the most value when displayed on The Board's tiles and map markers. Without Board, badges only appear in chat/profile views.

---

### Innovation 4: PRESENCE-FROM-PUBLISHING (Phase 1)

**Collapses:** Gap 7 (temporal currency / no heartbeat)
**Spec:** [02-presence-from-publishing.md](02-presence-from-publishing.md)
**Effort:** Low

**The insight:** Everyone's first instinct for presence is "build a heartbeat system." But every event an operator publishes already carries a signed timestamp. `GroupProjection.sourceEvents` is an array of `TrustedEvent` objects — each with `pubkey` and `created_at`. A derived store computing MAX(created_at) per pubkey per group gives us last-seen for free. ~20 lines of store code. Zero new events. Zero new relay subscriptions.

**Why this works technically:** `sourceEvents` is already loaded into memory for membership tracking and message display. The presence store aggregates differently from the same data. Reactivity comes from `groupProjections` — when new events arrive, the store recomputes.

**The check-in reframing:** The check-in button in `CommsView.svelte` fires `publishGroupMessage()` with `["msg-type", "check-in"]` + optional GPS coordinates. Relabeling it "Signal" reframes: it's not a social action ("I'm here!") but an operational transmission ("Broadcasting status"). The underlying event is unchanged; the mental model shifts.

**Why Phase 1:** Zero architecture changes. Ships independently. And critically: presence data becomes a Phase 3 dependency (Board tiles need freshness badges).

---

### Innovation 5: RELAY FINGERPRINT GATE (Phase 1)

**Collapses:** Gap 5 (relay isolation / Tier 2 compliance)
**Spec:** [03-relay-fingerprint-gate.md](03-relay-fingerprint-gate.md)
**Effort:** Low

**The insight:** An audit view shows problems after they exist. A gate prevents them from existing. When an operator creates or joins a Tier 2 group, the gate checks: does any proposed relay appear in any other Tier 2 group? If yes → **block** with explanation. The violation never occurs.

**Why a gate, not an audit:**
- `evaluateTierPolicy()` is already a gate pattern — it returns `{ok: false, reason}` on failure
- Adding relay isolation to the same gate follows the existing architectural convention
- The UI already handles tier policy rejections with error display in `GroupSettingsAdmin.svelte`
- Prevention > detection for security invariants

**The relay normalization detail:** `normalizeRelayUrl()` in `relay-policy.ts` handles case, trailing slashes, double-slash protocol variations, with SSRF protection via `isPrivateRelayUrl()`. The gate reuses this normalization.

**Why Phase 1:** Pure function. No state changes. One check added to the Tier 2 path.

---

### Innovation 6: THE BRIEFING (Phase 1)

**Collapses:** Gap 6 (onboarding teaches nothing)
**Spec:** [01-the-briefing.md](01-the-briefing.md)
**Effort:** Low

**The insight:** The onboarding structure is fine — 4 steps, progressive disclosure, skip options, back/forward via `OnboardingStageHost.svelte`. The *framing* is wrong. Changing copy ("Operational briefing" not "Get started", "Identity credential" not "Choose your key path", "Operator card" not "Profile", "Infrastructure status" not "You're ready") transforms first impressions without touching architecture.

**The one new component:** Step 4 gains a collapsible `SecurityPosturePanel.svelte` — "What's Protected / What's Visible." Lists what's encrypted (message content, private key, Tier 2 membership details) and what relay operators can see (public key, relay connections, timestamps, group relay association). Honest, not reassuring. This answers the shared archetype question: "Prove this app is secure."

**Why this matters more than it seems:** The first 60 seconds shape the mental model. If those seconds say "social signup," the operator interprets every subsequent feature through that lens. The Briefing resets expectations from "social app with security features" to "operational platform."

**Why Phase 1:** Copy changes + one component. Ships in hours. Zero risk.

---

## Phase Sequence

### Phase 0: Current State

NavCom today is a capable Nostr client with significant operational features:
- ✅ Three-mode UI (COMMS/MAP/OPS) with persistent state via `synced()` stores
- ✅ Group messaging with NIP-29 (baseline) and NIP-EE (encrypted) transport
- ✅ PQC crypto engine: ML-KEM-768 + AES-GCM-256, 556 tests passing, full primitive set
- ✅ Leaflet map with typed markers, layer filtering, time ranges, user location, tile switching
- ✅ OPS view with group summaries, map thumbnail, activity feed (8 most recent events)
- ✅ Relay health tracking: circuit-breaker demotion at 80% failure, verified relay list, `onDemotion()` callbacks
- ✅ Group projection system: members, roles, sourceEvents, audit log, checkpointing, staleness recovery
- ✅ Tier policy enforcement: Tier 2 blocks transport downgrades, generates audit events
- ✅ Mobile: drawer states (peek/half/full), responsive layouts, GPS integration
- ✅ Theme system: tri-axis (Shell×Surface×Accent), 4 palettes, dark-only operational aesthetic
- ✅ Beta test suite: 243/243 passing, 20 specs in cypress/e2e/beta/
- ❌ PQC not wired to message path (engine complete, integration incomplete)
- ❌ Outbox built but orphaned (never called from publish path)
- ❌ Background sync scaffolded but not integrated with service worker
- ❌ No presence aggregation from event timestamps
- ❌ No relay isolation enforcement for Tier 2
- ❌ No identity attestation mechanism beyond WoT score
- ❌ Onboarding framed as social signup

### Phase 1: Prove the Direction

**Innovations:** 6. The Briefing + 4. Presence-from-Publishing + 5. Relay Fingerprint Gate

**Character:** No new architecture. Copy changes, derived stores, one pure function. Each innovation is independently shippable. The goal is to prove the transmutation direction without irreversible architectural bets.

**What Phase 1 accomplishes:**
- The Briefing answers "Prove this app is secure" — first impression for all archetypes
- Presence-from-Publishing answers "how fresh is this data" — OVERWATCH's and ARCHITECT's core need
- Relay Fingerprint Gate answers "are my cells truly isolated" — ARCHITECT's first question
- Three of seven gaps addressed; all three archetype first-questions partially answered

**Phase 1 internal sequencing:**
1. The Briefing first — lowest risk, highest visibility
2. Relay Fingerprint Gate second — smallest code change, immediate tier compliance
3. Presence-from-Publishing third — derived from group projections, may need tuning on large groups

### Phase 2: SOVEREIGN MODE

**Innovation:** 1. Sovereign Mode

**Character:** The critical engineering phase. Introduces `connectionState` axis affecting publish pipeline, error handling, UI state. The hardest part is the transition SOVEREIGN → CONNECTED: outbox drain, conflict resolution, state reconciliation.

**What Phase 2 accomplishes:**
- SWITCHBLADE can check in through dead zones (the orphaned outbox activates)
- Every archetype gets degraded-but-operational experience
- Doctrine requirement "Continue operating when components fail" is met
- Two of seven gaps resolved (Gap 2 + Gap 3)

### Phase 3: THE BOARD

**Innovation:** 2. The Board

**Character:** The social client identity dies. Feed-as-landing is replaced by configurable tile grid. The "/" route's OPS mode becomes a composite operational surface.

**What Phase 3 accomplishes:**
- OVERWATCH gets a configurable command picture
- ARCHITECT gets a network status board
- SWITCHBLADE gets a minimal action surface
- Gap 1 (no operational dashboard) fully resolved
- Kill-list item "Feed as landing page" eliminated

### Phase 4: TRUST ATTESTATION EVENTS

**Innovation:** 3. Trust Attestation Events

**Character:** Protocol extension. New kind-30078 event. Lightest engineering of later phases but heaviest in protocol design and Nostr community implications.

**What Phase 4 accomplishes:**
- ARCHITECT can verify operational identities
- OVERWATCH can distinguish trusted sources on map
- Gap 4 (can't verify anyone) fully resolved
- Gap 7 (source reliability) fully resolved with Presence from Phase 1
- Kill-list item "Follow as trust" replaced by attestation

---

## Dependency Map

```
Phase 1 (independent)          Phase 2              Phase 3              Phase 4
─────────────────────          ─────────            ─────────            ─────────
6. The Briefing ───────────────────────────────────────────────────────────────────
4. Presence ──────────────────▶ (status bar) ──────▶ (group tiles) ────▶ (trust + freshness)
5. Relay Gate ─────────────────────────────────────────────────────────────────────
                               1. Sovereign ────────▶ 2. The Board ────▶ 3. Trust Attestation
                                Mode                                     Events
```

**Key dependency chains:**
- Presence → Board (tiles need freshness data)
- Sovereign Mode → Board (tiles must work in both connection states)
- Board → Trust Attestation (badges render on Board tiles)
- The Briefing and Relay Gate are terminal — no downstream dependencies

---

## Status Dashboard

| Innovation | Phase | Status | Spec | Notes |
|-----------|-------|--------|------|-------|
| 6. The Briefing | 1 | 📋 SPECCED | [01-the-briefing.md](01-the-briefing.md) | Copy rewrite + SecurityPosturePanel component |
| 4. Presence-from-Publishing | 1 | 📋 SPECCED | [02-presence-from-publishing.md](02-presence-from-publishing.md) | Derived store + PresenceBadge + group health |
| 5. Relay Fingerprint Gate | 1 | 📋 SPECCED | [03-relay-fingerprint-gate.md](03-relay-fingerprint-gate.md) | Pure function gate on Tier 2 group join/create |
| 1. Sovereign Mode | 2 | 📋 SPECCED | [04-sovereign-mode.md](04-sovereign-mode.md) | Connection state axis + outbox wiring + status bar |
| 2. The Board | 3 | 📋 SPECCED | [05-the-board.md](05-the-board.md) | Configurable tile grid replacing OPS mode switch |
| 3. Trust Attestation Events | 4 | 📋 SPECCED | [06-trust-attestation.md](06-trust-attestation.md) | kind-30078 attestation events + badge integration |

---

## Testing Strategy

The existing beta test suite (243/243 passing, 20 specs in `cypress/e2e/beta/`) validates current functionality and must continue passing through all phases.

**Per-phase testing approach:**

| Phase | New Cypress Specs | Unit Tests (Vitest) | Validation Focus |
|-------|------------------|--------------------|-----------------| 
| 1 | `onboarding-briefing.cy.ts`, `presence-badges.cy.ts`, `relay-fingerprint-gate.cy.ts` | `classifyPresence()`, `evaluateRelayFingerprintGate()` | Copy assertions, badge rendering, gate rejection |
| 2 | `sovereign-mode.cy.ts`, `outbox-drain.cy.ts` | Connection state machine, drain error classification | State transitions, queue persistence, drain recovery |
| 3 | `board-tiles.cy.ts`, `board-layout.cy.ts` | Tile data extraction, layout persistence | Tile rendering, responsive behavior, SOVEREIGN mode tiles |
| 4 | `trust-attestation.cy.ts` | Event structure validation, attestation expiry | Event creation, badge display, map marker differentiation |

```bash
pnpm test:beta           # Full Cypress suite (existing 243 + new per-phase)
pnpm test:beta:smoke     # Gate tests
pnpm vitest              # Unit tests (pure functions)
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | 6 innovations, 4-phase sequence | Collapse multiple gaps per innovation; phase by dependency chain |
| 2026-03-23 | Flat file structure (playbook + numbered specs per innovation) | Avoid doc rot; each innovation gets a full spec regardless of phase |
| 2026-03-23 | Phase 1 = Briefing + Presence + Relay Gate | Maximum doctrine compliance per effort unit; no new architecture |
| 2026-03-23 | "SOVEREIGN" not "offline" for connection state | Framing shapes design: operating independently vs. waiting for network |
| 2026-03-23 | Gate not audit for relay isolation | Prevention > detection; matches existing `evaluateTierPolicy()` gate pattern |
| 2026-03-23 | Presence derived from events, not heartbeat | Zero new events/subscriptions; ~20 lines of derived store code |
| 2026-03-23 | kind-30078 for attestation events | Parameterized replaceable events allow update-in-place per attestor-attestee pair |
| 2026-03-23 | "The Board" not "Dashboard" | Evokes physical operations board, not analytics SaaS; distinguishes NavCom identity |
| 2026-03-23 | Spec all phases upfront instead of "spec when prior phase ships" | User feedback: depth matters; the full strategic picture needs to be on disk, not in heads |
