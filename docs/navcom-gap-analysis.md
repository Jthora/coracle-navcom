# NavCom Gap Analysis: Current State vs Earth Alliance Vision

> Audit date: July 2025 | Branch: `feat/real-pqc-crypto`
> Reference: [docs/navcom-vision.md](navcom-vision.md)

---

## Reading This Document

Each capability is rated:

- **OPERATIONAL** — Production-ready, works as intended
- **PARTIAL** — Scaffolded or incomplete, needs wiring/extension
- **MISSING** — Not implemented, not started

The "Vision Requires" column states what a real Earth Alliance NavCom needs.
The "Current State" column states what exists today, with file references.
The "Gap" column states what's missing.

---

## Pillar 1: COMMS — Secure Communications

| Capability | Rating | Vision Requires | Current State | Gap |
|-----------|--------|-----------------|---------------|-----|
| **Group chat** | OPERATIONAL | Encrypted group messaging with role-based access | NIP-29 groups with moderation, role hierarchy (owner/admin/mod/member). `src/domain/group-control.ts`, `src/engine/group-commands.ts` | None for basic functionality |
| **Direct messages** | OPERATIONAL | Encrypted 1:1 messaging | NIP-44 (classical) DMs via `src/app/views/ChannelsList.svelte` | Works, but no PQC path active yet |
| **Announcements** | OPERATIONAL | System-wide broadcasts readable without auth | `src/app/views/Announcements.svelte` — kind:1 from designated pubkey, tag `#starcom_announcements` | None |
| **Security tier policy** | OPERATIONAL | Tiered encryption enforcement with audit trail | Three tiers (0/1/2) with policy checks and override audit events. `src/engine/group-tier-policy.ts` | None — well-tested |
| **PQC group encryption** | PARTIAL | ML-KEM-768 + AES-GCM-256 for group content | Crypto provider exists (`src/engine/pqc/crypto-provider.ts`), epoch state machine complete, 556 tests passing. Awaits message-path integration. | Wired in engine but not yet active in UI message flow |
| **PQC direct messages** | PARTIAL | Hybrid classical/PQC DM encryption | Envelope structure defined (`src/engine/pqc/dm-envelope.ts`), NIP-44 fallback working | PQC key publication (kind-10051) missing; no key generation UI |
| **Key rotation** | PARTIAL | Automated epoch-based key rotation | Policy and state machine exist (`src/engine/group-key-rotation-service.ts`). Manual trigger only. | No automated rotation schedule; no trigger on membership change |
| **Key revocation** | PARTIAL | Revoke compromised keys with audit trail | `revokeCompromisedDeviceForGroup()` tested, audit events recorded (`src/engine/group-key-revocation.ts`) | Manual-only; no automated compromise detection |
| **PQC key lifecycle** | MISSING | Generate, store, publish, rotate, expire ML-KEM-768 keys | No kind-10051 publication. No key generation flow. No expiry enforcement. | Entire PQC key management UI and automation |

### COMMS Verdict

**Core messaging works.** Classical encryption is production-ready. PQC crypto engine exists and is tested but is not yet wired into the live message path. The biggest gap is the absence of PQC key generation/publication — operators cannot establish PQC-capable identities. The tier policy system is strong but currently guards a door that PQC hasn't walked through yet.

---

## Pillar 2: NAV — Navigation & Geospatial Intelligence

| Capability | Rating | Vision Requires | Current State | Gap |
|-----------|--------|-----------------|---------------|-----|
| **Interactive map** | OPERATIONAL | Real-time operational map with GEOINT markers | Leaflet + OpenStreetMap integrated in `MapView.svelte` (NavCom Map mode). Marker derivation, layer filtering, clustering, user GPS, member positions. ~~Legacy `IntelNavMap.svelte` removed 2026-03-21.~~ | Map fully integrated into tri-mode NavCom UI |
| **GEOINT posting** | OPERATIONAL | Structured geo-tagged reports with GeoJSON | Full pipeline: lat/lon/alt/confidence/subtype/geohash. GeoJSON Feature embedded in content. Size validation. `src/app/util/geoint.ts`, `src/app/util/post-assembly.ts` | None for basic posting |
| **Map as core tool** | PARTIAL | Fused map-and-comms view, always accessible | Map exists but is a standalone page at `/intel/map`, separate from comms. Not in any composite view. | Map is isolated — not integrated with groups, feeds, or dashboard |
| **Layer controls** | MISSING | Filter markers by type, time, confidence, source | All GEOINT markers shown as identical pins. No filtering, no legend, no layer toggle. | No layer system |
| **Marker clustering** | MISSING | Handle hundreds of markers at operational scale | Raw markers only. Would degrade at >50 simultaneous points. | No Leaflet.markercluster or equivalent |
| **Draw/measure tools** | MISSING | Planning overlays, distance/area measurement | View-only map. No drawing, no annotation, no measurement. | No Leaflet.draw or equivalent |
| **Polygon/line geometry** | MISSING | Areas of interest, routes, boundaries | Point markers only. GeoJSON structure supports it but no UI for polygons/lines. | Point-only rendering |
| **Offline tile cache** | MISSING | Map usable in field with degraded connectivity | Standard Leaflet with online-only OSM tiles. | No tile caching strategy |
| **Spatial indexing** | MISSING | Performant queries over large geo datasets | Client-side filtering only. No geohash index, no quad-tree, no spatial query. | No spatial acceleration |

