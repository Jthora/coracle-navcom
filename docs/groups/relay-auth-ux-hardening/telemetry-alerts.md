# Telemetry + Alerts — Relay Auth + UX Hardening

## Core Events

- `group_setup_relay_checks_started`
- `group_setup_relay_checks_completed`
- `group_setup_relay_check_failed`
- `group_setup_relay_auth_started`
- `group_setup_relay_auth_result`
- `group_setup_relay_auth_expired`
- `group_setup_blocked_by_relay_requirements`
- `group_setup_share_package_created`

## Required Properties

- `flow` (`create` | `join`)
- `relay_count`
- `ready_count`
- `auth_required_count`
- `unreachable_count`
- `no_groups_count`
- `elapsed_ms`
- `result` (`success` | `warning` | `error`)

## Alert Recommendations

- Auth failure rate > 20% over 1h (per relay): alert.
- Relay probe unreachable spike > 30% over 1h: alert.
- Setup blocked by relay requirements > baseline + 2σ for 24h: investigate.

## Rollout Gate Metrics

- `create` completion rate with auth-required relays.
- `join` completion rate for invite-prefilled relay sets.
- Median auth resolution time.
- Drop-off rate between capability check and submit.
