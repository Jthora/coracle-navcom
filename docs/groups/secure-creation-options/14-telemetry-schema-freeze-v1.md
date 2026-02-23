# Telemetry Schema Contract v1

Status: Draft for Approval
Owner: Engineering + Security + Product Analytics
Last Updated: 2026-02-23

## Scope

This document finalizes canonical telemetry field names and semantics for group security mode behavior.

## Canonical Field Set

## Mode and Transport

- `security_mode_requested`: Requested security mode at action intent time (`auto|basic|secure|max`).
- `security_mode_resolved`: Effective runtime security mode (`auto|basic|secure|max`) when determinable.
- `requested_transport_mode`: Canonical transport request (`baseline|secure-pilot|compatibility`).
- `resolved_transport_mode`: Canonical transport resolution (`baseline|secure-pilot|compatibility`).

## Policy Outcomes

- `policy_block_reason`: Deterministic reason code for blocked action.
- `downgrade_reason`: Deterministic reason for transport/security downgrade.
- `mission_tier`: Invite/mission policy tier (`0|1|2`).
- `override_used`: Boolean flag indicating explicit policy override path.
- `override_reason`: Deterministic override audit reason code.

## Flow Context

- `flow`: `create|join|chat`.
- `entry_point`: UX origin (`groups_create|invite_prefill|manual_address|join_flow`).
- `result`: `success|warning|error|abandon`.

## Contract Rules

1. `security_mode_requested` MUST be emitted for create/join/chat attempts.
2. `policy_block_reason` MUST be emitted when result is blocked/error due to policy.
3. `requested_transport_mode` and `resolved_transport_mode` MUST be emitted for transport-resolved actions.
4. `security_mode_resolved` MAY be omitted only when runtime cannot resolve mode deterministically.
5. `override_used=true` REQUIRES `override_reason` and `mission_tier`.

## Event Families in Scope

- `group_setup_create_attempt`
- `group_setup_join_attempt`
- `group_setup_create_result`
- `group_setup_join_result`
- `group_setup_blocked_by_relay_requirements`
- `group_security_state_shown`
- `group_security_state_changed`

## Contract Notes

- This schema is finalized for P1 planning and must be implemented/validated through P6.4 tasks.
- Any field rename requires Decision Log update and contract migration note.
