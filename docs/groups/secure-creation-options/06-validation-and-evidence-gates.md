# Validation and Evidence Gates

Status: Draft
Owner: QA + Security + Engineering
Last Updated: 2026-02-22

## Gate G1 — Functional Correctness

- Create/join succeeds per mode contract.
- Mode mismatch paths fail with deterministic reason codes.
- Requested/resolved mode telemetry is emitted.
- Invite mission-tier and preferred-mode context is either enforced or deterministically rejected with reason codes.

## Gate G2 — Protocol Enforcement

- Basic paths use NIP-29 contract behavior.
- Secure/Max paths require NIP-EE secure runtime path behavior.
- NIP-104 is treated as profile input only, not standalone guarantee.

## Gate G3 — Cryptographic Integrity and Confidentiality

- Strict mode tamper tests fail closed.
- Recipient-binding mismatch tests fail closed.
- Replay/nonce misuse scenarios are handled deterministically.

## Gate G4 — Max Mode PQC Readiness

- All Max preconditions enforced at preflight and send time.
- Navcom-only constraints validated.
- No silent fallback in Max mode.
- Tier-policy confirmations and override-audit paths validated in UX + engine telemetry.

## Gate G5 — UX/Claim Truthfulness

- UI labels match runtime guarantees.
- No unsupported PQC claims in help/status copy.
- Blocked states provide actionable guidance.
- Capability/state messaging is mode-aware (Auto fallback messaging cannot leak into strict-mode guarantees).

## Gate G5.1 — Surface-Specific Claim Separation

- DM PQC maturity cannot be used as substitute evidence for group PQC claims.
- Group PQC claim readiness requires group create/join/chat strict-mode evidence bundle.

## Gate G6 — Operational Stability

- Error rate below agreed threshold.
- Downgrade/blocked telemetry stable.
- No P0 regressions in create/join/chat path.

## Gate G6.1 — Telemetry Contract Completeness

- Mode-level telemetry fields are present and verified (`security_mode_requested`, `security_mode_resolved`).
- Transport-level and mode-level telemetry are both available for correlation.

## Gate G6.2 — Storage/Recovery Integration Evidence

- Secure storage encryption/recovery paths are exercised in production-like integration scenarios.
- Recovery outcomes are emitted through telemetry and observable in staged rollout.

## Gate G6.3 — E2E Contract Stability

- Critical e2e assertions validate behavior/state and policy outcomes, not only mutable copy text.

## Evidence Bundle Required

- Unit + integration + e2e results.
- Security review notes and sign-off.
- Telemetry report for staged rollout window.
- Explicit “claim readiness” checklist completion.
- Separate evidence sections for DM surface and Group surface.
