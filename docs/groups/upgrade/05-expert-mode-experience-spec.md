# Expert Mode Experience Spec

Status: Draft
Owner: Product + Security + Frontend
Last Updated: 2026-02-21

## Objective

Define advanced controls for operators/security users without constraining protocol visibility.

## Expert Controls

- Transport mode selection
- Tier and fallback policy controls
- Detailed capability diagnostics
- Room-level relay targeting (including private relays)
- Advanced member/admin operations

## Safety Constraints

- Expert mode cannot bypass enforced security policy
- Fallback and downgrade signals must remain visible
- Destructive operations require explicit confirmation

## Acceptance Criteria

- Full technical controls available in expert mode
- Switching between guided/expert preserves safe state
- No silent policy weakening on mode switch

## Critique of Prior Draft

The previous draft named key controls but lacked explicit interaction model.
It did not define visibility requirements for diagnostics and state transitions.
It did not establish guardrails for dangerous but valid operations.

## Expert Mode Principles

1. Make state inspectable.
2. Make policy changes explicit.
3. Make failure semantics understandable.
4. Preserve reversibility where feasible.

## Required Control Groups

### Transport and Security

- Active transport indicator.
- Preferred transport selector.
- Fallback behavior controls.
- Downgrade disclosure history view.

### Relay Policy

- Room-level relay list with source classification.
- Private relay add/edit/remove actions.
- Validation status and health indicators.

### Operations

- Member and admin controls.
- Invite issuance controls with expiry semantics.
- Optional advanced moderation controls.

## Decision Logging Requirement

Expert actions that alter policy must be represented by:

1. Action summary.
2. Effective scope.
3. Immediate consequence note.
4. Revert path.

## Warning and Confirmation Rules

- Require confirm for operations that reduce security guarantees.
- Require confirm for relay policy removals affecting availability.
- Provide pre-submit warning for conflicting policy combinations.

## Expert-Mode Error Model

- Validation errors: inline and actionable.
- Runtime connectivity failures: non-blocking where possible.
- Policy conflicts: block submit until conflict resolved.

## Discoverability Requirements

Expert mode must be reachable from room context in one interaction.
No expert control may be hidden behind unrelated navigation.

## Mode Transition Contract

1. Switching to guided cannot erase expert-set required policy.
2. Guided-compatible rendering of expert settings must remain truthful.
3. Unsupported expert settings in guided view must remain visible as locked summaries.

## Telemetry Requirements

- `expert_control_viewed`
- `expert_policy_change_attempted`
- `expert_policy_change_succeeded`
- `expert_policy_change_failed`
- `expert_mode_exit`

## QA Scenarios

1. Relay policy edit with successful apply.
2. Relay policy edit with validation failure.
3. Security policy change with downgrade warning.
4. Mode switch preserving advanced state.

## Exit Criteria

Expert mode is complete when:

- All control groups are available and test-covered.
- Critical policy changes emit telemetry.
- Mode-switch contract passes regression suite.
