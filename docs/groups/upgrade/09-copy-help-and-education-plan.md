# Copy, Help, and Education Plan

Status: Draft
Owner: Product Content + Design
Last Updated: 2026-02-21

## Objective

Define user language and help surfaces for group setup, security, and relay controls.

## Required Artifacts

- Guided copy deck (plain language)
- Expert copy deck (technical language)
- Group-specific help topics
- In-context inline help placements

## Required Help Topics

- Create a group room
- Invite and join flow
- Room relay settings (including private relays)
- Understanding security/fallback states
- Group admin basics

## Acceptance Criteria

- Guided copy avoids protocol jargon in primary text
- Help topics are reachable from group surfaces at point of need

## Critique of Prior Draft

The prior draft established scope but lacked content governance.
It did not define tone by mode.
It did not define review ownership and change-control cadence.

## Copy System by Mode

### Guided Copy

- Plain language first.
- Action-outcome framing.
- Short instructional sentences.

### Expert Copy

- Technical precision.
- Explicit policy effects.
- Concise diagnostic labels.

## Terminology Rules

1. Avoid acronym-only primary labels.
2. Use same term for same concept across all views.
3. Define unavoidable technical terms via inline helper text.

## Required Help Entry Points

- Groups index quick help.
- Create/join flow inline “learn more.”
- Room settings contextual help.
- Security-state explanation links.

## Help Content Structure

Each help topic includes:

1. When to use this feature.
2. Steps.
3. Common errors.
4. Recovery options.
5. Related topics.

## Copy Review Workflow

- Draft by content owner.
- Product/design review.
- Security review for guarantee language.
- Final QA check in rendered UI.

## Localization Readiness Constraints

- Avoid idioms.
- Avoid overlong concatenated labels.
- Keep placeholders explicit and stable.

## Telemetry for Help Effectiveness

- `help_topic_opened`
- `help_topic_from_surface`
- `help_topic_followed_by_success`

## QA Content Checklist

1. No contradictory terms.
2. No over-claiming security state.
3. Recovery guidance exists for known errors.
4. Links open relevant topic context.

## Exit Criteria

Copy/help plan is complete when:

- Mode-specific copy decks are approved.
- Required help topics are implemented.
- In-context links are present in targeted group surfaces.

