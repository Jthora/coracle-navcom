# Groups UX Prioritized Implementation Plan

Status: In Progress
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `groups-page-encryption-ux-and-flow-matrix.md`, `task-flow-matrix.md`, `guided-vs-expert-contract.md`

## 1) Goal and Success Criteria

Implement UX refinements that improve clarity and usability across mobile and desktop without over-engineering, removing functionality, or obscuring access.

Success is achieved when all P0 outcomes are true:

1. Groups is faster to reach on mobile.
2. Primary next actions are obvious on detail/chat surfaces.
3. Guard redirects explain cause and recovery in plain language.
4. No route, permission, or expert workflow regressions are introduced.

## 2) Scope and Guardrails (Non-Negotiable)

1. Preserve all existing routes and capabilities.
2. Preserve expert/admin access paths and role-based controls.
3. No new modal stack architecture.
4. No transport/security behavior changes in this phase (presentation and navigation only).
5. Keep changes small and reversible.

Out of scope for this slice:

- New backend behavior.
- New permission model.
- Full IA redesign.
- New analytics schema unless existing telemetry is insufficient.

## 3) Delivery Strategy

Use incremental rollout in three implementation batches:

- Batch A: mobile discoverability (P0.1)
- Batch B: action hierarchy on detail/chat (P0.2)
- Batch C: guard-recovery copy improvements (P0.3)

Each batch must pass smoke checks before starting the next batch.

## 4) Prioritized Backlog with Action Steps

## P0 — Immediate (High Impact, Low Risk)

### P0.1 Mobile Groups quick access

Problem:

- Mobile requires extra menu depth to reach Groups, increasing friction for frequent users.

Implementation:

- Add a first-order, highly visible Groups entry in mobile primary navigation context.
- Keep existing menu route to Groups intact.

Action steps:

1. Add primary Groups entry in mobile top-level navigation zone.
2. Keep existing menu Groups item as secondary path.
3. Verify unread indicator remains visible in both paths.
4. Validate no signer/no-session guard regressions.

Files likely touched:

- `src/app/MenuMobile.svelte`

Acceptance:

- Groups reachable in <=1 interaction from primary mobile chrome/menu-open state.
- Existing Group route behavior unchanged.
- Unread state is still visible and telemetry call sites are preserved.

### P0.2 Action hierarchy on Group Detail and Group Chat

Problem:

- Too many peer-level actions reduce task clarity, especially on smaller screens.

Implementation:

- Promote one primary action by surface:
  - Group Detail: `Chat`
  - Group Chat: `Send` / `Invite` context
- Keep secondary actions visible but de-emphasized (same screen, no hidden dead-end).

Action steps:

1. Reorder action rows so primary CTA is first and visually dominant.
2. Move non-primary actions to secondary visual tier on narrow viewports.
3. Confirm all prior actions are still reachable in <=1 additional interaction.
4. Ensure no action text loses clarity.

Files likely touched:

- `src/app/views/GroupDetail.svelte`
- `src/app/views/GroupConversation.svelte`

Acceptance:

- Primary action is visually and positionally clear.
- Secondary actions remain discoverable in <=1 additional tap/click.
- Mobile layout remains readable without horizontal overflow.

### P0.3 Guard-recovery copy tightening

Problem:

- Current guard messaging is present but still somewhat technical.

Implementation:

- Refine guard reason copy to plain language + explicit next-step CTA text.
- Keep current redirect logic unchanged.

Action steps:

1. Replace technical guard phrasing with plain-language explanation.
2. Add explicit “next best action” wording in destination panels.
3. Keep the same redirect target and safety constraints.
4. Validate copy consistency across list/detail recovery states.

Files likely touched:

- `src/app/groups/guards.ts`
- `src/app/views/GroupDetail.svelte`
- `src/app/views/GroupList.svelte`

Acceptance:

- User can answer “why did I get redirected?” and “what should I do next?” from destination surface alone.
- Existing guard behavior (conditions and redirect targets) is unchanged.

## P1 — Next (Important, Moderate Effort)

### P1.1 Security state readability pass (layout-level)

Implementation:

- Standardize placement and density of security chip + hint across list/detail/chat/settings.
- Keep explicit PQC-preferred vs non-PQC labels introduced in current copy patch.

Action steps:

1. Align chip placement to consistent header zone across views.
2. Reduce duplicate verbose text while preserving state meaning.
3. Ensure fallback/degraded hints remain visible.

Acceptance:

