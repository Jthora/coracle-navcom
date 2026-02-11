# Edge Cases and Recovery Paths

## Purpose
- Enumerate edge cases during onboarding and immediate post-onboarding.
- Define how to recover without blocking users from posting once a key exists.
- Keep managed-first defaults intact while allowing graceful downgrades/upgrades.

## Principles
- Never strand a user with a key but no path forward; always surface a recover action.
- Prefer silent fixes (e.g., auto-apply relays/follows) over hard errors.
- Treat external dependencies (relays, signers) as unreliable and plan fallbacks.
- Preserve user intent: if they chose self-custody/import, do not silently convert to managed unless they confirm.

## Key Existence Mismatches
- User arrives with an existing key in storage but `/signup` is opened:
  - Show completion state instantly; avoid regenerating.
  - Offer optional profile/follows step as a non-blocking card.
- User starts managed, navigates away mid-step, returns later:
  - Detect partial managed key; resume from next step; avoid duplicate generation.
- Self-custody import partially entered (clipboard lost):
  - Clear incomplete input; keep them on import step with helper copy.

## External Signer Path Failures
- Signer not reachable:
  - Show soft error; offer switch to managed path with one tap.
  - Keep signer option available; do not lock them out.
- Signer times out after request sent:
  - Surface retry with clear countdown; log telemetry.
- User denies signer request:
  - Return to signer step with message; present managed fallback CTA.

## Import Errors
- Invalid nsec/bech32 parse:
  - Show concise validation error; do not block retries.
  - Preserve pasted text only if safe; otherwise clear to prevent confusion.
- Wrong length/charset:
  - Inline guidance; keep paste button visible.
- Encrypted backup import without password:
  - Prompt for password; allow cancel back to managed.

## Relay Failures During Defaults Application
- Defaults failed to publish:
  - Do not block completion; set `relays_applied=false` flag for reminder.
  - Retry silently on next app focus; cap retries.
- User already has relays:
  - Skip applying defaults; avoid duplicates.
- Offline during relay publish:
  - Queue publish; mark state `pending_publish`; notify when sent.

## Starter Follows Issues
- Starter toggle on but publish fails:
  - Mark `starter_applied=false`; keep onboarding completed.
  - Retry in background; if failure persists, surface non-blocking toast later.
- User deselects starter follows mid-step:
  - Honor choice; do not reapply silently.

## Profile Save Failures
- Avatar upload fails:
  - Show retry; allow skip; keep key usable.
- Display name/save fails due to network:
  - Cache locally; retry on reconnect; do not block posting.

## Navigation Interruptions
- Closing tab/app mid-step:
  - Persist step progress; resume at last known checkpoint.
- Deep link to `/signup` while already mid-flow elsewhere:
  - Prefer resume state; if conflicting, show chooser: resume or restart.

## Multi-Device Concurrency
- User creates managed key on device A, then opens signup on device B:
  - If sync detects key on B, mark as existing and skip creation.
  - If no sync, B may create new managed key; clarify conflict only if detected.

## Offline First-Run
- User opens signup fully offline:
  - Managed key generation works locally; allow completion sans relays/follows.
  - Queue relay/follow publish; show offline badge.
- External signer path offline:
  - Block signer handshake; suggest managed path or wait and retry.

## Permissions Issues
- Camera/photo access denied for avatar:
  - Offer file picker; allow skip.
- Clipboard denied for paste:
  - Show paste helper text; still allow typing import manually.

## Recovery Surfaces
- On completion screen: small card "Having trouble? Retry relays/follows" when flags false.
- Settings > Account: show relays/follows status with retry buttons.
- Backup reminders: if `backup_needed` true, keep surfacing until confirmed (self/import).

## State Flags to Track
- `has_key`: true once any key present (managed/import/self/signer).
- `relays_applied`: true when defaults or user relays present.
- `starter_applied`: true when starter follows sent successfully.
- `backup_needed`: true for self/import until confirmed.
- `pending_publish`: true if queued relay/follow writes exist.

## Transitions and Resets
- If user switches from advanced to managed mid-flow:
  - Mark old attempt abandoned; start clean managed key unless existing key already present.
- If user tries to switch from managed to self-custody after key exists:
  - Require explicit confirmation; warn about new key vs exporting existing (future feature).

## Edge Copy Guidelines
- Keep errors short, actionable; avoid jargon.
- Always present a positive path forward (retry, switch, skip).
- Avoid fear-based language; emphasize continuity ("You can finish later").

## Testing Matrix (scenarios)
- Managed: network up/down during relays/follows; verify completion not blocked.
- Import: invalid → valid; ensure state clears and telemetry logs.
- Signer: timeout → retry; timeout → switch to managed; denial → retry.
- Offline: complete flow; later online publishes relays/follows successfully.
- Multi-device: existing key detected; ensure no duplicate generation.

## Observability for Edge Cases
- Emit `onboarding_edge_case` with {type, path, recovered:boolean} for: signer_timeout, relay_publish_fail, starter_fail, offline_flow, duplicate_key_detected.
- Track retries count per type to catch loops.
- Ensure edge-case events are sampled with same session key to stitch funnel.

## Post-Onboarding Guards
- Posting attempt with no relays configured:
  - Auto-attach defaults silently; if impossible, soft-warn with retry.
- Posting with signer unavailable (external signer path):
  - Offer to switch to managed or retry signer; never dead-end.

## Data Integrity
- Avoid partial writes: if starter follows partially apply, mark which ids succeeded if cheap; otherwise mark boolean false and retry later.
- Ensure dedupe on relay list to prevent bloating.

## UX Placement for Recovery
- Inline banners only when action is available; otherwise use subtle status text.
- Avoid modal traps; all recovery actions should have a close/skip.

## Accessibility
- Error/retry affordances keyboard-navigable and screen-reader labeled.
- Timeouts communicated with text, not only color/animation.

## Performance
- Timeouts for signer/relays retries should be bounded; avoid blocking main thread.
- Backoff on retries to prevent relay spam.

## Security Considerations
- Do not expose key material in error messages.
- When switching paths, make explicit what happens to keys.

## Future Enhancements (optional)
- Export managed key flow with clear warnings; not blocking signup.
- Allow user to choose relay set template if defaults fail repeatedly.
- Smart retry scheduler prioritizing healthiest relays.

## Out-of-Scope (for now)
- Complex account merge across devices.
- Fully automated backup verification; manual confirmation only.

