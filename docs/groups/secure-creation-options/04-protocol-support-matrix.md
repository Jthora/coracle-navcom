# Protocol Support Matrix

Status: Draft
Owner: Protocol + App Team
Last Updated: 2026-02-22

## Goal

Provide one authoritative matrix mapping modes to protocol expectations.

## Protocol Roles

- `NIP-29`: baseline group control/interoperability lane.
- `NIP-EE`: secure runtime lane for group messaging/control path requirements.
- `NIP-104`: compatibility/profile signaling input (must not be treated alone as proof of runtime PQC guarantees).

## Mode-to-Protocol Matrix

| Mode | Required Protocols | Optional Signals | Fallback Policy |
|---|---|---|---|
| Auto | NIP-29 minimum | NIP-EE, NIP-104 | Allowed with disclosure |
| Basic | NIP-29 | NIP-104 signal optional | Not applicable |
| Secure | NIP-EE required | NIP-104 signal optional | Block by default |
| Max | NIP-EE required + Navcom PQC runtime constraints | NIP-104 profile alignment expected | Block |

## Required Runtime Checks

- Capability check at create/join time.
- Capability check at send time.
- Signer feature check for strict modes.
- Peer readiness/key freshness checks for Max.

## Telemetry Requirements

- `protocol_requested`
- `protocol_resolved`
- `mode_requested`
- `mode_resolved`
- `policy_block_reason`
