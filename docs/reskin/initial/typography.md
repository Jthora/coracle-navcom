# Typography & Iconography

## Typography
- Primary face: choose an angular/technical, open-licensed family (e.g., Orbitron, Michroma, Rajdhani). Avoid rounded humanist shapes.
- Secondary face (body/copy): a neutral sans with crisp edges (e.g., IBM Plex Sans, Space Grotesk) to keep readability high.
- Weights: 400/500 for body, 600/700 for headings and buttons. Avoid ultra-thin weights on dark backgrounds.
- Letter spacing: slight positive tracking on uppercase labels (0.04–0.08em) to emphasize mil-tech tone.
- Numerals: use tabular lining where available for telemetry/readouts.

## Hierarchy
- H1/H2: uppercase, tight leading; use accent or near-white text.
- Meta/labels: uppercase microcopy, `--accent` or muted cyan.
- Body: near-white (#e6edf3) on gun-metal backgrounds; keep contrast ratios ≥ 4.5:1.

## Iconography
- Style: thin-to-regular stroke, angular corners. Prefer line icons with occasional filled states for active/selected.
- Color: default `#c7d0d9`; active `#22d3ee`; danger/warn use their respective tokens.
- Effects: subtle glow on active/focus (`rgba(34, 211, 238, 0.35)`).

## Text Treatments for States
- Dynamic/telemetry: matrix green `#7af57a`, limited to live data to avoid overuse.
- Interactive links/chat: accent cyan; underline or glow on hover to distinguish from static text.
- Warnings/errors: yellow/orange and red palette with bold labels; avoid pure red-on-black without buffer (use tinted panel).

## Accessibility Notes
- Maintain minimum 4.5:1 contrast for text; 3:1 for large text and icons.
- Avoid relying solely on color for status — pair with icons or text labels.