### NAV Verdict

**The map exists and works for basic intel display.** GEOINT posting is surprisingly complete — GeoJSON, geohash, confidence, subtypes are all there. But the map is a sidecar, not a core tool. An Earth Alliance NavCom needs the map to be a fundamental surface where comms and spatial data converge. Currently it's a separate page you navigate to and look at, then navigate away from to do anything else. The absence of layer controls, clustering, and draw tools keeps it at "demonstration" level rather than operational.

---

## Pillar 3: INTEL — Intelligence Processing

| Capability | Rating | Vision Requires | Current State | Gap |
|-----------|--------|-----------------|---------------|-----|
| **Ops feed** | OPERATIONAL | Filtered operational information channel | Tag-driven: `#starcom_ops` + `["app","starcom"]`. Dedicated nav link. `src/app/views/Home.svelte` | None |
| **Intel feed** | OPERATIONAL | Filtered intelligence channel | Tag-driven: `#starcom_intel` + `["app","starcom-geoint"]`. Dedicated nav link. | None |
| **Custom feeds** | OPERATIONAL | User-created filtered views | Composable feed system via `@welshman/feeds` primitives. `src/domain/feed.ts` | None |
| **Search** | OPERATIONAL | Text search across content | `src/app/views/Search.svelte` — basic content search | Works but limited (no structured query) |
| **Operational dashboard** | MISSING | Composite view: feeds + map + groups + status | **No dashboard exists.** Each pillar lives on its own page. No composite view anywhere in the app. | The single biggest missing piece in the entire application |
| **Structured reporting** | MISSING | SITREP, SPOTREP, INTREP templates with form fields | All content is kind:1 notes with additive tags. No form builders, no schemas, no structured input. | No reporting templates |
| **Cross-reference / correlation** | MISSING | Link related reports, track entities across posts | No entity linking, no thread analysis, no correlation engine. | No analysis capability |
| **Trend visualization** | MISSING | Charts, timelines, activity graphs | No data visualization beyond the map. | No charting or analytics |
| **Classification system** | PARTIAL | Tag and classify content by sensitivity/type | Tags exist (ops, intel, geoint-type) but no formal classification scheme. No restricted/secret/top-secret marking. | Informal tag-based only |

### INTEL Verdict

**Feeds work. Everything else is missing.** The feed system is mature and flexible — Ops and Intel channels are properly differentiated, custom feeds are composable. But "intelligence processing" requires *processing*, not just display. There are no structured reporting templates, no correlation tools, no dashboards, no analytics. The most critical absence is the **operational dashboard** — the single screen that should be the landing page of NavCom, compositing live feeds, map status, group activity, and relay health into one operational picture. This screen does not exist.

---

## Pillar 4: AUTH — Identity & Access Control

| Capability | Rating | Vision Requires | Current State | Gap |
|-----------|--------|-----------------|---------------|-----|
| **Self-sovereign identity** | OPERATIONAL | Keypair-based identity, no central authority | Nostr keypair (npub/nsec). `src/app/views/Login.svelte` | None — inherent to Nostr |
| **Multiple signer methods** | OPERATIONAL | Browser extension, mobile, remote, hardware | NIP-07 (extension), NIP-55 (mobile), NIP-46 (bunker), pubkey-only read. | Works, but presented with too much jargon |
| **Group roles** | OPERATIONAL | Hierarchical role enforcement | owner → admin → moderator → member with permission checks. `src/domain/group-control.ts` | None |
| **NIP-98 relay auth** | OPERATIONAL | Authenticated relay connections | Challenge-response auth for closed relays. | None |
| **PQC key generation** | MISSING | Generate ML-KEM-768 keypairs for operators | No generation flow. No UI. No storage. | Blocks all PQC communication |
| **PQC key publication** | MISSING | Publish PQC public keys (kind-10051) | Not implemented. | Blocks PQC key exchange |
| **Chain-of-trust** | MISSING | Web-of-trust scoring, verification, attestation | No WoT implementation. No trust scoring. No attestation events. | No trust framework |
| **Key backup/recovery** | PARTIAL | Secure export and recovery of identity | nsec copy/paste exists. Backup reminder (non-blocking toast). `src/app/views/UserKeys.svelte` | No encrypted backup export, no recovery flow, no multi-device sync |
| **Jargon-free identity UX** | MISSING | Operators understand their identity without Nostr knowledge | Login page says "nostr signer", "NIP-07", "NIP-55", "remote signer", "nsec", "ncryptsec". | Language barrier for non-Nostr operators |

