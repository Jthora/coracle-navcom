# Remediation Architecture — Relay Password/Credential Handling

Date: 2026-02-22
Type: Recommendations only (no code changes in this audit)

## Objective

Unify relay credential handling so password-like material is never treated as ordinary UI data.

## Target Architecture

## 1) Introduce a centralized Relay Credential Service

Single service boundary responsible for:

- credential classification (`none`, `challenge-signer`, `bearer-token`, `relay-password`),
- secure persistence policy,
- redaction rules,
- expiry/rotation metadata,
- import/export restrictions.

UI modules should consume capability metadata and credential status only.

## 2) Enforce strict data classes

- **Secret class**: relay passwords, bearer claims/tokens, API keys.
- **Protected metadata**: relay auth-required flags, method indicators, expiry timestamps.
- **Public metadata**: relay URLs, capability statuses.

Only protected/public metadata may appear in telemetry or share flows.

## 3) Replace query-param claim sharing with one-time or out-of-band model

- Do not embed secrets in invite URL params.
- Prefer one of:
  - one-time server-issued invite capability references,
  - encrypted invite payload requiring recipient signer decryption,
  - explicit user copy/paste of secret in controlled channel with warning.

## 4) Remove plaintext localStorage secret persistence

- Do not persist relay secret tokens/passwords in plain browser storage.
- If persistence is required, use encrypted-at-rest store tied to signer/session root and explicit TTL.
- Default to memory-only for high-risk credentials.

## 5) Canonical encoding for non-secret relay payloads

- Replace delimiter-based `url|claim,url|claim` with structured JSON encoding (or equivalent robust schema) for non-secret fields.
- Reject unexpected/unsafe fields at parse boundary.

## 6) Align legacy relay join flow to groups auth model

- Promote signer challenge/response path to default where relay supports it.
- Treat bearer claim/password path as compatibility fallback with explicit risk labeling.

## Staged Rollout Recommendation

## Phase A — Safety guardrails (fast)

- Add classification rules and redaction checks.
- Block secret-in-query generation for new invites.
- Add UI warnings when user attempts to share secret-bearing relay access data.

## Phase B — Storage hardening

- Migrate persisted relay policy secrets out of plain local storage.
- Add TTL + explicit clear-on-logout behavior.

## Phase C — Protocol/path convergence

- Standardize app-wide relay auth UX on signer challenge/response where possible.
- Keep compatibility path isolated and auditable.

## Validation Gates

- No secret-class fields in URLs, telemetry props, or localStorage plain JSON.
- Invite acceptance robust for arbitrary relay metadata inputs.
- Regression tests for relay join/create/group setup with auth-required relays.

## Suggested Follow-up Work Items

1. Create `relay-credential-model` ADR (data classes + ownership + lifecycle).
2. Create migration design for existing `group_relay_policy:*` data.
3. Create threat-model appendix specific to relay credential replay and sharing channels.
