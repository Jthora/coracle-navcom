# Security Modes Implementation Delivery Plan

Status: Draft (execution-ready)
Owner: Core Team + Security + App
Last Updated: 2026-02-22

## Purpose

Make Group Security Modes the primary runtime contract (not just UX labels), with explicit technical behavior for:

- NIP-29 baseline operation
- NIP-EE secure lane operation
- NIP-104 signaling compatibility
- Navcom-only PQC group encryption mode

## Feasibility Verdict (Direct Answer)

Navcom-to-Navcom PQC groups are technically possible, but **not fully complete in the current runtime**.

What exists now:

- Mode intent plumbing and transport selection foundations.
- Secure pilot message path scaffolding.
- Relay capability/auth checks and UX surfaces.

What blocks full completion today:

- Secure control actions are not fully implemented in secure adapter paths.
- Current group secure content envelope path is not sufficient by itself to claim final confidentiality guarantees.
- NIP-104 appears mostly in signaling/copy/capability surfaces and needs explicit runtime contract enforcement.

Conclusion:

- **Yes, achievable** as a Navcom-only feature with focused implementation.
- **No, not already complete** as of this plan.

## Security Modes Contract (Target)

### Mode A — `Basic` (NIP-29)

- Control plane: NIP-29 group control events.
- Message plane: baseline interoperable path.
- Compatibility: broadest.
- Guarantee label: interoperability-first; no protocol-level PQC claim.

### Mode B — `Secure` (NIP-EE)

- Control plane: secure-capable control path (must be implemented end-to-end).
- Message plane: secure lane with strict capability checks.
- Compatibility: medium (requires secure-capable peers/runtime).
- Guarantee label: secure lane active; no PQC claim unless PQC criteria met.

### Mode C — `Max` (Navcom Group-Only PQC)

- Eligibility: Navcom-to-Navcom only (sender + recipients + signer/runtime support).
- Control plane: secure-capable control path with no silent downgrade.
- Message plane: PQC/hybrid envelope + verified key/negotiation requirements.
- Compatibility: intentionally narrow.
- Guarantee label: Navcom-only PQC mode active only when all hard prerequisites pass.

### Mode D — `Auto`

- Behavior: best available mode by policy; explicit fallback allowed.
- Guarantee label: adaptive compatibility; resolved mode always shown.

## Non-Negotiable Product Rules

1. Requested mode and resolved mode must both be visible in telemetry and diagnosable in UI.
2. `Max` mode never silently downgrades; explicit user confirmation + audit required.
3. `Secure` and `Max` create/join must fail closed when secure control path is unavailable.
4. Any PQC claim is gated by runtime proof conditions, not relay advertisement text alone.

## Implementation Plan

## Phase 0 — Contract Freeze (1 day)

Deliverables:

- Freeze mode-to-runtime contract table across product/security/engineering.
- Freeze copy terms for each mode and disallowed claims.
- Freeze telemetry schema fields:
  - `security_mode_requested`
  - `security_mode_resolved`
  - `transport_requested`
  - `transport_resolved`
  - `pqc_runtime_state`
  - `downgrade_reason`

Acceptance:

- One published matrix doc section in upgrade docs.
- No conflicting mode labels in create/join/chat/settings.

## Phase 1 — Make Modes Runtime-Enforced for Create/Join (2-3 days)

Deliverables:

- Implement secure adapter control actions for create/join/leave/member/admin paths.
- Wire create/join mode policy to hard behavior:
  - `Basic`: baseline only.
  - `Secure`: secure required (no capability fallback in guided flow).
  - `Max`: secure required + navcom-pqc prerequisites required.
  - `Auto`: fallback allowed.
- Add fail-closed errors with actionable copy when prerequisites are missing.

Acceptance:

- `Secure/Max` create/join never route to baseline without explicit override policy.
- Unit tests cover all mode × capability combinations.

## Phase 2 — Define and Enforce Navcom-Only PQC Preconditions (2 days)

Deliverables:

- Add a single evaluator for `Max` eligibility:
  - secure pilot active,
  - capability readiness target met,
  - signer feature support present,
  - recipient capability/key freshness rules satisfied,
  - Navcom-only peer policy satisfied.
- Add explicit `pqc_runtime_state` enum (example: `disabled`, `eligible`, `active`, `blocked`).
- Add proof diagnostics panel for why `Max` is or is not active.

Acceptance:

- Max mode cannot start group operations when any hard precondition fails.
- Deterministic reason codes returned for all blocked states.

## Phase 3 — Complete Group Message Cryptography Contract (3-5 days)

Deliverables:

- Replace placeholder-like envelope-only assumptions with cryptographically grounded group message protection path for Max mode.
- Ensure decrypt/validate path enforces mode expectations and fails closed for strict modes.
- Add deterministic fallback behavior:
  - `Auto`: allowed with disclosure.
  - `Secure`: blocked or explicit downgrade flow by tier policy.
  - `Max`: blocked unless explicit admin override policy is enabled.

Acceptance:

- Integration tests prove end-to-end group chat send/receive in `Max` for Navcom-to-Navcom peers.
- Tamper tests fail closed in strict modes.

## Phase 4 — NIP-104 Alignment and Truthful Labeling (1-2 days)

Deliverables:

- Treat NIP-104 as an explicit compatibility/profile signal, not a standalone security guarantee.
- Align mode badges and help text with actual enforced runtime path.
- Add mode-specific docs snippets in setup screens.

Acceptance:

- No UI text implies stronger guarantees than runtime checks can prove.
- Security review sign-off on copy.

## Phase 5 — Rollout and Guardrails (2-3 days + observation window)

Deliverables:

- Feature flags:
  - `ENABLE_GROUP_SECURE_CONTROL_ACTIONS`
  - `ENABLE_GROUP_NAVCOM_PQC_MAX_MODE`
  - `DISABLE_GROUP_MAX_DOWNGRADE`
- Staged rollout:
  1. Internal test cohort
  2. Navcom alpha cohort
  3. Wider cohort if stability targets pass
- Weekly telemetry review for fallback/block/error trends.

Acceptance:

- No increase in create/join fatal errors above threshold.
- Max mode success rate meets agreed target in Navcom cohort.

## Testing Matrix (Minimum)

- Unit:
  - mode resolver,
  - capability evaluator,
  - tier downgrade policy,
  - PQC preflight parser/validator.
- Integration:
  - create/join per mode,
  - secure control-action path,
  - group message send/receive per mode.
- E2E:
  - Basic happy path,
  - Secure blocked path with remediation,
  - Max Navcom-only happy path,
  - Max blocked due to missing capability.

## Evidence Required for “PQC Groups Ready” Claim

All must be true:

1. Secure control actions implemented and used in production paths.
2. Max mode preconditions enforced with deterministic block reasons.
3. End-to-end Navcom-to-Navcom group chat pass for create → join → first message.
4. Security copy and telemetry match runtime behavior.
5. Rollout telemetry stable for one release window.

## Risks and Mitigations

- Risk: overclaiming PQC readiness before runtime gates are complete.
  - Mitigation: claim gate uses the evidence checklist above.
- Risk: relay capability variance causes user confusion.
  - Mitigation: mode-specific diagnostic reasons + actionable remediation.
- Risk: strict mode adoption hurts conversion.
  - Mitigation: keep `Auto` default while `Max` remains explicit opt-in.

## Immediate Next Sprint (Concrete)

1. Implement secure adapter control actions for create/join.
2. Add shared `Max` precondition evaluator and reason codes.
3. Add test matrix cases for mode × capability × fallback outcomes.
4. Lock copy to prevent ungrounded PQC claims.