### AUTH Verdict

**Identity fundamentals are solid.** Nostr provides self-sovereign identity by architecture. All major signer methods are supported. Group roles work with proper enforcement. But the **operator-facing UX is Nostr-native jargon** that would confuse anyone who hasn't already been in the Nostr ecosystem. An Earth Alliance NavCom needs identity to feel like a security credential, not a cryptocurrency wallet. The complete absence of PQC key management blocks the entire PQC communication path.

---

## Pillar 5: INFRA — Resilient Infrastructure

| Capability | Rating | Vision Requires | Current State | Gap |
|-----------|--------|-----------------|---------------|-----|
| **Multi-relay architecture** | OPERATIONAL | No single point of failure | User-managed relay lists (kind:10001), group relay hints, default fallback relays. `src/app/views/RelayList.svelte` | None — inherent to Nostr |
| **Relay capability probing** | OPERATIONAL | Detect relay features and adapt | 4-capability probe (auth, group-kind, ack-stability, signer-nip44). TTL cache. R0–R4 readiness levels. `src/domain/group-capability-probe.ts` | None — well-designed |
| **Automatic fallback** | OPERATIONAL | Degrade gracefully when relay lacks capability | Secure (NIP-EE) → baseline NIP-29 fallback when relay can't support encryption. | None |
| **PWA** | OPERATIONAL | Universal platform access, installable | Workbox service worker, manifest, protocol handler. `vite.config.js` | None |
| **Android native** | PARTIAL | Mobile deployment | Capacitor 7.2.0 + nostr-signer plugin. Builds exist. `capacitor.config.ts` | UX polish incomplete |
| **Secure local storage** | OPERATIONAL | Encrypted at-rest storage | AES-GCM-256 for local group state. Corruption detection, wipe capability. `src/engine/group-secure-storage.ts` | None |
| **Relay health monitoring** | PARTIAL | Latency, uptime, failure rate tracking | Capability probe exists. **No latency, uptime, or failure-rate tracking.** | No operational health metrics |
| **Offline-first operation** | PARTIAL | Queue messages offline, sync on reconnect | Service worker caching (cache-first static, network-first feeds). Offline toast. | No message queue, no offline compose, no sync-on-reconnect |
| **Mesh networking** | MISSING | Peer-to-peer relay for denied environments | No mesh, no WebRTC, no local relay, no peer discovery. | Entire mesh capability |
| **Local-first sync** | MISSING | CRDT or equivalent for conflict resolution | No CRDT, no local-first engine. Local relay URL referenced but not bundled. | No conflict resolution |

### INFRA Verdict

**Relay infrastructure is strong.** The capability probe system, automatic fallback, and multi-relay design are genuine strengths that most apps lack. PWA works, Android build exists, local storage is encrypted. But **offline-first is aspirational** — there's caching but no offline message queue or sync engine. Mesh networking is entirely absent, which is the hardest gap to close and the most important for denied-environment operation.

---

## The Top 10 Gaps (Ranked by Impact)

