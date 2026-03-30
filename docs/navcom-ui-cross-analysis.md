# NavCom UI Cross-Analysis & Integration Audit

## Executive Summary

A comprehensive analysis of the NavCom app's UI shell, navigation stack, and first-run experience reveals **12 distinct issues** ranging from critical layout collisions to dead code and confusing new-user flows. The root cause for most issues is that the **ModeTabBar system was layered on top of the original Nav/Menu architecture** without fully retiring the legacy bottom nav, and the z-index hierarchy has been bypassed by hardcoded overrides.

---

## 1. CRITICAL: Mobile Double Bottom Bar Collision

**Files:** `src/app/Nav.svelte`, `src/app/views/ModeTabBar.svelte`, `src/app/App.svelte`

On mobile (`innerWidth < 1024`), **two fixed bottom bars render simultaneously**:

| Component | Position | Z-Index | Height |
|-----------|----------|---------|--------|
| Nav bottom bar | `fixed bottom-0 left-0 right-0` | `z-nav` (2) | ~44px |
| ModeTabBar | `fixed bottom-0 left-0 right-0` | `z-nav` (2) | `h-14` (56px) |

Both have identical positioning and z-index. Since ModeTabBar appears later in App.svelte's DOM, it renders **on top of the Nav bottom bar**, completely hiding it. The Nav bottom bar's search button, Post button, and hamburger menu are **invisible and unreachable** on mobile.

**Impact:** Nav bottom bar is dead UI on mobile. Either it should be removed/hidden on mobile, or ModeTabBar should incorporate Nav's functions (search, post, menu).

**Fix:** Add `{#if innerWidth >= 1024}` guard around the bottom nav section of Nav.svelte — OR — merge search/post/menu into ModeTabBar on mobile. The ModeTabBar already has a Settings gear (`lg:hidden`), suggesting it was intended to replace the bottom nav.

---

## 2. CRITICAL: Z-Index Hierarchy Broken by MainStatusBar

**File:** `src/app/MainStatusBar.svelte`

The Tailwind z-index hierarchy is defined in `tailwind.config.cjs`:
```
feature: 1 → nav: 2 → chat: 3 → popover: 4 → modal: 5 → sidebar: 6 → overlay: 7 → toast: 8
```

MainStatusBar uses **`z-[500]`**, which completely bypasses the system. This means:
- It renders above **everything** — modals, toasts, overlays
- It cannot be dismissed or overlaid by any component using the defined hierarchy
- On desktop, it sits at `fixed bottom-sai left-72` — positioned above ModeTabBar which is at `fixed bottom-0`

**Impact:** The status bar can block toast notifications, modal interactions, and popover menus on desktop.

**Fix:** Change `z-[500]` to `z-feature` (1) since it's an informational display that should never block interactions. The ModeTabBar and MainStatusBar should coordinate vertical space: ModeTabBar needs `bottom-[calc(var(--saib)+2rem)]` on desktop, or MainStatusBar should sit inside the ModeTabBar area.

---

## 3. CRITICAL: New User Sees Empty CommsView, Not Announcements

**Files:** `src/app/App.svelte`, `src/app/Routes.svelte`

Route "/" is registered to `Announcements.svelte`, but `Routes.svelte` marks "/" as a "mode page":
```js
const modePaths = new Set(["/"])
```

When `isModePage` is true, Routes ignores the registered component and renders based on `$navcomMode`:
- Default mode = `"comms"` → **CommsView.svelte**
- CommsView shows channel sidebar → empty for new user ("No channels")

**A brand new unauthenticated user landing at "/" sees:**
1. An empty channel list ("No channels. Create or join one")
2. Signal/Alert quick-action buttons (useless without groups)
3. ModeTabBar at the bottom
4. The hidden Nav bottom bar underneath

They do NOT see the Announcements feed, which is the intended welcoming content. Announcements is only reachable via `/announcements` or through the mobile menu.

**Impact:** First impression is a blank, confusing screen. The Announcements route registration at "/" is effectively dead code.

