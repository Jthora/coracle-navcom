# Invite Transport-Hint to Security Mode Mapping Contract

Status: Draft for Approval
Owner: Product + Security + Engineering
Last Updated: 2026-02-23

## Purpose

Define canonical behavior when invite payloads provide transport-level hints while runtime enforces mode-level contracts.

## Inputs

- Invite hint values: `baseline-nip29` | `secure-nip-ee` | missing/unknown.
- Mission tier: `0|1|2`.
- Runtime-selected security mode: `auto|basic|secure|max`.

## Mapping Rules

1. `baseline-nip29` hint maps to **preferred non-strict posture** (`auto` or `basic`).
2. `secure-nip-ee` hint maps to **preferred strict posture** (`secure` minimum; `max` allowed if preconditions pass).
3. Missing hint defaults to user-selected mode; no implied strict upgrade.
4. Unknown hint values are treated as invalid and trigger deterministic warning behavior.

## Mission Tier Constraints

- Tier 2 invite requires strict mode (`secure|max`); non-strict selection is blocked with deterministic reason.
- Tier 1 downgrade paths require explicit confirmation where policy requires it.

## Invalid/Incompatible Behavior

## Case A: Tier 2 + non-strict mode

- Outcome: Block.
- Reason: `INVITE_TIER2_REQUIRES_STRICT_MODE`.
- UX: actionable guidance to switch to `secure`/`max`.

## Case B: Invite strict hint + secure runtime unavailable

- Outcome: Block in strict modes; no silent fallback.
- Reason: strict capability deterministic reason family (`STRICT_*`, `MAX_*`).

## Case C: Unknown transport hint token

- Outcome: Ignore hint for runtime enforcement, emit warning telemetry.
- Reason: `INVITE_HINT_UNRECOGNIZED` (new code reserved for telemetry contract alignment).

## Contract Output Requirements

- Telemetry emits invite hint source and applied mapping outcome.
- Blocked outcomes emit deterministic policy reason.
- Runtime mode and transport requested/resolved values remain explicit.

## Contract Notes

- Contract finalization requires Security/Product/Engineering sign-off under P1.
- Any change to mapping semantics requires Decision Log update and migration note.
