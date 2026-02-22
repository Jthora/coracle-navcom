# Second-Pass Addendum — Relay Password/Relay Handling Audit

Date: 2026-02-22
Type: Code review only (delta from first pass)

## Why this addendum

A second pass was performed to find under-covered gaps in relay credential handling and broader relay security posture across app flows.

## Newly Identified Gaps

## SP-01 — Auto relay authentication defaults to enabled globally

Severity: **High**

Evidence:

- `src/engine/state.ts` sets `defaultSettings.auto_authenticate2: true`.
- `src/engine/state-storage-init.ts` sets `shouldAuth: (socket) => autoAuthenticate` in `makeSocketPolicyAuth`.

Risk:

- Signed auth attempts may be made automatically across relay connections when access controls request auth.
- User intent and per-relay trust context are weakly enforced by default.

Gap vs first pass:

- First pass covered token storage/sharing but underemphasized signer auto-auth policy as a password-equivalent risk surface.

## SP-02 — Claim token transmitted in plaintext event tag to relay

Severity: **High**

Evidence:

- `src/engine/commands.ts` uses `requestRelayAccess(url, claim)` and publishes event kind `28934` with tag `["claim", claim]`.

Risk:

- Claim values are sent as plaintext tag content and may be persisted/logged by relay or intermediary tooling.

Gap vs first pass:

- First pass highlighted URL/query exposure; second pass adds transport/publish-layer exposure risk.

## SP-03 — Relay claim parsing lacks schema hardening compared to group invite parser

Severity: **Medium**

Evidence:

- Relay claims parsed in `src/app/views/InviteAccept.svelte` via `split("|")`.
- Route serialization uses generic CSV (`asCsv("relays")` in `src/app/App.svelte`).
- Group invite payloads have dedicated parser/validation (`src/app/invite/schema.ts`).

Risk:

- Inconsistent robustness between relay and group invite paths.
- Easy to introduce malformed/boundary errors for claim-bearing relay entries.

Gap vs first pass:

- First pass noted delimiter fragility; second pass highlights architectural inconsistency relative to existing stronger schema pattern.

## SP-04 — Group relay policy retains claim secrets without being part of active auth path

Severity: **Medium-High**

Evidence:

- Claims are captured/persisted in group relay policy (`src/app/groups/relay-policy.ts`, `src/app/views/GroupRelayPolicyEditor.svelte`).
- Current groups create/join auth flow relies on capability + signer challenge path (`src/app/views/GroupCreateJoin.svelte`, `src/app/groups/relay-capability.ts`) and does not consume stored `claim` values.

Risk:

- Secret-like values may be stored long-term with little or no runtime benefit (retention without necessity).

Gap vs first pass:

- First pass flagged plaintext storage; second pass adds principle-of-least-retention concern due to weak operational coupling.

## SP-05 — Relay hostnames in telemetry may expose private relay infrastructure

Severity: **Medium**

Evidence:

- Group setup telemetry emits relay identifiers in auth/check events (`src/app/views/GroupCreateJoin.svelte`).
- Analytics/reporting is enabled by default (`report_analytics: true` in `src/engine/state.ts`).

Risk:

- Private/internal relay hostnames can leak to external analytics pipeline.

Gap vs first pass:

- First pass focused on credential values; second pass includes metadata privacy leakage from relay identifiers.

## Delta Recommendations

1. Add explicit policy decision on `auto_authenticate2` default and require per-relay/user consent model.
2. Treat `claim` as secret-class data in transit and at rest; avoid plaintext tag/query transport.
3. Add dedicated relay invite schema (mirror group invite schema robustness).
4. Remove or redesign claim persistence in group relay policy unless directly required by active auth flow.
5. Redact/hash relay host identifiers in telemetry where relay is private or user-designated sensitive.
