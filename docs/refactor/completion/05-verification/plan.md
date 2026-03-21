# WS-05: Verification Plan

> Systematic approach to verifying all 123 remaining unchecked items.

## Status: NOT STARTED

**Priority**: FINAL PHASE — all code/doc work must complete first
**Dependencies**: WS-01 through WS-04 must be done before visual testing is meaningful

---

## Overview

123 unchecked items break into 5 categories:

| Category | Count | Action Required |
|----------|-------|-----------------|
| **A — Run existing tests** | 5 | Execute vitest/Cypress commands |
| **B — Write new code/tests** | 6 | Covered by WS-01 through WS-04 |
| **C — Visual/manual browser testing** | 95 | Run app, test systematically |
| **D — Documentation** | 1 | Covered by WS-04 |
| **E — Already done, tick the box** | 9 | Verify artifacts exist, check box |
| **Relay validation (A∩E overlap)** | 5 | Run tests, then tick |
| **PQC regression (A∩E overlap)** | 2 | Run tests, then tick |

---

## Phase 1: Immediate Ticks (Category E) — 9 items

These items have existing evidence. Verify artifact exists, then check.

### State Management Audit (4 items)

**Verification**: Read `docs/refactor/05-scale-hardening/state-management-audit.md`

| Line | Item | Evidence |
|------|------|----------|
| 590 | Every store cataloged with owner domain | 93 stores inventoried with domain column |
| 591 | No two stores hold same data | Audit found "no true duplicates; all derived chains" |
| 592 | Every `subscribe()` has a cleanup path | All derived auto-clean; globals are singletons |
| 593 | Convention document in docs/refactor/ | File exists at path above |

### Relay Validation (5 items)

**Verification**: Run `npx vitest run tests/unit/engine/relay-validate-url.spec.ts`

| Line | Item | Test File |
|------|------|-----------|
| 630 | Malformed URL → rejected | relay-validate-url.spec.ts |
| 631 | `ws://` URL → rejected in production | relay-validate-url.spec.ts |
| 632 | `wss://localhost:8080` → rejected | relay-validate-url.spec.ts |
| 636 | Valid relay URL → connection proceeds | relay-validate-url.spec.ts |
| 637 | Unit tests for isValidRelayUrl | relay-validate-url.spec.ts + relay-pool-gate.spec.ts |

**Action**: Run tests, confirm pass, tick all 5.

---

## Phase 2: Run Existing Tests (Category A) — 5 items

### Cypress E2E (3 items)

**Prerequisite**: App must be running (`pnpm dev`)
**Command**: `npx cypress run --headless`

| Line | Item | Pass Criteria |
|------|------|--------------|
| 188 | `npx cypress run` passes all 5 tests | Exit code 0 |
| 189 | Tests run in < 60 seconds total | Check timing output |
| 190 | Tests work in headless mode (CI-compatible) | `--headless` flag succeeds |

### PQC Regression (2 items)

**Command**: `npx vitest run tests/unit/engine/pqc/`

| Line | Item | Pass Criteria |
|------|------|--------------|
| 382 | All 556 existing PQC tests still pass | 556 tests, 0 failures |
| 406 | Existing PQC unit tests still pass | Same test run |

---

## Phase 3: Visual/Manual Testing (Category C) — 95 items

**Prerequisites**:
- App running locally (`pnpm dev`)
- At least 2 browser windows (desktop + mobile viewport)
- At least one test group with messages
- Relay connectivity (for online/offline testing)

### Testing Sessions

Organized for efficient sequential testing — group related items to minimize context switching.

---

### Session 1: Design System & Theme (3 items)

**Setup**: Open app, toggle dark/light mode, change accent color

| Line | Item | How to Verify |
|------|------|---------------|
| 134 | Dark mode renders identically (visual regression) | Compare key screens in both modes |
| 135 | Light mode button glows respond to accent color change | Change accent → verify glow color |
| 136 | Tooltips use theme-appropriate colors in both modes | Hover tooltip targets in both modes |

---

