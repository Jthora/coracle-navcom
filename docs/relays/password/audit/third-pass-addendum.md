# Third-Pass Addendum — Relay Password/Relay Handling Audit

Date: 2026-02-22
Type: Code review only (delta from first and second pass)

## Why this addendum

A third pass was performed to identify residual gaps not clearly captured in earlier findings, focusing on relay secret handling ergonomics and transport-security posture.

## Newly Identified Gaps

## TP-01 — Relay claim inputs are not masked in operator-facing UI

Severity: **Medium**

Evidence:

- `src/app/views/GroupRelayPolicyEditor.svelte` captures claim values via standard text inputs (`Claim token (optional)`).
- `src/app/views/InviteCreate.svelte` captures relay claim values via standard text inputs (`Claim (optional)`).

Risk:

- Password-equivalent relay claim values are displayed in clear text during entry/editing.
- Increases exposure from shoulder-surfing, screensharing, screenshots, and recording tooling.

Gap vs prior passes:

- Prior passes focused on storage and transport exposures, but under-covered direct UI entry exposure.

## TP-02 — Guided group relay selection explicitly permits `ws://` relays

Severity: **High**

Evidence:

- `src/app/groups/guided-create-options.ts` accepts both `wss://` and `ws://` in `toRelayAddress`.
- `src/app/views/GroupCreateJoin.svelte` uses parsed relay selections for capability checks and group setup flow actions.

Risk:

- Insecure transport can expose relay interactions to interception/tampering on untrusted networks.
- Security posture in “private/higher security” guided modes may be undermined by transport downgrade.

Gap vs prior passes:

- Prior passes reviewed credential handling but did not explicitly flag TLS transport downgrade acceptance in guided relay path.

## Delta Recommendations

1. Treat relay claim fields as secret-class inputs (masked by default, explicit reveal).
2. Enforce `wss://` as baseline in guided create/join paths.
3. If `ws://` support is retained for edge environments, gate behind explicit advanced opt-in and clear risk acknowledgment.