| # | Gap | Pillar | Why It Matters |
|---|-----|--------|---------------|
| 1 | **No operational dashboard** | INTEL | The app has no "home base" — no composite view combining map + feeds + groups + status. First-time operators see an announcements feed, not a command picture. |
| 2 | **PQC not wired into message path** | COMMS | Crypto engine exists and tests pass, but no live messages use PQC encryption yet. The hardest crypto work is done; the integration is not. |
| 3 | **No PQC key generation/publication** | AUTH | Operators cannot create PQC identities. Blocks all PQC communication. No kind-10051 support. |
| 4 | **Map is isolated from comms** | NAV | The map is a standalone page. An ops platform needs map + chat + feeds fused into operational views. |
| 5 | **Onboarding ignores group context** | COMMS | Invite links lose context during onboarding. `invite` prop accepted but unused. No `returnTo`. Post-onboarding dumps to `/notes`. |
| 6 | **No structured reporting** | INTEL | All content is unstructured kind:1 notes. No SITREP/SPOTREP forms. No schemas. |
| 7 | **Jargon-dense identity UX** | AUTH | Login and key screens assume Nostr literacy. "nsec", "NIP-07", "remote signer" are meaningless to most operators. |
| 8 | **No offline message queue** | INFRA | PWA caches assets but cannot queue outbound messages. Field operators in degraded connectivity cannot compose and send later. |
| 9 | **No map layer controls** | NAV | All markers appear identical. No filtering by type, time, confidence, or source. Unusable at scale. |
| 10 | **No chain-of-trust** | AUTH | No mechanism to verify operator identity beyond key ownership. No WoT scoring. No attestation. |

---

## Where NavCom Is on the Path

### What's Genuinely Strong

1. **Protocol choice (Nostr)**: Self-sovereign identity, multi-relay resilience, censorship-resistance — these are architectural gifts that cannot be retrofitted onto centralized platforms.

2. **Relay infrastructure**: The capability probe → readiness level → automatic fallback pipeline is more sophisticated than most Nostr clients. This is real operational infrastructure.

3. **Security tier model**: Three-tier policy with audit trail is thoughtful design. When PQC is wired through, this becomes a real classification system.

4. **GEOINT data pipeline**: GeoJSON embedding, geohash, confidence scoring, altitude, subtypes — the data model is more complete than the UI suggests. The posting side is ready for a much more capable map.

5. **PQC crypto engine**: ML-KEM-768 + AES-GCM-256 + HKDF via `@noble/post-quantum` and Web Crypto. 556 tests passing. The hardest security work is done.

6. **Encrypted local storage**: AES-GCM-256 at rest with corruption detection and secure wipe. Most apps don't bother.

### Why It's Falling Short

1. **It still thinks it's a social app.** The landing page is a feed. Post-onboarding goes to `/notes`. The map is a sidebar feature. Groups are behind a signer gate that's visually disabled. The information architecture says "social client" not "operational platform."

2. **The operator has no operational picture.** There is no single screen where an operator can see: active groups, latest intel, map status, relay health, and unread messages. Every pillar lives in its own silo — you navigate *between* capabilities rather than *compositing* them.

3. **PQC is 90% built but 0% deployed.** The crypto engine works. The tests pass. But no message in the wild uses it because the last 10% — key generation, key publication, and message-path integration — hasn't been wired. This is the most frustrating gap because the hard work is done.

4. **Onboarding was built for Nostr users, not operators.** The key ceremony (nsec generation, extension detection, bunker setup) is appropriate for someone who already knows what Nostr is. It is a brick wall for someone told "go to navcom.app and join our group."

5. **The map is display-only.** No layers, no clustering, no draw tools, no offline tiles. It shows where things are but doesn't let you plan, measure, annotate, or filter. It's a view, not a tool.

6. **Intelligence is collection without processing.** Feeds collect information. Nothing processes it. No templates structure it. No dashboards summarize it. No tools correlate it. The "INTEL" pillar is really just "FEEDS."

---

## The Path Forward

The existing codebase is not wrong — it is *incomplete*. The foundation is sound:

- The protocol (Nostr) is the right substrate
- The cryptography (ML-KEM-768 + AES-GCM-256) is the right protection
- The relay architecture (probe → readiness → fallback) is the right infrastructure
- The GEOINT data model (GeoJSON, geohash, confidence) is the right format
- The tier policy (0/1/2 with audit) is the right governance

What's missing is the **operational integration layer** — the UX and composite views that fuse these individual capabilities into a unified platform that an operator can pick up and *use without thinking about the technology underneath*.

The single highest-impact change is building the **operational dashboard** as the landing page: a composite view showing active group status, latest feed items, map thumbnail, relay health, and unread count. Everything else the app already does — it just doesn't show it in one place.

After that, the priority sequence is:
1. Wire PQC into the live message path (engine exists, needs plumbing)
2. Build PQC key generation/publication flow
3. Fix onboarding to preserve group invite context
4. Add map layer controls and clustering
5. Build structured reporting templates
6. Add offline message queue
7. Simplify identity UX language

NavCom has the bones of an Earth Alliance communications platform. What it needs is the skin, the nerve endings, and the operational muscle to make those bones move.
