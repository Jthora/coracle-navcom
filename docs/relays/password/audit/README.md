# Relay Password Handling Audit (App-Wide)

Date: 2026-02-22
Type: Code review only (no implementation changes)
Scope: Relay password/claim/auth handling across app, engine, invite flows, groups flows, and persistence paths.

## Audit Documents

- `audit-report.md` — comprehensive findings, risk ratings, and impact analysis
- `findings-register.md` — structured findings matrix with severity/status/evidence
- `second-pass-addendum.md` — gap-focused findings identified in second-pass review
- `third-pass-addendum.md` — residual-gap findings identified in third-pass review
- `fourth-pass-addendum.md` — additional residual gaps identified in fourth-pass review
- `code-path-inventory.md` — code-path map for relay auth/password-like data
- `remediation-architecture.md` — architecture-level integration recommendations and staged plan

## Summary

Current relay auth handling is split across two patterns:

1. **Claim-token pattern** (legacy/general relay join + invite flows)

   - Tokens are handled as plaintext strings (`claim`) and can be serialized into invite URLs.
   - Group relay policy can persist claim-like values in local storage.

2. **Signer challenge/response pattern** (groups relay-auth hardening)
   - Uses signer-mediated auth attempts and lifecycle state tracking.
   - Avoids explicit relay password persistence in the new create/join preflight flow.

The app currently lacks a unified relay-secret architecture that centralizes classification, secure storage, redaction, and sharing rules for relay credentials/tokens/password-equivalents.
