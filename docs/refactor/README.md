# NavCom Refactor Roadmap

> Transforming Coracle from a Nostr social client into a sovereign communications platform.

This directory contains the complete implementation specifications for the NavCom refactor. Each document is a self-contained task spec with priority, effort, dependencies, implementation details, and verification checklists.

---

## Source Documents

These analysis documents produced the specifications below:

| Document | What it covers |
|----------|---------------|
| [navcom-vision.md](../navcom-vision.md) | 5-pillar strategic vision (COMMS, NAV, INTEL, AUTH, INFRA) |
| [navcom-gap-analysis.md](../navcom-gap-analysis.md) | Capability audit, top 10 gaps ranked by impact |
| [navcom-transmutation.md](../navcom-transmutation.md) | Coracle DNA audit, 40+ reference roster, 7-phase transmutation sequence |
| [navcom-interface-synthesis.md](../navcom-interface-synthesis.md) | Layout architectures, 9 component systems, 22-feature matrix |
| [navcom-ux-critique.md](../navcom-ux-critique.md) | 12 UX findings, "Two Modes, One App" fundamental fix |
| [navcom-two-modes.md](../navcom-two-modes.md) | Two-mode architecture spec, wireframes, ~1,200 lines estimated |
| [navcom-design-system.md](../navcom-design-system.md) | Color, typography, component audit, 12 problems found |
| [navcom-future-risks.md](../navcom-future-risks.md) | 18 risks (4 CRITICAL, 4 HIGH, 7 MEDIUM, 3 LOW) |

---

## Directory Structure

```
docs/refactor/
├── README.md                              ← You are here
├── nip-inventory.md                       # Nostr protocol map (all NIPs used/planned)
├── progress-tracker.md                    # Task completion tracking
├── 00-foundation/                         # Cleanup & safety before rewrite
│   ├── 01-design-system-fixes.md          # Fonts, colors, CSS bugs
│   ├── 02-error-boundary.md               # Global crash recovery
│   ├── 03-route-loading.md                # Timeout + dedup for lazy routes
│   └── 04-e2e-test-scaffold.md            # 5 critical-path Cypress tests
├── 01-two-mode-architecture/              # The core UI rewrite
│   ├── 01-mode-store-routing.md           # NavComMode store + routing
│   ├── 02-channel-sidebar.md              # Persistent channel list
│   ├── 03-comms-view.md                   # Signal-like default mode
│   ├── 04-map-view.md                     # Full-screen map + comms overlay
│   ├── 05-ops-dashboard.md                # Glanceable ops overview
│   ├── 06-status-bar.md                   # Connection + alert indicators
│   ├── 07-mode-tab-bar.md                 # Bottom tab navigation
│   └── 08-enrollment-flow.md              # 1-screen onboarding
├── 02-crypto-integration/                 # Wire PQC into live paths
│   ├── 01-message-path-wiring.md          # Encrypt/decrypt in send/receive
│   ├── 02-key-generation-ui.md            # Key management settings
│   └── 03-encryption-indicators.md        # Per-channel tier display
├── 03-structured-comms/                   # Message types & reports
│   ├── 01-message-type-system.md          # MESSAGE/CHECK-IN/ALERT/SITREP/SPOTREP
│   ├── 02-report-templates.md             # Simplified SITREP & SPOTREP forms
│   └── 03-marker-message-linking.md       # Bi-directional map ↔ comms linking
├── 04-map-enhancements/                   # Map features beyond basic markers
│   ├── 01-layer-controls.md               # Togglable layers + tile selection
│   ├── 02-clustering-temporal.md          # Marker clustering + time filter
│   └── 03-draw-tools.md                   # Point/line/polygon annotation
├── 05-scale-hardening/                    # Performance, security, accessibility
│   ├── 01-list-virtualization.md          # Virtual scrolling for long lists
│   ├── 02-state-management.md             # Store audit & normalization
│   ├── 03-offline-queue.md                # IndexedDB outbox + background sync
│   ├── 04-relay-validation.md             # URL validation + allowlist/denylist
│   ├── 05-key-storage.md                  # Migrate keys from localStorage
│   └── 06-accessibility.md                # WCAG 2.1 AA remediation
└── 06-future/                             # Longer-term capabilities
    ├── 01-i18n.md                         # Internationalization
    ├── 02-mesh-networking.md              # Peer-to-peer & LoRa mesh
    └── 03-chain-of-trust.md               # Operator verification & delegation
```

---

## Phase Timeline

### Phase 0 — Foundation (Do First)

Clean up the house before remodeling. These are low-risk, high-value fixes that reduce bugs and establish safety nets for the bigger work ahead.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [00-01](00-foundation/01-design-system-fixes.md) | Design system fixes | HIGH | LOW | — |
| [00-02](00-foundation/02-error-boundary.md) | Error boundary | HIGH | LOW | — |
| [00-03](00-foundation/03-route-loading.md) | Route loading resilience | MEDIUM | LOW | — |
| [00-04](00-foundation/04-e2e-test-scaffold.md) | E2E test scaffold | HIGH | MEDIUM | — |

