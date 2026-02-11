# CTA Placement

## Purpose
- Define where to surface “Get started” / guided-setup calls-to-action without modifying the landing page content.
- Ensure new users encounter a clear entry into /signup when they try to post or explore, while keeping the experience unobtrusive for readers.

## Surfaces
- Nav (desktop)
- Nav (mobile)
- Login screen
- Post attempt gate (guest trying to post)
- Optional: Notifications strip for onboarding_pending users (post-signup reminder only)

## Nav (Desktop)
- Add a primary or secondary button/link: "Get started" pointing to /signup.
- Visibility: show when logged out or onboarding_pending=true; hide when onboarding_complete or logged in with a key.
- Placement: near existing login link; avoid displacing critical nav items.

## Nav (Mobile)
- In the SliderMenu, add a prominent menu item: "Get started" → /signup.
- Visibility: same as desktop (logged out or onboarding_pending).
- Icon: simple user-plus or rocket; keep label clear.

## Login Screen
- Promote guided setup at the top of the options list:
  - Button: "Guided setup (recommended)" → /signup.
  - Existing sign-in options remain below (extension, external signer, remote signer, browse signers).
- Supporting copy: "New to Navcom? We’ll set up your key and get you posting quickly."

## Post Attempt Gate
- If a guest clicks Post/Create:
  - Intercept and route to /signup with a return target.
  - Message: "You need a key to post. We can set one up now." + CTA "Get started".
  - Secondary: "Advanced options" (link to advanced path within /signup).

## Notifications Strip (Optional)
- For onboarding_pending users post-signup, show a small banner inside Notifications: "Finish setup" (if any pending task like backup for self-custody). Hide when complete.

## Visibility Rules
- Show CTAs when: not logged in OR onboarding_pending=true.
- Hide CTAs when: onboarding_complete=true AND key present.
- Do not show on landing hero; keep hero unchanged.

## Copy Guidelines (per surface)
- Nav/Login/Post-gate: "Get started" / "Guided setup".
- Post-gate helper: "We’ll set up your Navcom key so you can post."
- Keep labels short; avoid jargon.

## Interaction Patterns
- Nav/login/post-gate CTAs navigate to /signup; preserve return target for post-gate.
- Do not open external links from these CTAs; all in-app.

## Mobile Considerations
- Ensure CTA is reachable within the initial menu view; avoid burying below folds.
- Keep label short to prevent wrapping.

## Desktop Considerations
- If using a button style in nav, use a low/accent style that matches existing design without crowding.

## State Awareness
- If a user already has a key and hits /signup via CTA, show a light message and offer "Switch/import key" or "Go back".
- If onboarding_pending=false but user is logged out, still show “Get started” (new account flow).

## Ordering Recommendations
- Nav (desktop): Login (or Account) then "Get started".
- Nav (mobile): Cluster primary actions near the top of the menu.
- Login: Guided setup first, then extension/signer options, then remote signer, then browse signers.

## Non-Goals
- No changes to landing hero or main content.
- No intrusive modals on page load.

## Fallback Behavior
- If /signup fails to load, keep user on current page and show a small error toast; retain ability to retry.

## A/B Room (Future)
- Could test placement prominence (button vs link) in nav if needed; not required initially.

## Accessibility
- Ensure CTA elements are focusable, keyboard-navigable.
- Provide aria-labels matching visible text.

## Telemetry Hooks (for telemetry doc)
- Capture surface where CTA was clicked (nav_desktop/nav_mobile/login/post_gate/notifications_strip).
- Capture whether user completes onboarding after CTA click.

## Visual Restraint
- Match existing button/link styles; avoid introducing new theme elements solely for CTAs.

## Edge Cases
- User clicks CTA while already in /signup: keep idempotent (no-op or gentle message).
- User clicks post-gate CTA, completes flow, then returns: ensure return target is honored.

## Implementation Notes
- Use router helpers to preserve return path in query/state for post-gate.
- Reuse existing menu item components for nav/mobile.
- Keep copy sourced from copy-and-voice.md.

## Summary
- CTAs live in nav (desktop/mobile), login, and post-gate; optional reminders in Notifications.
- They appear only when useful (logged out or onboarding_pending) and never alter the landing page hero.

