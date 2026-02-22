# PQC Group Security Model and UX State Spec

Status: Draft
Owner: Security + Engineering + Design
Last Updated: 2026-02-21

## Objective

Specify user-facing security states and backend mapping for group PQC behavior.

## User-Facing States

- Secure active
- Compatibility active
- Fallback active
- Blocked

## Requirements

- State labels must match runtime truth
- No over-claiming security guarantees
- Fallback reason must be explainable to users
- Admins get actionable recovery guidance

## Technical Mapping

Document mapping from transport/capability outcomes to UI state and telemetry event.

## Acceptance Criteria

- Every message/session state maps deterministically to one user-visible state
- Security status rendering is consistent across list/detail/chat/settings

## Critique of Prior Draft

The prior draft named states but did not define transition semantics.
It did not include copy constraints for non-expert users.
It did not define precedence when multiple runtime signals conflict.

## State Definitions

### Secure Active

Meaning: secure transport path is active and policy conditions are met.

### Compatibility Active

Meaning: functional operation with reduced security properties by policy or capability.

### Fallback Active

Meaning: temporary non-preferred mode due to runtime constraints.

### Blocked

Meaning: operation prevented by explicit policy constraints.

## Transition Priority Rules

1. `Blocked` has highest precedence.
2. `Fallback Active` overrides compatibility labels when temporary degradation detected.
3. `Secure Active` only when all required conditions are satisfied.
4. Else `Compatibility Active`.

## Copy Safety Rules

- Never claim “fully secure” without condition truth.
- Always describe fallback in plain language.
- Provide concise recovery action text.
- Keep technical diagnostics behind expandable detail.

## Room-Level Rendering Contract

State must appear consistently in:

- Group list row.
- Group detail header.
- Conversation header/status strip.
- Settings summary area.

## Admin Recovery Guidance Contract

When not secure-active, provide:

1. Cause category.
2. Suggested next action.
3. Link to advanced diagnostics.

## Runtime Signal Inputs

State resolver should consume at minimum:

- Capability probe outcome.
- Policy requirement flags.
- Current transport path.
- Recent downgrade or failure events.

## Conflict Resolution Examples

1. Secure-capable relay selected, but policy conflict -> `Blocked`.
2. Secure desired but capability missing -> `Compatibility Active` or `Fallback Active` based on runtime behavior.
3. Temporary network degradation while secure desired -> `Fallback Active`.

## Telemetry Mapping

- `security_state_viewed`
- `security_state_changed`
- `security_fallback_entered`
- `security_fallback_resolved`
- `security_blocked_action_attempted`

## QA Matrix Requirements

Must test:

- Each state independently.
- All priority transitions.
- Consistent rendering across required surfaces.
- Recovery guidance presence when state != secure active.

## Exit Criteria

PQC UX state spec is complete when:

- State resolver rules are documented and approved.
- UI copy is validated for claim safety.
- Transition telemetry and tests are implemented.