**Estimated new code**: ~300 lines  
**Net code change**: Negative (deleting unused fonts removes ~500KB)

---

### Phase 1 — Two-Mode Architecture (Core Rewrite)

The fundamental NavCom identity shift. Replaces the Coracle social-feed layout with a purpose-built communications interface. This is the largest and most important phase.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [01-01](01-two-mode-architecture/01-mode-store-routing.md) | Mode store & routing | CRITICAL | MEDIUM | 00-* |
| [01-02](01-two-mode-architecture/02-channel-sidebar.md) | Channel sidebar | CRITICAL | MEDIUM | 01-01 |
| [01-03](01-two-mode-architecture/03-comms-view.md) | Comms view | CRITICAL | HIGH | 01-01, 01-02 |
| [01-04](01-two-mode-architecture/04-map-view.md) | Map view | HIGH | HIGH | 01-01 |
| [01-05](01-two-mode-architecture/05-ops-dashboard.md) | Ops dashboard | MEDIUM | MEDIUM | 01-01 |
| [01-06](01-two-mode-architecture/06-status-bar.md) | Status bar | MEDIUM | LOW | 01-01 |
| [01-07](01-two-mode-architecture/07-mode-tab-bar.md) | Mode tab bar | CRITICAL | LOW | 01-01 |
| [01-08](01-two-mode-architecture/08-enrollment-flow.md) | Enrollment flow | HIGH | MEDIUM | 01-01 |

**Estimated new code**: ~1,200 lines  
**Key deliverable**: NavCom looks and feels like a comms platform, not a social feed

---

### Phase 2 — Crypto Integration

Wire the PQC cryptography engine (built on `feat/real-pqc-crypto` branch, 556 tests passing) into the live message pipeline.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [02-01](02-crypto-integration/01-message-path-wiring.md) | Message path wiring | CRITICAL | HIGH | 01-03 |
| [02-02](02-crypto-integration/02-key-generation-ui.md) | Key generation UI | HIGH | MEDIUM | 02-01 |
| [02-03](02-crypto-integration/03-encryption-indicators.md) | Encryption indicators | MEDIUM | LOW | 02-01, 01-02 |

**Estimated new code**: ~400 lines  
**Key deliverable**: Real encryption on messages, visible to users

---

### Phase 3 — Structured Communications

Move beyond plain text messages to typed communications with map integration.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [03-01](03-structured-comms/01-message-type-system.md) | Message type system | HIGH | MEDIUM | 01-03 |
| [03-02](03-structured-comms/02-report-templates.md) | Report templates | MEDIUM | MEDIUM | 03-01 |
| [03-03](03-structured-comms/03-marker-message-linking.md) | Marker ↔ message linking | HIGH | MEDIUM | 03-01, 01-04 |

**Estimated new code**: ~600 lines  
**Key deliverable**: Check-Ins, Alerts, SITREPs appear as structured cards, linked to map markers

---

### Phase 4 — Map Enhancements

Transform the map from a basic view into an operational tool.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [04-01](04-map-enhancements/01-layer-controls.md) | Layer controls | MEDIUM | MEDIUM | 01-04 |
| [04-02](04-map-enhancements/02-clustering-temporal.md) | Clustering & temporal filter | MEDIUM | MEDIUM | 04-01 |
| [04-03](04-map-enhancements/03-draw-tools.md) | Draw tools | LOW | MEDIUM | 01-04 |

**Estimated new code**: ~500 lines  
**Key deliverable**: Toggleable layers, marker clustering, time filtering, annotation tools

---

### Phase 5 — Scale & Hardening

Performance, security, and accessibility work that ensures NavCom works under real-world conditions.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [05-01](05-scale-hardening/01-list-virtualization.md) | List virtualization | MEDIUM | MEDIUM | 01-03 |
| [05-02](05-scale-hardening/02-state-management.md) | State management audit | MEDIUM | HIGH | 01-* |
| [05-03](05-scale-hardening/03-offline-queue.md) | Offline message queue | MEDIUM | HIGH | 02-01 |
| [05-04](05-scale-hardening/04-relay-validation.md) | Relay validation | HIGH | LOW-MED | — |
| [05-05](05-scale-hardening/05-key-storage.md) | Key storage security | CRITICAL | HIGH | 02-02 |
| [05-06](05-scale-hardening/06-accessibility.md) | Accessibility (WCAG 2.1 AA) | HIGH | HIGH | 00-01, 01-* |

**Key deliverable**: NavCom works offline, handles 10K messages, keys are secure, app is accessible

---

### Phase 6 — Future Capabilities