### Session 2: Error Boundary (5 items)

**Setup**: Inject error in a component (temporarily add `throw new Error("test")` to a nested component)

| Line | Item | How to Verify |
|------|------|---------------|
| 149 | Throw error → boundary catches, shows recovery UI | See error boundary card instead of crash |
| 150 | Nav/sidebar remain functional during error state | Click sidebar items, tabs — they work |
| 151 | "Try Again" re-renders the failed component | Click "Try Again" (after removing throw) |
| 152 | "Reload App" does a full page reload | Click "Reload App" → full reload |
| 153 | No unhandled promise rejections leak past boundary | Open DevTools console — no red errors |

---

### Session 3: Route Loading Safety (5 items)

**Setup**: DevTools Network → Slow 3G throttling

| Line | Item | How to Verify |
|------|------|---------------|
| 166 | Slow 3G → "slow" message at 5 seconds | Navigate to lazy route, wait 5s |
| 167 | 30-second timeout → error state | Block network entirely, wait 30s |
| 168 | Click same link 5× rapidly → only 1 request | Spam-click nav item, watch Network tab |
| 169 | After timeout → retry button works | Re-enable network, click retry |
| 170 | Normal network → pages still lazy-load correctly | Remove throttle, navigate normally |

---

### Session 4: Mode Switching & Navigation (10 items)

**Setup**: Fresh app load, test on both desktop and mobile viewport

| Line | Item | How to Verify |
|------|------|---------------|
| 211 | `navcomMode` defaults to "comms" on fresh install | Clear localStorage, reload |
| 212 | Switching modes persists across page refresh | Switch to map, refresh, verify map |
| 213 | Existing routes (settings, profiles) still work | Navigate to /settings, /profile |
| 214 | No unmount/remount between mode switches | Check component state preserved |
| 329 | Three tabs visible on mobile and desktop | Visual check |
| 330 | Active tab highlighted with accent color | Tap each tab, check highlight |
| 331 | Tapping tab switches mode instantly | Tap → instant switch |
| 332 | Tab bar fixed at bottom during scroll | Scroll content, check tab bar position |
| 333 | Tab bar respects safe area (notch devices) | Mobile simulator with notch |
| 334 | Settings accessible from UI element | Find and tap settings entry point |

---

### Session 5: Channel Sidebar (7 items)

**Setup**: Multiple groups joined, some with unread messages

| Line | Item | How to Verify |
|------|------|---------------|
| 229 | Desktop: sidebar persistent across mode switches | Switch comms→map→ops, check sidebar |
| 230 | Mobile/Comms: channel list is full-screen | Mobile viewport, comms mode |
| 231 | Mobile/Map & Ops: sidebar not visible | Mobile viewport, map/ops mode |
| 232 | Unread counts update in real time | Send message from another client |
| 233 | Encryption icons match group policy | Compare icon to group tier setting |
| 234 | Tapping channel opens correct conversation | Tap each channel, verify content |
| 235 | "Join/Create" button opens group flow | Tap button, verify flow opens |

---

### Session 6: Comms View (7 items)

**Setup**: Channel selected, compose bar visible

| Line | Item | How to Verify |
|------|------|---------------|
| 249 | Mobile: list → tap → conversation → back | Full mobile flow |
| 250 | Desktop: sidebar + conversation side-by-side | Desktop viewport |
| 251 | Empty state when no channel selected (desktop) | Deselect channel |
| 252 | Quick actions (Check-In, Alert) work | Tap quick action buttons |
| 253 | Encryption indicator shows correct tier | Check indicator vs group settings |
| 254 | Switch to Map/Ops and back preserves channel | Verify selection persists |
| 255 | Compose draft preserved across mode switches | Type text, switch mode, switch back |

---

### Session 7: Map View (8 items)

**Prerequisite**: WS-01 (map integration) must be complete

