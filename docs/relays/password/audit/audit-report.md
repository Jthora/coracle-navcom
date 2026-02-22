# Comprehensive Audit Report — Relay Password Handling

Date: 2026-02-22
Auditor mode: Code review only

## Scope and Intent

This audit evaluates how relay passwords or password-equivalent access credentials are handled across the app, with focus on:

- Collection and entry points
- Serialization and transport
- Storage and retention
- Runtime usage and exposure
- Integration consistency with newer groups relay-auth architecture

## Executive Assessment

Overall rating: **High risk (architectural inconsistency + plaintext credential handling in multiple paths)**

Primary conclusion:

- New groups challenge/response work has improved handling by avoiding direct password persistence.
- Legacy/general relay claim-token paths still treat credential-like values as plain strings and expose them in URL/local storage contexts.
- There is no unified relay-secret lifecycle model across app and groups modules.

## Findings

## F-01 — Invite links can carry relay claim tokens in plaintext query params

Severity: **High**

Evidence:

- Relay invite builder serializes `relays` as `url|claim` CSV in query params.
- Invite accept flow parses that field and forwards `claim` through UI actions.

Risk:

- Query params can be logged by browsers, proxies, analytics tooling, screenshots, crash reports, and clipboard history.
- QR invites containing claims are effectively shareable bearer credentials if claim acts as access token/password equivalent.

Impact:

- Unauthorized relay access if claims are long-lived or reusable.

---

## F-02 — Group relay policy persists claim-like values in plaintext local storage

Severity: **High**

Evidence:

- Group relay policy includes `claim` field and is saved to `window.localStorage` as JSON.

Risk:

- Any XSS, local malware, shared-browser profile, or physical device access can read claims.
- Token retention is indefinite unless manually cleared.

Impact:

- Credential replay and privacy leakage for private relays.

---

## F-03 — Delimiter-based relay claim serialization is fragile and non-canonical

Severity: **Medium**

Evidence:

- Serialization uses ad-hoc `|` (between url and claim) and `,` (between relay entries) with simple split parsing.

Risk:

- Claims containing delimiter chars break decode.
- Ambiguous parse behavior can drop/truncate claims silently.

Impact:

- Incorrect auth attempts, onboarding failures, and potential misbinding between URL and claim.

---

## F-04 — No centralized relay credential classification and handling policy

Severity: **Medium-High**

Evidence:

- Two distinct auth models coexist:
  - claim token path (legacy/general)
  - signer challenge/response path (groups)
- No shared service enforcing secret-class rules (store/share/redact/expire).

Risk:

- Inconsistent controls and accidental leaks as more relay features are added.

Impact:

- Security regressions and operational confusion.

---

## F-05 — Positive control: groups challenge/response flow avoids direct password persistence

Severity: **Informational (positive)**

Evidence:

- Groups relay auth uses signer-mediated challenge auth and lifecycle status.
- Telemetry added for counts/status instead of credential payloads.

Value:

- Strong baseline pattern to standardize app-wide.

## Architecture Gap Summary

- Relay auth data model lacks explicit separation between:
  - secret/bearer credential (high sensitivity),
  - non-secret requirement metadata (auth-required, method type),
  - transient runtime state (authenticated/expired).
- Secret handling responsibilities are currently distributed across UI and route serialization logic.

## App-Wide Risk Concentration

Highest concentration is in invite and relay-policy surfaces, not in the new groups NIP-42 preflight flow.

## Second-Pass Delta

A second-pass gap review was completed and documented in:

- `docs/relays/password/audit/second-pass-addendum.md`

Additional findings include global auto-auth defaults, plaintext claim event-tag transport, relay schema asymmetry vs group invite schema, potential over-retention of group claim values, and relay-host telemetry exposure concerns.

## Third-Pass Delta

A third-pass gap review was completed and documented in:

- `docs/relays/password/audit/third-pass-addendum.md`

Additional findings include plaintext claim entry in UI controls and acceptance of insecure `ws://` transport in guided group relay selection.

## Fourth-Pass Delta

A fourth-pass gap review was completed and documented in:

- `docs/relays/password/audit/fourth-pass-addendum.md`

Additional findings include an independent `ws://` allowance in group relay policy validation and missing bounded input controls for claim-token values.

## Audit Constraints

- This was a static code audit only.
- No runtime packet capture or production telemetry inspection was performed.
