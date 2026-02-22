# Stage 3 Rollback Drill Runbook

Status: Draft
Owner: Engineering + Release
Last Updated: 2026-02-21

## Purpose

Provide a controlled rollback drill procedure and report template for:

- `S3-P2-ST1-T2-SU1` Execute rollback in controlled env
- `S3-P2-ST1-T2-SU2` Record timings and recovery outcomes
- `S3-P2-ST1-T2-SU3` Update runbook with drill findings

## Preconditions

1. Current branch has Stage 3 telemetry and group flow changes merged.
2. `groups.cy.ts` telemetry assertions pass locally.
3. A staging-like environment target is available.
4. Feature-flag or release toggle path is defined for groups upgrade exposure.

## Drill Objective

Validate that groups-upgrade exposure can be quickly reduced or disabled while:

1. Preserving base group chat operation.
2. Preventing prolonged user-facing error spikes.
3. Producing measurable rollback timing data.

## Drill Roles

- Drill Lead: coordinates timeline and command execution.
- Observer: records timings and outcomes.
- Communications Owner: drafts and posts user-facing status updates.

## Drill Sequence

### Step 1: Baseline snapshot

Capture:

1. Current funnel metrics snapshot IDs.
2. Current error-rate and fallback-rate baselines.
3. Current active release toggle state.

### Step 2: Introduce controlled failure mode

In controlled env, trigger one of:

1. Elevated relay policy save failure path.
2. Security fallback spike simulation.
3. Setup/join conversion degradation simulation.

Record start timestamp (`T0`).

### Step 3: Execute rollback switch

1. Apply rollback toggle (or equivalent deployment rollback).
2. Confirm config propagation complete.
3. Record completion timestamp (`T1`).

Rollback duration:

`rollback_duration_ms = T1 - T0`

### Step 4: Post-rollback health verification

Validate within a fixed window:

1. Group setup/join surfaces load.
2. Core groups e2e smoke passes.
3. No new guard redirect regressions.
4. Error rates return toward baseline.

Record verification completion timestamp (`T2`).

Recovery verification duration:

`recovery_verification_ms = T2 - T1`

### Step 5: Communications confirmation

1. Post incident update with rollback complete status.
2. Confirm support channel received runbook status message.

## Minimum Acceptance Criteria

1. Rollback switch execution under agreed objective (default target: < 15 minutes).
2. Core groups smoke checks complete after rollback.
3. No unresolved High severity alerts remain after recovery window.
4. Report artifacts are captured and linked in tracker notes.

## Drill Report Template

Use this structure for every drill run:

- Date/Time (UTC):
- Environment:
- Drill Lead:
- Observer:
- Scenario:
- `T0` failure injected:
- `T1` rollback complete:
- `T2` verification complete:
- `rollback_duration_ms`:
- `recovery_verification_ms`:
- Alerts triggered:
- Alerts resolved:
- User-impact summary:
- Action items:

## Known Failure Modes Checklist

- [ ] Setup flow unavailable.
- [ ] Join flow degraded.
- [ ] Relay policy save failures elevated.
- [ ] Security fallback alerts elevated.
- [ ] Guard redirect unrecovered rate elevated.

## Post-Drill Update Rules

After every drill:

1. Add a report instance to this file under "Drill Reports".
2. Add evidence bullet to `progress-tracker.md` Stage 3 notes.
3. Update any target thresholds if drill shows miscalibration.

## Drill Reports

### DR-2026-02-21-01 (Template Placeholder)

- Date/Time (UTC): pending
- Environment: pending
- Drill Lead: pending
- Observer: pending
- Scenario: pending
- `T0` failure injected: pending
- `T1` rollback complete: pending
- `T2` verification complete: pending
- `rollback_duration_ms`: pending
- `recovery_verification_ms`: pending
- Alerts triggered: pending
- Alerts resolved: pending
- User-impact summary: pending
- Action items: pending

## Notes

This runbook is intentionally explicit so `S3-P2-ST1-T2` can be validated from repeatable evidence rather than ad-hoc notes.
