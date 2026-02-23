# Security Mode Contracts

Status: Draft
Owner: Engineering + Security
Last Updated: 2026-02-22

## Contract Format

Each mode must define:

- Allowed protocols
- Fallback rules
- Create/join behavior
- Chat send behavior
- Claim boundaries

## Mode: Auto

- Primary target: adaptive compatibility.
- Protocol targets: start from interoperable path; allow secure upgrade when available.
- Fallback: allowed with explicit telemetry and UI disclosure.
- Claims: compatibility-first, not guaranteed PQC.

## Mode: Basic

- Primary target: stable interoperability.
- Protocol target: `NIP-29` baseline operation.
- Fallback: not applicable beyond baseline.
- Claims: no guaranteed end-to-end confidentiality or PQC.

## Mode: Secure

- Primary target: secure lane operation.
- Protocol target: `NIP-EE` required for secure path.
- Fallback: disallowed by default; explicit policy override only.
- Claims: secure transport lane active only if runtime checks pass.

## Mode: Max

- Primary target: Navcom-only high assurance.
- Protocol target: `NIP-EE` runtime with `NIP-104` profile compatibility signaling and Navcom PQC constraints.
- Fallback: disallowed.
- Additional requirements:
  - compatible signer/runtime support,
  - compatible peer capability/key state,
  - deterministic preflight pass.
- Claims: PQC-capable only when all hard prerequisites pass and evidence gates are satisfied.

## Cross-Mode Enforcement Requirements

- Emit `security_mode_requested` and `security_mode_resolved` on create/join/send.
- Emit deterministic `blocked_reason` and `downgrade_reason` codes.
- Persist an audit event when strict-mode overrides are used.
