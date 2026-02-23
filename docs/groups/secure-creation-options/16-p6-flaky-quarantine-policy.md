# P6 Flaky-Test Budget + Quarantine Policy

Date: 2026-02-23

## Policy Scope

This policy applies to P6 CI gate suites:

- `groups:test:unit:mode-matrix`
- `groups:test:ui:gates`
- `groups:test:smoke:max`
- `groups:test:smoke:secure`
- `groups:test:smoke:fallback`

## Flaky Budget

- Maximum quarantined specs at any time: `1`.
- Quarantine entries are tracked in `docs/cache/groups-flaky-quarantine.json`.
- Any CI run with quarantined spec count above `maxQuarantined` fails the build.

## Quarantine Rules

- Quarantine only when a test has reproducible nondeterministic infra/runtime behavior.
- Add an owner, reason, and expiry date in the quarantine record before merge.
- Quarantine is temporary; expired entries must be removed or renewed with justification.

## CI Enforcement

- CI step `Groups flaky budget gate` validates the quarantine file before UI/smoke gates.
- Validation command: `pnpm groups:test:flaky:budget`.
- Build fails when:
  - JSON schema/shape is invalid,
  - `quarantinedSpecs.length > maxQuarantined`,
  - any quarantine entry is expired.
