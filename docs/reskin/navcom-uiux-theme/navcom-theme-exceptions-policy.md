# NavCom Theme Exceptions Policy

Date: 2026-03-22
Status: Active policy
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-token-handbook.md

## 1. Purpose

Define when non-token styles are allowed and how they must be documented.

## 2. Allowed Exception Categories

- third-party library constraints requiring inline style overrides
- map rendering overlays requiring context-sensitive colors
- temporary transition states during migration waves

## 3. Disallowed Exceptions

- convenience hardcoded colors where semantic token exists
- persistent shell gradients that bypass theme axes
- color-only warning or danger signaling

## 4. Required Exception Record

For each exception record:
- component or route path
- exact style exception
- reason and risk
- owner

## 5. Approved Exceptions Catalog (Post-Wave 5)

### 5.1 Dark-text-on-accent (text-neutral-900 on bg-accent / bg-nc-accent)
All instances of `text-neutral-900` appear exclusively on `bg-accent` or `bg-nc-accent` backgrounds (badges, active pills, CTA buttons). Dark text ensures readability on the bright accent color.
**Files**: GeoModal, MapPickerModal, PostTypeSelector, OpsView, MapLayerPanel, SpotrepForm, ChannelSidebar, MapView, UnlockScreen, GeoAnnotationForm, SitrepForm, MapDrawTools, NoteCreateComposer, ModeTabBar, SelectTiles.

### 5.2 White-text-on-accent/danger (text-white on bg-accent / bg-red-*)
`text-white` appears on colored action backgrounds where maximum contrast is needed.
**Files**: ForegroundButton (primary), SwUpdateBanner (CTA), GroupSettingsAdmin (danger CTA), RelayCardActions (accent CTA), MenuItem (hovered), FeedControls.

### 5.3 Leaflet map marker hex colors (#6366f1, #3b82f6, #93c5fd)
Leaflet API requires hex string values for `fillColor`, `color`, and inline `style` attributes on marker HTML. Cannot reference CSS variables without runtime `getComputedStyle`.
**File**: MapView.svelte (lines 117, 259, 261).

### 5.4 CSS mask-image rgba(0,0,0,...) values
Black-based opacity masks in `mask-image` and `-webkit-mask-image` use `rgba(0,0,0,...)` by CSS spec (black=opaque, transparent=hidden). Not theme colors.
**File**: MenuDesktopItem.svelte.

### 5.5 Shadow rgba(0,0,0,...) values
Box-shadow uses `rgba(0,0,0,...)` which is universally correct regardless of theme.
**Files**: Footer.svelte, MainStatusBar.svelte, Nav.svelte, MapView.svelte.

### 5.6 CSS animation/transition keyframe colors
NotePending.svelte gradient animation uses `rgba(0,0,0,0)` for transparency endpoints. Not theme colors.

### 5.7 Dynamic theme variable references (var(--neutral-*))
`var(--neutral-800)`, `var(--neutral-900)`, `var(--neutral-950)` etc. in style attributes and CSS are already dynamic — they're computed by the theme engine at runtime and respond to palette changes.
**Files**: App.svelte, MainStatusBar.svelte, Nav.svelte.

### 5.8 Icon color prop string references ("neutral-100")
`Icon` component's `color` prop accepts a theme color key string, which is resolved via `$themeColors["neutral-100"]` at runtime. Not a Tailwind class.
**Files**: Icon.svelte (default), NoteActions.svelte.

### 5.9 Light message bubble (bg-neutral-100 text-neutral-800)
Message.svelte uses a deliberately light background for the "other person's message" chat bubble to provide visual distinction from the user's own messages. Intentional contrast choice.

### 5.10 Dynamic -d suffix colors (bg-neutral-100-d)
NotePending.svelte uses `bg-neutral-100-d` which is a dynamic theme color class (the `-d` suffix indicates a dark-mode-resolved variant from the theme system). Not a hardcoded color.
- planned removal or review date

## 5. Approval Rule

Exception is approved only when:
- no semantic-token alternative is feasible in current wave
- readability and accessibility are preserved
- expiration or revisit date is specified
