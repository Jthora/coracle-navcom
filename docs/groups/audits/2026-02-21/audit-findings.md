# Group UX Audit Findings

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related Area: Group creation, invite/share, management, relay control, PQC UX clarity

## 1) Audit Scope

This audit focuses on **ease-of-group-creation** and **ease-of-group-chat** in the current app, with specific attention to:

- Group setup/join flows
- Invite/share flows
- Group management/admin usability
- PQC-related UX signals (secure mode, fallback, downgrade)
- Relay targeting controls for group content
- Guided vs Expert UX separation

## 2) Sources Reviewed

Primary runtime/UI surfaces:

- `src/app/views/GroupList.svelte`
- `src/app/views/GroupCreateJoin.svelte`
- `src/app/views/GroupDetail.svelte`
- `src/app/views/GroupConversation.svelte`
- `src/app/views/GroupSettingsAdmin.svelte`
- `src/app/views/InviteCreate.svelte`
- `src/app/views/InviteAccept.svelte`
- `src/app/MenuDesktop.svelte`
- `src/app/MenuMobile.svelte`
- `src/app/views/Help.svelte`

Group routing/guards/policy:

- `src/app/groups/route-config.ts`
- `src/app/groups/routes.ts`
- `src/app/groups/guards.ts`
- `src/app/groups/policy.ts`
- `src/app/groups/capability-gate.ts`
- `src/app/groups/downgrade-banner.ts`

Engine and transport behavior relevant to UX:

- `src/engine/group-commands.ts`
- `src/engine/group-transport.ts`
- `src/engine/group-transport-baseline.ts`
- `src/engine/group-transport-secure.ts`
- `src/app/groups/state.ts`

Roadmap/spec context:

- `docs/security/pqc/progress-tracker.md`
- `docs/groups/rebuild/00-charter-and-success-criteria.md`
- `docs/groups/rebuild/03-current-state-audit.md`
- `docs/groups/rebuild/07-implementation-plan-by-milestone.md`
- `docs/groups/rebuild/12-known-issues-ledger.md`
- `docs/groups/rebuild/24-medium-findings-closure-2026-02-12.md`
- `docs/guided-setup/initial/overview.md`
- `docs/guided-setup/initial/defaults-and-curation.md`

## 3) Executive Summary

The current group experience is technically capable but not beginner-friendly. The architecture and tests strongly emphasize protocol correctness, transport behavior, fallback safety, and operations readiness. In contrast, user-task clarity (create, share, invite, manage, relay targeting) is under-specified in runtime UX and documentation.

### Core mismatch

- **What exists:** protocol-first, admin-heavy controls, deterministic fallback logic.
- **What users need:** task-first guided flows, understandable security states, explicit room-level relay controls, low-friction invite/share loops.

## 4) High-Severity Findings (P0)

### P0.1 Per-group relay targeting is not exposed as a room-level UX control

Impact:

- Users cannot confidently choose where a specific group’s content is stored.
- Conflicts directly with expected “room-level storage control” mental model.

Evidence:

- Group publish paths route through user relay policy (`Router.get().FromUser().policy(addMaximalFallbacks).getUrls()`), not per-room relay config.
- Group hydration also uses user/global relay policy, not room-scoped relay sets.

Relevant code:

- `src/engine/group-commands.ts`
- `src/engine/group-transport-baseline.ts`
- `src/app/groups/state.ts`

### P0.2 Secure group mode appears selectable but is effectively unavailable by default

Impact:

- Users can choose secure settings but observe baseline fallback behavior, which feels contradictory/confusing.
- Undermines trust in “secure room” intent.

Evidence:

- Secure pilot adapter defaults to disabled (`securePilotEnabled = false`).
- Capability gate warns secure mode is unavailable and fallback will be used.
- Conversation-level downgrade banner reports compatibility fallback.

Relevant code:

- `src/engine/group-transport-secure.ts`
- `src/app/groups/capability-gate.ts`
- `src/app/groups/downgrade-banner.ts`
- `src/app/views/GroupConversation.svelte`

### P0.3 No guided group setup flow exists

Impact:

- New users face protocol terms and raw address entry immediately.
- High abandonment risk before first successful group message.

Evidence:

- Group create/join requires manual group address input and shows policy hints in protocol language.
- Existing guided onboarding is account onboarding only and intentionally hides relay/protocol complexity.

Relevant code/docs:

- `src/app/views/GroupCreateJoin.svelte`
- `src/app/groups/create-join.ts`
- `src/app/views/onboarding/OnboardingStageHost.svelte`
- `docs/guided-setup/initial/overview.md`

## 5) Medium-Severity Findings (P1)

### P1.1 Invite/share actions are not anchored in the group context

Impact:

- Users can create invites, but discoverability during active group workflows is weak.
- Share loop (create room -> invite people -> confirm join) is not obvious.

Evidence:

- Invite creation route exists, but group views prioritize Overview/Members/Settings without obvious “Share/Invite” CTA.
- Invite creation entrypoint is mainly account submenu driven.

Relevant code:

