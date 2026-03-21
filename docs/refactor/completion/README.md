# NavCom Completion Roadmap

> From 214/337 checkboxes to full completion.
> All 144 implementation tasks are done. What remains: 6 code fixes, 4 documentation items, and 113 verification acts.

---

## Current State

| Metric | Value |
|--------|-------|
| Tests passing | 825 (132 files) |
| Checkboxes complete | 212/337 (63%) |
| Task items (implementation) | 144/144 ✅ |
| Verification items remaining | 123 |
| Code changes needed | ~6 items, ~500 lines |
| Documentation needed | ~4 items, ~300 lines |
| Manual testing needed | ~95 items |
| Already done (just needs tick) | ~9 items |

---

## Workstream Index

| # | Workstream | Pillar | Priority | Effort | Unblocks |
|---|-----------|--------|----------|--------|----------|
| [01](01-map-integration/plan.md) | Map Integration | 4 — Spatial Awareness | CRITICAL | ~280 lines | 10 verify items |
| [02](02-pqc-group-wiring/plan.md) | PQC Group Wiring | 3 — Quantum Resistance | CRITICAL | ~120 lines | 16 verify items |
| [03](03-security-hardening/plan.md) | Security Hardening | 5 — Resilience | HIGH | ~120 lines | Production gate |
| [04](04-infrastructure/plan.md) | Infrastructure & Docs | Supporting | MEDIUM | ~300 lines | 6 verify items |
| [05](05-verification/plan.md) | Verification Plan | All | FINAL | 0 code lines | 95 verify items |

---

## Five Pillars ↔ Workstream Mapping

NavCom exists because:

1. **Commercial platforms can be shut off** → Nostr relay decentralization *(complete)*
2. **Sovereign identity** → Self-sovereign keypairs *(complete)*
3. **Adversaries will have quantum computers** → PQC encryption → **WS-02**
4. **The map is the territory** → Spatial + comms fusion → **WS-01**
5. **Resilience is architecture** → Offline-first, mesh, P2P → **WS-03**

---

## Dependency Graph

```
WS-01 (Map)  ──────────────────┐
                                ├── WS-05 Sessions 7-8 (Map/Ops visual)
WS-02 (PQC)  ──────────────────┤
                                ├── WS-05 Session 11 (Encryption visual)
WS-03 (Security) ──────────────┤
                                ├── WS-05 Session 13 (Offline/Relay visual)
                                ├── WS-05 Session 15 (Mesh visual)
WS-04 (Infra) ─────────────────┤
                                ├── WS-05 Session 14 (A11y/i18n visual)
                                │
WS-05 Phase 1 (immediate ticks) ← No dependencies
WS-05 Phase 2 (run tests)       ← No dependencies
WS-05 Sessions 1-6              ← No dependencies (existing code)
```

---

## Recommended Execution Sequence

### Sprint 1: Quick Wins (no code changes)

1. **WS-05 Phase 1**: Tick 9 already-done items (~10 min)
2. **WS-05 Phase 2**: Run existing tests, tick 5 items (~5 min)
3. **WS-05 Sessions 1-6**: Visual testing of existing features (24 items)

**Outcome**: 212 → 250/337 (74%)

### Sprint 2: Critical Code (mission-aligned)

4. **WS-01**: Map integration (~280 lines)
5. **WS-02**: PQC group wiring (~120 lines)
6. **WS-03**: Security hardening (~120 lines)

**Outcome**: 250/337 + code ready for remaining verification

### Sprint 3: Infrastructure

7. **WS-04**: axe-core, conventions, tracker fixes (~300 lines)

**Outcome**: Infrastructure complete, all code done

### Sprint 4: Final Verification

8. **WS-05 Sessions 7-15**: Remaining visual testing (71 items)

**Outcome**: 337/337 (100%)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Leaflet integration breaks mobile layout | WS-01 blocks 10 items | Test mobile viewport before merging |
| PQC epoch key resolution hits IndexedDB corruption | WS-02 blocks all encrypted groups | Use DM envelope as proven reference |
| SSRF fix breaks legitimate local relay users | WS-03 breaks 3 mesh items | Whitelist approach with clear documentation |
| Cypress E2E tests fail in headless mode | 3 items blocked | Run early, debug browser driver issues |
| Mesh testing requires running local Nostr relay | 3 items may defer | Document as integration test requirement |

---

## Files in This Directory

```
docs/refactor/completion/
├── README.md                          ← You are here
├── 01-map-integration/
│   └── plan.md                        ← Leaflet embed in MapView + OpsView
├── 02-pqc-group-wiring/
│   └── plan.md                        ← ML-KEM-768 in group transport
├── 03-security-hardening/
│   └── plan.md                        ← SSRF, input validation, data safety
├── 04-infrastructure/
│   └── plan.md                        ← axe-core, conventions, tracker fixes
└── 05-verification/
    └── plan.md                        ← 95-item manual testing protocol
```

---

## Progress Tracker Reference

Master tracker: [`docs/refactor/progress-tracker.md`](../progress-tracker.md)

Each workstream plan references specific line numbers in the tracker. After completing work, update the tracker by checking the corresponding boxes with a verification annotation:

```markdown
- [x] Item text _(Verified: YYYY-MM-DD, WS-NN)_
```