- State and meaning are visible above fold in all major group surfaces.

### P1.2 Invite journey continuity cues

Implementation:

- Add lightweight continuity cues after invite open/share actions (same route context).
- Do not add heavy modal workflows.

Action steps:

1. Add contextual next-step text after invite/share CTA usage.
2. Preserve existing route transitions and deep links.
3. Keep actions concise and non-blocking.

Acceptance:

- Users can follow create -> invite -> join intent with minimal ambiguity.

## P2 — Later (Optional Enhancements)

### P2.1 Mobile expert-density reduction

Implementation:

- Collapse advanced diagnostics sections by default on small viewports.

### P2.2 UX help affordances in-group

Implementation:

- Add small contextual help links for security and relay policy interpretation.

## 5) Execution Order and Gates

1. P0.1 Mobile quick access.
2. P0.2 Action hierarchy on detail/chat.
3. P0.3 Guard-recovery copy tightening.
4. P1.1 Security-state readability pass.
5. P1.2 Invite continuity cues.

Immediate execution priority:

1. P0.1 Mobile quick access (start here).
2. P0.2 Detail/chat action hierarchy.
3. P0.3 Guard copy tightening.

Implementation status:

- Complete: P0.1 mobile quick access, P0.2 action hierarchy, P0.3 guard copy tightening.
- In progress: P1.1 security-state readability and P1.2 invite continuity cues (initial UI pass complete; targeted Groups Cypress spec passing; manual desktop/mobile smoke verification pending).
- Validation update: expanded unit coverage for guards/security/guided privacy copy and added `groups-smoke` Cypress checks; targeted test runs are passing.
- Validation update (pass 2): added additional unit edge-case assertions plus `groups-routes-smoke` Cypress suite; both smoke suites are passing in targeted runs.
- Validation update (pass 3): added `invite-share` unit coverage and `groups-invite-smoke` Cypress suite; targeted unit + all groups smoke suites are passing.

Gate after each P0 item:

1. Manual desktop/mobile smoke pass.
2. No regression in route access.
3. No regression in role-gated admin access.

## 6) Validation and Robustness Plan

1. Manual cross-device checks (desktop + mobile viewport):
   - Reach Groups quickly
   - Find primary next action on each group surface
   - Recover from guard redirect
2. Add/adjust e2e checks for:
   - Mobile Groups discoverability
   - Primary action visibility on detail/chat
3. Keep existing telemetry events; add only if a clear measurement gap appears.

Regression checklist:

1. `/groups`, `/groups/create`, `/groups/:groupId`, `/chat`, `/members`, `/moderation`, `/settings` all reachable.
2. Existing invite/share actions still function.
3. No signer state still produces safe outcomes.
4. Security labels remain explicit about PQC-preferred vs compatibility.

Rollback strategy:

1. Keep changes per batch isolated to small filesets.
2. Revert latest batch if smoke or e2e checks fail.
3. Do not chain P1 work onto unstable P0 surfaces.

## 7) Risks and Mitigations

1. Risk: Primary CTA emphasis hides secondary actions.
   - Mitigation: Require <=1 extra interaction for all prior actions.
2. Risk: Mobile quick access duplicates logic inconsistently.
   - Mitigation: Keep existing menu path and shared route handlers.
3. Risk: Copy updates drift from guard logic.
   - Mitigation: Keep guard conditions unchanged and verify route outcomes.

## 8) Definition of Done for This UX Refinement Slice

1. P0 items complete with no route/access regressions.
2. No loss of existing capabilities.
3. Mobile and desktop flows improved in the user-flow matrix.
4. Copy remains explicit about PQC-preferred vs compatibility behavior.
5. Regression checklist and smoke checks are recorded for each delivered batch.

## 9) Owner Action Matrix

| Work Item | Primary Owner Action | QA Action | Exit Evidence |
| --- | --- | --- | --- |
| P0.1 Mobile quick access | Implement entry + preserve existing path | Verify mobile reachability + unread indicator | Screenshot + route smoke notes |
| P0.2 Action hierarchy | Reorder/de-emphasize actions without removal | Verify primary CTA clarity on mobile/desktop | Before/after UI capture |
| P0.3 Guard copy | Update plain-language copy only | Validate redirect comprehension on destination | Copy review + guard flow check |
| P1.1 Security readability | Normalize placement/density | Validate above-fold visibility | Cross-surface checklist |
| P1.2 Invite continuity | Add lightweight cue text | Validate create->invite->join clarity | Flow walkthrough notes |
