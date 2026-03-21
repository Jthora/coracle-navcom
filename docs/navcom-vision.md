# NavCom Vision: Earth Alliance Navigation & Communications

> _"NavCom" is not a brand name. It is a job description._

---

## What NavCom Is

NavCom — **Navigation & Communications** — is the nervous system of any organized force. Every military, every fleet, every coordinated alliance throughout history has needed two non-negotiable capabilities: the ability to **know where things are** and the ability to **talk to each other securely**. These two functions are so fundamental that they are always fused into a single system. That system is NavCom.

An **Earth Alliance NavCom** is the sovereign, censorship-resistant operational communications platform for a decentralized force that cannot rely on — and cannot trust — commercial infrastructure controlled by third parties. It exists because:

1. **Commercial platforms can be shut off.** Discord, Telegram, Signal — all require central servers operated by entities that respond to legal or political pressure.
2. **Sovereign identity is non-negotiable.** An alliance cannot build its chain of trust on identities that a corporation controls. Nostr's keypair-based identity is self-sovereign by design.
3. **Adversaries will have quantum computers.** Communications intercepted today can be decrypted tomorrow. Post-quantum cryptography is not a feature — it is a survival requirement.
4. **The map is the territory.** Operational awareness requires spatial context. Communications without location are incomplete. Location without communications is useless.
5. **Resilience is architecture, not a feature.** If the system has a single point of failure, the system has already failed.

---

## The Five Pillars

NavCom is organized around five functional pillars. Every feature, every screen, every line of code serves one or more of these:

### 1. COMMS — Secure Communications

The ability to exchange messages — one-to-one, one-to-many, and many-to-many — with cryptographic confidentiality, integrity, and authenticity appropriate to the sensitivity of the content.

**Requirements:**
- Tiered encryption: open (Tier 0), operational (Tier 1 — encrypted, downgrade requires confirmation), mission-critical (Tier 2 — encrypted, downgrade blocked)
- Post-quantum forward secrecy (ML-KEM-768 + AES-GCM-256)
- Epoch-based key rotation with revocation on compromise
- Group chat with role-based access (owner → admin → moderator → member)
- Direct messages with hybrid classical/PQC encryption
- Broadcast announcements (one-to-all, read without authentication)

### 2. NAV — Navigation & Geospatial Intelligence

The ability to know where things are, where they were, and where they are going — rendered on a shared operational map.

**Requirements:**
- Interactive map with real-time GEOINT markers
- Structured geo-tagged reporting (lat/lon, altitude, confidence, geohash, subtypes)
- GeoJSON-native data format
- Layer controls (filter by type, time, confidence, source)
- Marker clustering at scale
- Draw/measure tools for planning
- Offline tile caching for field use
- Spatial indexing for performant queries

### 3. INTEL — Intelligence Processing

The ability to collect, filter, correlate, and act on information from multiple sources — structured and unstructured.

**Requirements:**
- Typed feeds: Ops, Intel, General, Custom
- Structured reporting templates (SITREP, SPOTREP, INTREP schemas)
- Cross-reference and correlation tools
- Operational dashboard combining feeds + map + group status
- Search across all content types
- Tagging and classification system
- Analysis and trend visualization

### 4. AUTH — Identity & Access Control

The ability to establish who someone is, what they are authorized to do, and whether they can be trusted — without depending on any central authority.

**Requirements:**
- Self-sovereign keypair identity (Nostr)
- Multiple signer methods (browser extension, mobile app, remote bunker, hardware)
- Role hierarchy (owner → admin → moderator → member → observer)
- PQC key generation, storage, and publication (kind-10051)
- Chain-of-trust / web-of-trust attestation
- Key lifecycle management (creation → rotation → revocation → expiry)
- Secure key backup and recovery

### 5. INFRA — Resilient Infrastructure

The ability to continue operating when individual components fail, when networks are degraded, and when adversaries attempt to disrupt service.

**Requirements:**
- Multi-relay architecture with no single point of failure
- Relay capability probing and automatic fallback
- Relay health monitoring (latency, uptime, failure rate)
- Offline-first operation with sync-on-reconnect
- PWA for universal platform access
- Native mobile deployment (Capacitor/Android)
- Mesh networking / peer-to-peer relay for denied environments
- Local-first data persistence with conflict resolution
- Secure local storage (encrypted at rest)

---

## The Core Reframe

The existing app — forked from Coracle — is architected as a **Nostr social client that happens to have groups**. The NavCom vision requires it to become an **operational communications platform that happens to use Nostr**.

This is not a cosmetic distinction. It changes:

| Aspect | Current (Social Client) | Vision (Ops Platform) |
|--------|------------------------|----------------------|
| **Landing page** | Announcements feed | Operational dashboard |
| **Primary action** | Post a note | Send a secure message / file a report |
| **Map** | Interesting feature | Core operational tool |
| **Groups** | Social feature | Operational units |
| **Identity** | Nostr enthusiast concept | Security credential |
| **Encryption** | Privacy feature | Operational requirement |
| **Feeds** | Social timeline | Intelligence channels |
| **Onboarding** | Key ceremony for Nostr users | Rapid enrollment for operators |
| **Mental model** | "I'm using a social app" | "I'm in comms" |

---

## The Landing Experience

When an operator is told _"go to navcom.app and join our group"_, they should experience:

1. **Immediate context**: "This is a secure communications platform. Here is what's happening." (Not: "Here is a feed of announcements.")
2. **Obvious path to groups**: One click to see groups, paste an invite, or browse.
3. **Minimal enrollment**: Choose a name, get a key, skip everything else until later.
4. **Arrive in the group**: See the conversation. See who's there. Understand the mission tier.
5. **Context persists**: If they had an invite link, they end up in that group — not dumped to `/notes`.

---

## Why This Matters

A real Earth Alliance NavCom is not a chat app with a map bolted on. It is the foundational infrastructure through which a decentralized, sovereign alliance:

- **Coordinates** — by seeing a shared operational picture
- **Communicates** — through channels with appropriate security for the content
- **Authenticates** — by establishing identity and trust without central authority
- **Persists** — by operating through network degradation, censorship, and adversarial interference
- **Evolves** — by processing intelligence into understanding and understanding into action

The protocol (Nostr) provides the substrate. The cryptography (ML-KEM-768 + AES-GCM-256) provides the confidentiality. The architecture (multi-relay, offline-first, PWA + native) provides the resilience. But it is the **user experience** — the operational dashboard, the one-click group join, the structured reporting, the fused map-and-comms view — that turns infrastructure into capability.

NavCom is not finished when the crypto works. NavCom is finished when an operator can open it and _operate_.
