# Group IA and Copy Audit

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `task-flow-matrix.md`, `audit-findings.md`

## 1) Purpose

Audit information architecture and user-facing language for group setup/chat flows, then define copy and IA corrections for:

- Guided (beginner-friendly) behavior
- Expert (technical) behavior

## 2) Current IA Snapshot

Primary current surfaces:

- Discovery: Groups nav (`/groups`)
- Create/Join: shared page (`/groups/create`)
- Use room: Group detail + chat
- Admin/manage: Group settings/admin
- Invite create: mostly account-menu entry
- Invite accept: `/invite`
- Help: no group setup topic

## 3) IA Findings

### IA-01: Group share is not anchored to room surfaces

- Invite create exists, but room-level share action is not a primary affordance.
- Users inside a group must discover invites indirectly.

Recommendation:

- Add “Share / Invite” action directly in group chat and detail headers.
- Keep account-level invite creation as secondary utility.

### IA-02: Create/Join page merges two high-cognitive tasks without guided sequencing

- Create and join are both present, but neither has wizard-like progression.
- New users face technical address validation before conceptual setup.

Recommendation:

- Guided mode: split into task-first cards with step indicators.
- Expert mode: keep direct address/mode/tier inputs.

### IA-03: Help and education path is missing for groups

- Existing help topics omit group setup, invite/share, relay choices, and security fallback interpretation.

Recommendation:

- Add Group Help topics and link from in-context UI surfaces.

## 4) Copy Findings: Jargon and Clarity

### Current jargon that increases friction in guided contexts

- `baseline-nip29`
- `secure-nip-ee`
- `mission tier`
- `downgrade`
- `capability mismatch`
- raw group address format examples as primary instruction

### Copy strategy

- Guided mode: user-goal language first, protocol terms optional in expandable details.
- Expert mode: explicit protocol terms retained.
- Keep security truthfulness; avoid overstating secure guarantees when fallback applies.

## 5) Suggested Guided Copy Replacements

| Current Phrase | Guided Replacement | Expert Display |
| --- | --- | --- |
| Preferred mode | Privacy mode | Preferred transport mode |
| baseline-nip29 | Standard compatibility | baseline-nip29 |
| secure-nip-ee | Enhanced privacy (compatible relays required) | secure-nip-ee |
| Mission tier | Security level | Mission tier |
| Downgrade allowed | Allow automatic fallback | Downgrade allowed |
| Capability mismatch | Some selected relays don’t support enhanced privacy | Capability mismatch |
| Group address required | Room link or address | Group address |

## 6) Missing In-Product Guidance to Add

### Guided hints needed

1. What a “room” is and how it differs from DMs.
2. How sharing works after room creation.
3. What relay selection means for room availability/privacy.
4. What fallback means and when it happens.
5. What to do if moderation/settings are unavailable due to route guard constraints.

### Help pages to create

1. “Create a Group Room”
2. “Invite People to a Room”
3. “Room Relay Settings”
4. “Understanding Room Security Status”
5. “Group Admin Basics”

## 7) IA Corrections by Screen

### `/groups`

- Add first-time assist card:
  - “Create your first room”
  - “Join from invite link”

### `/groups/create`

- Guided mode:
  - Stepper: Name -> Privacy -> Relays -> Invite
- Expert mode:
  - Address field + mode/tier controls + full diagnostics

### `/groups/:groupId/chat` and detail

- Add prominent “Invite” action.
- Add simplified security chip with details drawer.

### `/groups/:groupId/settings`

- Guided mode:
  - simple policy labels
- Expert mode:
  - current mission tier + transport/downgrade controls

### `/invite`

- Show concise explanation of what will happen next:
  - join room
  - apply optional relay suggestions
  - open room chat when membership is active

## 8) Non-Negotiable Copy Rules

1. Never imply secure mode is guaranteed if fallback is active or likely.
2. Always present actionable next steps after warnings/errors.
3. Avoid protocol acronyms in Guided mode primary text.
4. Keep protocol metadata available in Expert mode and diagnostics.

## 9) Deliverables for Next Pass

- Copy deck draft for guided vs expert strings
- Screen-level IA wire copy map
- Link map for where help topics are surfaced
- Redline of current strings to be replaced
