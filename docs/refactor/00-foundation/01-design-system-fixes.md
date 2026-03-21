# 00-01: Design System Fixes

> Pre-work: clean up known visual/CSS issues before the two-mode rewrite.

**Priority**: Do first — trivial effort, prevents bugs from propagating into new components.  
**Effort**: LOW (1–2 days)  
**Depends on**: Nothing  
**Source**: [navcom-design-system.md](../../navcom-design-system.md), [navcom-future-risks.md](../../navcom-future-risks.md) §13

---

## Tasks

### 1. Delete Unused Font Files

10 font files in `/public/fonts/` are shipped but never referenced in CSS.

**Delete these files:**
- `Figtree-VariableFont_wght.ttf`
- `Figtree-Italic-VariableFont_wght.ttf`
- `Montserrat Regular 400.ttf`
- `Montserrat SemiBold 600.ttf`
- `Montserrat Italic 400.ttf`
- `Montserrat` (directory)
- `Roboto-Regular.ttf`
- `Roboto-Bold.ttf`
- `Roboto-Italic.ttf`
- `Lato-Light.ttf`
- `Lato-LightItalic.ttf`

**Estimated savings**: ~500KB–1MB from production builds.

---

### 2. Fix `.montserrat` CSS Class

**File**: `src/app.css`

**Current** (broken):
```css
.montserrat {
  font-family: Lato;
  font-weight: 400;
}
```

**Fix**: Either rename the class to `.lato` where it's used, or remove it entirely if unused. Search codebase for `.montserrat` usage first.

---

### 3. Fix Italic @font-face Path

**File**: `src/app.css`

**Current** (broken):
```css
@font-face {
  font-family: "Lato";
  font-style: italic;
  font-weight: 400;
  src: local(""), url("/fonts/Italic.ttf") format("truetype");
}
```

**Fix**: Change to `url("/fonts/Lato-Italic.ttf")` — the correct file exists in `/public/fonts/`.

---

### 4. Fix Safe Area Margin Bug

**File**: `src/app.css`

The `.mt-sai`, `.mr-sai`, `.mb-sai`, `.ml-sai` utility classes use `padding-*` instead of `margin-*`.

**Current** (broken):
```css
.mt-sai { padding-top: var(--sait); }
.mr-sai { padding-right: var(--sair); }
.mb-sai { padding-bottom: var(--saib); }
.ml-sai { padding-left: var(--sail); }
```

**Fix**:
```css
.mt-sai { margin-top: var(--sait); }
.mr-sai { margin-right: var(--sair); }
.mb-sai { margin-bottom: var(--saib); }
.ml-sai { margin-left: var(--sail); }
```

**Risk**: Search for usage before fixing — if existing code depends on the padding behavior, this could shift layout.

---

### 5. Extract Hardcoded rgba() Colors

**File**: `src/app.css`

~30 instances of hardcoded `rgba(34, 211, 238, ...)`, `rgba(99, 230, 255, ...)`, `rgba(14, 165, 233, ...)` in `.btn`, `.panel`, `.cy-chip` classes. These bypass the theme token system.

**Approach**: Define new CSS custom properties derived from `--accent`:

```css
:root {
  --accent-glow-subtle: rgba(var(--accent-rgb), 0.12);
  --accent-glow-medium: rgba(var(--accent-rgb), 0.22);
  --accent-glow-strong: rgba(var(--accent-rgb), 0.35);
}
```

Requires adding `--accent-rgb` (raw R,G,B without #) to the `themeColors` computation in `src/partials/state.ts`.

**Why**: This unblocks white-labeling (change accent via env var) and fixes light mode glow artifacts.

---

### 6. Fix Tippy Tooltip Theming

**File**: `src/app.css`

Tippy tooltips have hardcoded dark colors (`#0f0f0e`, `#403d39`) that ignore the theme system.

**Fix**: Replace with CSS custom properties:
```css
.tippy-box[data-theme~="dark"] {
  background-color: var(--neutral-900);
  border: 1px solid var(--neutral-600);
}
```

---

### 7. Remove Coracle Brand Hook

**File**: `src/app.css`

```css
:root {
  --bc-color-brand: var(--accent);
}
```

Search for `--bc-color-brand` usage. If nothing reads it, remove it.

---

## Verification

- [ ] Build completes without errors
- [ ] Font directory contains only 6 files (Aldrich, Staatliches, Lato ×3, Satoshi)
- [ ] Dark mode renders identically (visual regression check)
- [ ] Light mode button glows actually respond to accent color change
- [ ] Tooltips use theme-appropriate colors in both modes
