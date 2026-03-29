# NavCom Future Risk Assessment

> Small things today that become big UX or architectural problems as capabilities expand.

---

## Critical (Will block expansion)

### 1. No List Virtualization

**Now**: Messages, channels, members render every DOM node. Acceptable at < 50 items.

**At scale**: 1,000 messages in a channel = 1,000 DOM nodes rendered simultaneously. Mobile devices with 512MB RAM will freeze. Sidebar with 50+ channels becomes a slideshow. Member lists for 500-person groups are unusable.

**When it bites**: Any group with > 100 active messages per day, or any deployment with > 20 channels.

**Fix complexity**: Medium. Requires integrating a virtual scroller (e.g., `svelte-virtual-list`) into Feed, channel list, and member list components. Touch every list view.

---

### 2. Fragmented State Management

**Now**: 20+ store files across `src/app/state.ts`, `src/app/groups/state.ts`, `src/engine/state*.ts`. Multiple overlapping caches (SWR, network-first, cache-first). No centralized schema.

**At scale**: Adding a new feature requires reading 5+ state files to understand where data lives. Duplicate state invites sync bugs. Subscription cleanup isn't enforced — each leaked subscription is a permanent memory tax. With 50+ stores and 5+ contributors, nobody can answer "where is this state?"

**When it bites**: Next 5 major features. Every new store increases the combinatorial complexity.

**Fix complexity**: High. Requires state audit, normalization, and possibly a state management pattern (zustand-like or event bus).

---

### 3. Private Keys in localStorage

**Now**: Keys are stored in localStorage via `synced()` with `localStorageProvider`. Optional password encryption exists but is not default.

**At scale**: Any XSS vulnerability (even via a dependency) can read localStorage. The 3 existing `@html` usages in note rendering are sanitized with `insane` + `marked`, but a zero-day in either library = key exfiltration for every user. Shared devices are a permanent risk. Service worker bugs on shared hosting could access localStorage.

**When it bites**: First malicious note posted to a popular group, or first shared-device deployment.

**Fix complexity**: High. Requires WebCrypto-backed keystore or moving to NIP-46 remote signing.

---

### 4. No Relay URL Validation

**Now**: Relay URLs from group metadata, NIP-05, or user profiles are connected to without explicit validation. The WebSocket layer accepts whatever URL is provided.

**At scale**: An attacker modifies group metadata to include a malicious relay → all group members connect to attacker-controlled relay → attacker can serve stale/falsified events or harvest connection metadata. With PQC-encrypted groups, the relay can't read content, but it can track who connects and when.

**When it bites**: First group with > 50 members in a contested environment.

**Fix complexity**: Low-Medium. Allowlist/denylist + URL format validation before connection.

---

## High (Will cause significant pain)

### 5. No Global Error Boundary

**Now**: `LazyRouteHost.svelte` catches route-load errors with retry. Beyond that, an unhandled exception in any deeply nested component crashes the entire app with no recovery.

**At scale**: As component trees deepen (especially with map overlays, rich message types, embedded media), the probability of an unhandled error per session approaches certainty. Users see a blank page with no explanation. On mobile PWA, they may not even know to pull-to-refresh.

**When it bites**: Adding any third-party component (map tiles, media players, rich embeds).

**Fix complexity**: Low. Svelte `<svelte:boundary>` or a wrapper component at the route level.

---

### 6. No i18n Infrastructure

**Now**: All UI strings are hardcoded in Svelte components. Date formatting uses `Intl.DateTimeFormat` (good). Currency has basic localization in `src/util/i18n`. Everything else is English-only.

**At scale**: Adding Spanish = touching 500+ components. RTL language support (Arabic, Hebrew) = layout rewrite. Community translation contributions = impossible without code changes. Market expansion beyond English speakers = blocked.

**When it bites**: First non-English deployment request, or first international team.

**Fix complexity**: High (retroactive). Every hardcoded string needs extraction to a key-value system. Should be done incrementally — new code uses i18n, old code gets migrated module by module.

---

### 7. Accessibility Debt

