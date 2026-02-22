# Guided vs Expert Interaction Contract (Groups)

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `ia-and-copy-audit.md`, `task-flow-matrix.md`

## 1) Purpose

Define explicit UX contract for two interaction modes in group features:

- **Guided mode**: optimized for first-time and low-technical users
- **Expert mode**: optimized for advanced operators requiring full control

## 2) Product Goals

1. Reduce friction for room creation/join/chat for new users.
2. Preserve expert control over transport/security/relay behavior.
3. Avoid false security confidence.
4. Keep safe defaults and deterministic fallback behavior.

## 3) Mode Definitions

## 3.1 Guided Mode

Characteristics:

- Task-first flow
- Minimal protocol terminology
- Progressive disclosure for advanced details
- Recommended defaults preselected
- Inline recovery guidance

Default audience:

- First-time group users
- Casual collaborators

## 3.2 Expert Mode

Characteristics:

- Full protocol terminology
- Full control surface (transport/tier/fallback policy/relay targeting)
- Explicit diagnostics and reason codes

Default audience:

- Admins, operators, security-aware users

## 4) Mode Switch Contract

### Requirements

1. Persistent user preference (`guided` / `expert`).
2. Visible and reversible switch in group setup/settings surfaces.
3. Safe migration between modes (no silent destructive config changes).
4. Switching to Guided does not erase expert-configured policy; it abstracts presentation.

### Suggested switch locations

- Group setup/create screen
- Group settings header

## 5) Surface-by-Surface Visibility Matrix

| Surface | Guided | Expert |
| --- | --- | --- |
| Group create | Wizard steps (name/privacy/relays/invite) | Direct address + full policy controls |
| Group join | Invite/link first, address optional advanced | Direct address as primary |
| Group settings policy | Simplified labels and recommendations | Mission tier + mode + downgrade + diagnostics |
| Relay controls | Recommended relay profile + basic override | Full per-room relay set editing and capability details |
| Security status | Plain status badge + clear meaning + next action | Detailed status + reason codes + raw mode info |
| Member management | Human-friendly identity selection + role presets | Raw pubkey operations + full role controls |

## 6) Non-Negotiable Safeguards

1. Do not claim enhanced privacy when fallback is active.
2. Do not hide fallback events; always user-visible in both modes.
3. Tier-2 and equivalent strict constraints must remain enforced in both modes.
4. Guard/redirect constraints must always provide recovery instructions.
5. All destructive actions require explicit confirmation in both modes.

## 7) Copy Contract

### Guided copy

- Use user-goal language (“Room privacy level”, “Automatic fallback”).
- Explain outcomes, not protocol internals.
- Offer “Show technical details” disclosure.

### Expert copy

- Preserve protocol labels (`baseline-nip29`, `secure-nip-ee`, tier semantics).
- Show diagnostics and reason codes directly.

## 8) Error and Recovery Contract

For any block/warning state:

1. Explain what happened in plain language.
2. Explain impact on user goal.
3. Offer one primary recovery action.
4. Offer “technical details” only when useful.

## 9) Security State Contract

Standard runtime states to display consistently:

- `Secure active`
- `Compatibility active`
- `Fallback active`
- `Blocked`

Both modes must map to the same underlying truth; only verbosity differs.

## 10) Implementation Guardrails

1. Guided mode must not require raw group address by default.
2. Expert mode must remain available without hidden flags once enabled.
3. Mode-specific UI cannot bypass transport policy enforcement.
4. Telemetry must include mode context for all major setup/chat steps.

## 11) Acceptance Criteria

- First-time users can create and message in a group without protocol terms.
- Experts can still configure transport and policy controls fully.
- Security/fallback state is understandable and honest in both modes.
- Mode switching preserves intent and does not create unsafe hidden state.

## 12) Open Product Decisions

1. Default mode for new users (recommended: Guided).
2. Conditions for prompting switch to Expert.
3. Whether room owners can enforce minimum mode for admins.
4. Exact relay override freedoms in Guided mode.