**Fix options:**
- A) Remove "/" from `modePaths` so new/unauth users see Announcements at root, and make mode views accessible from the tab bar on a different base route
- B) Add an unauth check: if `!$pubkey`, render Announcements at "/" instead of mode views
- C) Make CommsView show an onboarding prompt or Announcements feed as a fallback when no channels exist

---

## 4. HIGH: Desktop MainStatusBar Overlaps ModeTabBar

**Files:** `src/app/MainStatusBar.svelte`, `src/app/views/ModeTabBar.svelte`

On desktop (`innerWidth >= 1024`):
- MainStatusBar: `fixed bottom-sai left-72 h-8 z-[500]`
- ModeTabBar: `fixed bottom-0 left-0 right-0 h-14 lg:left-72 z-nav`

Both anchored at the bottom, left-72. MainStatusBar is 32px tall at `bottom-sai` (safe area offset). ModeTabBar is 56px tall at `bottom-0`. They physically overlap by ~32px on most devices (where `--saib` is 0).

**Impact:** ModeTabBar tabs are partially hidden behind MainStatusBar. The Comms/Map/Ops labels and the active mode indicator are obscured.

**Fix:** Stack them vertically. Either:
- Move ModeTabBar up by MainStatusBar height: `bottom-[calc(var(--saib)+2rem)]`
- Or nest MainStatusBar inside ModeTabBar's bottom area
- Or use a CSS variable `--bottom-chrome-height` that both reference

---

## 5. HIGH: ForegroundButtons Positioning Assumes Single Bottom Bar

**File:** `src/app/ForegroundButtons.svelte`

The scroll-to-top button uses:
```css
fixed bottom-[calc(var(--saib)+4.5rem)] right-[calc(var(--sair)+1rem)] z-feature
```