**Now**: ~15-20 `aria-*` attributes across the entire app. No focus management on route changes. No keyboard navigation handlers. Modal focus trapping unclear.

**At scale**: Screen reader users cannot use the app. Keyboard-only users get trapped. As the interface adds more modes (Comms/Map/Ops from the two-mode architecture), focus management becomes exponentially harder to retrofit. Enterprise and government customers may require WCAG 2.1 AA compliance.

**When it bites**: First accessibility audit, first enterprise customer, or first legally-mandated compliance check.

**Fix complexity**: Medium-High. Needs systematic component-by-component work. Easier to build into new components than retrofit old ones.

---

### 8. No Integration or E2E Tests

**Now**: Unit tests cover crypto and group state logic (vitest). Cypress directory exists but no visible E2E test implementations. UI layer coverage is likely < 20%.

**At scale**: Every refactor is a gamble. The two-mode architecture rewrite (restructuring Nav, Routes, layout) has zero automated safety net. Relay authentication flow changes can break silently. A regression in onboarding flow won't be caught until users report it.

**When it bites**: First major refactor (the two-mode architecture switch).

**Fix complexity**: Medium. Start with happy-path E2E tests for the 5 most critical flows (onboarding, group join, message send, mode switch, key management).

---

## Medium (Will accumulate into drag)

### 9. Route Load Hangs on Bad Networks

**Now**: Lazy route loading (`registerLazy()`) has no timeout. Multiple routes can load simultaneously without coordination or deduplication.

**At scale**: User on mobile data taps 5 links quickly → 5 concurrent chunk downloads → spinner forever on 3G. No timeout means the app appears frozen with no feedback. Multiple downloads of the same chunk can occur simultaneously.

**When it bites**: Mobile users on inconsistent networks (trains, rural areas, developing countries).

**Fix complexity**: Low. Add a 30-second timeout to dynamic imports. Deduplicate in-flight chunk requests.

---

### 10. Mega-Components

**Now**: `GroupCreateJoin.svelte` is estimated 1,000+ lines handling guided setup, relay auth, and security state in one file. Several components have 5-8+ props.

**At scale**: Adding features to a 1,000-line component requires understanding all 1,000 lines. Bug fixes in one section risk breaking another. New developers take weeks to become productive. When the component needs splitting, it's a multi-day refactor that touches every parent.

**When it bites**: Next 2-3 features added to group management.

**Fix complexity**: Medium per component, but compounds — each decomposition risks regression without E2E tests.

---

### 11. Hardcoded Design Tokens

**Now**: ~30 instances of raw `rgba(34, 211, 238, ...)` and `rgba(99, 230, 255, ...)` in CSS component classes. Tippy tooltips hardcoded to `#0f0f0e`.

**At scale**: White-labeling (changing accent from cyan to another color) requires find-and-replace across CSS, not just an env var change. Light mode will always have dark-mode glow artifacts. Any new component that copies the `.btn` pattern copies the hardcoded values too.

**When it bites**: First white-label customer, or when light mode usage increases.

**Fix complexity**: Low. Replace rgba() with `color-mix()` or CSS custom properties with opacity.

---

### 12. Offline = Toast Message Only

**Now**: Detects offline via `window.addEventListener("offline")`, shows a toast. No message queue, no draft persistence, no background sync. PWA workbox limited to 5MB cache.

**At scale**: User composes 5 messages offline → reconnects → none sent. Message drafts lost on network drop. 5MB cache can't hold conversation history for 5+ active groups. On mobile, app backgrounding kills relay subscriptions with no re-sync.

**When it bites**: Any field deployment where connectivity is intermittent (the exact use case NavCom is designed for).

**Fix complexity**: High. Requires outbox queue with IndexedDB persistence, background sync API, and subscription recovery logic.

---

### 13. Dead Font Weight

**Now**: 16 font files in `/public/fonts/`, only 6 are referenced in CSS. Figtree, Montserrat, Roboto, Lato-Light, and Lato-LightItalic are dead weight (10 files, estimated 500KB-1MB).

