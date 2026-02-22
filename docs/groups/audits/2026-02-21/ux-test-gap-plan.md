# Group UX Test Gap Plan

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `task-flow-matrix.md`, `telemetry-gap-plan.md`

## 1) Purpose

Define test coverage needed to validate ease-of-use for novice group workflows, complementing existing protocol/domain coverage.

## 2) Current State Summary

Current coverage is strong in domain/engine/helper behavior and route wiring.
Coverage is weaker in user-task flows across real screens.

### Existing strengths

- Group route/config/guards unit coverage
- Group policy/admin helper coverage
- Invite payload serializer/accept helper coverage
- Transport/capability/mixed-lane simulations

### Primary gaps

- Little to no view-level tests for novice journey outcomes
- No group-focused cypress e2e scenarios
- No assertion of “discoverability” paths and recovery UX

## 3) Test Strategy

Layered plan:

1. View-model/component behavior tests (unit/integration)
2. Route/flow integration tests (screen transitions and guard handling)
3. Cypress e2e novice journey tests
4. Telemetry assertion tests for funnel observability

## 4) Priority Test Matrix

| Priority | Scenario | Test Layer | Status |
| --- | --- | --- | --- |
| P0 | First-time create room -> first message | E2E + integration | Missing |
| P0 | Invite accept -> join -> active member -> first message | E2E + integration | Missing |
| P0 | Room-level share action discoverability from chat/detail | View + E2E | Missing |
| P0 | Redirect guard explanation after blocked moderation/settings route | View + integration | Missing |
| P1 | Guided mode copy and progressive disclosure | View | Missing |
| P1 | Expert mode controls visibility and constraints | View + unit | Missing |
| P1 | Security state rendering consistency (secure/fallback/blocked) | View + integration | Partial |
| P2 | Help entrypoint visibility and topic links from group surfaces | View + E2E | Missing |

## 5) Proposed New Test Files

## 5.1 Unit / Integration (app views)

- `tests/unit/app/views/group-create-guided.spec.ts`
  - validates guided step ordering, required fields, and beginner copy.
- `tests/unit/app/views/group-chat-security-state.spec.ts`
  - validates security chips/banners/details consistency.
- `tests/unit/app/views/group-share-entrypoints.spec.ts`
  - validates invite/share actions are present in group context.
- `tests/unit/app/views/group-guard-recovery.spec.ts`
  - validates user-facing recovery guidance after guard redirect.

## 5.2 Existing test extensions

- Extend `tests/unit/app/groups/routes.spec.ts`
  - assert mode-specific route metadata if guided/expert pathing is introduced.
- Extend invite tests
  - assert post-invite novice continuation prompts and labels.

## 5.3 Cypress e2e

- `cypress/e2e/groups-create-first-message.cy.ts`
- `cypress/e2e/groups-invite-join-first-message.cy.ts`
- `cypress/e2e/groups-guard-recovery.cy.ts`
- `cypress/e2e/groups-guided-vs-expert.cy.ts`

## 6) E2E Acceptance Assertions

### Scenario A: novice create flow

- User reaches Groups from nav
- User starts guided create
- User completes required steps without raw protocol terms
- User lands in group chat and sends first message successfully

### Scenario B: invite conversion

- User opens invite
- User reaches join flow (or auto-route)
- User joins and reaches active membership state
- User sends first message

### Scenario C: blocked elevated route recovery

- User navigates to moderation/settings with non-relay ID
- User sees plain-language explanation
- User receives one-click recovery action

### Scenario D: guided vs expert separation

- Guided mode hides advanced protocol knobs
- Expert mode exposes transport/tier/downgrade controls
- Mode switch preserves safety constraints

## 7) Telemetry Assertions in Tests

For P0 flows, assert event emission for:

- setup started/completed/abandoned
- join submitted/active detected
- first message attempted/succeeded/failed

This ensures dashboards remain reliable during UX iteration.

## 8) Test Data / Fixture Needs

- Canonical valid relay-addressed group IDs
- Non-relay group IDs for guard cases
- Capability profiles causing secure success/fallback/block
- Invite payload variants: valid single-group, mixed payloads, invalid entries

## 9) Rollout Plan for Coverage

Phase 1 (P0):

- Add two core e2e flows + one guard recovery test
- Add at least two view-level novice flow tests

Phase 2 (P1):

- Add guided/expert mode and security-state view tests
- Add telemetry assertions for all key steps

Phase 3 (P2):

- Add help/discoverability assertions and copy regressions

## 10) Exit Criteria

- P0 scenarios green in CI
- Guard and recovery behavior verified end-to-end
- Invite conversion journey covered end-to-end
- Telemetry event assertions in place for key funnels
