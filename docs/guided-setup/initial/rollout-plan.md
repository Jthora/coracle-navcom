# Guided Signup Rollout Plan

## Flags
- `VITE_ENABLE_GUIDED_SIGNUP`: primary gate. Controls exposure of /signup and nav CTAs. Default: off in production, on in dev/staging.
- `VITE_ENABLE_GUIDED_SIGNUP_SHADOW`: shadow-mode telemetry. When true and primary is false, /signup remains reachable for measurement but CTAs point to login.

## Environments
- **Development**: enable both flags to exercise flow and telemetry end-to-end.
- **Staging**: start with shadow-only (primary=false, shadow=true) to validate telemetry and ensure redirects behave. Then enable primary for QA.
- **Production**: ship with primary=false, shadow=true for silent telemetry burn-in. Flip primary true gradually per ramp plan.

## Ramp / Checks
1) Shadow burn-in (prod, primary=false, shadow=true)
   - Verify onboarding_entry/path/step/completion/edge/error events volume and schema.
   - Check post_first_after_onboarding firing once per user after completion.
2) Limited enablement
   - Enable primary for small cohort (config/feature flag rollout). Monitor completions, errors, edge cases.
3) Full enablement
   - Enable primary for all users once error rates stable and funnel acceptable.

## Redirect Behavior Matrix
- primary=false, shadow=false: /signup redirects to /login; nav CTAs go to login.
- primary=false, shadow=true: nav CTAs go to login; /signup allowed (direct/deeplink) for telemetry/testing.
- primary=true: nav CTAs and post-gate go to /signup; flow fully active.

## Operational Notes
- Keep DEFAULT_RELAYS and DEFAULT_FOLLOWS curated and healthy before ramp.
- Monitor relay/starter application edge-case telemetry for retries; ensure toasts are non-blocking.
- Keep backup reminder enabled for self/import paths post-completion.