**At scale**: Doesn't get worse, but every byte matters for first-load on mobile. Users on 3G download fonts they'll never use. The `.montserrat` class applying Lato instead of Montserrat will confuse any future developer.

**When it bites**: First performance audit.

**Fix complexity**: Trivial. Delete unused files, fix the `.montserrat` class.

---

### 14. Z-Index Collision Path

**Now**: 8 named z-index layers (feature through toast). Clean and intentional.

**At scale**: The two-mode architecture adds a bottom tab bar (z-nav), a pull-up map drawer (z-sidebar?), and a status strip (z-nav?). Map overlays need their own stacking context. Popovers inside drawers inside modals create z-index inception. 8 layers isn't enough for 3 modes × multiple overlay types.

**When it bites**: First time a popover opens inside a drawer that's over the map which is behind the tab bar.

**Fix complexity**: Low. Plan stacking contexts per mode. Use `isolation: isolate` on mode containers.

---

### 15. CSS Architecture Drift

**Now**: Tailwind utility-first + custom component classes in `app.css` + scoped `<style>` in .svelte files. Three authoring patterns coexist.

**At scale**: New developer doesn't know if styling goes in Tailwind classes, `app.css` component classes, or `<style>` blocks. Duplicate styling appears. Specificity wars between `@layer components` and Tailwind utilities. The three patterns compound: a button might have Tailwind classes + `.btn` from app.css + a scoped `<style>` override.

**When it bites**: 10+ contributors, or any design system overhaul.

**Fix complexity**: Low-Medium. Document the convention (when to use each pattern). Lint for violations.

---

## Low (Worth noting)

### 16. FontAwesome Lock-in

**Now**: Entire icon system is FontAwesome Free v6.7.2. No custom NavCom icons.

**At scale**: Domain-specific concepts (channel types, encryption status, signal strength, operational modes) need custom icons. FontAwesome Free doesn't have military/tactical iconography. Mixing FontAwesome with custom SVGs creates visual inconsistency.

**Fix**: Plan a small custom icon set (10-15 icons) for NavCom-specific concepts. Use SVG sprites.

---

### 17. No Bundle Size Budget

**Now**: Vite chunks vendor code (leaflet, hls, qr-scanner separated). No explicit size budget or monitoring.

**At scale**: Each new dependency increases the critical path. Without a budget, someone adds a 200KB charting library for the Ops dashboard and nobody notices until users complain about load times.

**Fix**: Add `bundlesize` or similar to CI. Set a budget now (e.g., 250KB gzipped for initial load).

---

### 18. Source Maps in Production

**Now**: Enabled in `vite.config.js`.

**At scale**: Exposes full source code to anyone who opens DevTools. For a security-focused platform, this is an information disclosure.

**Fix**: Disable source maps in production build, or use hidden source maps uploaded to error tracking service only.

---

## Summary: What to Fix When

### Before the Two-Mode Architecture Rewrite
- [ ] Error boundary (risk: rewrite breaks something, user sees blank page)
- [ ] Route load timeout (risk: new modes add routes, mobile users hang)
- [ ] Delete dead fonts (trivial, no reason to wait)
- [ ] Fix safe area margin bug in app.css (`.mt-sai` uses padding, not margin)
- [ ] Fix `.montserrat` class (lies about which font it applies)

### During the Two-Mode Architecture Rewrite
- [ ] Plan z-index stacking contexts per mode
- [ ] Document CSS authoring convention (Tailwind vs app.css vs scoped)
- [ ] Add E2E tests for critical paths (onboarding, messaging, mode switch)
- [ ] Extract hardcoded rgba() to CSS custom properties

### Before Scaling to 100+ Users
- [ ] List virtualization for messages, channels, members
- [ ] Relay URL validation
- [ ] Offline message queue
- [ ] State management audit + normalization

### Before First Non-English Deployment
- [ ] i18n infrastructure (string extraction + key-value system)

### Before Enterprise/Government Deployment
- [ ] Accessibility audit + remediation
- [ ] Private key storage migration (WebCrypto or NIP-46)
- [ ] Disable production source maps
- [ ] Bundle size budget in CI
