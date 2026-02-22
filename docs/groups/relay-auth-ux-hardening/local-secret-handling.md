# Local Secret Handling Constraints — Relay Auth UX

Date: 2026-02-22
Scope: relay authentication credentials and local signer-dependent state for Groups create/join flows.

## Security Boundaries

- NAVCOM **must not** store relay passwords, private keys, or challenge secrets in plaintext local storage.
- Auth completion state (`authenticated`, `expired`, `failed`) is operational metadata only and is not a secret.
- Challenge/response signing must remain delegated to the active signer; relay challenge payloads are treated as ephemeral.

## Storage Constraints

- Allowed local persistence:
  - relay URL list and non-secret preflight outcomes (`ready`, `auth-required`, `no-groups`, `unreachable`),
  - auth session timestamps and status flags,
  - UX preferences (relay preset, setup flow state).
- Prohibited local persistence:
  - relay-specific passwords/tokens/API keys,
  - signer secret material or seed phrases,
  - raw challenge payloads beyond active auth attempt lifecycle.

## Runtime Handling Rules

- If signer is unavailable, treat this as a credential-unavailable state and block auth-required relay progression with actionable copy.
- For relay auth methods not advertised by relay metadata, present a warning and require user relay change or out-of-band credential provisioning.
- Clear relay auth pending state on attempt completion and mark sessions expired on TTL breach.

## Logging and Telemetry Constraints

- Telemetry may include aggregate counts (`auth_required_count`, `missing_signer_count`) and relay host strings already used in setup UX.
- Telemetry must not include challenge payloads, signatures, tokens, or copied access package contents.
- Error messages should be categorical (`missing-signer`, `relay-rejected`, `unknown-auth-method`) without embedded secret values.

## User Guidance Constraints

- Access package content is informational only (group address, relay list, auth requirement type, security mode, fallback expectation).
- Access package copy flow must never include local-only auth artifacts.
- For secured relays requiring credentials outside NIP-42 signer flow, direct users to relay operator instructions.

## Implementation Checklist

- [x] No plaintext credential persistence introduced in relay-auth UX modules.
- [x] Missing-signer and unknown-method states are surfaced before create/join submit.
- [x] Share package excludes secrets and challenge artifacts.
- [x] Telemetry emits aggregate diagnostics only.
