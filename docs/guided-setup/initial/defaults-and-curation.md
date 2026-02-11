# Defaults and Curation

## Purpose
- Define sensible defaults (relays, follows) applied silently to reduce friction for new users.
- Keep optional curation lightweight: a single toggle for starter follows, no mandatory choices.

## Relays
- Default behavior: auto-apply a curated list of default relays without prompting during onboarding.
- Rationale: Avoid exposing relay concepts to newcomers; they just need posts to load.
- Source: use existing env DEFAULT_RELAYS; ensure they are write-capable where needed.
- Visibility: do not show in the main flow; editable later in settings.

## Follows
- Default behavior: offer a single toggle "Add starter follows" on profile/final step.
- State: toggle on by default; user can uncheck to skip.
- Content: curated list of recommended follows (kept small and relevant).
- Rationale: Seed feeds so new users see content immediately; avoid overwhelming with choices.

## Profile
- Optional; allow skip.
- Keep fields minimal: handle/display name.
- No blocking on avatar/about.

## Application Timing
- Relays: applied when key is set (or at flow completion) without user input.
- Follows: applied if toggle remains on when finishing the flow; otherwise skipped.

## Post-Flow Adjustability
- Users can edit relays and follows later via settings and follow UI.
- No irreversible actions; defaults are reversible.

## UI Placement
- Starter follows toggle appears on the profile or final step; concise label and helper.
- Relays are not shown in-flow; handled silently.

## Copy (see copy doc)
- Toggle label: "Add starter follows"
- Helper: "See posts right away; you can change later."

## Edge Cases
- If default relays fail: app should still function; allow fallback to remaining relays.
- If starter follows fail to publish: do not block completion; optionally show a mild toast.
- Returning users with existing relays/follows: do not overwrite; skip applying defaults.

## Logic for Applying Defaults
- Relays: if user has none at flow end, set defaults.
- Follows: if toggle is on, publish starter follows; if off, do nothing.
- Respect existing data: detect existing relays/follows and avoid duplicates.

## Data Sources
- DEFAULT_RELAYS: from env/state.
- Starter follows: curated list maintained in code/config; small and updated periodically.

## Telemetry Hooks
- Record whether starter follows were applied (boolean).
- Record if relays were already present or defaults were applied.
- Do not log lists of follows or relays; only counts/boolean.

## Non-Goals
- Do not force the user to pick relays or follows during onboarding.
- Do not surface relay terminology in the main flow.

## Testing Scenarios
- New user, defaults applied: verify relays set, follows published, no prompts shown.
- Toggle off: ensure no follows are added; relays still auto-set.
- Existing user with relays/follows: ensure no override; skip defaults.
- Failure to publish follows: flow still completes; optional toast.

## Performance/Resilience
- Apply defaults in the background; avoid delaying completion screen.
- If network fails, retry in background; do not block user.

## Minimal UX Impact
- No additional steps/screens for defaults.
- Single toggle for starter follows; nothing else exposed.

## Future-Proofing
- Room to swap starter lists by locale or campaign without changing flow steps.
- Ability to add a second toggle (e.g., "Add Ops follows") later if needed, but keep default off unless required.

## Safeguards
- Deduplicate follows before publishing to avoid redundant tags.
- Validate relay URLs; use normalized forms.

## Rollout Considerations
- If changing DEFAULT_RELAYS, ensure they are healthy before shipping.
- Keep starter follows list curated and small to avoid noise.

## Observability
- Monitor success rate of applying defaults; log failures (non-PII) for relay/follow publishing.
- Track effect on time-to-first-post and feed engagement post-onboarding.

## User Control Post-Onboarding
- Provide clear path to remove starter follows (unfollow) and edit relays in settings.

