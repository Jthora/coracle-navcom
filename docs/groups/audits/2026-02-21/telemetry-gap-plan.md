# Group UX Telemetry Gap Plan

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `task-flow-matrix.md`, `ia-and-copy-audit.md`

## 1) Purpose

Define telemetry needed to evaluate and improve:

- Ease-of-group-creation
- Ease-of-group-chat onboarding
- Invite/share conversion
- Guided vs Expert usability outcomes

## 2) Current Gap Summary

Current telemetry is stronger for protocol/transport diagnostics than for novice UX task conversion.

Primary missing visibility:

- Where users abandon group setup
- Whether users can complete first-message journey
- How invite links convert into active membership and chat activity
- Whether guided/expert mode choice impacts completion rates

## 3) KPI Framework

### North-star UX KPIs

1. Create-to-first-message completion rate
2. Median time to first successful group message
3. Invite accept-to-active-membership conversion rate
4. Invite accept-to-first-message conversion rate
5. Group setup abandonment rate by step

### Quality guard KPIs

1. Redirect/guard-trigger rate (invalid ID, elevated route blocked)
2. Secure-mode intent vs fallback realization rate
3. Room relay selection completion rate (once implemented)

## 4) Event Taxonomy (Proposed)

## 4.1 Group setup funnel

- `group_setup_started`
  - props: `entry_point` (`groups_list`, `invite_accept`, `deep_link`, `chat_prompt`), `mode` (`guided`, `expert`)
- `group_setup_step_completed`
  - props: `step` (`name`, `privacy`, `relay`, `invite`, `confirm`), `mode`
- `group_setup_validation_error`
  - props: `step`, `error_code`, `mode`
- `group_setup_abandoned`
  - props: `last_step`, `mode`, `elapsed_ms`
- `group_setup_completed`
  - props: `mode`, `elapsed_ms`, `used_default_relays`, `secure_intent`

## 4.2 Join/invite funnel

- `group_invite_viewed`
  - props: `group_entries_count`, `invalid_entries_count`, `has_people_payload`, `has_relays_payload`
- `group_invite_destination_opened`
  - props: `destination` (`group_chat`, `join_flow`), `auto_join` (bool)
- `group_join_started`
  - props: `entry_point` (`invite`, `manual_address`, `deep_link`)
- `group_join_submitted`
  - props: `entry_point`
- `group_join_active_detected`
  - props: `time_since_join_submit_ms`

## 4.3 First-message success funnel

- `group_chat_opened`
  - props: `entry_point`, `has_active_membership`, `mode`
- `group_first_message_attempted`
  - props: `entry_point`, `mode`
- `group_first_message_succeeded`
  - props: `elapsed_since_setup_start_ms`, `mode`, `security_runtime_state`
- `group_first_message_failed`
  - props: `error_type`, `mode`

## 4.4 Security/fallback comprehension events

- `group_security_state_shown`
  - props: `state` (`secure`, `compatibility`, `fallback_active`, `blocked`)
- `group_security_details_opened`
  - props: `state`
- `group_secure_intent_blocked`
  - props: `reason_code`, `recovered_via_fallback` (bool)

## 5) Funnel Definitions

### Funnel A: Create -> First Message

1. `group_setup_started`
2. `group_setup_completed`
3. `group_chat_opened`
4. `group_first_message_succeeded`

Primary metrics:

- completion rate step 1 -> 4
- median elapsed time
- drop-off by step

### Funnel B: Invite -> Active Member -> First Message

1. `group_invite_viewed`
2. `group_invite_destination_opened`
3. `group_join_submitted`
4. `group_join_active_detected`
5. `group_first_message_succeeded`

Primary metrics:

- invite conversion rates
- where conversion fails
- latency between join and active status

## 6) Instrumentation Priorities

### P0

- Setup started/completed/abandoned
- Join submitted/active detected
- First message attempted/succeeded/failed

### P1

- Security-state shown/details opened
- Secure intent blocked + fallback usage

### P2

- Copy-level interaction metrics (tooltip/help opens)
- Guard redirect explanation interactions

## 7) Data Hygiene and Privacy Rules

1. Do not log message content.
2. Do not log full group IDs; log normalized shape/hash only.
3. Do not log pubkeys in plain form.
4. Log booleans/counts/reason codes, not sensitive payload details.

## 8) Dashboards and Alerting

### Dashboard panels

1. Setup funnel conversion (guided vs expert)
2. Invite funnel conversion
3. Time-to-first-message distribution
4. Security-state exposure and fallback rates
5. Guard redirect frequency and recoveries

### Alerts

- Sudden drop in setup completion > threshold
- Spike in first-message failures
- Elevated secure-intent blocked rate
- Elevated guard redirect rate for settings/moderation

## 9) Rollout Measurement Plan

- Phase 1: Baseline current flow metrics (pre-UX changes)
- Phase 2: Guided mode pilot metrics
- Phase 3: Compare guided vs expert outcomes
- Phase 4: Promote defaults based on measured completion and trust signals

## 10) Implementation Notes

Use existing telemetry pathways for consistency (e.g., group telemetry helpers) and keep event names deterministic and versioned where necessary.

## 11) Exit Criteria

- Baseline and post-change funnels available in dashboard
- Drop-off locations clearly attributable to flow steps
- Invite conversion and first-message outcomes measurable by entry path
- Security-state comprehension proxy metrics available