- `src/app/App.svelte`
- `src/app/views/GroupConversation.svelte`
- `src/app/views/GroupDetail.svelte`
- `src/app/MenuDesktop.svelte`
- `src/app/MenuMobile.svelte`

### P1.2 Admin UX defaults to expert-level inputs (raw pubkeys, policy jargon)

Impact:

- Basic “manage members” tasks are difficult for non-experts.
- Role and moderation operations require technical literacy by default.

Evidence:

- Member actions rely on pubkey input fields and role strings.
- Policy editor exposes mission tier / preferred mode / downgrade without a simpler guided abstraction.

Relevant code:

- `src/app/views/GroupSettingsAdmin.svelte`

### P1.3 Route guard redirects may feel opaque to users

Impact:

- Users entering moderation/settings via non-relay IDs can be redirected with limited explanatory guidance in-flow.

Evidence:

- Guard blocks elevated paths for non-relay group identifiers and redirects to base group route.

Relevant code:

- `src/app/groups/guards.ts`

### P1.4 Help and in-app education lack group setup documentation

Impact:

- Users cannot self-serve understanding of group creation, relay choices, secure/fallback semantics.

Evidence:

- Help topics currently cover WoT, NIP-17 DMs, remote signers; no group setup/invite/security help topic.

Relevant code:

- `src/app/views/Help.svelte`

## 6) Lower-Severity Findings (P2)

### P2.1 Group list/detail labels surface protocol metadata but little task guidance

Impact:

- Users see protocol/status indicators but not next-best actions for setup success.

Relevant code:

- `src/app/views/GroupList.svelte`
- `src/app/views/GroupDetail.svelte`

### P2.2 UX-level automated coverage is thinner than protocol-level coverage

Impact:

- Regressions in ease-of-use are less likely to be detected early.

Evidence:

- Extensive domain/engine/group helper tests exist.
- Minimal view-level/e2e scenarios for novice group journey tasks.

Relevant tests:

- `tests/unit/app/groups/*.spec.ts`
- `tests/unit/engine/group-*.spec.ts`
- `cypress/e2e/` (no group-focused specs found)

## 7) Gap-to-Goal Mapping

User goal: “Create a PQC group chat room, set room relays, invite people, and understand status quickly.”

Current gap map:

1. **Create room quickly** -> Requires technical group address knowledge.
2. **Understand security mode** -> Secure selectable, but fallback may activate due to pilot/capability constraints.
3. **Choose room relays** -> No explicit room-level relay chooser.
4. **Share room** -> Invite flow exists but not strongly attached to room context.
5. **Manage room** -> Admin UX assumes expert literacy (pubkeys, policy terms).
6. **Learn by guidance** -> No group-focused help/walkthrough path.

## 8) Deduced Product/UX Requirements Not Yet Explicitly Captured

To rectify ease-of-group-creation/chat, the following should be documented as requirements before UI implementation changes:

1. Guided mode user story and success criteria (first successful group message under a target time).
2. Expert mode capabilities and explicit gating/entry.
3. Room-level relay policy model (required/optional relays, fallback behavior, failure states).
4. Security-state vocabulary and UI standards (secure, compatibility, fallback, blocked).
5. Invite/share lifecycle standards (where invite actions live, what confirmation states look like).
6. Member management abstraction for non-experts (identity display vs raw key fallback).

## 9) Documentation Follow-Ups (Created)

The following companion documents have been created under the same audit program:

1. `docs/groups/audits/2026-02-21/task-flow-matrix.md`
   - Task-by-task path mapping, friction points, and desired end states.
2. `docs/groups/audits/2026-02-21/ia-and-copy-audit.md`
   - Information architecture and copy review, including jargon replacement guidance.
3. `docs/groups/audits/2026-02-21/telemetry-gap-plan.md`
   - UX funnel instrumentation plan for setup/join/invite conversion.
4. `docs/groups/audits/2026-02-21/ux-test-gap-plan.md`
   - View-level and e2e test coverage expansion plan for novice flows.
5. `docs/groups/audits/2026-02-21/guided-vs-expert-contract.md`
   - Interaction contract defining mode switch behavior, visibility, and safeguards.

## 10) Proposed Next Audit Pass

Next pass should produce:

- Persona-indexed task flow matrix (new user, operator, admin)
- Severity-ranked remediation backlog (P0/P1/P2)
- Acceptance criteria per screen and task
- Instrumentation plan for conversion/drop-off in group setup
- Traceability links from findings -> remediation -> tests

## 11) Audit Confidence and Limits

Confidence: High for code-level flow and architecture findings.

Limits:

- No direct user session analytics reviewed in this pass.
- No usability interview artifacts reviewed in this pass.
- Findings are implementation/documentation grounded, not survey grounded.

## 12) Follow-Up Audit Passes

- Round 2 findings documented in `docs/groups/audits/2026-02-21/audit-findings-round2.md`.
- Round 2 adds net-new evidence around telemetry blind spots, guard/redirect UX behavior, invite hint-to-action mismatch, and current UX test-suite gaps.
