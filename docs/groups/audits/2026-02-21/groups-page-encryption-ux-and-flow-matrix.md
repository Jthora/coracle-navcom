# Groups Encryption UX and Flow Matrix Audit

Status: Draft
Owner: Copilot + Core Team
Date: 2026-02-21
Related: `audit-findings.md`, `task-flow-matrix.md`, `guided-vs-expert-contract.md`

## 1) Scope

This audit focuses on two concerns:

1. Whether the current Groups UX communicates meaningful encryption/transport differences.
2. Whether Groups navigation and page structure fit mobile and desktop flows.

## 2) Encryption Behavior Findings

## E-01: Guided privacy copy was ambiguous about PQC behavior

Observed behavior:

- Guided create options include `standard`, `private`, and `fallback-friendly` labels.
- Runtime security state resolver distinguishes `secure-nip-ee` vs compatibility/fallback states.
- Secure pilot transport can be unavailable by capability or pilot enablement.

Impact:

- Users could interpret “Extra private” as guaranteed stronger encryption, even when runtime falls back.

Code evidence:

- `src/app/groups/guided-create-options.ts`
- `src/app/groups/security-state.ts`
- `src/engine/group-transport-secure.ts`
- `src/app/groups/downgrade-banner.ts`

## E-02: Create flow does not hard-bind guided privacy selection to guaranteed secure mode

Observed behavior:

- Create flow telemetry records privacy selection, but creation uses recovery path and relay/runtime capability still governs effective transport.

Impact:

- Selection is preference/intent, not hard guarantee.

Code evidence:

- `src/app/views/GroupCreateJoin.svelte`
- `src/engine/group-transport-baseline.ts`
- `src/engine/group-transport-secure.ts`

## 3) Copy Clarity Changes Applied

Applied in-code copy changes:

1. Guided option labels now explicitly reference PQC preference vs compatibility behavior.
2. Guided security status hint now states secure-first intent and compatibility fallback behavior.
3. Security state labels now explicitly mark secure as PQC-preferred and compatibility as non-PQC.
4. Create screen now includes a plain-language explainer under privacy options.

Updated files:

- `src/app/groups/guided-create-options.ts`
- `src/app/groups/security-state.ts`
- `src/app/views/GroupCreateJoin.svelte`

## 4) Mobile vs Desktop UX Critique

## C-01 Navigation parity is good, but Groups journey is still deep in mobile menu

- Desktop has persistent sidebar; Groups is always visible.
- Mobile requires opening slider menu, then selecting Groups.
- This adds friction for high-frequency chat users.

Recommendation:

- Add a first-order mobile quick action for Groups/Unread in bottom or top app chrome.

## C-02 Group detail page includes many actions without task prioritization

- Chat, overview, members, moderation, settings are all peer actions.
- On smaller screens this can become crowded and less scannable.

Recommendation:

- Use a prioritized primary action (Chat) and collapse secondary actions into segmented tabs or overflow.

## C-03 Guard recovery is present but could be stronger for novice users

- Redirect reason + CTA are shown.
- Recovery explanation still assumes understanding of relay-addressed constraints.

Recommendation:

- Add “Why this happened” microcopy and one-step route to supported action.

## C-04 Invite conversion path is functional but fragmented across surfaces

- Invite entrypoints exist in chat and invite accept flows.
- Discovery still relies on users navigating between surfaces.

Recommendation:

- Keep invite action primary in chat/detail headers and add success state breadcrumbs after share/join.

## 5) User Flow Map Matrix (Mobile + Desktop)

| Flow ID | User Goal | Desktop Path | Mobile Path | Current Friction | UX Opportunity |
| --- | --- | --- | --- | --- | --- |
| G-01 | Open groups quickly | Sidebar -> Groups | Menu -> Groups | Mobile path is 1 extra layer | Add mobile quick-access Groups action |
| G-02 | Create secure room | Groups -> Create -> Privacy | Menu -> Groups -> Create -> Privacy | PQC meaning not obvious by label alone | Keep explicit PQC-preferred explainer in create flow |
| G-03 | Join from invite | Invite accept -> Join flow | Same | Metadata appears but intent not always obvious | Show destination + expected transport outcome text |
| G-04 | Send first message | Group chat compose | Same | Security/fallback context can be missed | Keep state chip + fallback banner persistent above compose |
| G-05 | Adjust advanced policy | Settings admin (expert mode) | Same, but more taps | Expert tools dense on small screens | Move diagnostics to collapsible sections on mobile |
| G-06 | Recover from blocked route | Redirect + warning + CTA | Same | Cause may still feel technical | Add plain-language reason + next best action |

## 6) Navigation / Sub-page / Popup Guidance

1. Keep create/join as dedicated sub-page (`/groups/create`) for deep-link reliability.
2. Prefer in-page section transitions for guided steps instead of modal stacks.
3. Use popups only for destructive confirmations and short contextual help.
4. Reserve full-page transitions for route-level context changes (list/detail/chat/settings).

## 7) Acceptance Criteria (UX Clarity)

1. User can identify which option is PQC-preferred without domain knowledge.
2. User can identify when runtime is in non-PQC compatibility mode.
3. Mobile users can reach Groups in <=1 navigation gesture from primary app chrome.
4. Guard-recovery screens explain cause and next action in plain language.

## 8) Next Steps

1. Validate copy in staging with quick comprehension checks.
2. Add mobile-first Groups quick action design proposal.
3. Add one e2e assertion for PQC copy presence in guided create flow.
4. Extend flow telemetry to include selected privacy label + resulting runtime security state.
