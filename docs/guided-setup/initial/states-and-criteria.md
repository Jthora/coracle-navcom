# States and Criteria

## Purpose
- Define the minimal state machine for onboarding so the app can decide when to show the guided flow, when to nudge, and when to consider a user ready to post.
- Keep requirements minimal: only require a key to post; avoid gating on profile/follows/relays.

## Core Flags
- `onboarding_pending` (boolean): true until the flow is finished; false after completion.
- `onboarding_complete` (boolean): inverse of pending; set true at flow completion.
- `onboarding_path` (enum): managed | self_custody | import | external_signer.
- `onboarding_stage` (enum): start | key | profile | done (for resume).
- `backup_needed` (boolean): true for self-custody until backup confirmed; false for managed by default.
- `backup_confirmed_at` (timestamp | null): when self-custody backup was acknowledged.
- `nstart_completed` (boolean): legacy/external signer completion flag (if kept); defaults false.

## Minimal Gating Rules
- Posting requires: presence of a key (any path). Do not require profile/follows/relays.
- Read-only usage: never blocked; flags do not affect reading.
- Completion requires: key exists + user reached final step; profile optional.

## Stage Progression Criteria
- start → key: user clicks continue from start.
- key → profile: key created/imported/attached; `onboarding_path` set.
- profile → done: user saves or skips profile; set `onboarding_complete=true`, `onboarding_pending=false`.
- done: redirect to intended destination; set resume stage to none.

## Backup Criteria
- Managed path: `backup_needed=false` by default; can show optional export prompt later.
- Self-custody/import: set `backup_needed=true` until user confirms backup; store `backup_confirmed_at` when acknowledged.
- External signer: treat as `backup_needed=false` (external app owns key), unless we decide to prompt for export later (optional).

## Nudges/Visibility
- Onboarding tasks/toasts shown when `onboarding_pending=true` or `backup_needed=true` (self-custody) and hidden when complete/confirmed.
- Notifications page: show OnboardingTasks if pending; hide when complete.
- Nav/login CTA: show “Get started” when not logged in; can hide after completion.

## Storage Expectations
- Use persistent store (e.g., localStorage-backed synced store) for `onboarding_stage`, `onboarding_path`, `backup_needed`, `backup_confirmed_at`.
- Session store for return target (post-gate) to redirect after completion.
- Do not store secrets in telemetry or plain logs.

## Resume Behavior
- On /signup load: check `onboarding_stage`; resume at last stage; if `onboarding_complete`, redirect to home/intended destination.
- If key exists but flags missing, infer `onboarding_complete=true` and set default path to managed (unless self-custody detected via signer/import flag).

## Detection Heuristics
- Key presence: use existing app store for pubkey/signer presence.
- Self-custody vs managed: set explicitly at key step based on user choice; do not guess unless necessary.
- External signer: set path to external_signer when that option is used.

## Error States
- If key creation/import fails: keep `onboarding_stage=key`; do not advance; show retry.
- If storage write fails: keep in-memory flags; warn user minimally.

## Interactions with Posting
- If no key and user attempts to post: set `onboarding_stage=start`, route to /signup with return target; on completion, return to post intent.
- If key exists but `onboarding_pending=true`: allow post; optionally show mild reminder toast after post.

## Interactions with Profile/Follows
- Profile not required to complete onboarding; `onboarding_complete` does not depend on profile.
- Follows/relays not required; defaults applied silently.

## Task Completion Logic
- Task list (if used) should reflect pending items: backup confirmation (self-custody) only.
- Mark tasks complete when corresponding flag set; hide component when none pending.

## Backward Compatibility
- Support legacy `nstartCompleted` flag; if true, allow progression to profile/done.
- If legacy users have keys but no flags, set `onboarding_complete=true` on first detection to avoid regressions.

## Safeguards
- Never block logout/switch account based on onboarding.
- Ensure `onboarding_stage` resets on account switch.

## Example State Transitions
- New user selects managed:
  - start (pending=true) → key (managed, key created) → profile (optional) → done (complete=true, pending=false, backup_needed=false).
- New user selects self-custody:
  - start → key (self_custody, key created) → profile → done (pending=false, backup_needed=true) + reminder.
- Returning user mid-flow:
  - start → resume at stored stage; if key exists and complete flag missing, set complete and proceed.

## Telemetry Hooks (for telemetry doc)
- Emit events on stage changes, path selection, completion, backup confirmation.
- Do not include key material; include booleans/enums only.

## Cleanup Conditions
- On onboarding completion: clear resume-specific state if not needed; keep path/backup flags for reminders.

## Open Questions
- Should managed users ever see backup_needed=true? (Default: no.)
- How to infer self-custody if user brings their own signer without using flow? (Default: path=external_signer, backup_needed=false.)
- Should profile skip affect any reminders? (Default: no reminders.)

## Testing Scenarios
- Fresh user managed path: ensure flags flip to complete and posting is allowed.
- Fresh user self-custody: ensure backup_needed=true and reminder shows post-signup.
- Import flow: set path=import, backup_needed=true until confirmed.
- Resume: abandon at key step, reload /signup, resume at key; abandon at profile, resume at profile.
- Post-gate: attempt post as guest, complete onboarding, return and post.

