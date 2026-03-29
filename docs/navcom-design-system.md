# NavCom Design System Audit

> Current state of typography, color, and visual styling. Source-verified.

---

## Color Architecture

Colors are defined as env vars (`.env.template`), parsed at build time, and injected as CSS custom properties at runtime via `src/partials/state.ts`. Each base color gets automatic `-l` (lighter, +10%) and `-d` (darker, -10%) variants.

### Dark Theme (Default)

| Token | Hex | Role |
|-------|-----|------|
| `accent` | `#22d3ee` | Primary action, links, glows, focus rings |
| `neutral-950` | `#050608` | Deepest background |
| `neutral-900` | `#0b0e12` | Primary background |
| `neutral-800` | `#0f1114` | Card/panel background |
| `neutral-700` | `#181c20` | Borders, dividers |
| `neutral-600` | `#20262c` | Secondary borders |
| `neutral-500` | `#2c343d` | Disabled states |
| `neutral-400` | `#4b5563` | Muted text |
| `neutral-300` | `#94a3b8` | Secondary text |
| `neutral-200` | `#c7d0d9` | Body text |
| `neutral-100` | `#e6edf3` | Primary text |
| `neutral-50` | `#f8fafc` | Brightest text |
| `success` | `#7af57a` | Connected, verified |
| `warning` | `#f5b942` | Caution states |
| `danger` | `#dc2626` | Error, destructive |
| `tinted-100` | `#0f172a` | Dark blue tint |
| `tinted-200` | `#111827` | Slightly lighter blue |
| `tinted-400` | `#1f2937` | Mid blue tint |
| `tinted-500` | `#27303c` | — |
| `tinted-600` | `#2f3946` | — |
| `tinted-700` | `#374251` | Lightest blue tint |
| `tinted-800` | `#0b0e12` | Darkest blue tint |

### Light Theme

Neutrals are flipped (950↔50, 900↔100, etc.). Accent shifts from `#22d3ee` → `#0ea5e9`. Success darkens to `#16a34a`. Tinted range flips to white/light grays. Warning and danger unchanged.

### How Colors Flow

```
.env.template → VITE_DARK_THEME / VITE_LIGHT_THEME
    ↓
src/partials/state.ts → parseTheme() → themeColors derived store
    ↓
themeVariables store → CSS custom properties injected into <style> tag
    ↓
tailwind.config.cjs → maps color names to var(--token-name)
    ↓
Components use: class="bg-neutral-800 text-accent border-neutral-700"
```

### Hardcoded Color Problems

The following bypass the token system:

| Location | Hardcoded Value | Should Be |
|----------|----------------|-----------|
| `.btn` box-shadow | `rgba(99, 230, 255, 0.22)` | Token-derived |
| `.btn` active | `rgba(14, 165, 233, 0.95)` | `var(--accent)` with opacity |
| `.panel-row` gradient | `rgba(15, 17, 20, 0.95)` | `var(--neutral-800)` |
| `.cy-chip` background | `rgba(34, 211, 238, 0.12)` | `var(--accent)` with opacity |
| Tippy dark theme | `#0f0f0e`, `#403d39` | Theme tokens |
| Code blocks | `var(--neutral-800)` | ✓ Correct |

**Impact**: Light theme gets dark-mode glow colors baked into buttons, panels, and chips. Switching theme doesn't fully switch — cyan glow effects stay cyan-on-light, Tippy stays dark regardless.

---

## Typography

### Font Stack

Declared in `src/app.css`:

```css
:root {
  font-family: Aldrich, "IBM Plex Sans", Lato, sans-serif;
}
```

### Loaded Fonts

| Font | Weight | Style | File | Used For |
|------|--------|-------|------|----------|
| **Aldrich** | 400 | normal | `Aldrich/Aldrich-Regular.ttf` | Root/body text, buttons, labels |
| **Staatliches** | 400 | normal | `Staatliches Regular 400.ttf` | Headings, page titles, nav logo |
| **Lato** | 400 | normal | `Lato-Regular.ttf` | Fallback body, `.montserrat` class |
| **Lato** | 600 | bold | `Lato-Bold.ttf` | Bold fallback |
| **Lato** | 400 | italic | `Italic.ttf` | Italic fallback |
| **Satoshis** | 400 | normal | `Satoshi Symbol.ttf` | Symbol/icon supplement |

