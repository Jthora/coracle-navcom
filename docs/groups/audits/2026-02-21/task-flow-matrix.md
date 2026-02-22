# Group UX Task Flow Matrix

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `audit-findings.md`

## 1) Purpose

Map the current end-to-end group experience across major entry points and identify:

- User intent per step
- Current route/screen behavior
- Friction and dead-ends
- Redirect/guard behavior
- Required future-state behavior

## 2) Entry Points in Scope

- Global nav -> Groups
- Groups list -> Create/Join
- Invite accept -> Join flow / Group chat
- Group detail/conversation -> Settings/Admin
- Account menu -> Invite create

## 3) Current Flow Matrix

| Flow ID | User Intent | Entry Point | Current Path | Current Outcome | Friction / Dead-end | Guard / Redirect | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Find where to start with groups | Main nav | `/groups` | Groups list loads and exposes Create CTA | Minimal instructional copy; no “first-time setup” guide | None | P1 |
| F-02 | Create first group quickly | Groups list -> Create | `/groups/create` -> GroupCreateJoin | Requires manual group address + optional name/description | Address-first model is technical for beginners; no guided wizard | Validation warning on invalid address | P0 |
| F-03 | Join group from known address | Groups list -> Create/Join | `/groups/create` join section | Join request submitted on valid address | User must understand canonical address format | Validation warning on invalid address | P1 |
| F-04 | Join via invite link | `/invite` | InviteAccept -> `resolveGroupInviteDestinationPath` -> `/groups/create?...` | Prefilled join context available | Protocol metadata (mode/tier) exposed with limited explanation | Auto-join only under strict conditions | P1 |
| F-05 | Share group with members | Group context | No primary group-level share CTA; invite create mostly via account submenu | Possible but not context-native | Share loop discoverability is weak in active group workflows | None | P1 |
| F-06 | Chat in group after create/join | Group create/join completion | `/groups/:groupId/chat` | Basic conversation/send works | Security state not self-evident; fallback status appears reactive | Downgrade banner can appear after fallback | P1 |
| F-07 | Configure secure mode | Group settings/admin | `/groups/:groupId/settings` policy editor | Can select `secure-nip-ee` | Secure pilot is disabled by default; expectation mismatch | Capability gate warns fallback/unavailable | P0 |
| F-08 | Use moderation/settings on non-relay ID | Direct link or in-app nav | `/groups/:groupId/moderation` or `/settings` | Redirect away from elevated route | Redirect feels opaque without remediation guidance | Guard redirects to `/groups/:groupId` | P1 |
| F-09 | Control relays for a specific room | Group create/settings/chat | No room-level relay chooser | Uses global user relay policy for publish/hydration | Cannot explicitly choose per-room storage relays | None | P0 |
| F-10 | Manage members as beginner admin | Group settings/admin | Raw pubkey + role actions | Operationally works | Requires expert-level inputs and terminology | Permissions enforced by role | P1 |

## 4) Guard / Redirect Deep-Dive

### Guard behavior currently enforced

Source: `src/app/groups/guards.ts`

- Invalid/missing group ID -> redirect `/groups`
- Non-relay group IDs on `/moderation` or `/settings` -> redirect `/groups/:groupId`

### UX implications

- Correct from safety perspective, but weakly explanatory for non-experts.
- Recovery path is not explicit (“how do I make this a relay-addressed group?”).

### Required UX correction

- If redirected, show context card with:
  - Why the route is restricted
  - What to do next
  - One-click action to supported path

## 5) Flow-by-Flow Desired Future State

### F-02 Create first group quickly (Guided)

- Replace address-first default with guided “Create Room” sequence:
  1. Room name
  2. Privacy posture (simple labels)
  3. Relay plan (recommended defaults preselected)
  4. Invite people
  5. Confirmation + first message prompt

### F-05 Share group with members

- Add group-context Share action in:
  - Group chat header
  - Group detail header
- Keep account-level invite create as secondary.

### F-07 Configure secure mode

- Move protocol-level toggles behind Expert mode.
- In Guided mode, use clear options such as:
  - Standard reliability
  - Enhanced privacy (availability dependent)
- Always disclose if fallback is active.

### F-09 Room-level relay control

- Add explicit room relay selector during create/settings.
- Show health and capability status for selected relays.
- Keep global relay config separate from room relay policy.

## 6) Acceptance Criteria Seeds

- A first-time user can create a room and send a first message without entering a raw group address.
- A user can share a room from the room itself in <=2 clicks.
- A user can view and edit room-specific relay targets.
- Security state is understandable at glance: no contradictory secure/fallback messaging.
- Redirects always include plain-language recovery guidance.

## 7) Dependencies for Design/Implementation

- Guided vs Expert interaction contract
- Room relay policy product decision
- Security-state copy standard
- Invite/share IA decision
- Telemetry events for step completion and drop-off