Longer-term features that extend NavCom's capabilities significantly.

| # | Task | Priority | Effort | Depends On |
|---|------|----------|--------|------------|
| [06-01](06-future/01-i18n.md) | Internationalization | LOW→HIGH | HIGH | 01-* |
| [06-02](06-future/02-mesh-networking.md) | Mesh networking | ASPIRATIONAL | VERY HIGH | 05-03, 02-01 |
| [06-03](06-future/03-chain-of-trust.md) | Chain of trust | MEDIUM | HIGH | 05-05, 02-01 |

**Key deliverable**: Multi-language support, peer-to-peer comms, operator verification

---

## Dependency Graph

```
Phase 0 (Foundation)
  ├── 00-01 Design System ──────────────────────────── 05-06 Accessibility
  ├── 00-02 Error Boundary
  ├── 00-03 Route Loading
  └── 00-04 E2E Tests
        │
        ▼
Phase 1 (Two-Mode Architecture)
  ├── 01-01 Mode Store ─────┬── 01-02 Sidebar ──┬── 01-03 Comms ──┬── 02-01 Crypto Wiring
  │                         ├── 01-04 Map View   │                 ├── 03-01 Message Types
  │                         ├── 01-05 Ops Dash   │                 └── 05-01 Virtualization
  │                         ├── 01-06 Status Bar  │
  │                         ├── 01-07 Tab Bar     │
  │                         └── 01-08 Enrollment  │
  │                                               │
  ▼                                               ▼
Phase 2 (Crypto)                          Phase 3 (Structured Comms)
  ├── 02-01 Wiring ────┬── 02-02 Key UI   ├── 03-01 Types ──── 03-02 Reports
  │                    │   02-03 Indicators │                    03-03 Map Linking
  │                    │                    │
  │                    ▼                    ▼
  │              05-05 Key Storage    Phase 4 (Map)
  │              05-03 Offline Queue    ├── 04-01 Layers
  │              06-03 Chain of Trust   ├── 04-02 Clustering
  │              06-02 Mesh Network     └── 04-03 Draw Tools
  │
  ▼
Phase 5 (Hardening)           Phase 6 (Future)
  05-04 Relay Validation       06-01 i18n
  (standalone)                 06-02 Mesh
                               06-03 Trust
```

---

## Effort Summary

| Phase | Docs | Estimated New Lines | Effort Level |
|-------|------|-------------------- |-------------|
| 0 — Foundation | 4 | ~300 | LOW |
| 1 — Two-Mode Architecture | 8 | ~1,200 | HIGH |
| 2 — Crypto Integration | 3 | ~400 | HIGH |
| 3 — Structured Comms | 3 | ~600 | MEDIUM |
| 4 — Map Enhancements | 3 | ~500 | MEDIUM |
| 5 — Scale & Hardening | 6 | ~600+ | HIGH |
| 6 — Future | 3 | ~300+ (Phase A only) | VERY HIGH (total) |
| **Total** | **30** | **~3,900+** | |

---

## Priority Matrix

### Do Immediately (blocks everything)
- **05-04** Relay validation (standalone, low effort, high security value)
- **00-01** Design system fixes (quick wins, remove dead weight)
- **00-02** Error boundary (safety net before rewrite)
- **00-04** E2E test scaffold (regression safety)

### Do Next (core identity)
- **01-01** → **01-07** → **01-02** → **01-03**: Mode store → tab bar → sidebar → comms view
- **01-08**: Enrollment flow (first impression)
- **01-04**: Map view (second mode)

### Do After Core UI
- **02-01** → **02-02** → **02-03**: Crypto wiring → key UI → indicators
- **03-01** → **03-02** → **03-03**: Message types → reports → map linking
- **05-05**: Key storage (CRITICAL security)

### Do When Stable
- **05-01**: List virtualization
- **05-06**: Accessibility
- **05-02**: State management audit
- **05-03**: Offline queue

### Longer Term
- **04-01** → **04-02** → **04-03**: Map layers → clustering → draw tools
- **06-01**: i18n (when non-English operators appear)
- **06-03**: Chain of trust (when organizational trust matters)
- **06-02**: Mesh networking (aspirational north star)

---

## Design Principles (carried through all specs)

1. **Two modes, one app** — Comms mode is the default, Map mode is spatial, Ops mode is overview
2. **Progressive disclosure** — simple defaults, complexity accessible on demand
3. **Per-channel, not per-message** — encryption, typing indicators, and status shown at channel level
4. **Operator-first** — white-label configuration via env vars, not hardcoded values
5. **Mobile-first** — every feature must work on a phone in the field
6. **Signal-like simplicity** — if a field operator can't use it under stress, it's too complex
7. **Nostr-native** — use standard NIPs where possible, custom kinds where necessary (see [NIP Inventory](nip-inventory.md))
