# Room Relay Policy and Private Relay Spec

Status: Draft
Owner: Engineering + Product + Ops
Last Updated: 2026-02-21

## Objective

Define how each room chooses read/write relays, including user-owned private relays not in public rosters.

## Required Capabilities

- Room-specific relay set independent from global app relay defaults
- Add/edit/remove relay URLs manually
- Optional private relay access claim/credentials flow
- Health and capability indicators per selected relay
- Deterministic fallback behavior when selected relays fail

## Policy Decisions Needed

- Minimum relay count per room
- Required vs optional relay roles
- Behavior when all selected relays are unavailable
- Secure mode requirements across selected relays

## Acceptance Criteria

- User can configure and save per-room relay targets
- Private/self-hosted relay URLs are accepted and validated
- Publish/read paths honor room relay policy

## Critique of Prior Draft

The previous draft defined capability goals but not operational rules.
It did not specify policy conflict handling.
It did not define relay validation lifecycle.
It did not define user-facing behavior during partial outage.

## Relay Role Model

Each relay may have one or more roles:

1. Read-only.
2. Write-only.
3. Read/write.
4. Bootstrap/discovery support.

## Minimum Policy Constraints

- At least one writable relay required for posting.
- At least one readable relay required for history retrieval.
- Policy save blocked if constraints are unmet.

## Private Relay Handling

Required support:

- Manual relay URL entry.
- URL normalization and validation.
- Credential hinting surface (without credential leakage).
- Per-room opt-in for private relay usage.

## Validation Pipeline

When relay entries change:

1. Parse and normalize URL.
2. Check scheme and structural validity.
3. Attempt lightweight reachability/capability probe.
4. Persist with explicit status label.

## Status Labels

- Healthy.
- Reachable but limited capability.
- Unreachable.
- Unknown (not yet verified).

## Fallback Behavior Contract

1. If preferred write relay fails, try other writable relays in room policy.
2. If all writable relays fail, surface actionable publish error.
3. If read relays degrade, preserve compose capability when possible.

## UI Disclosure Requirements

- Show active relay set in room settings.
- Show per-relay status and last verification age.
- Show if runtime used fallback relay.

## Policy Conflict Examples

1. All relays set to read-only.
2. Private relay marked required but unreachable.
3. Secure mode requested where selected relay set cannot satisfy requirements.

## Policy Conflict Resolution Rules

- Block save for hard conflicts.
- Allow save with warnings for soft conflicts.
- Provide one-click fix suggestions where feasible.

## Telemetry Requirements

- `relay_policy_opened`
- `relay_policy_saved`
- `relay_policy_save_failed`
- `relay_health_changed`
- `relay_fallback_used`

## QA Scenarios

1. Add valid private relay and save.
2. Add invalid URL and verify field-level error.
3. Simulate writable relay outage and verify fallback behavior.
4. Save blocked on hard conflict with clear guidance.

## Exit Criteria

Relay policy work is complete when:

- Policy constraints are enforced.
- Private relay flow is test-covered.
- Fallback behavior is deterministic and visible.