| Line | Item | How to Verify |
|------|------|---------------|
| 270 | Mobile: map full-screen, drawer in peek state | Mobile viewport |
| 271 | Drag drawer to half → messages + map visible | Touch drag |
| 272 | Drag drawer to full → full conversation + compose | Touch drag further |
| 273 | Desktop: three-column layout | Desktop viewport |
| 274 | Selecting channel updates comms pane | Click channel in sidebar |
| 275 | Map retains viewport across mode switches | Pan/zoom, switch mode, switch back |
| 276 | GEOINT markers render on map | Verify marker pins appear |
| 277 | Tools button opens layer controls | Click tools button |

---

### Session 8: Ops Dashboard (8 items)

**Prerequisite**: WS-01 (OpsView thumbnail) must be complete

| Line | Item | How to Verify |
|------|------|---------------|
| 291 | Mobile: three cards stack vertically | Mobile viewport |
| 292 | Desktop: three-column + sidebar | Desktop viewport |
| 293 | Map thumbnail shows GEOINT markers | Visual check of thumbnail |
| 294 | Tap map thumbnail → switches to Map mode | Tap → verify mode switch |
| 295 | Channel cards show unread counts + tiers | Visual check |
| 296 | Tap channel card → Comms mode + channel active | Tap → verify |
| 297 | Activity feed shows recent events | Visual check |
| 298 | Tap activity item opens source message | Tap → verify navigation |

---

### Session 9: Status Bar (6 items)

| Line | Item | How to Verify |
|------|------|---------------|
| 311 | Green dot + "Connected" when healthy | Normal app state |
| 312 | Red dot + "Reconnecting..." when disconnected | Disable network |
| 313 | Alert badge appears only when > 0 | Send alert from another client |
| 314 | Visually unobtrusive | Visual check |
| 315 | Renders correctly in all three modes | Switch between modes |
| 316 | Respects safe area on mobile | Mobile simulator with notch |

---

### Session 10: Enrollment Flow (7 items)

**Setup**: Use private/incognito window for fresh state

| Line | Item | How to Verify |
|------|------|---------------|
| 350 | Invite link → one screen → in group (< 5s) | Generate invite, open in incognito |
| 351 | Direct visit → one screen → empty channel list | Visit app root in incognito |
| 352 | Keys generated silently | Check that no nsec displayed during flow |
| 353 | Relays auto-configured | Check settings after onboard |
| 354 | Key backup prompt at 24h | Check localStorage timer logic |
| 355 | Existing Nostr identity login works | Login with existing nsec |
| 356 | `returnTo` preserved through invite flow | Navigate: invite → onboard → landing |

---

### Session 11: Message Path & Encryption (16 items)

**Prerequisite**: WS-02 (PQC group wiring) must be complete

#### Message Path (5 items)
| Line | Item | How to Verify |
|------|------|---------------|
| 377 | T1 group → encrypted on wire | Send, check raw event in relay |
| 378 | T1 group → decrypts and displays | Verify readable in conversation |
| 379 | T2 without key → blocked with error | Attempt send without key |
| 380 | T0 group → plaintext | Verify raw event readable |
| 381 | Old-epoch message → decrypts if key available | Switch epoch, read old message |

#### Key Generation UI (5 items)
| Line | Item | How to Verify |
|------|------|---------------|
| 400 | Generate key → appears in settings | Generate, check settings |
| 401 | Key published to relays | Query relay for kind 10051 |
| 402 | Other users' PQC keys discoverable | Search for PQC-enabled user |
| 403 | DM to PQC user uses PQC encryption | Send DM, check raw event |
| 404 | DM to non-PQC user falls back | Send DM to non-PQC user |
| 405 | Key rotation retains old for decryption | Rotate, read old messages |

#### Encryption Indicators (6 items)
| Line | Item | How to Verify |
|------|------|---------------|
| 420 | T0: no encryption indicator | Check T0 channel |
| 421 | T1: lock with "Encrypted" | Check T1 channel |
| 422 | T2: enforced lock with "End-to-End Enforced" | Check T2 channel |
| 423 | First visit shows education tooltip | Visit encrypted channel first time |
| 424 | Tooltip dismisses and doesn't reappear | Dismiss, navigate away and back |
| 425 | Individual messages have no badges | Check message bubbles |

