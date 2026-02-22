# Implementation Plan — Relay Auth + UX Hardening

Date: 2026-02-22

## Goals

1. Users can determine whether selected relays support Groups before create/join.
2. Users can complete relay auth requirements from the UI without guesswork.
3. Group sharing clearly communicates relay + auth requirements to recipients.

## Phase Breakdown

## 1) Capability Probe Robustness

- Add timeout and retry policy for relay info probes.
- Add result cache + TTL to reduce redundant probes.
- Standardize relay URL normalization and deduping.
- Enforce viability rule: at least one `ready` relay for create/join progression.

Deliverables:

- Hardened probe service and deterministic status mapping.
- Error copy for unreachable/CORS/auth/no-group states.

## 2) Challenge/Response Auth UX (NIP-42 path)

- Replace manual auth confirmation with real handshake flow.
- Track per-relay auth state (`pending`, `authenticated`, `failed`, `expired`).
- Add retry + expiration handling and clear remediation UI.

Deliverables:

- Auth modal/inline flow integrated into create/join preflight.
- Relay-level auth state persisted for active session.

## 3) Secured Relay Credential Experience

- Add optional relay credential profile inputs for secured relays.
- Separate credential handling from share links/invites.
- Expose status indicators (`credential present`, `auth verified`, `expired`).

Deliverables:

- Credential UX + secure local storage policy notes.
- UX warnings for missing credentials on required relays.
- Local secret handling constraints doc for relay auth state, telemetry, and share packaging.

## 4) Share Access Package

- Generate share package with:
  - group address,
  - selected relay list,
  - auth-required relay list,
  - security mode expectation.
- Add recipient checklist UI in join flow.

Deliverables:

- Share/export copy and receiver-side setup checklist.

## 5) Validation + Rollout

- Unit/integration/e2e test coverage for capability + auth gating.
- Telemetry and alert thresholds for auth failures and preflight drop-offs.
- Staged rollout with kill-switch readiness.

Deliverables:

- QA evidence and rollout recommendation memo.

## Definition of Done

- Create and join flows surface relay capability/auth blockers before submission.
- Auth-required relays can be resolved in-product.
- Shared access package is sufficient for recipient setup.
- Validation suites and telemetry gates pass for staged rollout.
