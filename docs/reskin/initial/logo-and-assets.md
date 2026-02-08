# Logo & Asset Guidance

## Primary Logo
- Source: Animated GIF (rotating star with four angular wings): https://navcom.app/assets/WingCommanderLogo-288x162-Dr7UFZxN.gif
- Usage: hero/header, splash, or modal brand moments. Apply blend mode `screen` or `lighten` over dark gun-metal backgrounds to avoid opaque black boxes.
- Avoid using the animated GIF for favicons/PWA icons — generate static exports.

## Static Variants (needed)
- Produce a static monochrome SVG/PNG on transparent background for:
  - Favicons and PWA icons (Vite favicons pipeline expects a static source image).
  - App chrome (top-left brand lockup), sharing previews, and manifest icons.
- Recommended sizes: 512x512 master; derive 192/144/96/48/32 as needed.

## Wordmarks
- Create dark/light wordmarks sized for headers and Open Graph images. Keep high contrast against gun-metal backgrounds. Ensure transparent backgrounds.

## Background & Texture Assets
- Subtle brushed-metal or carbon textures for shells (low opacity, tileable).
- Holographic overlays: soft cyan/blue gradients with 10–20% opacity for panel glass.

## Placement Guidelines
- Keep logo on dark, low-noise areas; avoid busy textures directly behind it.
- Minimum clear space: at least wing-span height around the mark.
- Do not recolor the animated logo; recolor only static variants if needed.