---

### Session 12: Message Types (8 items)

| Line | Item | How to Verify |
|------|------|---------------|
| 442 | New user: no type selector | Fresh account |
| 443 | After 10 messages: selector icon appears | Send 10 messages |
| 444 | Check-In sends with `msg-type: check-in` tag | Send, inspect raw event |
| 445 | Check-In auto-attaches geolocation | Allow location permission |
| 446 | Alert renders with priority border | Send alert |
| 447 | Regular messages unchanged | Send regular message |
| 448 | Structured message cards visually distinct | Compare regular vs structured |
| 449 | Message types work encrypted + unencrypted | Test in both T0 and T1 groups |

---

### Session 13: Offline Queue & Relay (9 items)

**Prerequisite**: WS-03 (queue-drain fix) should be complete

| Line | Item | How to Verify |
|------|------|---------------|
| 610 | Offline → send → ⏳ shown | Disable network, send |
| 611 | Online → auto-publishes → ⏳ removed | Re-enable network |
| 612 | Kill app offline → reopen → queued messages persist | Close tab, reopen |
| 613 | Relay rejects → retry → mark failed after 5 | Requires mock relay |
| 614 | Draft text persists across close/reopen | Type, close, reopen |
| 615 | Queue drain FIFO order | Send multiple, verify order |
| 633 | Denylist URL → rejected | Add to denylist, try connect |
| 634 | Not on allowlist → rejected | Set allowlist, connect unlisted |
| 635 | Max connections → refused with warning | Saturate pool, try one more |

---

### Session 14: i18n & Accessibility (5 items)

**Prerequisite**: WS-04 (axe-core) should be complete

| Line | Item | How to Verify |
|------|------|---------------|
| 685 | axe-core zero critical violations | Run axe-core test |
| 705 | Switching locale updates all strings | Change locale in settings |
| 707 | Missing key shows key path (not blank) | Remove a key, check display |
| 709 | PR checklist includes i18n | Check CONTRIBUTING.md |
| 191 | At least one Cypress test covers 375×812 | Audit test files |

---

### Session 15: Mesh Networking (3 items)

**Prerequisite**: WS-03 (SSRF fix) must be complete

| Line | Item | How to Verify |
|------|------|---------------|
| 725 | Messages via local relay appear in conversation | Run local relay, send |
| 726 | Internet down → local relay works | Disable internet, keep LAN |
| 727 | Internet returns → messages sync | Re-enable internet |

**Note**: These 3 items require a real local Nostr relay running. May need to defer to integration testing phase with `nostr-rs-relay` or similar.

---

## Verification Tracking Template

After each testing session, update `docs/refactor/progress-tracker.md`:

```markdown
- [x] Item text _(Verified: YYYY-MM-DD, Session N)_
```

---

## Recommended Execution Order

```
Phase 1: Immediate ticks        (9 items, ~10 min)
Phase 2: Run existing tests     (5 items, ~5 min)
--- WS-01 through WS-04 code work happens here ---
Phase 3: Visual testing sessions
  Session 1-3:  Design/Error/Route    (13 items, ~45 min)
  Session 4-6:  Navigation/Comms      (24 items, ~60 min)
  Session 7-8:  Map/Ops (needs WS-01) (16 items, ~45 min)
  Session 9-10: StatusBar/Enrollment  (13 items, ~45 min)
  Session 11:   Message path (WS-02)  (16 items, ~60 min)
  Session 12:   Message types         (8 items, ~30 min)
  Session 13:   Offline/Relay (WS-03) (9 items, ~45 min)
  Session 14:   i18n/A11y (WS-04)     (5 items, ~20 min)
  Session 15:   Mesh (needs relay)    (3 items, ~30 min)
```

---

## Files Modified

| File | Action |
|------|--------|
| `docs/refactor/progress-tracker.md` | Check boxes as items verified |

**No code changes in this workstream** — verification only (code changes live in WS-01 through WS-04).