### Font Files Present But Unused

| Font | Files | Status |
|------|-------|--------|
| **Figtree** | 2 variable-weight TTFs | Not referenced in CSS or components |
| **Montserrat** | 4 TTFs (Regular, SemiBold, Italic, base) | `.montserrat` class exists but maps to **Lato**, not Montserrat |
| **Roboto** | 3 TTFs (Regular, Bold, Italic) | Not referenced anywhere |
| **Lato-Light** | 1 TTF | Not referenced in @font-face |
| **Lato-LightItalic** | 1 TTF | Not referenced in @font-face |

**Dead weight**: 10 font files (~500KB–1MB estimated) shipped but never loaded. The `.montserrat` utility class is misleading — it applies Lato, not Montserrat.

### Typography Scale

| Element | Size | Font | Additional Properties |
|---------|------|------|-----------------------|
| Page titles | `text-6xl` | Staatliches | — |
| Subtitles | `text-3xl` | Staatliches | — |
| Nav logo | `text-2xl` | Staatliches | `uppercase`, `tracking-[0.2em]` |
| h1 (long-form) | `2em` | Staatliches | `line-height: 1.4em` |
| h2 (long-form) | `1.5em` | Staatliches | `line-height: 1em` |
| Buttons | h-9 | Aldrich | `uppercase`, `font-semibold`, `tracking-[0.08em]` |
| Labels | — | Any | `font-semibold`, `uppercase`, `tracking-[0.06em]` |
| Chips | `text-[12px]` | Any | `uppercase`, `tracking-[0.06em]` |
| Small chips | `text-[11px]` | Any | — |
| Monospace | `text-sm` | System mono | Code blocks, hex values |

### Typography Observations

1. **Aldrich is a display font used as body text** — it's geometric and uppercase-optimized, not designed for paragraph readability. Works for a military/tech aesthetic but reduces readability for longer text (announcements, about pages, message bodies).
2. **No explicit body text size declared** — relies on browser default (16px). The scale jumps from 11px chips to 2xl headings with no defined "paragraph" size.
3. **Italic path is broken** — the @font-face for Lato italic references `/fonts/Italic.ttf`, not `/fonts/Lato-Italic.ttf`. A file named `Lato-Italic.ttf` exists in the font directory but isn't what's loaded.
4. **IBM Plex Sans in fallback chain** — listed in :root font-family but never loaded via @font-face. Only activates if Aldrich fails to load.

---

## Component Styling Classes

### Buttons (`.btn`)

```
Default:  dark gradient (800→900), neutral-600 border, cyan inset glow
Hover:    lighter gradient (700→800), stronger cyan glow
Active:   cyan gradient fill, white text, translateY(1px)
Focus:    double cyan ring, no outline
Disabled: 45% opacity, grayscale(0.2), no pointer events
```

Variants:
- `.btn-low` — ghost button, cyan text on transparent cyan bg
- `.btn-accent` — full cyan gradient, white text
- `.btn-danger` — red gradient, white text
- `.btn-circle` — round, aspect-square
- `.btn-tall` — h-11 (44px) instead of h-9 (36px)

### Panels (`.panel`)

```
Default:  rounded-[10px], gradient (900→950), neutral-700 border, cyan inset glow, deep shadow
Interactive: hover brightens gradient, shows cyan border glow
Row:      horizontal layout, 90° gradient with cyan accent start
```

### Chips (`.cy-chip`)

```
Default:  rounded-full, cyan bg at 12% opacity, cyan border, accent text
Muted:    neutral-800 bg, neutral border, neutral text
Accent:   gradient cyan bg, white text, triple shadow
Danger:   red bg at 12%, red border, red text
Warning:  amber bg at 16%, amber border, amber text
```

---

## Dark/Light Theme Switching

