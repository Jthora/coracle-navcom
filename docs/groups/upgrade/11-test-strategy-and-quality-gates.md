# Test Strategy and Quality Gates

Status: Draft
Owner: QA + Engineering
Last Updated: 2026-02-21

## Objective

Define test coverage required for UX-safe rollout of groups upgrade.

## Coverage Layers

- Unit: helpers, policies, selectors
- View/integration: guided/expert screen behavior
- E2E: novice create/join/invite/chat flows
- Telemetry assertions for funnel events

## Required E2E Scenarios

1. Create room and send first message
2. Invite accept and join to first message
3. Guard redirect with persistent recovery guidance
4. Guided vs Expert mode visibility and safety

## Quality Gates

- P0 scenarios green in CI
- No critical UX regressions in flow completion tests
- Telemetry events emitted for all funnel steps

## Critique of Prior Draft

The prior draft identified layers but lacked release-gate rigor.
It did not define pass/fail criteria per layer.
It did not define ownership for flaky or unstable tests.

## Test Pyramid Targets

- Unit: fastest, broadest logic validation.
- Integration/view: key user interaction correctness.
- E2E: end-user flow confidence.

## Required Scenario Matrix

For each P0 flow include:

1. Happy path.
2. One likely failure path.
3. Recovery completion path.

## Security-State Test Requirements

Must validate:

- State labels are deterministic.
- Transition rendering is consistent across surfaces.
- Recovery guidance appears on degraded states.

## Relay Policy Test Requirements

Must validate:

- Valid private relay entry accepted.
- Invalid relay entry rejected with field-level message.
- Fallback behavior is deterministic when writable relay fails.

## Quality Gates by Milestone

### M1

- Guided flow happy path e2e green.

### M2

- Mode switch state-preservation tests green.

### M3

- Relay policy conflict handling tests green.

### M4

- Security-state consistency matrix green.

### M5

- Full P0 regression pack green in CI.

## Flakiness Management

1. Track flake rate per scenario.
2. Quarantine with issue only under explicit policy.
3. Require remediation owner and due date.

## Telemetry-in-Test Policy

P0 e2e scenarios must assert at least one success/failure telemetry emission.

## Exit Criteria

Test strategy is complete when:

- Scenario matrix covers all P0/P1 requirements.
- CI gates align with milestone definitions.
- Flakiness process is documented and active.

