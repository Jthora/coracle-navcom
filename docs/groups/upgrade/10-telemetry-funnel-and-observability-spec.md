# Telemetry, Funnel, and Observability Spec

Status: Draft
Owner: Data + Engineering
Last Updated: 2026-02-21

## Objective

Define funnel telemetry and dashboard requirements to validate UX improvements.

## Required Funnels

- Create room -> first message
- Invite accept -> active member -> first message
- Guided mode completion vs expert mode completion

## Required Event Families

- setup started/completed/abandoned
- join started/submitted/active
- invite viewed/destination opened/conversion
- first-message attempted/succeeded/failed
- security-state shown/details opened/fallback activated

## Dashboard Requirements

- Conversion by entry point
- Step drop-off by mode
- Time-to-first-message distribution
- Guard redirect incidence and recovery

## Acceptance Criteria

- Baseline and post-change funnels measurable
- Alert thresholds for major regressions defined

## Critique of Prior Draft

The prior draft listed event families but not event contracts.
It did not define required properties per event.
It did not define governance for schema evolution.

## Event Contract Requirements

Every event must define:

1. Event name.
2. Trigger condition.
3. Required properties.
4. Optional properties.
5. Privacy constraints.

## Core Property Set

- `mode` (guided/expert)
- `entry_point`
- `room_context_present`
- `security_state`
- `relay_policy_state`
- `result` (success/failure/abandon)

## Funnel Definitions

### Create Funnel

Start: create intent.
End: first successful message.

### Join Funnel

Start: invite/join intent.
End: first successful message in joined room.

### Security Comprehension Funnel

Start: security status viewed.
End: recovery action completed when degraded state detected.

## Regression Alerts

- Create funnel conversion drop above threshold.
- Join funnel time-to-completion spike.
- Increase in guard redirects without recovery.
- Increase in fallback-active duration.

## Dashboard Segmentation

Segment by:

- Mode.
- Platform form factor.
- Entry point.
- New vs returning user.

## Data Quality Checks

1. Event volume sanity by release.
2. Property completeness checks.
3. Duplicate event detection.
4. Clock/order anomalies.

## Telemetry Governance

- Version event schemas.
- Deprecate only after replacement active.
- Maintain event dictionary in docs.

## QA Telemetry Assertions

For every P0 e2e test assert:

- start event emitted.
- completion or failure event emitted.
- mode and entry point properties present.

## Exit Criteria

Telemetry spec is complete when:

- Funnels have stable definitions and owners.
- Dashboards exist for baseline and post-change comparison.
- Alert thresholds are configured and reviewed.

