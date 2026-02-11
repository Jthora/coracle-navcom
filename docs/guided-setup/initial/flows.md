# Guided Setup Flows

## Flow Goals
- Deliver a three-step, managed-first onboarding that gets a user posting quickly.
- Avoid inline education; keep choices minimal and defaults smart.
- Keep landing page unchanged; entry via nav/login/post-gate only.

## Entry Points
- Nav (desktop/mobile): "Get started" link to /signup.
- Guest post attempt: intercept and route to /signup (not /login).
- Login screen: primary CTA for guided setup above other sign-in options.
- Optional: Notifications strip for onboarding_pending users (post-signup nudges only).

## Core Path (Managed-First)
1) Start
   - Plain-language value prop: "Post in under a minute."
   - CTA: Continue to key step.
   - External links: "What is Nostr?" (opens new tab) for those curious.
2) Key Choice (default managed)
   - Primary: Managed key (generate/store, export later), one-tap.
   - Secondary (link): Advanced/self-custody/import/external signer.
   - External signer option remains available but not primary.
3) Profile Lite
   - Handle/display name fields; optional skip.
   - No blockers; skip allowed.
   - Finish → go to app.

## Post-Signup (Lightweight)
- Backup reminder: toast/banner for self-custody until confirmed; mild export prompt for managed.
- Optional mini-tour link; not forced.

## Defaults & Automation
- Relays: Auto-apply default relays silently; no step.
- Follows: Optional "Add starter follows" toggle (default on). If off, proceed without follows.
- Profile: Optional; allow skip.

## Branching Logic
- Managed path: default selection; proceed immediately.
- Advanced path: reveals self-custody (local gen), import (nsec), or external signer link.
- External signer (nstart/extension) remains an escape hatch; do not force novice users there.

## Skip/Return Behavior
- If user closes tab mid-flow: resume at last completed step (track in store/session).
- If key exists but profile/follows incomplete: mark onboarding_pending=false once key is set; allow reminders for profile/follows optionally.
- If backup not confirmed (self-custody): show post-signup reminder; do not block posting.

## Routing/Modal Patterns
- /signup can be full page or modal from login/post-gate; keep URL addressable.
- Post-gate: route to /signup with return target preserved for after completion.

## Screen Content Guidelines
- Keep copy short; no protocol terms; say "Navcom key" and "Signs your posts." 
- Buttons: "Get started", "Use recommended setup" (managed), "Advanced options", "Skip for now", "Continue".
- Avoid multi-column complexity on mobile; maintain clarity.

## Error Handling in Flow
- Managed key generation failure: retry path; fallback message to try again.
- External signer unavailable: suggest managed path instead.
- Import validation: detect bad nsec, show concise error, keep user on step.

## Success Criteria per Step
- Start: CTA clicked.
- Key: Key created/imported/attached; path recorded (managed/advanced/import/external).
- Profile: Saved or skipped; do not block.
- Completion: onboarding_complete flag set; redirect to intended destination or app home.

## Post-Flow Nudges
- Self-custody: persistent backup reminder until confirmed.
- Managed: soft export reminder (non-blocking) after first session.
- No relays/follows/profile blockers; only optional reminders.

## External Links Usage
- Allowed: "What is Nostr?", "Learn more", external signer link.
- Not allowed: Multi-step educational detours in-flow.

## Mobile/Desktop Considerations
- Single-column on mobile; avoid dense lists.
- Keep video/media optional and external; do not embed heavy assets in steps.

## Data to Capture (for telemetry doc)
- Entry point (nav/login/post-gate).
- Path (managed/self-custody/import/external).
- Step completions and drop-offs.
- Time-to-first-post after completion.
- Backup confirmation status (self-custody).

## Non-Goals in Flow
- Forcing follows/relays/profile completion.
- Requiring wallet/zap setup.
- Educating users on protocol internals.

## Recovery Paths
- "Switch/import key" link available from settings/login post-flow.
- "Restart setup" option for users who want to rerun onboarding.

## Minimal Visual Impact
- No changes to landing page content.
- CTAs added only to nav/login/post-gate surfaces.

## Implementation Notes
- Keep components lean; reuse existing Button/Modal patterns.
- Use router to preserve return path from post-gate.
- Store flow stage in a recoverable store (localStorage or session) for resume.

## Open Decisions
- Whether to show starter follows toggle by default on step 3 or as a pre-checked option.
- Whether to surface a mini-tour link on completion screen or via toast.

## Completion Redirect
- If user came from a gated action (e.g., post), return there after completion.
- Otherwise, go to default feed/home.

## Accessibility
- Ensure buttons/links are focusable; provide aria labels where needed.
- Keep color contrast aligned with existing design tokens.

## Security/Privacy
- Managed key handling must follow existing secure storage pattern.
- Avoid logging secrets; telemetry must not capture key material.

## Testing Considerations
- Flows: managed path happy path; advanced path; external signer unavailable; import error.
- Resume logic: refresh mid-flow; close tab and reopen /signup.
- Post-gate return: attempt post as guest → /signup → return and post.

## Out-of-Flow Education
- Provide a single link to external resources; avoid adding steps.

