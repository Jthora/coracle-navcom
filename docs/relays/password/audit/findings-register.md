# Findings Register — Relay Password Handling Audit

Date: 2026-02-22
Scope: App-wide relay password/claim/auth handling

## Legend

- Severity: `High` | `Medium` | `Low` | `Info`
- Status: `Open` | `Mitigated` | `Accepted Risk`

## Finding Matrix

| ID    | Title                                                               | Severity    | Status    | Primary Evidence                                                                                          | Risk Summary                                                                   | Recommended Owner   |
| ----- | ------------------------------------------------------------------- | ----------- | --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------- |
| RP-01 | Relay claims in invite query params                                 | High        | Open      | `src/app/invite/create.ts`, `src/app/views/InviteCreate.svelte`, `src/app/views/InviteAccept.svelte`      | Claim/password-equivalent values can leak via URLs/QR/history/logging channels | App + Security      |
| RP-02 | Group relay claims stored plaintext in localStorage                 | High        | Open      | `src/app/groups/relay-policy.ts`, `src/app/views/GroupRelayPolicyEditor.svelte`                           | Secret-like relay claims are recoverable from local browser storage            | Groups + Security   |
| RP-03 | Delimiter-based claim encoding is non-canonical                     | Medium      | Open      | `src/app/invite/create.ts`, `src/app/views/InviteAccept.svelte`, `src/app/util/router.ts`                 | Delimiter parsing can mis-handle edge values and produce ambiguous decode      | App Infrastructure  |
| RP-04 | No unified relay credential lifecycle service                       | Medium-High | Open      | Split patterns in `src/app/groups/relay-capability.ts` vs claim paths above                               | Inconsistent handling rules increase leak/regression risk                      | Architecture        |
| RP-05 | Positive control: signer challenge flow avoids password persistence | Info        | Mitigated | `src/app/groups/relay-capability.ts`, `src/app/views/GroupCreateJoin.svelte`                              | Strong baseline pattern available for standardization                          | Groups              |
| RP-06 | Global auto-authenticate default for relay challenges               | High        | Open      | `src/engine/state.ts`, `src/engine/state-storage-init.ts`, `src/app/views/UserSettings.svelte`            | Relay auth attempts may occur automatically without strong per-relay intent    | Security + Platform |
| RP-07 | Relay claim sent as plaintext event tag                             | High        | Open      | `src/engine/commands.ts` (`requestRelayAccess`)                                                           | Claim token may be exposed via relay-side storage/logging channels             | Engine + Security   |
| RP-08 | Relay invite path lacks dedicated schema validation                 | Medium      | Open      | `src/app/App.svelte` (`asCsv("relays")`), `src/app/views/InviteAccept.svelte`, `src/app/invite/schema.ts` | Relay path is less robust than group invite schema path                        | App Infrastructure  |
| RP-09 | Group policy claim retention without active auth-path coupling      | Medium-High | Open      | `src/app/groups/relay-policy.ts`, `src/app/views/GroupCreateJoin.svelte`                                  | Secret retention may exceed operational necessity                              | Groups              |
| RP-10 | Relay hostname exposure in telemetry                                | Medium      | Open      | `src/app/views/GroupCreateJoin.svelte`, `src/engine/state.ts` (`report_analytics`)                        | Private relay infrastructure metadata may leak into analytics                  | App + Security      |
| RP-11 | Relay claim entry fields are plaintext in UI                        | Medium      | Open      | `src/app/views/GroupRelayPolicyEditor.svelte`, `src/app/views/InviteCreate.svelte`                        | Shoulder-surfing/screen-capture exposure risk for password-equivalent claims   | UX + Security       |
| RP-12 | Guided group flow allows insecure `ws://` relay transport           | High        | Open      | `src/app/groups/guided-create-options.ts`, `src/app/views/GroupCreateJoin.svelte`                         | Relay auth and group operations may traverse non-TLS relay channels            | Groups + Security   |
| RP-13 | Group relay policy validator permits insecure `ws://` URLs          | High        | Open      | `src/app/groups/relay-policy.ts`, `src/app/views/GroupRelayPolicyEditor.svelte`                           | Private relay policy can normalize/accept non-TLS transport                    | Groups + Security   |
| RP-14 | Relay claim values have no bounded length/shape controls            | Medium      | Open      | `src/app/invite/create.ts`, `src/app/groups/relay-policy.ts`, `src/engine/commands.ts`                    | Oversized/unconstrained claims increase leak, logging, and availability risk   | App + Engine        |

## RP-13 — Group relay policy validator permits insecure `ws://` URLs

- Evidence:
  - Group relay policy URL validation regex accepts `wss?://`.
  - Group relay policy editor and save path rely on this validation before persistence.
- Why this matters:
  - Security-sensitive relay policy can persist and operationalize non-TLS relay endpoints.
  - This creates a second downgrade surface independent of guided create/join parsing.
- Recommended first action:
  - Require `wss://` in relay policy validation and treat `ws://` as explicit legacy override only.

## RP-14 — Relay claim values have no bounded length/shape controls