**Mechanism**: Class-based (`dark` on `<html>`) + runtime CSS variable injection.

```
User toggles → theme store updates → localStorage persists →
  1. document.documentElement.classList.add/remove("dark")
  2. themeVariables derived store recalculates all CSS variables
  3. <style> tag re-injected with new values
```

**Coverage gap**: Component classes (`.btn`, `.panel`, `.cy-chip`) use hardcoded rgba() values for the cyan glow effects. These don't respond to theme changes. In light mode, you get dark-mode glow colors on light backgrounds.

---

## Icon System

**Library**: FontAwesome Free v6.7.2 (`@fortawesome/fontawesome-free`)

Common icons: `fa-copy`, `fa-qrcode`, `fa-times`, `fa-calendar-days`, `fa-chevron-left`, `fa-chevron-right`, `fa-circle-notch`, `fa-star`, `fa-palette`, `fa-upload`, `fa-warning`, `fa-right-left`, `fa-plus`

Custom animation: `.fa-beat-custom` (scale 1.4, 0.4s duration, single iteration)

**No custom icon set** — entirely dependent on FontAwesome's free tier. No NavCom-specific icons (satellite, signal strength, encryption locks, channel types, etc.).

---

## Spacing & Layout Tokens

### Z-Index Layers

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Default |
| `feature` | 1 | Map features, overlays |
| `nav` | 2 | Navigation |
| `chat` | 3 | Chat UI |
| `popover` | 4 | Tooltips, dropdowns |
| `modal` | 5 | Modals |
| `sidebar` | 6 | Sidebar menus |
| `overlay` | 7 | Full-screen overlays |
| `toast` | 8 | Notifications |

### Breakpoints

| Token | Width | Usage |
|-------|-------|-------|
| `xs` | 400px | Small mobile |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (primary breakpoint) |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

### Safe Area Insets

Full set of utilities (`.pt-sai`, `.px-sai`, etc.) for notch/status bar avoidance on mobile/PWA.

**Note**: `.mt-sai` and `.mr-sai` are defined using `padding-*` not `margin-*` — likely a copy-paste bug.

---

## Additional CSS Custom Properties

| Property | Value | Usage |
|----------|-------|-------|
| `--bc-color-brand` | `var(--accent)` | Coracle brand hook (still present) |
| `--main-status-height` | `2rem` | Main status bar height |

---

## Design System Assessment

### Strengths

- **Distinct visual identity** — the cyan-on-dark palette with glass-morphism gradients reads as "tactical tech platform," not "social media app"
- **Dynamic theming** — env-var-driven colors mean white-labeling is possible by changing one line
- **Comprehensive safe area support** — mobile/PWA-ready
- **Intentional z-index scale** — named layers prevent z-index wars
- **Glass-morphism consistency** — buttons, panels, and chips share the same gradient + inset glow + shadow pattern

### Problems

1. **Hardcoded rgba() in CSS classes** — ~30 instances of raw cyan/dark rgba values in `.btn`, `.panel`, `.cy-chip` that don't respond to theme switching or customization
2. **10 unused font files** — ~500KB-1MB dead weight in the public directory
3. **`.montserrat` class lies** — applies Lato, not Montserrat
4. **Italic @font-face broken** — references `Italic.ttf`, not `Lato-Italic.ttf`
5. **Aldrich as body font** — display font used for paragraph text hurts readability
6. **No body text size token** — no defined "prose" size between chip (11px) and heading (24px+)
7. **Light mode incomplete** — hardcoded dark-mode glows persist, tinted colors may fail contrast
8. **Tippy always dark** — tooltip styling is hardcoded, ignores theme
9. **No semantic color tokens** — using `neutral-800` for both "background" and "code block" with no semantic distinction
10. **Safe area margin bug** — `.mt-sai`, `.mr-sai`, `.mb-sai`, `.ml-sai` use `padding-*` properties, not `margin-*`
11. **`--bc-color-brand` Coracle remnant** — still present, unclear if any component reads it
12. **FontAwesome only** — no custom NavCom iconography for domain-specific concepts
