# Key Custody

## Purpose
- Define the key custody approach for guided setup: managed-first, with a clear advanced path for self-custody/import/external signer.
- Keep the main path simple and fast while preserving opt-in control for advanced users.

## Paths
- Managed (recommended, default): app generates/stores a Navcom key; export available later.
- Self-custody: generate locally; user must back up; path explicitly chosen.
- Import: user pastes an existing nsec; treated like self-custody for backup reminders.
- External signer: use browser extension or external app; no backup prompt inside Navcom (external owns key).

## Defaults
- Default selection: Managed.
- Advanced entry: "Advanced options" link on key step exposes self-custody/import/external.
- External signer is not default; it’s an escape hatch for users who know what they’re doing.

## Managed Path Details
- Generation: create key in-app; store securely per existing patterns.
- Export: offer after signup (settings and post-signup reminder light-touch).
- Backup: no hard requirement; optional reminder to export.
- Posting: allowed immediately once key is created.

## Self-Custody Path Details
- Generation: create key locally; show it once; require user to acknowledge backup.
- Backup requirement: show checkbox "I saved my key"; set `backup_needed=true` until confirmed.
- Storage: do not persist the key without user consent; ensure copy/download options.
- Posting: allowed after key exists; backup reminder persists until confirmed.

## Import Path Details
- Input: paste nsec; validate format; reject invalid input.
- Backup: assume user should confirm backup; set `backup_needed=true` until acknowledged (even if they imported, we prompt gently).
- Posting: allowed after import succeeds.

## External Signer Path Details
- Trigger external signer (extension/app); attach pubkey when available.
- Backup: generally skipped; assume signer manages it; do not nag.
- Failure case: if signer absent/unresponsive, suggest managed path.

## UI Structure (Key Step)
- Heading: "Set up your key"
- Primary: managed card/button (selected by default): "Use recommended setup" + short helper.
- Secondary: link to "Advanced options" expanding self-custody, import, external signer.
- Error handling: concise errors; keep user on step.

## Backup Strategy
- Managed: mild export prompt post-signup; no blocking.
- Self-custody/import: persistent reminder until user confirms backup; allow dismiss only after confirmation.
- External signer: no backup reminder.

## Risks & Mitigations
- Risk: Managed path feels unsafe to power users → provide clear advanced link.
- Risk: Users skip backup on self-custody → persistent reminder until confirmed.
- Risk: External signer unresponsive → fallback copy to choose managed; keep retry.
- Risk: Users think managed is locked-in → emphasize "Export anytime" in copy and a visible export action in settings.

## Data/Flags
- `onboarding_path`: managed | self_custody | import | external_signer.
- `backup_needed`: true for self_custody/import until confirmation; false for managed/external.
- `backup_confirmed_at`: timestamp when user confirms backup.

## Telemetry (tie to telemetry doc)
- Log path selection (enum only).
- Log backup confirmation event for self_custody/import.
- Do not log key material.

## Copy Hooks (see copy doc)
- Managed: "We’ll create and store a Navcom key for you. Export anytime."
- Self-custody: "Bring or generate your own key; you must back it up."
- Import: "Paste your key (nsec…)"
- External: "Use external signer"

## Blocking Rules
- Only block posting if no key present.
- Do not block on backup confirmation; use reminder for self-custody/import.

## Export Availability
- Managed: settings entry for "Export key"; post-signup toast/banner.
- Self-custody/import: provide copy/download when created/imported; allow re-view if safely stored (consider not storing raw key after step).

## External Signer UX
- If extension detected: show option; if not, still show but note may fail.
- If mobile signer: provide appropriate link scheme when available.
- Failure message: concise; suggest managed path.

## Security Notes
- Ensure managed key storage follows existing secure store patterns; avoid leaking via logs.
- Validate imports; do not store invalid inputs.
- Clear key material from memory when leaving self-custody/import step, unless user consents to store.

## Edge Cases
- User switches path mid-step: update `onboarding_path`, reset backup flags as needed.
- User already has a key and enters /signup: show "You already have a key" and offer switch/import.
- External signer attached but no response: keep user on step; allow switching to managed.

## Testing Scenarios
- Managed happy path: create key, proceed to profile, post works.
- Self-custody: generate key, require backup confirmation, reminder persists until confirmed.
- Import: reject bad nsec, accept good, set backup_needed=true.
- External signer: signer available vs unavailable; fallback to managed.
- Path switch: move from advanced to managed; ensure flags update.

## Open Questions
- Should we store self-custody key beyond the step if user doesn’t confirm backup? (Default: avoid storing; require copy/backup now.)
- Should import path skip backup reminder if user asserts they already backed up? (Default: still remind once; allow one-click confirm.)

## Minimal Visual Guidance
- Use cards or radio-like selections to show paths; primary styled for managed, secondary for advanced options.
- Keep descriptions to one short sentence per option.

## Performance/UX
- Key generation should be instant; if not, show a short spinner with brief text.

## Localization
- Keep strings simple; avoid technical terms for managed path.

## Future-Proofing
- Room to add hardware signer or account-recovery link later without changing defaults.