- Evidence:
  - Invite query builder serializes relay claim values directly into `relays` query param.
  - Group relay policy stores trimmed claim values but enforces no max length/charset constraints.
  - Relay access publish path sends claim tag directly without claim size preflight.
- Why this matters:
  - Unbounded claim payloads increase accidental leak surface (URLs/logs/clipboard) and may trigger oversized payload failures or abuse conditions.
- Recommended first action:
  - Define claim validation policy (max length + allowed charset) and enforce it at entry, serialization, and publish boundaries.

## RP-01 — Relay claims in invite query params

- Evidence:
  - Invite builder serializes relay entries using `url|claim` in `relays` query param.
  - Invite accept parser reads claim from route payload and forwards into relay join UI.
- Why this matters:
  - Query values can propagate to browser history, screenshots, QR payloads, logs, and intermediary tooling.
- Recommended first action:
  - Block secret-bearing invite URL generation and move to one-time reference or encrypted payload.

## RP-02 — Group relay claims persisted plaintext

- Evidence:
  - Relay policy object includes `claim` and is stored via `window.localStorage.setItem`.
- Why this matters:
  - Secrets can be exfiltrated via XSS/local compromise or shared browser profiles.
- Recommended first action:
  - Remove secret-class fields from plain local storage; use memory-only or encrypted storage with TTL.

## RP-03 — Non-canonical delimiter encoding

- Evidence:
  - Relay encoding/decoding uses string splitting with delimiters rather than structured schema.
- Why this matters:
  - Potential parsing ambiguity and accidental claim truncation/misbinding.
- Recommended first action:
  - Replace with structured serialization for non-secret metadata and explicit schema validation.

## RP-04 — Missing unified credential lifecycle architecture

- Evidence:
  - Legacy claim-token path coexists with signer challenge-response path.
- Why this matters:
  - Secret handling controls are distributed and inconsistent.
- Recommended first action:
  - Introduce a centralized relay credential service with classification/redaction/storage policies.

## RP-05 — Positive control in groups challenge flow

- Evidence:
  - Auth attempts use signer challenge flow; no explicit relay password persistence in create/join preflight.
- Why this matters:
  - Demonstrates viable pattern for broader app convergence.
- Recommended first action:
  - Reuse this model as default for compatible relays.

## RP-06 — Global auto-authenticate default for relay challenges

- Evidence:
  - Default setting enables relay auto-auth (`auto_authenticate2: true`).
  - Socket auth policy checks this global flag and may auto-attempt auth.
- Why this matters:
  - Reduces explicit user intent boundaries around relay auth attempts.
- Recommended first action:
  - Introduce per-relay consent/trust policy and revisit default.

## RP-07 — Relay claim sent as plaintext event tag

- Evidence:
  - Relay claim access command publishes claim tag directly.
- Why this matters:
  - Relay-side persistence and logging may retain claim values.
- Recommended first action:
  - Replace plaintext claim tag transport with safer secret handling protocol.

## RP-08 — Relay invite path lacks dedicated schema validation

- Evidence:
  - Relay invite parsing uses CSV + split logic.
  - Group invites already have structured parser and recovery model.
- Why this matters:
  - Inconsistent validation quality between adjacent invite surfaces.
- Recommended first action:
  - Add a dedicated relay invite schema with strict parse/validate behavior.

## RP-09 — Group policy claim retention without active auth-path coupling

- Evidence:
  - Group relay policy stores claim values.
  - Current group create/join auth path focuses on capability checks + signer challenge flow.
- Why this matters:
  - Long-lived secret retention without clear runtime necessity violates least-retention principles.
- Recommended first action:
  - Remove stored claim path or explicitly integrate it into a bounded, auditable credential lifecycle.

## RP-10 — Relay hostname exposure in telemetry

- Evidence:
  - Group setup telemetry includes relay identifiers.
  - Analytics reporting is enabled by default.
- Why this matters:
  - Private relay infrastructure metadata may leave the client boundary.
- Recommended first action:
  - Redact/hash relay hosts for private/sensitive relays and require explicit opt-in for host-level reporting.

## RP-11 — Relay claim entry fields are plaintext in UI

- Evidence:
  - Group relay policy claim fields use generic text input (`Claim token (optional)`).
  - Invite relay claim fields use generic text input (`Claim (optional)`).
- Why this matters:
  - Claim values are visible during entry and editing, increasing exposure to shoulder surfing, recordings, and screenshots.
- Recommended first action:
  - Mark claim inputs as secret-class entry fields and apply masked input + reveal affordance where required.

## RP-12 — Guided group flow allows insecure `ws://` relay transport

- Evidence:
  - Guided relay parser accepts both `wss://` and `ws://` when normalizing selected relays.
  - Group create/join flows consume these parsed relays for capability checks and setup actions.
- Why this matters:
  - Non-TLS relay transport weakens confidentiality/integrity guarantees for relay interactions and auth-related traffic.
- Recommended first action:
  - Enforce `wss://` by default for guided flow and gate `ws://` behind explicit advanced opt-in with warnings.
