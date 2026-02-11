# Guided Signup Wireframes (Text Spec)

## Start (Desktop)
- Single column centered card, max-width 640px.
- Header: "Post in under a minute"; subtext: concise value prop.
- Primary CTA: "Get started" (accent, full width on mobile, 240px on desktop).
- Secondary: external link "What is Nostr?" aligned right, subtle.
- Background: existing app chrome; no hero media.

## Start (Mobile)
- Full-width stacked; CTA full-width; link below CTA.
- Keep copy to two lines max; avoid long words.

## Key Choice (Desktop)
- Two cards in a grid (2 columns): Managed (accent border when selected), Import.
- External signer block below grid, full width.
- Managed card: title, short description, two buttons (Use recommended, Keep selected).
- Import card: title, description, nsec input field, primary/secondary buttons.
- External signer: title, description, select button + "Open signer options" low-emphasis.
- Footer row: left helper text; right Back + "Skip for now" buttons.

## Key Choice (Mobile)
- Same content stacked single column; buttons full-width; external signer block below.
- Input spans full width; helper text above buttons.

## Profile Lite (Desktop)
- Single column form max-width 640px.
- Fields: handle, display name; starter follows toggle row.
- Buttons: Back (ghost), Continue (accent, full width on mobile, 240px desktop).
- Skip: integrated via Continue even if empty; copy notes skip allowed.

## Profile Lite (Mobile)
- Stacked fields and toggle; buttons full-width.

## Completion (Desktop/Mobile)
- Status list (relay defaults, starter follows, backup reminder) in a panel.
- CTA row: Back (ghost) + "Go to Navcom" (accent, full width on mobile).
- Dots progress indicator under main content.

## CTA Placement (Nav/Login/Post-Gate)
- Nav desktop: top bar button "Get started" if signed out; gated by flag.
- Nav mobile: bottom bar button "Get started" if signed out; gated by flag.
- Post-gate: post attempt routes to /signup with returnTo preserved; falls back to /login when flag off.

## States and Recovery
- Error copy inline under inputs; spinner on key actions; retry toasts for relays/follows.
- External signer timeout: inline warning, managed fallback CTA.
- Offline badge not shown; rely on toasts and queued retries.

## Visual Tokens
- Use existing buttons/panels/neutral palette; accent for primaries; minimal icons.
- Avoid new typography; keep current Navcom styles.
