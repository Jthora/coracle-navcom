# Telemetry and Checks

## Purpose
- Define what to measure in the guided setup to understand conversion, drop-off, and time-to-first-post.
- Specify minimal gating/checks to ensure users can post once they have a key, without over-blocking.

## Metrics to Capture
- Entry point: nav_desktop | nav_mobile | login | post_gate | notifications_strip.
- Path: managed | self_custody | import | external_signer.
- Step completion: start, key, profile, done.
- Drop-off: last step reached before exit.
- Time-to-first-post: duration from entering /signup to first successful post.
- Starter follows applied: boolean (on/off).
- Defaults applied: relays already present vs defaults set.
- Backup confirmation: boolean + timestamp for self_custody/import.
- Errors: counts by type (key generation failure, import invalid, signer unavailable).

## Event Schema (suggested)
- `onboarding_entry`: {entry_point}
- `onboarding_path_selected`: {path}
- `onboarding_step_completed`: {step}
- `onboarding_completed`: {path, starter_follows_applied}
- `onboarding_backup_confirmed`: {path, timestamp}
- `onboarding_error`: {type}
- `post_first_after_onboarding`: {time_since_start}

## Privacy/Safety
- Do not log key material, nsec values, or PII.
- Only log enums/booleans/timestamps; keep event payloads small.
- Avoid logging handle/display name content; log whether provided (boolean) if needed.

## Checks (Gates)
- Posting allowed if key present; block only when no key.
- Do not block on profile/follows/relays; allow completion without them.
- Backup reminder is non-blocking (self_custody/import) after signup.

## Error Handling Instrumentation
- Key creation failure: increment error count; include path=managed.
- Import invalid: error count; include path=import.
- Signer unavailable: error count; include path=external_signer.
- Relay/follow publish failure (optional): boolean flag, but do not block.

## Drop-off Analysis Targets
- Step drop-off rates (start→key→profile→done).
- Path abandonment rates (managed vs advanced options).
- Post-gate return success: % who return and post after completion.

## Performance Signals
- Time per step; highlight long waits (e.g., external signer or key gen).
- Network failure rates on follows/relays publication (if instrumented).

## Reminder/Task Tracking
- Track whether backup_needed remains true after N sessions for self_custody/import.
- Track dismissals of reminders (count only, no content).

## Opt-In/Out Considerations
- Telemetry should follow existing app telemetry policy; respect any opt-out.

## Storage/Transport
- Use existing telemetry pipeline; batch where possible.
- Avoid sending from failed states where network is absent; queue if needed.

## Reporting
- Dashboards: conversion funnel (entry → completion), time-to-first-post, path distribution, backup confirmations.
- Alerts (optional): spike in onboarding_error by type; drop in completion rate; rise in signer unavailable errors.

## Success Criteria
- Completion rate improvement over baseline.
- Managed path median time-to-first-post < 60s.
- Self-custody backup confirmation rate improving over time with reminder tuning.

## Experimentation (Future)
- A/B CTA prominence (nav button vs link) if needed.
- A/B copy brevity on key step if drop-off persists.

## Testing/Validation
- Ensure events fire once per step.
- Simulate errors to confirm error events.
- Verify post-gate return tagging (time-to-first-post includes return segment).

## Data Hygiene
- Deduplicate events on retries where possible.
- Keep event names consistent; avoid schema drift.

## Security Notes
- Never log secrets; scrub inputs before emitting.
- Ensure import validation errors don’t leak user input.

## Edge Cases
- User already has key and visits /signup: emit entry and immediate completion with path=existing.
- Offline users: queue telemetry; allow onboarding to proceed if possible.
- External signer path with no response: emit error, allow switch to managed.

## Minimal Checks to Implement
- Key existence before posting.
- Optional: ensure relays array non-empty; if empty, auto-apply defaults silently (no blocking).

## Maintenance
- Revisit metrics after rollout; prune low-value events.

## Event Payload Shapes (examples)
- `onboarding_entry`: { entry_point, timestamp }
- `onboarding_path_selected`: { path, timestamp }
- `onboarding_step_completed`: { path, step, timestamp }
- `onboarding_completed`: { path, starter_follows_applied, timestamp }
- `onboarding_backup_confirmed`: { path, timestamp }
- `onboarding_error`: { path, type, is_retry, timestamp }
- `post_first_after_onboarding`: { path, time_since_start_ms }

## Sampling and Volume
- Default: send 100% for onboarding as volume is low; reconsider if load grows.
- If sampling added, do it per-session to keep funnels consistent.
- Cap error burst reporting if a loop causes spam; include dedupe keys.

## Alert Threshold Starters
- Completion rate drop >10% over 1h window vs 24h baseline → alert.
- Key creation failure rate >1% of starts → alert.
- External signer unavailable errors >5% of signer attempts → alert.
- Telemetry send failures (queue backlog) persists >5m → warn.

## Dashboards (concrete widgets)
- Funnel: entry → path → step1 → step2 → completion; sliced by entry_point and path.
- Time-to-first-post: median/95th by path; overlay changes/deploys.
- Error panel: stacked counts by type; trend over time.
- Backup confirmations: rate over time for self_custody/import only.
- Path mix: % managed vs advanced options; watch for regressions after UI tweaks.

## Implementation Notes
- Emit events from a single module to avoid schema drift; centralize constants.
- Use monotonic clock deltas where possible for time-to-first-post to avoid skew.
- Guard against duplicate emits on rerender; tie events to transitions not mounts.
- Queue events while offline; flush on regain; mark `was_offline=true` if used.
- For retries, include `is_retry` flag to separate user persistence from errors.

## QA Scenarios
- Managed happy path desktop/mobile: expect entry, path_selected, step_completed xN, completed, post_first.
- Self-custody import with bad key then good key: expect error(type=import_invalid) then success events.
- External signer timeout then switch to managed: expect error(type=signer_unavailable), path_selected(managed), completion.
- Offline during signup: events queued, flush after network returns; timestamps preserved.
- User with existing key visiting /signup: entry + completion(path=existing) only; no key generation.

## Data Governance
- Ensure PII scrubbers run on event payloads; unit-test with sample data.
- Maintain event versioning; if schema changes, add `version` field not rename fields silently.
- Document events in analytics catalog; keep docs synced with code.

## Rollout and Verification
- Stage rollout: enable telemetry in staging first; validate funnels and error rates against synthetic flows.
- Shadow mode for new events: emit but mark `debug=true` until validated; exclude from dashboards.
- Post-deploy check: within first hour, verify event volume and absence of schema errors in backend.

## Post-Launch Review
- After 1-2 weeks, compare completion and time-to-first-post vs pre-change baseline.
- Identify top error types; feed back into copy/UX or reliability fixes.
- Trim low-signal events to reduce noise and cost.

