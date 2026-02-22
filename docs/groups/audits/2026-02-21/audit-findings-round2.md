# Group UX Audit Findings — Round 2

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `audit-findings.md`, `task-flow-matrix.md`, `telemetry-gap-plan.md`

## 1) Scope of Round 2

This pass audits gaps not fully covered in Round 1:

- Runtime behavior of guard/redirect messaging
- Telemetry readiness vs funnel requirements
- Invite metadata propagation into join behavior
- UX test coverage realities in CI-facing suites

## 2) Net-New Findings

## R2-P0.1 Funnel-critical telemetry is missing for create/join/invite conversion

Impact:

- Cannot quantify abandonment points in group setup.
- Cannot measure invite-to-join-to-first-message conversion.
- Blocks evidence-based UX iteration.

Evidence:

- Group telemetry enum is limited to nav/chat/unread/send events.
- No group setup started/completed/abandoned events.
- No join submission/activation events.
- No invite conversion events.

Code references:

- `src/app/groups/telemetry.ts`
- `src/app/views/GroupConversation.svelte`
- `src/app/MenuDesktop.svelte`
- `src/app/MenuMobile.svelte`

## R2-P0.2 Invite transport metadata is presented as hints but not applied in join action

Impact:

- Users see invite mode/tier/label hints but join operation does not consume mode/tier intent.
- Creates expectation/behavior mismatch and weakens trust in invite-guided setup.

Evidence:

- `preferredMode`, `missionTier`, `label` are rendered as `joinInviteHints`.
- Join action calls `publishGroupJoin({groupId})` only.

Code references:

- `src/app/views/GroupCreateJoin.svelte`

## R2-P1.1 Guard failures are surfaced as transient toasts followed by immediate redirect

Impact:

- Users may miss the message and only see navigation jump.
- Recovery guidance is not persisted in destination surface.
- Increases confusion for non-experts hitting moderation/settings restrictions.

Evidence:

- Route guard failure triggers `showWarning(result.message)` and immediate `router.go(...)`.
- Guard reason for non-relay elevated routes is technical and route-specific.

Code references:

- `src/app/Routes.svelte`
- `src/app/groups/guards.ts`

## R2-P1.2 Auto-join behavior is intentionally narrow and can feel inconsistent to users

Impact:

- Some invites auto-forward while others require manual action without clear explanation.
- Perceived unpredictability in invite flow.

Evidence:

Auto-join requires all of:

- active session
- exactly one valid group payload
- zero invalid payloads
- no people/relay payload sections

Code references:

- `src/app/invite/accept.ts`

## R2-P1.3 Help-link ecosystem exists, but there are no group help topics to hook into

Impact:

- UX can point users to help elsewhere in app, but group flows cannot do the same today.

Evidence:

- App routes include `/help/:topic` and multiple surfaces link to help topics.
- Current help topics: web-of-trust, NIP-17 DMs, remote-signers.
- No group creation/invite/security topics available.

Code references:

- `src/app/App.svelte`
- `src/app/views/Help.svelte`
- `src/app/views/PersonDetail.svelte`
- `src/app/views/UserContent.svelte`
- `src/app/views/LoginBunker.svelte`
- `src/app/shared/Message.svelte`

## R2-P1.4 UX-level test coverage remains materially behind protocol-level coverage

Impact:

- CI can pass while novice usability regressions persist.

Evidence:

- Cypress e2e suite currently has login/signup/feed/search only.
- View-level tests are onboarding-focused; no group view tests.

Paths:

- `cypress/e2e/*.cy.ts`
- `tests/unit/app/views/*.spec.ts`

## 3) Risk Summary Update

Top updated risk:

- **Measurement Risk (High):** Without funnel telemetry, UX remediation cannot be objectively validated.

Secondary updated risks:

- **Expectation Drift (High):** invite metadata displayed but not operationally enacted.
- **Recovery Clarity Risk (Medium):** guard toasts + redirects are too ephemeral.

## 4) Immediate Documentation Actions

1. Add this round-two report to the audit index and backlog traceability.
2. Amend telemetry plan priorities to treat setup/join/invite instrumentation as absolute P0.
3. Add explicit “hint vs enforced behavior” notes in guided/expert contract for invite metadata.
4. Add guard-recovery persistent pattern requirement to task-flow matrix acceptance criteria.

## 5) Proposed Acceptance Criteria Additions (Delta)

1. **Telemetry:** setup/join/invite/first-message funnels are fully measurable before UX rollout.
2. **Invite consistency:** any displayed invite mode/tier intent must either be applied or explicitly marked informational.
3. **Guard recovery UX:** redirect outcomes must preserve actionable explanation on destination screen.
4. **Test gate:** at least two group novice-flow e2e tests required before UX remediation release.