This assumes 4.5rem of bottom chrome (≈ ModeTabBar's 3.5rem + 1rem margin). But with the double bottom bar situation on mobile and MainStatusBar on desktop, the actual bottom chrome height varies:
- Mobile: ModeTabBar (3.5rem) + hidden Nav (~2.75rem) = button is approximately correct
- Desktop: ModeTabBar (3.5rem) + MainStatusBar (2rem) = 5.5rem → **button sits under MainStatusBar**

Also uses `z-feature` (1), lower than `z-nav` (2), so it can be hidden behind navigation bars.

**Fix:** Use a shared CSS variable for total bottom chrome height. Raise to `z-nav` or above.

---

## 6. HIGH: SovereignBar Overlaps Desktop Top Nav

**File:** `src/partials/SovereignBar.svelte`

SovereignBar renders `fixed left-0 right-0 top-0 z-popover` when the app enters sovereign/offline mode. The desktop Nav top bar uses `fixed top-sai z-nav`. Since `z-popover` (4) > `z-nav` (2), SovereignBar renders on top of the Nav.

However, neither component adjusts its vertical spacing when the other is visible:
- SovereignBar sits at `top-0`, Nav sits at `top-sai` (safe area inset top)
- They physically overlap — SovereignBar hides the Nav's search box and Post button
- Page content (`lg:pt-16`) doesn't account for the extra SovereignBar height

**Fix:** When SovereignBar is active, push Nav down by SovereignBar height, or place SovereignBar below Nav with `top-[calc(var(--sait)+4rem)]`.

---

## 7. MEDIUM: BackupReminder Conflicts with Bottom Chrome

**File:** `src/app/views/onboarding/BackupReminder.svelte`

Positioned at `fixed bottom-16 right-4 z-toast`. On mobile:
- `bottom-16` = 64px from viewport bottom
- ModeTabBar height = 56px (3.5rem)
- The reminder sits just 8px above ModeTabBar
- With any safe area inset, it overlaps ModeTabBar or gets pushed behind it

**Fix:** Use the same bottom-chrome-height variable: `bottom-[calc(var(--bottom-chrome-height)+1rem)]`

---

## 8. MEDIUM: Desktop Menu Sidebar Shows Channel-Only Content

**File:** `src/app/Menu.svelte`, `src/app/views/ChannelSidebar.svelte`

On desktop, the left sidebar (`w-72`) permanently shows `ChannelSidebar.svelte`. This component is:
- Only useful when the user has groups/channels
- Shows "No channels. Create or join one" for new/unauth users
- Takes 288px of horizontal space **on all pages** — settings, profile, search, etc.

For a new user browsing settings or reading an announcement post, 288px of their viewport shows a dead empty sidebar.

**Impact:** Wastes screen real estate and confuses context for non-channel pages.

**Fix:** Show ChannelSidebar only when on Comms mode or channel-related routes. For other pages, either collapse the sidebar or show contextually relevant navigation (e.g., settings tree on settings pages).

---

## 9. MEDIUM: Map View Height Calculation Is Incorrect

**File:** `src/app/Routes.svelte`

```html
<div class="h-[calc(100dvh-8rem)] w-full lg:h-[calc(100dvh-4rem-var(--main-status-height))]">
```

**Mobile:** `100dvh - 8rem` = 100dvh - 128px
- ModeTabBar = 56px, Nav bottom bar (hidden but occupying space?) = unclear
- Safe area margin (`m-sai`) adds variable height
- If only ModeTabBar is visible: 100dvh - 56px would be correct, but 128px is subtracted
- **Result:** ~72px of unused blank space below the map on mobile

**Desktop:** `100dvh - 4rem - 2rem` = 100dvh - 96px
- Nav top bar = 64px (4rem) ✓
- MainStatusBar = 32px (2rem) ✓  
- ModeTabBar = 56px → **NOT accounted for!**
- **Result:** Map extends ~56px behind ModeTabBar on desktop

**Fix:** Desktop should be `calc(100dvh - 4rem - var(--main-status-height) - 3.5rem)`. Mobile should match the actual visible bottom chrome height.

---

## 10. LOW: Pointer-Events Trap When Menu Open

**File:** `src/app/Routes.svelte`

When `$menuIsOpen`, the entire `#page` container gets `pointer-events-none`. This correctly prevents interaction with page content while the menu overlay is open. However:
- ForegroundButtons, Nav, and ModeTabBar render **outside** the Routes container (in App.svelte)
- They remain interactive while the menu is open
- User can click Post, switch modes, or trigger scroll-to-top while the menu animates

**Impact:** Minor — could cause unexpected navigation during menu interaction.

**Fix:** Add `pointer-events-none` to ModeTabBar and ForegroundButtons when `$menuIsOpen`.

---

## 11. LOW: Multiple Duplicate Navigation Patterns

The mobile experience has redundant navigation spread across three systems:

| Action | ModeTabBar | Nav Bottom | MenuMobile |
|--------|-----------|-----------|------------|
| Switch modes (Comms/Map/Ops) | ✅ Tabs | ❌ | ❌ |
| Open Settings | ✅ Gear icon | ❌ | ✅ Settings section |
| Search | ❌ | ✅ Search icon (hidden) | ❌ |
| Create Post | ❌ | ✅ Post button (hidden) | ❌ |
| Open Menu | ❌ | ✅ Hamburger (hidden) | N/A (is the menu) |
| View Announcements | ❌ | ❌ | ✅ Link |
| View Groups | ❌ | ❌ | ✅ Link |

Since Nav bottom bar is hidden behind ModeTabBar, **Search and Post are unreachable on mobile** except through the menu (Search) or not at all (Post is only in the hidden Nav bar).

**Fix:** Add Search and Post actions to either ModeTabBar or make them accessible from the CommsView toolbar.

---

## 12. LOW: Route "/" Announcements Registration is Dead Code

**File:** `src/app/App.svelte` line ~625

```js
router.register("/", Announcements)
```

This registration is never executed because Routes.svelte intercepts "/" as a modePage before the registered component renders. The Announcements component only works via `/announcements`.

**Fix:** Either remove this registration (and update any links pointing to "/" for announcements) or remove "/" from `modePaths` to restore the intended behavior.

---

## Fix Priority Matrix

| # | Issue | Severity | Effort | User Impact |
|---|-------|----------|--------|-------------|
| 1 | Mobile double bottom bar | Critical | Low | Search/Post/Menu invisible |
| 3 | New user sees empty CommsView | Critical | Medium | Confusing first impression |
| 11 | Search/Post unreachable on mobile | Critical | Medium | Core actions blocked |
| 2 | z-[500] on MainStatusBar | High | Low | Blocks modals/toasts |
| 4 | MainStatusBar overlaps ModeTabBar | High | Low | Mode tabs obscured |
| 9 | Map height calc wrong | High | Low | Map clipped or overflows |
| 5 | ForegroundButton z-index/position | High | Low | Scroll button hidden |
| 6 | SovereignBar overlaps Nav | High | Low | Nav hidden when offline |
| 8 | Sidebar shows channels on all pages | Medium | Medium | Wasted space, confusion |
| 7 | BackupReminder position | Medium | Low | Overlap with bottom chrome |
| 10 | Pointer-events leak | Low | Low | Minor interaction glitch |
| 12 | Dead "/" Announcements registration | Low | Low | Code hygiene |

---

---

## Implementation Plan

### Design Principle: Unified Bottom Chrome

The root cause of issues 1, 4, 5, 7, 9, and 11 is that there is no single source of truth for bottom chrome height. Each component independently guesses its offset from the viewport bottom. The fix is to introduce a `--bottom-chrome` CSS variable that all bottom-anchored components reference, and to make the bottom bar a **single unified component** on mobile.

Similarly, the top of the viewport needs a `--top-chrome` variable so SovereignBar can push content down without manual coordination.

---

### Step 1 — Introduce layout CSS variables (app.css)

**File:** `src/app.css`

Add to `:root`:
```css
  /* ── Bottom chrome heights ─────────────────────── */
  --mode-tab-height: 3.5rem;           /* ModeTabBar h-14 = 56px */
  --main-status-height: 2rem;          /* MainStatusBar h-8 = 32px (already exists) */
  --bottom-chrome: var(--mode-tab-height);  /* mobile: just ModeTabBar */
  --top-chrome: 0px;                   /* updated by SovereignBar when active */

  @media (min-width: 1024px) {
    --bottom-chrome: calc(var(--mode-tab-height) + var(--main-status-height));
  }
```

This gives every component a single variable to reference. When bottom chrome composition changes, only this variable needs updating.

---

### Step 2 — Retire the mobile bottom Nav bar (Nav.svelte)

**File:** `src/app/Nav.svelte`

**What:** Delete the entire `{#if innerWidth < 1024}` bottom nav block (the `<!-- bottom nav -->` section, lines ~121-170). This bar is completely hidden behind ModeTabBar and its actions (Search, Post, Menu) are unreachable.

**Why not just hide it?** It's not "hidden and useful sometimes" — ModeTabBar *always* renders at the same position. The bottom nav is dead UI. Removing it eliminates the double-bar collision (Issue #1) and simplifies the DOM.

**The actions it provided** (Search, Post+, Menu hamburger) will be relocated in Step 3.

**Keep** the desktop top nav (`{#if innerWidth >= 1024}`) — it's the only top bar and works correctly.

After this change, Nav.svelte only outputs UI on desktop (≥ 1024px). The `<svelte:window bind:innerWidth />` and the `innerWidth` variable remain needed for the desktop conditional.

---

### Step 3 — Absorb Search/Post/Menu into ModeTabBar (ModeTabBar.svelte)

**File:** `src/app/views/ModeTabBar.svelte`

**What:** On mobile, ModeTabBar becomes the *sole* bottom bar. Add the three missing actions from the retired Nav bar:

1. **Search** — Add a search icon tab (fa-search) before the mode tabs, mobile only (`lg:hidden`). On click: `router.at("/search").open()` (same as old Nav).

2. **Post+** — Add a Post button. Two options:
   - *Option A (recommended):* A floating accent-colored button positioned above the tab bar, outside the tab row itself. This keeps the tab row clean for navigation and gives Post+ visual prominence. Position it `absolute -top-14 right-4` relative to the ModeTabBar container.
   - *Option B:* Inline as a 5th tab item with `fa-plus` icon, accent-colored when `$signer`, or showing "Log in" / "Get started" text for unauth users.

3. **Menu / Profile** — Replace the Settings gear (currently `lg:hidden`) with the hamburger + PersonCircle combo from the old Nav. On click: `menuIsOpen.set(true)`. Include the notification badge dot.

**New imports needed:** `pubkey`, `signer` from `@welshman/app`; `menuIsOpen` from state; `PersonCircle`; `env` from engine; notification stores for the badge.

**Auth-aware rendering:**
- If `$signer`: show Post+ button and PersonCircle with badge
- If `!$pubkey`: show "Get started" or "Log in" link (respecting `ENABLE_GUIDED_SIGNUP`)
- Always show: Search icon, mode tabs, menu hamburger

**Rough template structure (mobile row):**
```
[ Search ] [ Comms | Map | Ops ] [ Post+ ] [ ☰ Avatar ]
```

On desktop (`lg:`), hide Search (already in top Nav) and use the full-width tab row as-is with `lg:left-72` offset.

---

### Step 4 — Fix MainStatusBar z-index (MainStatusBar.svelte)

**File:** `src/app/MainStatusBar.svelte`

**What:** Change `z-[500]` → `z-feature`.

MainStatusBar is an informational-only display (relay counts, uptime). It should *never* overlay modals, toasts, or overlays. `z-feature` (1) is the correct layer — it's below nav (2) which is below everything interactive.

**Also:** Change its bottom position from `bottom-sai` to `bottom-[var(--mode-tab-height)]` so it sits directly above ModeTabBar instead of overlapping it. Combined with ModeTabBar's `bottom-0`, this gives a clean vertical stack:

```
┌──────────────────── viewport bottom ─┐
│  MainStatusBar  (h-8, bottom offset) │
│  ModeTabBar     (h-14, bottom-0)     │
└──────────────────────────────────────┘
```

The `lg:left-72` offset stays (sidebar clearance). Add `lg:bottom-[calc(var(--saib)+var(--mode-tab-height))]` to position it above ModeTabBar on desktop.

---

### Step 5 — Fix ForegroundButtons positioning (ForegroundButtons.svelte)

**File:** `src/app/ForegroundButtons.svelte`

**What:** Replace the hardcoded bottom offset with the CSS variable:

```
bottom-[calc(var(--saib)+4.5rem)]  →  bottom-[calc(var(--saib)+var(--bottom-chrome)+1rem)]
```

And change `z-feature` → `z-nav` so the scroll-to-top button renders above ModeTabBar, not behind it.

On desktop (`lg:`), use:
```
lg:bottom-[calc(var(--bottom-chrome)+1rem)]
```

This keeps the button 1rem above whatever bottom chrome exists, on any viewport.

---

### Step 6 — Fix map/full-bleed height calculations (Routes.svelte)

**File:** `src/app/Routes.svelte`

**What:** Replace both instances of the height calc:

**Mobile (current):** `h-[calc(100dvh-8rem)]`
**Mobile (fixed):** `h-[calc(100dvh-var(--bottom-chrome)-var(--saib))]`

This accounts for exactly the ModeTabBar height (3.5rem) plus safe area, instead of an arbitrary 8rem (which wastes 72px of space).

**Desktop (current):** `h-[calc(100dvh-4rem-var(--main-status-height))]`
**Desktop (fixed):** `h-[calc(100dvh-4rem-var(--bottom-chrome))]`

This accounts for: Nav top bar (4rem) + ModeTabBar (3.5rem) + MainStatusBar (2rem). Since desktop `--bottom-chrome` = `mode-tab-height + main-status-height`, this simplifies to one variable.

There are **two** instances of this pattern in Routes.svelte (one for the map mode view, one for full-bleed route views). Both need the same change.

---

### Step 7 — Fix SovereignBar / top nav overlap (SovereignBar.svelte + app.css)

**File:** `src/partials/SovereignBar.svelte`

**What:** SovereignBar currently renders at `fixed top-0 z-popover`. When active, it covers the desktop top Nav. Two changes:

1. **Position it below the Nav on desktop:** Change to `fixed top-0 z-popover lg:top-16` (Nav is h-16). On mobile it stays at top-0 (no top nav exists on mobile).

2. **Push page content down:** In `src/app.css`, add:
```css
:root { --sovereign-bar-height: 0px; }
```
Then in SovereignBar.svelte, when the bar mounts/unmounts, update the CSS variable:
```js
onMount(() => document.documentElement.style.setProperty('--sovereign-bar-height', '2rem'))
onDestroy(() => document.documentElement.style.setProperty('--sovereign-bar-height', '0px'))
```

In Routes.svelte, add `--sovereign-bar-height` to the top offset for desktop:
```css
lg:pt-[calc(4rem+var(--sovereign-bar-height))]
```

This way page content shifts down only when SovereignBar is active, and the bar doesn't cover the Nav search box.

---

### Step 8 — Fix BackupReminder positioning (BackupReminder.svelte)

**File:** `src/app/views/onboarding/BackupReminder.svelte`

**What:** Change `fixed bottom-16` → `fixed bottom-[calc(var(--saib)+var(--bottom-chrome)+1rem)]`.

Current `bottom-16` (64px) puts it only 8px above ModeTabBar's 56px. With the CSS variable, it sits 1rem above whatever bottom chrome exists. The `z-toast` is already correct (highest in the hierarchy).

---

### Step 9 — New user landing: show Announcements for unauth (Routes.svelte)

**File:** `src/app/Routes.svelte`

**What:** When at "/" and the user is *not authenticated*, show the registered Announcements component instead of mode views. Change the mode page logic:

```svelte
{#if isModePage}
  {#if !$pubkey}
    <!-- Unauthenticated: show Announcements landing -->
    {@const {route} = router.getMatch($page.path)}
    <div class="m-auto w-full max-w-2xl">
      <div class="flex max-w-2xl flex-grow flex-col gap-4 p-4">
        <LazyRouteHost {route} props={router.getProps($page)} />
      </div>
    </div>
  {:else if $navcomMode === "comms"}
    ...existing comms/map/ops blocks...
```

This way:
- **New/unauth user at "/"** → sees Starcom Announcements (the registered component)
- **Authenticated user at "/"** → sees mode-based views (Comms/Map/Ops)

The Announcements route registration at "/" is no longer dead code — it serves unauthenticated visitors.

---

### Step 10 — Desktop sidebar: context-aware content (Menu.svelte)

**File:** `src/app/Menu.svelte`

**What:** Currently the desktop sidebar *always* shows ChannelSidebar (the group/channel list). For users with no groups, or on non-channel pages, this is 288px of dead space.

Import the router page store and the navcom mode:
```js
import {router} from "src/app/util/router"
import {navcomMode} from "src/app/navcom-mode"
const {page} = router
```

Then conditionally render:
```svelte
{:else}
  <div class="top-sai left-sai bottom-sai fixed z-sidebar flex w-72 flex-col">
    <div class="flex-1 overflow-hidden border-r border-nc-shell-border bg-nc-shell-deep">
      {#if $navcomMode === "comms" || $page?.path?.startsWith("/groups") || $page?.path?.startsWith("/channels")}
        <ChannelSidebar />
      {:else}
        <!-- Contextual nav for non-channel pages -->
        <nav class="flex h-full flex-col bg-nc-shell-deep">
          <div class="flex items-center border-b border-nc-shell-border px-4 py-3">
            <h2 class="staatliches text-lg uppercase tracking-widest text-nc-text">{appName}</h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Navigation links matching MenuMobile's structure -->
          </div>
        </nav>
      {/if}
    </div>
  </div>
{/if}
```

**Note:** Also fix the z-index from `z-nav` to `z-sidebar` (6). The sidebar should be above nav (2) so it doesn't get clipped by the top Nav bar. The current `z-nav` was likely an oversight when `z-sidebar` exists at level 6 specifically for this component.

---

### Step 11 — Guard interactions when menu open (ModeTabBar.svelte, ForegroundButtons.svelte)

**File:** `src/app/views/ModeTabBar.svelte`, `src/app/ForegroundButtons.svelte`

**What:** Import `menuIsOpen` from state and add `class:pointer-events-none={$menuIsOpen}` to the root container of each component. This prevents mode switching and scroll-to-top from firing while the mobile menu overlay is open.

In ModeTabBar:
```svelte
<nav class="... fixed bottom-0 ..."
  class:pointer-events-none={$menuIsOpen}>
```

In ForegroundButtons:
```svelte
<div class="fixed bottom-[...] ..."
  class:pointer-events-none={$menuIsOpen}>
```

---

### Step 12 — Clean up dead registration (App.svelte)

**File:** `src/app/App.svelte`

**What:** After Step 9, the "/" registration *is* used for unauth users, so this is no longer dead code. No action needed — the registration stays and is now functional.

If we had chosen a different approach in Step 9 (e.g., showing a dedicated WelcomeView), we'd remove the registration here. But the current plan reactivates it.

---

## Dependency Graph & Execution Order

```
Step 1 (CSS vars)
  ├─→ Step 4 (MainStatusBar z-index + position)  ←── no deps besides Step 1
  ├─→ Step 5 (ForegroundButtons position)         ←── no deps besides Step 1
  ├─→ Step 6 (Map height calc)                    ←── no deps besides Step 1
  └─→ Step 8 (BackupReminder position)            ←── no deps besides Step 1

Step 2 (Remove Nav bottom bar)
  └─→ Step 3 (Absorb into ModeTabBar)             ←── needs Step 2 done first

Step 7 (SovereignBar)       ←── independent
Step 9 (Unauth landing)     ←── independent
Step 10 (Sidebar context)   ←── independent
Step 11 (Menu guard)        ←── needs Step 3 done (ModeTabBar's final shape)
Step 12 (Dead code)         ←── resolved by Step 9
```

**Recommended execution batches:**

| Batch | Steps | Files touched | Risk |
|-------|-------|---------------|------|
| **A** | 1 | app.css | None — additive only |
| **B** | 2, 3 | Nav.svelte, ModeTabBar.svelte | High — changes primary mobile nav |
| **C** | 4, 5, 6, 8 | MainStatusBar, ForegroundButtons, Routes, BackupReminder | Medium — positioning changes |
| **D** | 7 | SovereignBar.svelte, Routes.svelte | Low — edge case (offline mode) |
| **E** | 9 | Routes.svelte | Medium — changes landing page |
| **F** | 10, 11 | Menu.svelte, ModeTabBar, ForegroundButtons | Low — polish |

---

## Verification Checklist

After each batch, verify:

- [ ] **Mobile (< 1024px):** Single bottom bar with mode tabs + search + post + menu
- [ ] **Mobile:** Scroll-to-top button visible above bottom bar
- [ ] **Mobile:** Map view fills viewport minus bottom bar (no blank gap, no overflow behind bar)
- [ ] **Mobile:** BackupReminder floats above bottom bar, not behind it
- [ ] **Mobile:** Menu opens; no buttons behind it are clickable
- [ ] **Desktop (≥ 1024px):** Top nav with NAVCOM title, search, Post+
- [ ] **Desktop:** ModeTabBar at bottom, MainStatusBar directly above it (not overlapping)
- [ ] **Desktop:** Map fills viewport minus top nav + bottom chrome
- [ ] **Desktop:** Sidebar shows channels in Comms mode, contextual nav in other modes
- [ ] **Desktop:** Modals/toasts render ABOVE MainStatusBar (not blocked by z-500)
- [ ] **Unauth at "/":** Sees Starcom Announcements feed
- [ ] **Auth at "/":** Sees mode views (Comms/Map/Ops)
- [ ] **Sovereign mode:** Red bar below top nav on desktop, at top on mobile, content shifts down
