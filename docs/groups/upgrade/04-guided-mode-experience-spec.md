# Guided Mode Experience Specification

Status: Draft
Owner: Product Design + Frontend
Last Updated: 2026-02-21

## Objective

Define a beginner-friendly group flow that minimizes protocol complexity while preserving safe behavior.

## Required Guided Flow

1. Start (Create or Join)
2. Room basics (name/purpose)
3. Privacy level selection (plain-language options)
4. Relay selection (recommended defaults visible)
5. Invite members
6. Confirmation and first message prompt

## Rules

- Avoid protocol jargon in primary copy
- Always provide one-click recovery for failures
- Expose technical details only behind disclosure

## Acceptance Criteria

1. User can create and send first message without raw group address entry
2. User can share invite from room context
3. User can understand active security state in one glance
# Guided Mode Experience Spec

Status: Draft
Owner: Product Design + Frontend
Last Updated: 2026-02-21

## Objective

Define a beginner-friendly group flow that minimizes protocol complexity while preserving safe behavior.

## Required Guided Flow

1. Start (Create or Join)
2. Room basics (name/purpose)
3. Privacy level selection (plain-language options)
4. Relay selection (recommended defaults visible)
5. Invite members
6. Confirmation and first message prompt

## Rules

- Avoid protocol jargon in primary copy
- Always provide one-click recovery for failures
- Expose technical details only behind disclosure

## Acceptance Criteria

- User can create and send first message without raw group address entry
- User can share invite from room context
- User can understand active security state in one glance

## Critique of Prior Draft

The prior draft captured the happy path but not operational constraints.
It did not define explicit step-by-step error handling.
It did not specify bounded decision complexity per screen.
It did not map guided copy to measurable success thresholds.

## Guided Mode Design Principles

1. One primary action per step.
2. No mandatory protocol terms in primary labels.
3. Explain consequences in plain language.
4. Preserve progress on error and recovery.
5. Keep advanced controls optional and clearly marked.

## Step-Level Interaction Budgets

- Start screen: at most 2 primary choices.
- Room basics: at most 3 required inputs.
- Privacy selection: at most 3 options with short descriptions.
- Relay selection: one recommended default path and one edit path.
- Invite step: one obvious share action and one skip option.

## Required Security Status Presentation

Guided mode must present:

- Current mode label in plain language.
- One-line meaning statement.
- Visible “what to do if this changes” recovery hint.

## Error Model

For each guided step define:

1. Blocking errors.
2. Non-blocking warnings.
3. Recovery CTA labels.
4. Retry behavior.
5. Cancel behavior.

## Recovery Patterns

- Connectivity issue: retry + offline-friendly guidance.
- Relay setup issue: keep defaults + edit option.
- Invite generation issue: retry + copy fallback.
- Secure transition issue: disclosure + next step.

## Content Constraints

- No acronym-only labels.
- No multi-clause instructional walls.
- No dead-end screens.

## Accessibility Requirements

1. Keyboard-complete flow.
2. Screen reader announced step titles.
3. Error messages linked to specific fields.
4. Color not sole carrier of state.

## Telemetry Hooks for Guided Flow

- `guided_step_viewed`
- `guided_step_completed`
- `guided_step_error`
- `guided_flow_abandoned`
- `guided_first_message_sent`

## QA Acceptance Pack

Must include:

- Happy path e2e scenario.
- One failure branch for each major step.
- Copy verification checklist.
- Security-state visibility assertion.

## Out of Scope for Guided Mode

- Full relay-policy graph editing.
- Deep policy diagnostics.
- Operator-level moderation workflows.

## Exit Criteria

Guided mode is complete when:

1. First-room creation succeeds within interaction budget.
2. First-message completion rate meets target threshold.
3. Critical failure recovery is validated for all major steps.
4. Support docs align with final guided copy.
