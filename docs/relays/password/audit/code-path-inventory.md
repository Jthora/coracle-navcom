# Code Path Inventory — Relay Password/Auth Handling

Date: 2026-02-22

## A) Legacy/General Relay Claim Token Path

### 1. Invite creation serializes relay claims into URL query

- `src/app/views/InviteCreate.svelte`
  - Relay entries are modeled as `{url, claim}`.
  - UI explicitly allows optional claim input for private relay access.
- `src/app/invite/create.ts`
  - `buildInviteQueryParams` serializes relays as `url|claim` and joins entries by `,` in `relays` query parameter.

### 2. Invite acceptance parses relay claims from URL query

- `src/app/App.svelte`
  - `/invite` route uses `asCsv("relays")` serializer.
- `src/app/views/InviteAccept.svelte`
  - Parses each relay entry with `split("|")` and normalizes URL.
  - Passes `{url, claim}` into `RelayCard`.

### 3. Relay join action forwards claim to engine command

- `src/app/shared/RelayCardActions.svelte`
  - `joinRelay(url, claim)` invoked from relay card action.
- `src/engine/commands.ts`
  - `joinRelay` calls `requestRelayAccess(url, claim)` when claim exists.
  - `requestRelayAccess` publishes event kind `28934` with tag `["claim", claim]` to relay.

## B) Group Relay Policy Claim Storage Path

### 1. Group admin relay policy editing

- `src/app/views/GroupRelayPolicyEditor.svelte`
  - Supports `isPrivate` + `claim` fields.
  - Claim value editable in plaintext input.

### 2. Policy persistence

- `src/app/groups/relay-policy.ts`
  - `saveRoomRelayPolicy` writes full policy JSON (including `claim`) to `window.localStorage` under `group_relay_policy:{groupId}`.
  - `loadRoomRelayPolicy` restores claim values directly from local storage.

## C) Group Challenge/Response Relay Auth Path (New)

### 1. Capability and auth flow

- `src/app/groups/relay-capability.ts`
  - Detects `limitation.auth_required` and NIP-42 support.
  - `attemptRelayChallengeAuth` uses signer-mediated `attemptAuth` without explicit relay password handling.

### 2. UX orchestration

- `src/app/views/GroupCreateJoin.svelte`
  - Tracks auth session lifecycle (`authenticated`, `expired`, etc.).
  - Emits telemetry counts and status, not credential payloads.

### 3. Helper constraints

- `src/app/groups/relay-auth-ux.ts`
  - Access package includes auth requirement type and relay list, not secret payloads.

## D) Global Relay Auth Plumbing

- `src/engine/state-storage-init.ts`
  - Registers `makeSocketPolicyAuth` for signer-based relay auth (`auto_authenticate2` behavior).
  - No password field observed here; auth delegated to signer flow.

## E) Serializer/Encoding Observations

- `src/app/util/router.ts`
  - `asCsv` uses simple `split(",")` decode.
- `src/app/invite/create.ts` and `src/app/views/InviteAccept.svelte`
  - Relay claim serialization/parsing uses ad-hoc `|` and `,` delimiters without escaping/structured encoding.
