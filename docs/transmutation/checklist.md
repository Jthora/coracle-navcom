# NavCom Transmutation — Master Workload Checklist

> Every projected workload from the transmutation documentation, organized as **Stages → Phases → Steps → Tasks → Subtasks**.
> Checkboxes seeded with sequential numbers at each hierarchy level.
> Each task includes implementation subtasks and, where applicable, **[EH]** error handling, **[ER]** error reporting, **[EU]** error UI/UX, and **[CR]** code robustness subtasks.

---

## Stage 1: Foundation & Planning

### 1.1 Phase: Strategic Documentation

#### 1.1.1 Step: Doctrine & Analysis

- [x] 1.1.1.1 — Write playbook doctrine (central elephant, archetypes, gaps, innovations)
  - [x] Identify and codify the 3 operator archetypes with behavioral profiles
  - [x] Map each gap to specific source files with line references
  - [x] Define innovation → gap mapping matrix
  - [x] [CR] Cross-validate gap claims against current codebase (no phantom gaps)

- [x] 1.1.1.2 — Define 4-phase sequence with dependency map
  - [x] Define inter-phase dependencies (what Phase N provides to Phase N+1)
  - [x] Identify graceful degradation paths when earlier phases absent
  - [x] [CR] Verify no circular dependencies in phase ordering

- [x] 1.1.1.3 — Create status dashboard tracking table
  - [x] Define status enum: NOT_STARTED / IN_PROGRESS / COMPLETE / BLOCKED
  - [x] Include blocking-reason column for BLOCKED items
  - [x] [ER] Define how blockers and risks surface in the dashboard

- [x] 1.1.1.4 — Define per-phase testing strategy
  - [x] Map each phase to required unit test files and E2E spec files
  - [x] Define regression policy: all prior tests must pass before phase gate
  - [x] [CR] Define minimum coverage thresholds per module type

- [x] 1.1.1.5 — Initialize decision log with key decisions (Tier 2 only, no heartbeats, etc.)
  - [x] Record each decision with context, alternatives considered, and rationale
  - [x] Flag reversible vs. irreversible decisions
  - [x] [CR] Establish decision review cadence (re-evaluate at each phase gate)

#### 1.1.2 Step: Innovation Specifications

- [x] 1.1.2.1 — Write 01-the-briefing.md (Phase 1, onboarding copy rewrite)
  - [x] Include current-state copy vs. target-state copy diff tables
  - [x] Define acceptance criteria with testable assertions
  - [x] [CR] Verify all referenced source files and components exist in codebase

- [x] 1.1.2.2 — Write 02-presence-from-publishing.md (Phase 1, derived presence)
  - [x] Specify store derivation chain from groupProjections
  - [x] Define freshness thresholds with rationale
  - [x] [EH] Document behavior when no events exist for a member (unknown state)
  - [x] [CR] Verify groupProjections store shape matches spec assumptions

- [x] 1.1.2.3 — Write 03-relay-fingerprint-gate.md (Phase 1, relay isolation)
  - [x] Specify pure gate function signature and return types
  - [x] Document URL normalization edge cases (ws:// vs wss://, trailing slash, IDN)
  - [x] [EH] Document behavior for empty relay lists and missing member data
  - [x] [CR] Verify relay-policy.ts exports match spec assumptions

- [x] 1.1.2.4 — Write 04-sovereign-mode.md (Phase 2, connection state + outbox)
  - [x] Map all 4 disconnection sites in current codebase
  - [x] Specify signAndPublish choke-point modification (single if-statement)
  - [x] [EH] Document IndexedDB quota handling, passphrase-unavailable path, stale event timestamps
  - [x] [CR] Verify outbox module and queue-drain exist and match spec assumptions

- [x] 1.1.2.5 — Write 05-the-board.md (Phase 3, tile dashboard)
  - [x] Specify all 7 tile types with data source stores
  - [x] Specify synced store pattern for layout persistence
  - [x] [EH] Document corrupted-layout recovery (fallback to defaults)
  - [x] [CR] Verify OpsView.svelte structure matches replacement assumptions

- [x] 1.1.2.6 — Write 06-trust-attestation.md (Phase 4, attestation events)
  - [x] Specify kind 30078 event structure with d-tag namespacing
  - [x] Specify attestation parsing, expiry, and summary computation
  - [x] [EH] Document malformed event handling (parse returns null)
  - [x] [CR] Verify kind 30078 d-tag namespace doesn't collide with delegation/app-data

#### 1.1.3 Step: Architecture Reference

- [x] 1.1.3.1 — Write architecture-patterns.md (cross-cutting patterns, store inventory, pipeline docs)
  - [x] Enumerate all synced() store keys with module locations
  - [x] Document derived store chain for group projections
  - [x] Document signAndPublish pipeline (sign → route → publish)
  - [x] [CR] Verify all documented patterns against actual codebase (no drift)

---

## Stage 2: Phase 1 — Prove the Direction

### 2.1 Phase: The Briefing (Onboarding Copy Rewrite)

#### 2.1.1 Step: Onboarding Copy Changes

##### 2.1.1.1 Task: Modify `Start.svelte`

- [x] 2.1.1.1.1 — Replace headline copy: "Create an account" → "Initialize Your Secure Identity"
  - [x] Verify exact current string exists (grep before replacing)
  - [x] Check no other components reference this headline text
  - [x] [CR] Ensure replacement text fits within existing layout constraints (no overflow)

- [x] 2.1.1.1.2 — Replace subheadline copy: social-media framing → cryptographic key pair framing
  - [x] Verify current subheadline string location in component
  - [x] [EU] Ensure new copy is readable on small screens (mobile viewport)

- [x] 2.1.1.1.3 — Replace login prompt copy: "Already have an account?" → "Already have credentials?"
  - [x] Verify the login prompt link destination is unchanged
  - [x] [CR] Ensure clickable area is not reduced by shorter/longer text

- [x] 2.1.1.1.4 — Replace first-visit paragraph: social features → decentralized identity
  - [x] Verify paragraph is not conditionally rendered (check all render paths)
  - [x] [EU] Test paragraph readability — no jargon without context

- [x] 2.1.1.1.5 — Replace CTA button: "Get started" → "Generate Credentials"
  - [x] Verify button click handler is unchanged
  - [x] [EU] Ensure new button text fits without truncation on all breakpoints
  - [x] [CR] Verify disabled/loading states still apply with new text

##### 2.1.1.2 Task: Modify `KeyChoice.svelte`

- [x] 2.1.1.2.1 — Replace page heading: "Choose your login method" → "Select Authentication Method"
  - [x] Verify heading element type (h1/h2) is preserved
  - [x] [CR] Grep codebase for any tests asserting old heading text

- [x] 2.1.1.2.2 — Replace nsec option label: social terms → "Local Private Key"
  - [x] Verify label is associated with correct option element
  - [x] [EU] Ensure label change doesn't confuse users mid-onboarding

- [x] 2.1.1.2.3 — Replace nsec description: casual → cryptographic key management
  - [x] Verify description element location and any conditional rendering

- [x] 2.1.1.2.4 — Replace extension option label: "Use a browser extension" → "Hardware/Extension Signer"
  - [x] Verify NIP-07 detection logic is unchanged
  - [x] [EH] Ensure label still makes sense when no extension is detected

- [x] 2.1.1.2.5 — Replace extension description: app-store framing → NIP-07 signer framing
  - [x] [EU] Avoid deep technical jargon — "NIP-07" may need brief inline context

- [x] 2.1.1.2.6 — Replace bunker option label: "Use a remote signer" → "Remote Signer (Bunker)"
  - [x] Verify bunker connection flow is unchanged
  - [x] [CR] Ensure label works when bunker option is conditionally hidden

- [x] 2.1.1.2.7 — Replace bunker description: cloud framing → air-gapped/remote key management
  - [x] [EU] Verify description is understandable for non-cryptographer operators

##### 2.1.1.3 Task: Modify `ProfileLite.svelte`

- [x] 2.1.1.3.1 — Replace heading: "Create your profile" → "Configure Operator Profile"
  - [x] Verify heading is not reused in other onboarding paths

- [x] 2.1.1.3.2 — Replace subheading: social framing → "Your operator profile is your identity across all groups"
  - [x] [EU] Ensure copy conveys the cross-group identity concept clearly

- [x] 2.1.1.3.3 — Replace name label: "What should people call you?" → "Callsign / Display Name"
  - [x] Verify label `for` attribute still matches the input element
  - [x] [CR] Ensure label change doesn't break any form validation messages

- [x] 2.1.1.3.4 — Replace name placeholder: socializing → "e.g., SHADOW-6, Dr. Lin, Dispatch-Alpha"
  - [x] [EU] Verify placeholder text doesn't overflow input on mobile
  - [x] [CR] Ensure placeholder disappears on focus (standard behavior)

- [x] 2.1.1.3.5 — Replace bio label: casual → "Brief Role / Clearance Description"
  - [x] Verify textarea/input element is unchanged

- [x] 2.1.1.3.6 — Replace bio placeholder → "e.g., Logistics Lead — North Sector, Medical QRF"
  - [x] [EU] Ensure placeholder gives operators actionable examples

- [x] 2.1.1.3.7 — Replace avatar prompt: "Add a profile photo" → "Upload Identifier Image (optional)"
  - [x] Verify upload handler and file type validation unchanged
  - [x] [EH] Ensure "(optional)" framing doesn't confuse existing skip logic

- [x] 2.1.1.3.8 — Replace skip text: casual → "Skip — You can configure this from settings"
  - [x] Verify skip handler/routing is unchanged
  - [x] [EU] Ensure skip option remains visually discoverable (not buried)

##### 2.1.1.4 Task: Modify `Complete.svelte`

- [x] 2.1.1.4.1 — Replace heading: "Welcome!" → "Credentials Generated — Secure Your Key"
  - [x] Verify heading renders after key generation completes
  - [x] [EH] Handle case where heading renders before key generation (race condition guard)

- [x] 2.1.1.4.2 — Replace body copy: social framing → private key backup warning with consequences
  - [x] [EU] Use clear language about irreversibility of key loss
  - [x] [EU] Avoid alarm-fatigue — warn firmly but not panic-inducing

- [x] 2.1.1.4.3 — Replace "explore" CTA → "Enter NavCom"
  - [x] Verify CTA routing target is unchanged
  - [x] [CR] Ensure CTA works in both nsec and extension auth flows

- [x] 2.1.1.4.4 — Import and render SecurityPosturePanel below the key backup warning
  - [x] Verify import path resolves correctly
  - [x] Position panel between backup warning and CTA button
  - [x] [EH] Ensure Complete.svelte still renders if SecurityPosturePanel throws
  - [x] [CR] Verify no circular dependency from import chain

- [x] 2.1.1.4.5 — Replace skip/later text → "I understand the risks — enter without backup"
  - [x] [EU] Make the risk acknowledgment clear without being a legal disclaimer
  - [x] [CR] Verify skip still routes to correct post-onboarding destination

- [x] 2.1.1.4.6 — Add conditional import for SecurityPosturePanel
  - [x] Use dynamic import or Svelte component conditional rendering
  - [x] [EH] Fallback: if panel fails to load, onboarding still completes
  - [x] [CR] Verify bundle size impact of new import

#### 2.1.2 Step: New Component — SecurityPosturePanel

- [x] 2.1.2.1 — Create `src/partials/SecurityPosturePanel.svelte` (collapsible panel)
  - [x] Create file with Svelte + TypeScript script block
  - [x] Define component API: no required props (reads from session/auth context)
  - [x] [CR] Ensure component is self-contained (no external state dependencies that could fail)

- [x] 2.1.2.2 — Implement 2-row layout: "Protected (private key, passphrase)" and "Visible (display name, relays)"
  - [x] Render "Protected" row with lock icon and itemized list
  - [x] Render "Visible" row with eye icon and itemized list
  - [x] [EU] Use clear visual distinction between protected and visible sections (color/icon)
  - [x] [EH] Handle edge case: user has no passphrase set (show "Not set" rather than blank)
  - [x] [EH] Handle edge case: display name is empty (show pubkey truncation or "Anonymous")

- [x] 2.1.2.3 — Add collapsible toggle (collapsed by default)
  - [x] Track collapsed state in local component variable
  - [x] Implement smooth expand/collapse animation (CSS transition)
  - [x] [EU] Ensure toggle control is keyboard-accessible (Enter/Space)
  - [x] [EU] Provide visual affordance that panel is expandable (chevron icon)

- [x] 2.1.2.4 — Style with nc-surface-2 background, nc-border, nc-text-muted color tokens
  - [x] Use existing Tailwind custom properties (nc- prefix tokens)
  - [x] Verify rendering in both light/dark themes (if applicable)
  - [x] [CR] Avoid hardcoded colors — use only design system tokens

#### 2.1.3 Step: Testing — The Briefing

- [x] 2.1.3.1 — Create `cypress/e2e/beta/onboarding-briefing.cy.ts`
  - [x] Set up test fixtures with clean onboarding state
  - [x] Define helper for navigating through onboarding steps
  - [x] [CR] Ensure test cleanup doesn't affect other test suites

- [x] 2.1.3.2 — Test: Start page shows "Initialize Your Secure Identity"
  - [x] Assert headline text with exact string match
  - [x] Assert page renders without console errors

- [x] 2.1.3.3 — Test: KeyChoice page shows 3 authentication methods with operational language
  - [x] Assert each method label is present
  - [x] Assert no social-media terminology exists on the page

- [x] 2.1.3.4 — Test: ProfileLite shows "Callsign / Display Name"
  - [x] Assert label text and associated input element

- [x] 2.1.3.5 — Test: Complete page shows "Credentials Generated — Secure Your Key"
  - [x] Assert heading after key generation completes
  - [x] [EH] Test: page handles slow key generation gracefully (loading state)

- [x] 2.1.3.6 — Test: SecurityPosturePanel renders and is collapsible
  - [x] Assert panel is collapsed by default
  - [x] Assert toggle expands panel and shows content
  - [x] Assert toggle collapses panel again

- [x] 2.1.3.7 — Test: SecurityPosturePanel shows "Protected" and "Visible" rows
  - [x] Assert both row labels present when expanded
  - [x] Assert items listed under each row

- [x] 2.1.3.8 — Test: No social-media terminology present in onboarding flow
  - [x] Grep entire flow for banned words: "account", "followers", "social", "friends", "posts"
  - [x] [CR] Maintain banned-word list for regression testing

- [x] 2.1.3.9 — Update existing Cypress assertions that reference old copy strings
  - [x] Search all existing specs for old strings being replaced
  - [x] Update each reference to new operational language
  - [x] [CR] Verify no tests are silently skipped due to string mismatches

- [x] 2.1.3.10 — Validate all 11 acceptance criteria
  - [x] Create a checklist mapping each criterion to at least one test
  - [x] Verify no criterion is unreachable by existing tests

---

### 2.2 Phase: Presence-from-Publishing

#### 2.2.1 Step: Core Store — `presence.ts`

- [x] 2.2.1.1 — Create `src/app/groups/presence.ts`
  - [x] Create file with TypeScript module structure
  - [x] Import dependencies: `groupProjections` from state, `derived` from svelte/store
  - [x] [CR] Verify file location follows existing module conventions in `src/app/groups/`

- [x] 2.2.1.2 — Define `PresenceStatus` type: "active" | "recent" | "cold" | "unknown"
  - [x] Export type for use by badge components
  - [x] [CR] Ensure type is exhaustive (covers all possible classification outcomes)

- [x] 2.2.1.3 — Define freshness thresholds (15min active, 2hr recent, 24hr cold)
  - [x] Export thresholds as named constants (not magic numbers)
  - [x] Use seconds for threshold values (consistent with `created_at` epoch)
  - [x] [CR] Document threshold rationale in comments (why 15min, not 5min or 30min)

- [x] 2.2.1.4 — Implement `classifyPresence(lastSeenTimestamp: number): PresenceStatus`
  - [x] Compute delta between now and lastSeenTimestamp
  - [x] Return correct status for each threshold band
  - [x] [EH] Handle future timestamps gracefully (clock skew → clamp to "active")
  - [x] [EH] Handle `NaN`, `0`, `undefined` input → return "unknown"
  - [x] [EH] Handle negative timestamps → return "unknown"
  - [x] [CR] Use `Math.floor(Date.now() / 1000)` for consistent epoch seconds

- [x] 2.2.1.5 — Implement `groupMemberPresence` derived store from `groupProjections`
  - [x] Derive Map<groupId, Map<pubkey, PresenceStatus>>
  - [x] Recompute when groupProjections updates
  - [x] [EH] Handle groupProjections being empty or undefined → return empty Map
  - [x] [CR] Ensure derivation doesn't iterate excessively (O(groups × members) is acceptable)
  - [x] [CR] No memory leak: derived store automatically cleaned up when unsubscribed

- [x] 2.2.1.6 — Derive per-member last-seen from most recent event `created_at`
  - [x] Scan member events for maximum `created_at` value
  - [x] [EH] Handle member with zero events → classify as "unknown"
  - [x] [EH] Handle events with missing `created_at` → skip event
  - [x] [CR] Cache last-seen values within derivation cycle (avoid redundant scans)

- [x] 2.2.1.7 — Implement `getMemberPresence(groupId, pubkey)` helper
  - [x] Accept groupId and pubkey, return PresenceStatus
  - [x] Lookup from groupMemberPresence store snapshot
  - [x] [EH] Return "unknown" for non-existent groupId or pubkey
  - [x] [CR] Type the return value — never return undefined

- [x] 2.2.1.8 — Implement `getGroupHealth(groupId)` helper returning health level
  - [x] Compute health from member presence distribution
  - [x] Health levels: "healthy" (majority active), "degraded" (majority recent), "cold" (majority cold)
  - [x] [EH] Handle group with zero members → return "cold" (or a distinct "empty" state)
  - [x] [EH] Handle non-existent groupId → return "cold" with no crash
  - [x] [CR] Define "majority" threshold (e.g., >50% of members in a band)

- [x] 2.2.1.9 — Implement `getGroupPresenceSummary(groupId)` returning active/recent/cold/unknown counts
  - [x] Return `{active: number, recent: number, cold: number, unknown: number}`
  - [x] [EH] Return all-zeros for non-existent groupId
  - [x] [CR] Ensure counts sum to total member count (invariant check)

#### 2.2.2 Step: New Components — Presence Badges

##### 2.2.2.1 Task: Create `PresenceBadge.svelte`

- [x] 2.2.2.1.1 — Create `src/partials/PresenceBadge.svelte`
  - [x] Create Svelte component with TypeScript script block
  - [x] [CR] Follow existing component conventions in `src/partials/`

- [x] 2.2.2.1.2 — Accept `pubkey` and `groupId` props
  - [x] Type props with `export let` declarations
  - [x] [EH] Guard: if either prop is undefined/empty, render nothing (no crash)

- [x] 2.2.2.1.3 — Subscribe to `groupMemberPresence` store
  - [x] Use `$` reactive subscription syntax
  - [x] Derive presence status reactively from store + props
  - [x] [CR] Subscription automatically cleaned up on component destroy (Svelte default)

- [x] 2.2.2.1.4 — Render colored dot: green (active), amber (recent), gray (cold), transparent (unknown)
  - [x] Use CSS background-color with nc-token colors where available
  - [x] Dot size: 8px circle with border-radius
  - [x] [EU] Ensure dots meet WCAG contrast ratio against background
  - [x] [EU] Don't rely solely on color — tooltip provides text description

- [x] 2.2.2.1.5 — Add tooltip with human-readable duration ("3 min ago", "2 hours ago")
  - [x] Compute relative time from last-seen timestamp
  - [x] [EH] Show "Unknown" tooltip when presence is "unknown"
  - [x] [EH] Handle case where timestamp is in the future ("Just now")
  - [x] [EU] Tooltip should appear on hover and be accessible via keyboard focus

##### 2.2.2.2 Task: Create `GroupHealthBadge.svelte`

- [x] 2.2.2.2.1 — Create `src/partials/GroupHealthBadge.svelte`
  - [x] Create Svelte component with TypeScript script block

- [x] 2.2.2.2.2 — Accept `groupId` prop
  - [x] Type prop
  - [x] [EH] Render fallback emoji (⚪) if groupId is undefined

- [x] 2.2.2.2.3 — Subscribe to `groupMemberPresence` store
  - [x] Derive group health reactively

- [x] 2.2.2.2.4 — Compute group health from member presence distribution
  - [x] Call `getGroupHealth(groupId)` or inline equivalent
  - [x] [EH] Handle empty groups gracefully (no members → cold)
  - [x] [CR] Recompute only when relevant group data changes (not on every store update)

- [x] 2.2.2.2.5 — Render emoji: 🟢 (healthy), 🟡 (degraded), 🔴 (cold)
  - [x] Map health level to emoji
  - [x] [EU] Ensure emoji renders consistently across platforms (use text emoji, not image)
  - [x] [EU] Emoji must be visually distinguishable at small sizes

- [x] 2.2.2.2.6 — Add tooltip with summary ("5 active, 2 recent, 1 cold")
  - [x] Call `getGroupPresenceSummary(groupId)` for counts
  - [x] Format as human-readable string
  - [x] [EH] Show "No data" tooltip when all counts are zero

#### 2.2.3 Step: Integration — Modified Files

##### 2.2.3.1 Task: Modify `src/app/groups/state.ts`

- [x] 2.2.3.1.1 — Re-export presence store and helpers from `state.ts`
  - [x] Add `export { groupMemberPresence, getMemberPresence, getGroupHealth, getGroupPresenceSummary } from "./presence"`
  - [x] [CR] Verify no circular import created by re-export
  - [x] [CR] Verify existing state.ts exports are not disrupted

##### 2.2.3.2 Task: Modify `CommsView.svelte` — Signal Reframe

- [x] 2.2.3.2.1 — Replace check-in label: "Check in" → "Signal"
  - [x] Locate check-in button/label in component
  - [x] [CR] Verify only the label text changes, not the event kind or content

- [x] 2.2.3.2.2 — Replace check-in icon (if applicable)
  - [x] Change icon from social to operational (e.g., radio signal icon)
  - [x] [EU] Ensure new icon communicates "presence signal" concept

- [x] 2.2.3.2.3 — Replace check-in toast text: social framing → "Signal sent"
  - [x] Locate toast call after successful check-in publish
  - [x] [EH] Verify error toast for failed signal is unchanged or similarly reframed
  - [x] [EU] Keep toast brief (2-3 words)

- [x] 2.2.3.2.4 — No behavioral changes to check-in publishing
  - [x] Verify event kind, content structure, and relay targets are unchanged
  - [x] [CR] Smoke test: signal publish → event appears in group feed

##### 2.2.3.3 Task: Modify `OpsView.svelte`

- [x] 2.2.3.3.1 — Import and render `GroupHealthBadge` next to each group in the ops list
  - [x] Add import statement
  - [x] Place badge adjacent to group name in the group list item
  - [x] [EH] Ensure OpsView renders normally if presence store has no data yet (loading state)
  - [x] [CR] Badge should not shift existing layout (inline element, no width impact)

- [x] 2.2.3.3.2 — Import and render `PresenceBadge` next to each member in member lists
  - [x] Add import statement
  - [x] Place badge adjacent to member name in member list items
  - [x] [EH] Handle members not yet in presence store → badge shows transparent/unknown
  - [x] [CR] Verify member list performance with many members + badges (no jank)

#### 2.2.4 Step: Testing — Presence

- [x] 2.2.4.1 — Create `tests/unit/app/groups/presence.spec.ts`
  - [x] Set up test harness with mock groupProjections data
  - [x] Define test fixtures: groups with members at various activity levels

- [x] 2.2.4.2 — Unit test: `classifyPresence()` returns correct status for each threshold
  - [x] Test: timestamp 5 minutes ago → "active"
  - [x] Test: timestamp 1 hour ago → "recent"
  - [x] Test: timestamp 6 hours ago → "cold"
  - [x] Test: timestamp 0 → "unknown"
  - [x] [EH] Test: NaN input → "unknown"
  - [x] [EH] Test: future timestamp → "active" (clock skew tolerance)
  - [x] Test: exact boundary values (15min, 2hr, 24hr)

- [x] 2.2.4.3 — Unit test: `getGroupHealth()` correctly computes health from member distribution
  - [x] Test: all active → "healthy"
  - [x] Test: majority cold → "cold"
  - [x] Test: mixed → "degraded"
  - [x] [EH] Test: empty member list → "cold"
  - [x] [EH] Test: non-existent groupId → "cold"

- [x] 2.2.4.4 — Unit test: `getGroupPresenceSummary()` returns correct counts
  - [x] Test: 3 active, 2 cold → {active: 3, recent: 0, cold: 2, unknown: 0}
  - [x] [EH] Test: non-existent groupId → all zeros

- [x] 2.2.4.5 — Create `cypress/e2e/beta/presence-badges.cy.ts`
  - [x] Set up E2E fixtures with groups that have recent activity
  - [x] [CR] Ensure test doesn't depend on wall-clock timing (mock timestamps)

- [x] 2.2.4.6 — E2E test: PresenceBadge renders colored dot per member
  - [x] Assert dot element exists next to member names
  - [x] Assert dot color corresponds to presence status

- [x] 2.2.4.7 — E2E test: GroupHealthBadge renders emoji per group
  - [x] Assert emoji element exists next to group names
  - [x] Assert emoji corresponds to computed health

- [x] 2.2.4.8 — E2E test: "Signal" label replaces "Check in" in COMMS view
  - [x] Assert "Signal" text is present
  - [x] Assert "Check in" text is absent

- [x] 2.2.4.9 — Validate all 14 acceptance criteria
  - [x] Map each criterion to at least one passing test
  - [x] [CR] Verify no criterion is only tested manually

---

### 2.3 Phase: Relay Fingerprint Gate

#### 2.3.1 Step: Core Module — `relay-fingerprint-gate.ts`

- [x] 2.3.1.1 — Create `src/engine/relay-fingerprint-gate.ts`
  - [x] Create file with TypeScript module structure
  - [x] [CR] Follow engine module conventions (pure functions, no side effects)

- [x] 2.3.1.2 — Define `GateInput` type: `{memberRelays, groupRelays, memberPubkeys}`
  - [x] Type memberRelays as `Map<pubkey, string[]>` (member → their personal relays)
  - [x] Type groupRelays as `string[]` (group's assigned relay URLs)
  - [x] [CR] Export type for use by assembly helper and tests

- [x] 2.3.1.3 — Define `GateResult` type: `{ok: boolean, violations: Violation[]}`
  - [x] Export type
  - [x] [CR] `ok === true` implies `violations.length === 0` (enforce invariant)

- [x] 2.3.1.4 — Define `Violation` type: `{pubkey, personalRelay, groupRelay, overlapType}`
  - [x] Export type
  - [x] Define `overlapType` as "exact" | "normalized" (exact match vs. match after normalization)
  - [x] [ER] Include enough detail for UI to render actionable violation messages

- [x] 2.3.1.5 — Implement `evaluateRelayFingerprintGate(input: GateInput): GateResult` (pure function)
  - [x] Iterate each member's personal relay list against group relay set
  - [x] Use normalized URL comparison
  - [x] Return all violations (not just first found)
  - [x] [EH] Handle null/undefined input → return `{ok: true, violations: []}` (safe default)
  - [x] [EH] Handle empty memberRelays map → return ok (no members to check)
  - [x] [EH] Handle empty groupRelays → return ok (no group relays to violate)
  - [x] [CR] Pure function: no side effects, no store reads, fully testable

- [x] 2.3.1.6 — Check: no member's personal relay list overlaps with the group's relay set
  - [x] Build Set from normalized group relay URLs for O(1) lookup
  - [x] For each member, check each personal relay against the Set
  - [x] [CR] Collect all violations — don't short-circuit on first match

- [x] 2.3.1.7 — Normalize relay URLs before comparison (strip trailing slashes, lowercase, protocol normalize)
  - [x] Strip trailing `/` characters
  - [x] Lowercase the hostname portion
  - [x] Normalize ws:// ↔ wss:// (treat as equivalent or flag difference)
  - [x] [EH] Handle malformed URLs (try/catch URL parsing → skip gracefully)
  - [x] [EH] Handle empty string URLs → skip
  - [x] [EH] Handle URLs with query parameters → strip before comparison
  - [x] [CR] Reuse `normalizeRelayUrl()` from relay-policy.ts once exported

- [x] 2.3.1.8 — Implement `assembleGateInput(groupId)` helper to gather data from stores
  - [x] Read group relay URLs from group projection / relay policy store
  - [x] Read member personal relay lists from user relay data
  - [x] [EH] Handle non-existent groupId → return empty GateInput (gate will pass)
  - [x] [EH] Handle members with no relay data → skip member (don't block gate)
  - [x] [ER] Log warning when member relay data is unavailable (debugging aid)
  - [x] [CR] This is the only impure function in the module (reads stores)

#### 2.3.2 Step: Integration — Modified Files

##### 2.3.2.1 Task: Modify `src/app/groups/relay-policy.ts`

- [x] 2.3.2.1.1 — Export `normalizeRelayUrl()` function (currently not exported)
  - [x] Change from `function` to `export function`
  - [x] [CR] Verify no callers break — function signature unchanged, only visibility changes
  - [x] [CR] Verify function handles edge cases that external callers might hit

- [x] 2.3.2.1.2 — Add `extractRelayUrls(pubkey)` helper to get member's personal relay list
  - [x] Read from appropriate store (user relay list / kind-10002 events)
  - [x] Return `string[]` of relay URLs
  - [x] [EH] Return empty array when no relay data found for pubkey
  - [x] [EH] Filter out undefined/null/empty URLs from result
  - [x] [CR] Memoize or cache if called frequently (per gate evaluation)

##### 2.3.2.2 Task: Modify `GroupSettingsAdmin.svelte`

- [x] 2.3.2.2.1 — Import `evaluateRelayFingerprintGate` and `assembleGateInput`
  - [x] Verify import paths resolve correctly
  - [x] [CR] Ensure no circular dependencies introduced

- [x] 2.3.2.2.2 — Add reactive gate check: `$: gateResult = evaluateRelayFingerprintGate(assembleGateInput(groupId))`
  - [x] Recomputes whenever groupId or underlying relay data changes
  - [x] [EH] Wrap in try/catch: if gate evaluation throws, default to `{ok: true}` (don't block admin)
  - [x] [CR] Debounce if relay data changes frequently (prevent excessive recalculation)
  - [x] [ER] Log gate evaluation errors to console for debugging

- [x] 2.3.2.2.3 — Display violations as a warning banner when `!gateResult.ok`
  - [x] Show amber/red warning panel above save button
  - [x] Use existing Tailwind warning styles (border-warning, bg-warning/10)
  - [x] [EU] Warning must be immediately visible without scrolling
  - [x] [EU] Clear warning text explaining what the violation means operationally

- [x] 2.3.2.2.4 — Show per-violation detail: member pubkey, overlapping relay URL
  - [x] Render list of violations with member identifier and the problematic relay
  - [x] [EU] Truncate long relay URLs (show first 40 chars + "...")
  - [x] [EU] Show member display name if available, fallback to truncated pubkey
  - [x] [ER] Each violation should suggest remediation ("Remove relay X from personal list" or "Change group relay")

- [x] 2.3.2.2.5 — Disable save/proceed button when violations exist (Tier 2 hard gate)
  - [x] Set `disabled` attribute on save button when `!gateResult.ok`
  - [x] [EU] Change button text to explain why it's disabled (e.g., "Resolve relay conflicts to save")
  - [x] [EU] Ensure disabled state is visually distinct (grayed out, cursor not-allowed)
  - [x] [CR] Verify button re-enables immediately when violations are resolved

#### 2.3.3 Step: Testing — Relay Fingerprint Gate

- [x] 2.3.3.1 — Create `tests/unit/engine/relay-fingerprint-gate.spec.ts`
  - [x] Set up test fixtures: mock relay lists for members and groups
  - [x] [CR] Tests must not depend on any store or runtime state

- [x] 2.3.3.2 — Unit test: gate returns `ok: true` when no overlaps exist
  - [x] Test with disjoint relay sets
  - [x] Test with many members, all clean

- [x] 2.3.3.3 — Unit test: gate returns violations for relay URL overlaps
  - [x] Test with single overlap
  - [x] Test with multiple overlaps across different members
  - [x] Test with same member overlapping on multiple relays

- [x] 2.3.3.4 — Unit test: gate normalizes URLs (trailing slash, case, ws/wss)
  - [x] Test: "wss://relay.example.com/" matches "wss://relay.example.com"
  - [x] Test: "WSS://RELAY.EXAMPLE.COM" matches "wss://relay.example.com"
  - [x] [EH] Test: malformed URL doesn't crash gate

- [x] 2.3.3.5 — Unit test: gate handles empty relay lists gracefully
  - [x] Test: empty memberRelays map → ok
  - [x] Test: empty groupRelays → ok
  - [x] Test: member with empty personal relay list → ok for that member
  - [x] [EH] Test: null/undefined input → ok (safe default)

- [x] 2.3.3.6 — Unit test: `assembleGateInput()` correctly gathers data from stores
  - [x] Test with mocked stores containing relay data
  - [x] [EH] Test with missing group data → empty input
  - [x] [EH] Test with member having no relay data → member omitted from input

- [x] 2.3.3.7 — Create `cypress/e2e/beta/relay-fingerprint-gate.cy.ts`
  - [x] Set up E2E fixtures with groups and members with configurable relay lists
  - [x] [CR] Test isolation: each test starts with clean state

- [x] 2.3.3.8 — E2E test: GroupSettingsAdmin shows warning when relay overlap detected
  - [x] Configure member with overlapping relay
  - [x] Navigate to group admin settings
  - [x] Assert warning banner is visible
  - [x] Assert violation details are readable

- [x] 2.3.3.9 — E2E test: Save button disabled when violations exist
  - [x] Assert button is disabled
  - [x] Assert button has explanatory text/tooltip
  - [x] Assert click on disabled button does nothing

- [x] 2.3.3.10 — E2E test: Warning clears when violation resolved
  - [x] Configure overlap → see warning → remove overlap → assert warning gone
  - [x] Assert save button re-enabled

- [x] 2.3.3.11 — Validate all 16 acceptance criteria
  - [x] Map each criterion to passing tests
  - [x] [CR] Verify gate is tested as pure function AND as integrated UI

### 2.4 Phase: Phase 1 Integration & Validation

- [x] 2.4.1 — Verify all 3 Phase 1 innovations work together without conflicts
  - [x] Run app with all 3 innovations active simultaneously
  - [x] Verify no import conflicts or circular dependencies
  - [x] Verify no store subscription conflicts (derived stores don't interfere)
  - [x] [EH] Verify each innovation degrades gracefully if another has a runtime error
  - [x] [CR] Verify bundle size increase is reasonable (< 15KB gzipped per innovation)

- [x] 2.4.2 — Run full beta test suite (243+ tests) and confirm no regressions
  - [x] Run `npx cypress run` for all 20 beta specs
  - [x] Verify 243/243 original tests still pass
  - [x] Run new Phase 1 specs (onboarding-briefing, presence-badges, relay-fingerprint-gate)
  - [x] [ER] If regressions found, isolate which innovation caused the break

- [x] 2.4.3 — Git commit Phase 1 work (using Prettier workaround for hooks)
  - [x] Stage all Phase 1 files (new + modified)
  - [x] Commit with descriptive message referencing Phase 1
  - [x] [CR] Use `--no-verify` Prettier workaround if needed, but verify lint passes manually

- [x] 2.4.4 — Update playbook.md status dashboard for Phase 1 completion
  - [x] Set Briefing, Presence, Relay Gate rows to COMPLETE
  - [x] Record actual completion notes / deviations from plan

---

## Stage 3: Phase 2 — Sovereign Mode

### 3.1 Phase: Connection State Engine

#### 3.1.1 Step: Core Store — `connection-state.ts`

- [ ] 3.1.1.1 — Create `src/engine/connection-state.ts`
  - [ ] Create file with TypeScript module structure
  - [ ] Import writable/derived from svelte/store
  - [ ] [CR] Follow engine module conventions (state + logic colocated)

- [ ] 3.1.1.2 — Define `ConnectionMode` type: "connected" | "sovereign"
  - [ ] Export type
  - [ ] [CR] String literal union (not enum) for consistency with codebase

- [ ] 3.1.1.3 — Define `ConnectionState` type: `{mode, since, queuedCount, lastConnectedAt}`
  - [ ] `mode: ConnectionMode`
  - [ ] `since: number` (epoch seconds when current mode started)
  - [ ] `queuedCount: number` (messages in outbox awaiting drain)
  - [ ] `lastConnectedAt: number` (epoch seconds of last connected transition)
  - [ ] [CR] Export type for consumer components

- [ ] 3.1.1.4 — Create `connectionState` writable store
  - [ ] Initialize with safe defaults: mode="connected", since=now, queuedCount=0
  - [ ] [EH] Initial mode should reflect `navigator.onLine` at creation time
  - [ ] [EH] Handle case where `navigator.onLine` is unavailable (SSR, old browsers) → default "connected"

- [ ] 3.1.1.5 — Create `isSovereign` derived store: `derived(connectionState, s => s.mode === "sovereign")`
  - [ ] Export for use in signAndPublish and components
  - [ ] [CR] Derived store auto-updates when connectionState changes

- [ ] 3.1.1.6 — Implement `startConnectionMonitor()` — bind `navigator.onLine`, online/offline events
  - [ ] Add event listener for `window.addEventListener("online", ...)`
  - [ ] Add event listener for `window.addEventListener("offline", ...)`
  - [ ] Read initial `navigator.onLine` value at startup
  - [ ] [EH] Guard: only bind events when `window` is defined (SSR safety)
  - [ ] [EH] Handle `navigator.onLine` reporting true behind captive portal (relay health fallback)
  - [ ] [CR] Return cleanup function for event listener removal (testability)
  - [ ] [ER] Log connection state transitions to console (debug aid)

- [ ] 3.1.1.7 — Implement 3-second debounce for transition to sovereign (prevent flapping)
  - [ ] On offline event: start 3-second timer before setting mode="sovereign"
  - [ ] If online event fires within window: cancel timer, stay connected
  - [ ] [EH] Clear any pending timer on component/monitor teardown
  - [ ] [CR] Use `setTimeout`/`clearTimeout` (not reactive timer libraries)
  - [ ] [CR] Debounce window is configurable constant (not magic number)

- [ ] 3.1.1.8 — Implement immediate transition to connected (no debounce)
  - [ ] On online event: immediately set mode="connected"
  - [ ] Cancel any pending sovereign-transition timer
  - [ ] Trigger queue drain (outbox flush)
  - [ ] [CR] Update `lastConnectedAt` timestamp on transition

- [ ] 3.1.1.9 — Implement `updateQueuedCount(count)` function
  - [ ] Accept count (number), update connectionState.queuedCount
  - [ ] [EH] Clamp to non-negative (Math.max(0, count))
  - [ ] [CR] Export function for use by signAndPublish and queue-drain

- [ ] 3.1.1.10 — Track `lastConnectedAt` timestamp on transitions
  - [ ] Set `lastConnectedAt = Math.floor(Date.now() / 1000)` when transitioning to connected
  - [ ] Preserve value during sovereign mode (don't overwrite on offline events)
  - [ ] [EU] Used by SovereignBar to display "Last online: N minutes ago"

#### 3.1.2 Step: New Component — `SovereignBar.svelte`

- [ ] 3.1.2.1 — Create `src/partials/SovereignBar.svelte`
  - [ ] Create Svelte component with TypeScript script block
  - [ ] [CR] Maintain separation from Toast.svelte (two independent systems)

- [ ] 3.1.2.2 — Subscribe to `connectionState` store
  - [ ] Use `$connectionState` reactive subscription
  - [ ] Derive display values reactively

- [ ] 3.1.2.3 — Implement 4 visual states: CONNECTED (hidden), DEGRADED (amber bar), SOVEREIGN (red bar), RECONNECTING (blue bar)
  - [ ] CONNECTED: component renders nothing (display:none or `{#if}` guard)
  - [ ] DEGRADED: amber/yellow background with warning icon
  - [ ] SOVEREIGN: red background with disconnect icon
  - [ ] RECONNECTING: blue background with spinning sync icon
  - [ ] [EU] Transitions between states should be smooth (CSS transition)
  - [ ] [EU] Color must meet WCAG AA contrast on text within the bar
  - [ ] [CR] Use Tailwind utility classes with nc- tokens where possible

- [ ] 3.1.2.4 — Display elapsed time since last connected (`since` field)
  - [ ] Compute and update elapsed time reactively (tick every second or minute)
  - [ ] Format as "Xm" or "Xh Xm" for readability
  - [ ] [EH] Handle `since` timestamp being 0 or future → show "Just now"
  - [ ] [CR] Use `setInterval` with cleanup in `onDestroy` (no timer leak)

- [ ] 3.1.2.5 — Display queue depth: "N queued" from `queuedCount`
  - [ ] Show only when queuedCount > 0
  - [ ] Format: "1 queued" / "N queued"
  - [ ] [EU] Provide assurance: queued items will send on reconnect
  - [ ] [EU] If queue is empty in sovereign mode, show "Nothing to send"

- [ ] 3.1.2.6 — Position as fixed/sticky bar at top of viewport
  - [ ] Use `position: fixed; top: 0; left: 0; right: 0; z-index:` above content
  - [ ] [CR] Use z-index from existing scale (check architecture-patterns.md z-index scale)
  - [ ] [EU] Bar should not obscure critical navigation elements

- [ ] 3.1.2.7 — Ensure bar is visible in all mode-views (COMMS, MAP, OPS)
  - [ ] Import SovereignBar at layout/shell level (above Routes.svelte conditional)
  - [ ] Verify visibility when switching modes
  - [ ] [CR] Bar renders independently of navcomMode state

- [ ] 3.1.2.8 — Add app shell conditional padding to prevent content overlap
  - [ ] When bar is visible, add `padding-top` to main content area
  - [ ] When bar is hidden, remove padding
  - [ ] [EU] Content should not "jump" when bar appears (smooth transition)
  - [ ] [CR] Use reactive class binding or CSS variable for padding

### 3.2 Phase: Pipeline Integration

#### 3.2.1 Step: Modify `signAndPublish` — Choke Point

- [ ] 3.2.1.1 — Modify `src/engine/commands.ts` — add sovereign mode branch to `signAndPublish()`
  - [ ] Locate `signAndPublish` function
  - [ ] [CR] Minimal change: single if-statement, not a rewrite
  - [ ] [CR] Read `isSovereign` synchronously via `get(isSovereign)` (not reactive $)

- [ ] 3.2.1.2 — Import `isSovereign` and `updateQueuedCount` from connection-state
  - [ ] Verify import paths
  - [ ] [CR] Verify no circular dependency (commands ←→ connection-state)

- [ ] 3.2.1.3 — When `isSovereign === true`: sign event → enqueue to outbox → update queue count → return
  - [ ] Call `sign()` to produce signed event (works offline — uses local key)
  - [ ] Determine target relay URLs from routing logic
  - [ ] Enqueue `{signedEvent, targetRelays}` to IndexedDB outbox
  - [ ] Call `updateQueuedCount()` with new count
  - [ ] [EH] If `sign()` fails (e.g., passphrase unavailable): show error toast, don't enqueue
  - [ ] [EH] If `enqueue()` fails (IndexedDB error / quota exceeded): show error toast, explain message not saved
  - [ ] [ER] Toast message for enqueue failure: "Message could not be saved for later sending"
  - [ ] [EU] On success: no toast (SovereignBar already shows queue count)
  - [ ] [CR] Return signed event regardless of enqueue success/failure

- [ ] 3.2.1.4 — When `isSovereign === false`: existing publishThunk path (no change)
  - [ ] [CR] Verify existing code path is completely unchanged
  - [ ] [CR] No additional wrapping, error handling, or logging added to connected path

- [ ] 3.2.1.5 — Ensure signed event is returned regardless of mode
  - [ ] Both sovereign and connected paths return the signed event
  - [ ] [CR] Callers that use the return value work identically in both modes

#### 3.2.2 Step: Extend Outbox Queue

##### 3.2.2.1 Task: Extend `QueuedMessage` type

- [ ] 3.2.2.1.1 — Add `signedEvent` field to `QueuedMessage` in outbox module (full signed event envelope)
  - [ ] Add optional `signedEvent?: TrustedEvent` (or appropriate signed event type)
  - [ ] [CR] Field is optional to maintain backward compatibility with legacy DM queue entries
  - [ ] [CR] Existing serialization/deserialization handles new field (JSON-safe)

- [ ] 3.2.2.1.2 — Add `targetRelays` field to `QueuedMessage` (array of relay URLs for publication)
  - [ ] Add optional `targetRelays?: string[]`
  - [ ] [CR] Required when `signedEvent` is present
  - [ ] [EH] Default to empty array if missing (drain will skip publish with no targets)

##### 3.2.2.2 Task: Extend `queue-drain.ts`

- [ ] 3.2.2.2.1 — Modify drain logic: detect `signedEvent` field on queued message
  - [ ] Check `msg.signedEvent` presence before deciding drain path
  - [ ] [CR] Detection is a simple truthiness check, not type discrimination

- [ ] 3.2.2.2.2 — When `signedEvent` present: publish via `publishThunk()` (skip re-signing)
  - [ ] Extract signed event and target relays from queued message
  - [ ] Call `publishThunk(signedEvent, targetRelays)`
  - [ ] [EH] If publish fails on specific relays: retry with exponential backoff (existing pattern)
  - [ ] [EH] If publish fails on ALL relays: mark message as "failed", leave in queue for next drain
  - [ ] [EH] If signed event has stale `created_at` (relay rejects "event too old"): log warning, dequeue anyway
  - [ ] [ER] Log each drain attempt: "Draining N queued events to M relays"
  - [ ] [CR] Guard against concurrent drains (existing `draining` boolean)

- [ ] 3.2.2.2.3 — When `signedEvent` absent: legacy DM send path (existing behavior)
  - [ ] [CR] Existing sendMessage logic unchanged
  - [ ] [CR] Both paths share retry/dequeue/error infrastructure

- [ ] 3.2.2.2.4 — Update `updateQueuedCount()` after each successful drain
  - [ ] After each message successfully published: decrement count
  - [ ] After full drain complete: set count to remaining queue length
  - [ ] [EH] Count should never go negative (clamp to 0)
  - [ ] [EU] SovereignBar updates in real-time as queue drains

#### 3.2.3 Step: Relay Health Integration

- [ ] 3.2.3.1 — Modify `relay-health.ts`: add `pause()` method to relay health tracker
  - [ ] Set internal flag to skip health check evaluations
  - [ ] [CR] Existing health data preserved (not cleared on pause)
  - [ ] [EH] Idempotent: calling pause() when already paused is a no-op

- [ ] 3.2.3.2 — Modify `relay-health.ts`: add `resume()` method to relay health tracker
  - [ ] Clear pause flag, re-enable health tracking
  - [ ] [CR] Don't trigger immediate re-evaluation (let normal check cycle resume)
  - [ ] [EH] Idempotent: calling resume() when already running is a no-op

- [ ] 3.2.3.3 — Call `pause()` on transition to sovereign mode
  - [ ] Wire from connectionState transition logic
  - [ ] [CR] Prevents false relay demotions during offline period

- [ ] 3.2.3.4 — Call `resume()` on transition to connected mode
  - [ ] Wire from connectionState transition logic
  - [ ] [CR] Resume before triggering drain (health data informs relay selection)

- [ ] 3.2.3.5 — Add relay circuit-breaker: if all relays demoted, transition to sovereign regardless of `navigator.onLine`
  - [ ] Monitor relay health states; if all reach demoted/failed state, trigger sovereign
  - [ ] [EH] Captive portal detection: navigator.onLine says true, but no relay responds
  - [ ] [EH] Reset circuit-breaker when at least one relay recovers
  - [ ] [CR] Circuit-breaker should have its own debounce (don't flap on brief relay hiccups)

#### 3.2.4 Step: Cleanup & Startup

- [ ] 3.2.4.1 — Modify `Toast.svelte`: remove independent online/offline event listeners that show redundant toast
  - [ ] Locate online/offline event listeners in Toast.svelte
  - [ ] Remove the listeners and associated toast rendering
  - [ ] [CR] SovereignBar now owns all connection-status UI
  - [ ] [EH] If SovereignBar fails to render, there's no fallback — accept this (fail loudly)

- [ ] 3.2.4.2 — Modify `main.js` (or app entry): call `startConnectionMonitor()` at app startup
  - [ ] Import `startConnectionMonitor` from connection-state.ts
  - [ ] Call during app initialization sequence
  - [ ] [CR] Call after DOM is ready but before user interaction (init sequence ordering)
  - [ ] [EH] If monitor fails to start, app still loads (connection features disabled, not blocking)

- [ ] 3.2.4.3 — Ensure SovereignBar component is imported at layout/shell level
  - [ ] Import in the top-level layout or shell component
  - [ ] Position above the Routes.svelte conditional rendering
  - [ ] [CR] Bar is always mounted regardless of navcomMode

### 3.3 Phase: Testing — Sovereign Mode

#### 3.3.1 Step: Unit Tests

- [ ] 3.3.1.1 — Create `tests/unit/engine/connection-state.spec.ts`
  - [ ] Set up test harness with mocked `navigator.onLine` and event dispatch
  - [ ] [CR] Use fake timers for debounce testing (vi.useFakeTimers)

- [ ] 3.3.1.2 — Unit test: store initializes to "connected" when `navigator.onLine` is true
  - [ ] Mock `navigator.onLine = true`
  - [ ] Assert initial mode is "connected"

- [ ] 3.3.1.3 — Unit test: store initializes to "sovereign" when `navigator.onLine` is false
  - [ ] Mock `navigator.onLine = false`
  - [ ] Assert initial mode is "sovereign"

- [ ] 3.3.1.4 — Unit test: transition to sovereign after debounce on offline event
  - [ ] Dispatch offline event
  - [ ] Assert mode is still "connected" immediately
  - [ ] Advance timer by 3000ms
  - [ ] Assert mode is "sovereign"

- [ ] 3.3.1.5 — Unit test: transition to connected immediately on online event
  - [ ] Set mode to sovereign
  - [ ] Dispatch online event
  - [ ] Assert mode is "connected" immediately (no timer wait)

- [ ] 3.3.1.6 — Unit test: no transition if connection returns within debounce window
  - [ ] Dispatch offline event
  - [ ] Wait 1000ms
  - [ ] Dispatch online event
  - [ ] Advance timer by 5000ms
  - [ ] Assert mode was never "sovereign"

- [ ] 3.3.1.7 — Unit test: `since` timestamp updates on each transition
  - [ ] Record timestamp before transition
  - [ ] Trigger transition
  - [ ] Assert `since` is >= recorded timestamp

- [ ] 3.3.1.8 — Unit test: `lastConnectedAt` preserved during sovereign mode
  - [ ] Record `lastConnectedAt` before going sovereign
  - [ ] Go sovereign
  - [ ] Assert `lastConnectedAt` unchanged during sovereign mode

- [ ] 3.3.1.9 — Unit test: `updateQueuedCount()` updates store
  - [ ] Call updateQueuedCount(5)
  - [ ] Assert store.queuedCount === 5
  - [ ] [EH] Call updateQueuedCount(-1)
  - [ ] Assert store.queuedCount === 0 (clamped)

- [ ] 3.3.1.10 — Create `tests/unit/engine/commands-sovereign.spec.ts`
  - [ ] Set up test harness with mocked stores and outbox

- [ ] 3.3.1.11 — Unit test: `signAndPublish` enqueues when sovereign
  - [ ] Set isSovereign to true
  - [ ] Call signAndPublish with template
  - [ ] Assert event was enqueued to outbox
  - [ ] Assert publishThunk was NOT called

- [ ] 3.3.1.12 — Unit test: `signAndPublish` publishes normally when connected
  - [ ] Set isSovereign to false
  - [ ] Call signAndPublish with template
  - [ ] Assert publishThunk was called
  - [ ] Assert outbox was NOT written to

- [ ] 3.3.1.13 — Unit test: queued count updated after enqueue
  - [ ] Set isSovereign to true
  - [ ] Call signAndPublish
  - [ ] Assert updateQueuedCount called with incremented value

- [ ] 3.3.1.14 — Unit test: signed event returned regardless of mode
  - [ ] [Test sovereign] Assert return value is a signed event
  - [ ] [Test connected] Assert return value is a signed event
  - [ ] Assert event structure matches in both cases

#### 3.3.2 Step: E2E Tests

- [ ] 3.3.2.1 — Create `cypress/e2e/beta/sovereign-mode.cy.ts`
  - [ ] Set up E2E fixtures with active groups and relay connections
  - [ ] Define helper for simulating offline/online transitions (cy.intercept + navigator.onLine mock)
  - [ ] [CR] Ensure test cleanup restores online state

- [ ] 3.3.2.2 — E2E test: SovereignBar appears when connection drops
  - [ ] Simulate offline
  - [ ] Wait for debounce (3s)
  - [ ] Assert SovereignBar visible
  - [ ] Assert "SOVEREIGN" text present
  - [ ] Assert bar is red-themed

- [ ] 3.3.2.3 — E2E test: messages queue in sovereign mode and drain on reconnect
  - [ ] Simulate offline → wait for sovereign
  - [ ] Send a message in COMMS view
  - [ ] Assert "1 queued" in SovereignBar
  - [ ] Simulate online
  - [ ] Assert drain completes (queued count returns to 0)
  - [ ] Assert SovereignBar shows "CONNECTED" then hides

- [ ] 3.3.2.4 — E2E test: SovereignBar shows queue depth
  - [ ] Simulate offline → send 3 messages
  - [ ] Assert "3 queued" displayed
  - [ ] [EU] Verify count updates in real-time (not batch)

- [ ] 3.3.2.5 — E2E test: brief connection hiccups don't trigger sovereign mode (debounce)
  - [ ] Simulate offline → wait 1 second → simulate online
  - [ ] Assert SovereignBar NEVER appeared
  - [ ] [CR] Test validates the 3-second debounce behavior

- [ ] 3.3.2.6 — E2E test: relay health pause prevents false demotions during sovereign mode
  - [ ] Enter sovereign mode
  - [ ] Verify relay health tracking is paused (no demotion events)
  - [ ] Reconnect
  - [ ] Verify relay health tracking is resumed

### 3.4 Phase: Phase 2 Validation

- [ ] 3.4.1 — Validate all 19 acceptance criteria for Sovereign Mode
  - [ ] Create criterion-to-test mapping
  - [ ] Verify each criterion has at least one automated test
  - [ ] [CR] No manual-only criteria

- [ ] 3.4.2 — Run full beta test suite (243+ Phase 1 tests) and confirm no regressions
  - [ ] Run all existing specs plus new sovereign specs
  - [ ] [ER] Document any regressions with root cause analysis

- [ ] 3.4.3 — Verify per-mode behavior: COMMS queues messages, MAP tiles unavailable expected, OPS continues
  - [ ] In sovereign: COMMS messages are queued (not silently dropped)
  - [ ] In sovereign: MAP shows "offline" overlay (expected behavior)
  - [ ] In sovereign: OPS/Board tiles show cached data or appropriate empty states
  - [ ] [EU] Verify user understands what's happening in each mode during sovereign

- [ ] 3.4.4 — Test transition edge cases: flapping, captive portal, passphrase unavailable
  - [ ] Rapid online/offline toggling → no sovereign mode triggered
  - [ ] Captive portal (navigator.onLine=true, relays fail) → circuit-breaker triggers sovereign
  - [ ] Passphrase unavailable during sovereign → sign fails → error toast
  - [ ] [EH] Event with stale created_at on drain → log warning, dequeue

- [ ] 3.4.5 — Git commit Phase 2 work
  - [ ] Stage all Phase 2 files
  - [ ] Commit with descriptive message
  - [ ] [CR] Verify Prettier/lint passes

- [ ] 3.4.6 — Update playbook.md status dashboard for Phase 2 completion
  - [ ] Set Sovereign Mode row to COMPLETE
  - [ ] Record notes on edge cases encountered

---

## Stage 4: Phase 3 — The Board

### 4.1 Phase: Board State & Infrastructure

#### 4.1.1 Step: Core Module — `board-state.ts`

- [ ] 4.1.1.1 — Create `src/app/board/board-state.ts`
  - [ ] Create directory `src/app/board/` if it doesn't exist
  - [ ] Create TypeScript module with type exports and store
  - [ ] [CR] Follow existing app module conventions (see `src/app/groups/`)

- [ ] 4.1.1.2 — Define `TileType` union: "map-overview" | "group-status" | "personnel-status" | "activity-feed" | "connection-status" | "security-status" | "quick-actions"
  - [ ] Export type for use by tile components and registry
  - [ ] [CR] String literal union — extensible for Phase 4 ("trust-overview")

- [ ] 4.1.1.3 — Define `TilePlacement` type: `{type, col, row, colSpan, rowSpan}`
  - [ ] type: TileType
  - [ ] col, row: 1-based grid coordinates
  - [ ] colSpan, rowSpan: tile dimensions (default 1×1)
  - [ ] [CR] Ensure grid coordinates are validated (no negative, no out-of-bounds)

- [ ] 4.1.1.4 — Define `BoardLayout` type: `TilePlacement[]`
  - [ ] Export type
  - [ ] [CR] Array order determines render order (z-index in case of overlap)

- [ ] 4.1.1.5 — Define `TILE_REGISTRY` object with metadata (name, icon, description) for all 7 tile types
  - [ ] Each entry: `{name: string, icon: string, description: string}`
  - [ ] [CR] Registry drives TilePicker UI — all tile types must have entries
  - [ ] [EH] Unknown tile type in layout → skip rendering (don't crash Board)

- [ ] 4.1.1.6 — Define `DEFAULT_DESKTOP_LAYOUT` constant with 5 default tiles
  - [ ] Include: map-overview, group-status, activity-feed, personnel-status, connection-status
  - [ ] Assign sensible grid positions for 4-column layout
  - [ ] [CR] Layout should fill visible viewport without scrolling on typical desktop

- [ ] 4.1.1.7 — Create `boardLayout` synced store: `synced("ui/board-layout", DEFAULT_DESKTOP_LAYOUT)`
  - [ ] Use existing synced() pattern for localStorage persistence
  - [ ] [EH] If localStorage contains invalid JSON → fallback to default layout silently
  - [ ] [EH] If localStorage contains layout with unknown tile types → filter them out, keep valid tiles
  - [ ] [EH] If localStorage is corrupted or quota exceeded → use in-memory default
  - [ ] [CR] Key `"ui/board-layout"` follows existing naming convention (see architecture-patterns.md)

- [ ] 4.1.1.8 — Implement `addTile(type)` function: places new tile at next available row
  - [ ] Compute next available grid position (after last tile)
  - [ ] Append new TilePlacement to boardLayout
  - [ ] [EH] Prevent adding duplicate tile types if max count enforced
  - [ ] [CR] Store update triggers reactive re-render in BoardView

- [ ] 4.1.1.9 — Implement `removeTile(index)` function
  - [ ] Remove tile at array index from boardLayout
  - [ ] [EH] Guard: index out of bounds → no-op
  - [ ] [EH] Prevent removing last tile (always keep at least one?)
  - [ ] [CR] Store update persists immediately via synced()

- [ ] 4.1.1.10 — Implement `moveTile(fromIndex, toIndex)` function
  - [ ] Reorder tile in the layout array
  - [ ] [EH] Guard: invalid indices → no-op
  - [ ] [CR] Used by drag-and-drop reordering

#### 4.1.2 Step: New Component — `TilePicker.svelte`

- [ ] 4.1.2.1 — Create `src/app/board/TilePicker.svelte`
  - [ ] Create Svelte component with TypeScript script block
  - [ ] Import TILE_REGISTRY and addTile from board-state

- [ ] 4.1.2.2 — List all available tile types from `TILE_REGISTRY`
  - [ ] Iterate TILE_REGISTRY entries
  - [ ] Display icon, name, description for each
  - [ ] [EH] Handle empty registry gracefully (should never happen, but defensive)

- [ ] 4.1.2.3 — Show add button per tile type
  - [ ] Button calls `addTile(type)` on click
  - [ ] [EU] Button should provide visual feedback on click (brief highlight)
  - [ ] [EU] Confirm action or auto-close picker after adding

- [ ] 4.1.2.4 — Disable tiles already at max count (if applicable)
  - [ ] Check current layout for existing instances of each type
  - [ ] Gray out / disable add button for tiles at limit
  - [ ] [EU] Show tooltip explaining why tile is disabled ("Already on board")

- [ ] 4.1.2.5 — Style as collapsible side panel or modal
  - [ ] Use existing UI patterns for overlay/panel (check Tailwind z-index scale)
  - [ ] [EU] Close picker on outside click or Escape key
  - [ ] [EU] Animate open/close for smooth UX
  - [ ] [CR] Picker should not overlap SovereignBar

### 4.2 Phase: Board View & Layout

#### 4.2.1 Step: New Component — `BoardView.svelte`

- [ ] 4.2.1.1 — Create `src/app/views/BoardView.svelte`
  - [ ] Create Svelte component with TypeScript script block
  - [ ] Import boardLayout, TILE_REGISTRY from board-state
  - [ ] [CR] Follow existing view component conventions (see CommsView, MapView)

- [ ] 4.2.1.2 — Subscribe to `boardLayout` synced store
  - [ ] Use `$boardLayout` reactive subscription
  - [ ] [EH] If store value is null/empty → render default layout
  - [ ] [CR] Subscription auto-cleanup on component destroy

- [ ] 4.2.1.3 — Render CSS Grid with `grid-template-columns` and `grid-template-rows`
  - [ ] Set `display: grid` on container
  - [ ] Use `grid-template-columns: repeat(4, 1fr)` as base (4 columns)
  - [ ] Set `gap` for spacing between tiles
  - [ ] [CR] Grid container fills available height (min-height or flex-grow)

- [ ] 4.2.1.4 — Map each `TilePlacement` to the correct tile component (dynamic dispatch)
  - [ ] Use `{#each}` over boardLayout
  - [ ] Map type string to component via lookup object or switch
  - [ ] Set `grid-column` and `grid-row` from placement data
  - [ ] [EH] Unknown tile type → render placeholder "Unknown tile" box
  - [ ] [ER] Log warning for unknown tile type: "Unknown tile type: {type}"
  - [ ] [CR] Each tile receives its type and placement as props

- [ ] 4.2.1.5 — Implement edit mode toggle button
  - [ ] Local `editMode: boolean` state
  - [ ] Toggle button: gear/pencil icon in top-right corner
  - [ ] [EU] Button text changes: "Edit" ↔ "Done"
  - [ ] [EU] Edit mode boundary is visually clear (outline on board, dimmed tiles)

- [ ] 4.2.1.6 — In edit mode: show ✕ remove button on each tile
  - [ ] Overlay remove button at top-right corner of each tile
  - [ ] Call `removeTile(index)` on click
  - [ ] [EU] Confirm removal or provide undo (toast with "Undo" action)
  - [ ] [EU] Remove button should have sufficient tap target (min 44px)

- [ ] 4.2.1.7 — In edit mode: show TilePicker panel
  - [ ] Conditionally render `<TilePicker />` when editMode is true
  - [ ] [EU] Picker should not obscure the board (side panel or bottom sheet)

- [ ] 4.2.1.8 — Implement drag-and-drop reordering (native HTML drag events)
  - [ ] Set `draggable="true"` on tile containers in edit mode
  - [ ] Handle dragstart, dragover, drop events
  - [ ] Call `moveTile(fromIndex, toIndex)` on successful drop
  - [ ] [EH] Handle drop outside valid target → no-op (revert to original position)
  - [ ] [EU] Visual feedback during drag: ghost element, drop target highlight
  - [ ] [EU] Mobile: consider long-press to initiate drag (touch events)
  - [ ] [CR] Drag only active in edit mode (no accidental reorder)

- [ ] 4.2.1.9 — Implement responsive breakpoints: 4 columns (xl) → 3 (lg) → 2 (md) → 1 (sm)
  - [ ] Use Tailwind responsive classes or CSS media queries
  - [ ] Adjust `grid-template-columns: repeat(N, 1fr)` per breakpoint
  - [ ] [EU] Tiles should reflow gracefully (no overflow, no horizontal scroll)
  - [ ] [EU] On mobile (1 column): tiles stack vertically in meaningful order
  - [ ] [CR] Test at each breakpoint: xl (1280+), lg (1024+), md (768+), sm (<768)

#### 4.2.2 Step: Modify `Routes.svelte`

- [ ] 4.2.2.1 — Replace `OpsView` import with `BoardView` import
  - [ ] Change import statement
  - [ ] [CR] Verify import path resolves to new BoardView.svelte

- [ ] 4.2.2.2 — Change conditional: when `$navcomMode === "ops"` render `<BoardView />` instead of `<OpsView />`
  - [ ] Replace component reference in the `{#if}` / `{:else if}` chain
  - [ ] [CR] All other mode conditionals (comms, map) unchanged
  - [ ] [EH] If BoardView fails to import → build error (caught at compile time)

- [ ] 4.2.2.3 — Change max width: `max-w-4xl` → `max-w-6xl` for Board layout
  - [ ] Locate max-width Tailwind class on the OPS-mode container
  - [ ] Change to `max-w-6xl` (1152px) to accommodate grid layout
  - [ ] [EU] Verify wider layout doesn't cause reading discomfort on ultra-wide screens
  - [ ] [CR] Only the OPS-mode branch gets wider — COMMS and MAP unchanged

- [ ] 4.2.2.4 — Preserve OpsView.svelte in codebase (do not delete)
  - [ ] [CR] Keep file as reference/fallback — no import needed
  - [ ] [CR] Remove from any barrel exports if applicable

### 4.3 Phase: Tile Components

#### 4.3.1 Step: Map Overview Tile

- [ ] 4.3.1.1 — Create `src/app/board/tiles/MapOverviewTile.svelte`
  - [ ] Create directory `src/app/board/tiles/` if needed
  - [ ] Create Svelte component with TypeScript script block
  - [ ] [CR] Follow tile component conventions (self-contained, own store subscriptions)

- [ ] 4.3.1.2 — Initialize Leaflet instance (separate from MapView's instance)
  - [ ] Use `L.map()` on a dedicated DOM container within the tile
  - [ ] Set up tile layer with same tile URL as MapView
  - [ ] [EH] Handle Leaflet load failure → show "Map unavailable" text
  - [ ] [CR] Separate instance avoids conflicts with MapView (proven pattern — current OpsView does this)
  - [ ] [CR] Cleanup: call `map.remove()` in `onDestroy` to prevent memory leak

- [ ] 4.3.1.3 — Render group markers using existing `deriveMarkers()` and `MARKER_STYLES`
  - [ ] Call deriveMarkers with current data
  - [ ] Apply MARKER_STYLES per marker type
  - [ ] [EH] Handle empty markers array → show map with no markers (no crash)
  - [ ] [EH] Handle marker with invalid coordinates → skip (don't break other markers)

- [ ] 4.3.1.4 — Display as thumbnail/overview (non-interactive or minimally interactive)
  - [ ] Disable zoom controls and scroll-to-zoom
  - [ ] Fit bounds to all markers
  - [ ] [EU] Click on tile → switch to MAP mode (full interaction there)

- [ ] 4.3.1.5 — Sovereign mode: show "Map data unavailable offline" overlay
  - [ ] Check `$isSovereign` and conditionally render overlay
  - [ ] Overlay: semi-transparent background with centered message
  - [ ] [EU] Preserve last-rendered map image behind overlay (stale data is better than blank)

#### 4.3.2 Step: Group Status Tile

- [ ] 4.3.2.1 — Create `src/app/board/tiles/GroupStatusTile.svelte`
  - [ ] Create Svelte component with TypeScript script block

- [ ] 4.3.2.2 — Subscribe to `groupProjections` store
  - [ ] Use `$groupProjections` reactive subscription
  - [ ] [EH] Handle empty projections → show "No groups" state
  - [ ] [CR] Only subscribe to what's needed (not entire repository)

- [ ] 4.3.2.3 — Render group list with name, member count, unread count
  - [ ] Iterate groups from projections
  - [ ] Display: group name, N members, N unread
  - [ ] [EH] Handle group with missing name → show group ID truncated
  - [ ] [EU] Sort groups by unread count (most active first) or alphabetically

- [ ] 4.3.2.4 — Render `GroupHealthBadge` per group (from Phase 1 presence)
  - [ ] Import and render GroupHealthBadge for each group
  - [ ] [EH] If GroupHealthBadge is not available (Phase 1 not shipped) → don't render (graceful skip)
  - [ ] [CR] Use optional import or dynamic component check

- [ ] 4.3.2.5 — Click group → navigate to COMMS mode with channel opened
  - [ ] On click: set `navcomMode` to "comms" and navigate to group channel
  - [ ] [EH] Handle case where group channel doesn't exist → show toast "Channel unavailable"
  - [ ] [EU] Provide visual click feedback (hover state, cursor pointer)

- [ ] 4.3.2.6 — Graceful degradation: show member counts without badges if Phase 1 not shipped
  - [ ] Check if GroupHealthBadge component exists / health data is available
  - [ ] If not: render tile without badges (no error, just simpler display)
  - [ ] [CR] Tile remains fully functional without Phase 1 dependency

#### 4.3.3 Step: Personnel Status Tile

- [ ] 4.3.3.1 — Create `src/app/board/tiles/PersonnelStatusTile.svelte`
  - [ ] Create Svelte component

- [ ] 4.3.3.2 — Subscribe to `groupProjections` and `groupMemberPresence` stores
  - [ ] Derive member list from projections
  - [ ] [EH] Handle missing groupMemberPresence store (Phase 1 not shipped) → skip presence data

- [ ] 4.3.3.3 — Render member list with `PresenceBadge` per member (from Phase 1)
  - [ ] Display member display name + PresenceBadge
  - [ ] [EH] Missing display name → show truncated pubkey
  - [ ] [EH] PresenceBadge unavailable → render member without badge

- [ ] 4.3.3.4 — Sort by presence status (active first, cold last)
  - [ ] Sort order: active → recent → cold → unknown
  - [ ] [CR] Stable sort within same status (alphabetical by name)

- [ ] 4.3.3.5 — Graceful degradation: show member list without presence if Phase 1 not shipped
  - [ ] Alphabetical member list, no badges
  - [ ] [EU] Show "Presence data unavailable" subtitle if store is missing

#### 4.3.4 Step: Activity Feed Tile

- [ ] 4.3.4.1 — Create `src/app/board/tiles/ActivityFeedTile.svelte`
  - [ ] Create Svelte component

- [ ] 4.3.4.2 — Subscribe to repository events (recent events across groups)
  - [ ] Use deriveEvents or appropriate filter for recent group events
  - [ ] [EH] Handle empty event set → show "No recent activity"
  - [ ] [CR] Filter to relevant event kinds (messages, check-ins, not metadata)

- [ ] 4.3.4.3 — Render chronological event list with timestamp, icon, and group name
  - [ ] Format timestamp as relative time ("3m ago", "1h ago")
  - [ ] Map event kind to icon (message icon, signal icon, etc.)
  - [ ] Show group name for context
  - [ ] [EH] Handle event with missing group reference → show "Unknown group"
  - [ ] [EU] Truncate long event content (show first ~80 chars)

- [ ] 4.3.4.4 — Limit to N most recent events (e.g., 10-20)
  - [ ] Slice events after sorting by created_at descending
  - [ ] [CR] Configurable constant for limit (not magic number)
  - [ ] [CR] Don't load more events than needed from repository

- [ ] 4.3.4.5 — Auto-scroll or show "new events" indicator
  - [ ] When new events arrive while tile is visible
  - [ ] [EU] Don't force scroll if user is reading older events
  - [ ] [EU] Show "N new events" badge at top of tile (click to scroll to top)

#### 4.3.5 Step: Connection Status Tile

- [ ] 4.3.5.1 — Create `src/app/board/tiles/ConnectionStatusTile.svelte`
  - [ ] Create Svelte component

- [ ] 4.3.5.2 — Subscribe to `connectionState` store (from Phase 2)
  - [ ] [EH] If connectionState store not available (Phase 2 not shipped) → show basic fallback
  - [ ] [CR] Use optional/try import pattern for cross-phase dependency

- [ ] 4.3.5.3 — Display current mode: "CONNECTED" or "SOVEREIGN"
  - [ ] Color-coded mode label (green/red)
  - [ ] [EU] Icon alongside label (check mark / disconnect icon)

- [ ] 4.3.5.4 — Display queue depth and last connected timestamp
  - [ ] Show "N queued" when in sovereign mode
  - [ ] Show "Last online: Xm ago" when sovereign
  - [ ] [EH] Handle zero queue → "Queue empty"
  - [ ] [EU] Clear communication that queued items will send on reconnect

- [ ] 4.3.5.5 — Show relay status summary (connected/total relays)
  - [ ] Read from relay health data
  - [ ] Display "3/5 relays connected" format
  - [ ] [EH] Handle relay health data unavailable → show "Relay status unknown"

- [ ] 4.3.5.6 — Graceful degradation: basic online/offline indicator if Phase 2 not shipped
  - [ ] Fallback: use `navigator.onLine` directly
  - [ ] Show simple green dot / red dot
  - [ ] [EU] Clearly mark as "basic" connectivity info

#### 4.3.6 Step: Security Status Tile

- [ ] 4.3.6.1 — Create `src/app/board/tiles/SecurityStatusTile.svelte`
  - [ ] Create Svelte component

- [ ] 4.3.6.2 — Run `evaluateRelayFingerprintGate()` as read-only audit per group (from Phase 1)
  - [ ] Import gate function and assembleGateInput
  - [ ] Evaluate gate for each group
  - [ ] [EH] If gate function not available (Phase 1 not shipped) → show "N/A"
  - [ ] [EH] If gate evaluation throws → show "Check failed" per group
  - [ ] [CR] Read-only: no save/gate behavior, just informational display

- [ ] 4.3.6.3 — Display per-group gate status: green check (clean) or red warning (violation)
  - [ ] Iterate groups, show ✓ or ⚠ next to each group name
  - [ ] [EU] Clickable violations → navigate to GroupSettingsAdmin for remediation
  - [ ] [ER] Show violation count per group ("2 relay conflicts")

- [ ] 4.3.6.4 — Graceful degradation: "N/A" if Phase 1 relay gate not shipped
  - [ ] Show "Security audit unavailable — requires relay fingerprint gate"
  - [ ] [EU] Don't show alarming UI — just informational "not yet available"

#### 4.3.7 Step: Quick Actions Tile

- [ ] 4.3.7.1 — Create `src/app/board/tiles/QuickActionsTile.svelte`
  - [ ] Create Svelte component

- [ ] 4.3.7.2 — Render action buttons: broadcast message, signal check-in, switch mode
  - [ ] Button for each action with icon + label
  - [ ] [EU] Clear labels: "Broadcast", "Signal", "Switch to COMMS", "Switch to MAP"
  - [ ] [EU] Buttons should have consistent sizing and spacing
  - [ ] [CR] Actions are same as accessible elsewhere — this is a shortcut panel

- [ ] 4.3.7.3 — Wire actions to existing commands (`publishGroupMessage`, etc.)
  - [ ] Broadcast: prompt for message → call `publishGroupMessage` for selected group
  - [ ] Signal: call existing check-in/signal publish
  - [ ] Switch mode: update `navcomMode` store
  - [ ] [EH] If action fails: show error toast with action-specific message
  - [ ] [EH] If in sovereign mode: broadcast queues (no special handling needed — signAndPublish handles it)
  - [ ] [EU] Disable broadcast button if no groups exist
  - [ ] [ER] Toast feedback: "Broadcast sent" / "Signal sent" / "Broadcast queued (offline)"

### 4.4 Phase: Testing — The Board

#### 4.4.1 Step: Unit Tests

- [ ] 4.4.1.1 — Create `tests/unit/app/board/board-state.spec.ts`
  - [ ] Set up test harness with mocked localStorage for synced store
  - [ ] [CR] Each test starts with clean localStorage

- [ ] 4.4.1.2 — Unit test: `DEFAULT_DESKTOP_LAYOUT` has 5 tiles
  - [ ] Assert array length === 5
  - [ ] Assert expected tile types are present

- [ ] 4.4.1.3 — Unit test: `TILE_REGISTRY` has entries for all 7 tile types
  - [ ] Assert 7 entries
  - [ ] Assert each entry has name, icon, description

- [ ] 4.4.1.4 — Unit test: `boardLayout` synced store initializes with default layout
  - [ ] Clear localStorage
  - [ ] Read store value
  - [ ] Assert matches DEFAULT_DESKTOP_LAYOUT
  - [ ] [EH] Test: corrupted localStorage → fallback to default

- [ ] 4.4.1.5 — Unit test: `addTile()` places at next available row
  - [ ] Call addTile("quick-actions")
  - [ ] Assert layout array grew by 1
  - [ ] Assert new tile has valid grid position

- [ ] 4.4.1.6 — Unit test: `removeTile()` removes correct tile and persists
  - [ ] Record initial layout
  - [ ] Call removeTile(1)
  - [ ] Assert layout shrank by 1 and correct tile removed
  - [ ] [EH] Test: removeTile with invalid index → no change

#### 4.4.2 Step: E2E Tests

- [ ] 4.4.2.1 — Create `cypress/e2e/beta/board-view.cy.ts`
  - [ ] Set up E2E fixtures with groups, members, and events
  - [ ] [CR] Clear board layout localStorage before each test

- [ ] 4.4.2.2 — E2E test: Board renders when OPS mode selected
  - [ ] Click OPS mode
  - [ ] Assert CSS grid container is visible
  - [ ] Assert at least one tile renders

- [ ] 4.4.2.3 — E2E test: default tiles visible on first visit
  - [ ] Clear localStorage
  - [ ] Navigate to OPS mode
  - [ ] Assert map overview, group status, activity feed, connection status tiles visible

- [ ] 4.4.2.4 — E2E test: edit mode shows tile controls and TilePicker
  - [ ] Click edit button
  - [ ] Assert TilePicker panel visible
  - [ ] Assert remove (✕) buttons visible on tiles
  - [ ] Click Done → assert controls hidden

- [ ] 4.4.2.5 — E2E test: adding a tile persists to layout (survives reload)
  - [ ] Enter edit mode → add "quick-actions" tile
  - [ ] Exit edit mode → reload page
  - [ ] Assert Quick Actions tile still present

- [ ] 4.4.2.6 — E2E test: removing a tile persists to layout (survives reload)
  - [ ] Enter edit mode → remove a tile
  - [ ] Exit edit mode → reload page
  - [ ] Assert removed tile is gone

- [ ] 4.4.2.7 — E2E test: GroupStatusTile shows health badges
  - [ ] Navigate to OPS mode
  - [ ] Assert group cards have health badge emoji (🟢🟡🔴)
  - [ ] [EH] If Phase 1 not available → assert tile renders without badges

- [ ] 4.4.2.8 — E2E test: ActivityFeedTile shows recent events
  - [ ] Navigate to OPS mode
  - [ ] Assert activity items visible with timestamp, icon, group name

- [ ] 4.4.2.9 — E2E test: ConnectionStatusTile shows current mode
  - [ ] Navigate to OPS mode
  - [ ] Assert "CONNECTED" or "SOVEREIGN" visible in connection tile

- [ ] 4.4.2.10 — E2E test: clicking group in GroupStatusTile navigates to COMMS
  - [ ] Click a group in GroupStatusTile
  - [ ] Assert mode switched to COMMS
  - [ ] Assert channel opened

### 4.5 Phase: Phase 3 Validation

- [ ] 4.5.1 — Validate all 19 acceptance criteria for The Board
  - [ ] Map each criterion to at least one test
  - [ ] [CR] No criterion covered by manual testing only

- [ ] 4.5.2 — Migrate existing OpsView Cypress tests to Board tests
  - [ ] Identify all existing OpsView-specific selectors in beta specs
  - [ ] Update to Board equivalents
  - [ ] [CR] Don't delete old tests — update them

- [ ] 4.5.3 — Run full beta test suite and confirm no regressions
  - [ ] All original 243+ tests pass
  - [ ] Phase 1 and Phase 2 specs pass
  - [ ] New Board specs pass
  - [ ] [ER] If regression found: isolate to Board changes vs. pre-existing

- [ ] 4.5.4 — Verify responsive behavior at all 4 breakpoints
  - [ ] xl (1280px): 4 columns
  - [ ] lg (1024px): 3 columns
  - [ ] md (768px): 2 columns
  - [ ] sm (<768px): 1 column
  - [ ] [EU] No horizontal overflow at any breakpoint

- [ ] 4.5.5 — Verify sovereign mode rendering for each tile
  - [ ] Map tile: "offline" overlay
  - [ ] Connection tile: shows sovereign status
  - [ ] Activity feed: shows cached events
  - [ ] Group status: still visible with cached data
  - [ ] [EU] No tile crashes or blanks during sovereign mode

- [ ] 4.5.6 — Verify graceful degradation when Phase 1/2 innovations not present
  - [ ] Group status tile: member counts without badges
  - [ ] Personnel tile: list without presence
  - [ ] Connection tile: basic online/offline
  - [ ] Security tile: "N/A"
  - [ ] [CR] All tiles must render something meaningful even without dependencies

- [ ] 4.5.7 — Git commit Phase 3 work
  - [ ] Stage all Phase 3 files (10+ new, 1 modified)
  - [ ] Commit with descriptive message
  - [ ] [CR] Verify lint/Prettier passes

- [ ] 4.5.8 — Update playbook.md status dashboard for Phase 3 completion
  - [ ] Set The Board row to COMPLETE
  - [ ] Record any deviations from spec

---

## Stage 5: Phase 4 — Trust Attestation

### 5.1 Phase: Attestation Engine

#### 5.1.1 Step: Core Module — `attestation.ts`

- [ ] 5.1.1.1 — Create `src/engine/trust/attestation.ts`
  - [ ] Create file in existing `src/engine/trust/` directory
  - [ ] Import dependencies: `deriveEvents`, `repository`, svelte stores
  - [ ] [CR] Follow existing trust module conventions (see delegation.ts, chain.ts)

- [ ] 5.1.1.2 — Define `Attestation` type: `{attester, target, method, confidence, scope, validUntil, context, createdAt, expired}`
  - [ ] Export type
  - [ ] `attester: string` (pubkey of the attestor)
  - [ ] `target: string` (pubkey of the attested person)
  - [ ] `expired: boolean` (computed from validUntil vs now)
  - [ ] [CR] Type mirrors event structure but with parsed/typed fields

- [ ] 5.1.1.3 — Define `AttestationMethod` type: "in-person" | "video-call" | "shared-secret" | "key-signing" | "vouched" | "organizational" | "device-verification" | "self-declared"
  - [ ] Export type
  - [ ] [CR] 8 methods — extensible but finite for Phase 4

- [ ] 5.1.1.4 — Define `Confidence` type: "high" | "medium" | "low"
  - [ ] Export type
  - [ ] [CR] Ordinal: high > medium > low (used by getAttestationSummary)

- [ ] 5.1.1.5 — Define `Scope` type: "operational" | "personal" | "financial"
  - [ ] Export type

- [ ] 5.1.1.6 — Define `METHOD_LABELS` constant for human-readable method names
  - [ ] Map each AttestationMethod to a display string
  - [ ] Example: "in-person" → "In Person", "key-signing" → "Key Signing Event"
  - [ ] [CR] Used by AttestForm select dropdown and AttestationPanel display

- [ ] 5.1.1.7 — Implement `isAttestationEvent(event)`: check kind 30078 + d-tag prefix "attestation:"
  - [ ] Check `event.kind === 30078`
  - [ ] Find d-tag and check it starts with "attestation:"
  - [ ] Return boolean
  - [ ] [EH] Handle events with no tags → false
  - [ ] [EH] Handle events with no d-tag → false
  - [ ] [CR] Fast check — used as filter across all kind-30078 events

- [ ] 5.1.1.8 — Implement `parseAttestation(event): Attestation | null`
  - [ ] Extract d-tag → get target pubkey from "attestation:<pubkey>"
  - [ ] Extract p-tag → verify matches d-tag target
  - [ ] Extract method, confidence, scope, valid-until, context tags
  - [ ] Compute expired flag from valid-until vs current time
  - [ ] [EH] Return null for events that pass `isAttestationEvent` but have invalid structure
  - [ ] [EH] Handle missing/malformed d-tag → return null
  - [ ] [EH] Handle d-tag/p-tag mismatch → return null (suspicious event)
  - [ ] [EH] Handle missing optional tags gracefully (valid-until, context)
  - [ ] [CR] Never throw: always return Attestation or null

- [ ] 5.1.1.9 — Handle optional tags: valid-until, context; defaults for missing method/confidence
  - [ ] Default method: "self-declared" when tag missing
  - [ ] Default confidence: "low" when tag missing
  - [ ] Default scope: "operational" when tag missing
  - [ ] Default context: "" (empty string) when tag missing
  - [ ] [CR] Defaults are conservative (low confidence, self-declared)

- [ ] 5.1.1.10 — Implement expiry check: mark `expired` if `valid-until < now`
  - [ ] Compare valid-until (epoch seconds) to `Math.floor(Date.now() / 1000)`
  - [ ] If no valid-until tag → never expires (`expired = false`)
  - [ ] [EH] Handle valid-until of 0 or NaN → treat as expired
  - [ ] [CR] Expiry is checked at parse time and should be re-evaluated for long-running sessions

- [ ] 5.1.1.11 — Create `attestationsByTarget` derived store from `deriveEvents({kinds: [30078]})`
  - [ ] Filter events through `isAttestationEvent` then `parseAttestation`
  - [ ] Group by target pubkey into Map<string, Attestation[]>
  - [ ] [EH] Handle events that parse to null → skip silently
  - [ ] [CR] Recomputes when repository receives new kind-30078 events
  - [ ] [CR] Consistent with how delegation system derives from same event pool

- [ ] 5.1.1.12 — Build `Map<pubkey, Attestation[]>` grouping by target pubkey
  - [ ] Iterate parsed attestations, group by `target` field
  - [ ] Sort each array by `createdAt` descending (most recent first)
  - [ ] [CR] O(n) iteration over attestation events — acceptable for typical group sizes

- [ ] 5.1.1.13 — Implement `getAttestationSummary(map, pubkey)`: `{isAttested, count, highestConfidence, methods}`
  - [ ] Look up pubkey in map
  - [ ] Filter to non-expired attestations for `isAttested` and counts
  - [ ] Find highest confidence among active attestations
  - [ ] Collect unique methods used
  - [ ] [EH] Return `{isAttested: false, count: 0, highestConfidence: null, methods: []}` for unknown pubkey
  - [ ] [EH] Handle empty attestation array → not attested
  - [ ] [CR] Pure function (takes map + pubkey, returns summary)

- [ ] 5.1.1.14 — Implement `buildAttestationTemplate(params)`: create unsigned kind 30078 event
  - [ ] Accept `{target, method, confidence, scope, validUntil?, context?}`
  - [ ] Build event template with kind=30078
  - [ ] [CR] Returns unsigned template — signAndPublish handles signing
  - [ ] [EH] Validate target is a valid pubkey format (64-char hex)
  - [ ] [EH] Validate method is one of defined AttestationMethods

- [ ] 5.1.1.15 — Set d-tag: `"attestation:<targetPubkey>"` for addressable replacement
  - [ ] Tag: `["d", "attestation:" + target]`
  - [ ] [CR] Addressable event — republishing replaces previous attestation for same target
  - [ ] [CR] Namespace prefix "attestation:" won't collide with "delegation:" or app-data d-tags

- [ ] 5.1.1.16 — Set p-tag matching target pubkey
  - [ ] Tag: `["p", target]`
  - [ ] [CR] Enables relay filtering with `#p` filter — essential for efficient fetching

- [ ] 5.1.1.17 — Set method, confidence, scope, valid-until, context tags
  - [ ] `["method", method]`
  - [ ] `["confidence", confidence]`
  - [ ] `["scope", scope]`
  - [ ] `["valid-until", String(validUntil)]` (only if provided)
  - [ ] `["context", context]` (only if non-empty)
  - [ ] [CR] Omit optional tags when not set (smaller event)

- [ ] 5.1.1.18 — Truncate context to 280 chars
  - [ ] `context = context.slice(0, 280)`
  - [ ] [EH] Handle null/undefined context → empty string
  - [ ] [CR] Prevent arbitrarily large context strings in events

### 5.2 Phase: Attestation UI Components

#### 5.2.1 Step: New Component — `AttestationBadge.svelte`

- [ ] 5.2.1.1 — Create `src/partials/AttestationBadge.svelte`
  - [ ] Create Svelte component with TypeScript script block

- [ ] 5.2.1.2 — Accept `pubkey` prop
  - [ ] Export let pubkey: string
  - [ ] [EH] Guard: if pubkey is undefined/empty, render nothing

- [ ] 5.2.1.3 — Subscribe to `attestationsByTarget` store
  - [ ] Derive attestation summary reactively
  - [ ] [CR] Subscription auto-cleaned on destroy

- [ ] 5.2.1.4 — Show ✦ icon (text-accent color) when attested
  - [ ] Render `✦` character with `class="text-accent"`
  - [ ] [EU] Icon should be visually distinct but not dominating (small size, subtle)
  - [ ] [EU] Screen reader: `aria-label="Attested"`

- [ ] 5.2.1.5 — Show nothing when not attested
  - [ ] Use `{#if isAttested}` guard
  - [ ] [CR] No empty wrapper elements when not attested (zero DOM footprint)

- [ ] 5.2.1.6 — Add tooltip: "Attested (N attestations)"
  - [ ] Show count and highest confidence
  - [ ] [EU] Tooltip accessible on hover and keyboard focus

#### 5.2.2 Step: New Component — `AttestationPanel.svelte`

- [ ] 5.2.2.1 — Create `src/partials/AttestationPanel.svelte`
  - [ ] Create Svelte component

- [ ] 5.2.2.2 — Accept `pubkey` prop
  - [ ] [EH] Guard: undefined pubkey → render "No attestation data"

- [ ] 5.2.2.3 — List all attestations for pubkey: attester, method, confidence, scope, context, date
  - [ ] Render each attestation as a card/row
  - [ ] Show attester display name (or truncated pubkey fallback)
  - [ ] Show method label from METHOD_LABELS
  - [ ] Show confidence and scope badges
  - [ ] Show context text (if any)
  - [ ] Show relative date ("3 days ago")
  - [ ] [EH] Handle attestation with missing fields → show available fields, skip missing
  - [ ] [EU] Scrollable if many attestations (max-height with overflow-y)

- [ ] 5.2.2.4 — Show "No attestations yet" when empty
  - [ ] [EU] Informative empty state, not just blank space
  - [ ] [EU] Suggest: "Be the first to attest this person"

- [ ] 5.2.2.5 — Show expired badge for expired attestations
  - [ ] Visual indicator: "Expired" tag in muted color
  - [ ] [EU] Expired attestations shown but visually de-emphasized (lower opacity)

- [ ] 5.2.2.6 — Sort by most recent first
  - [ ] Sort by `createdAt` descending
  - [ ] [CR] Expired attestations sorted to bottom of their recency position

#### 5.2.3 Step: New Component — `AttestForm.svelte`

- [ ] 5.2.3.1 — Create `src/partials/AttestForm.svelte`
  - [ ] Create Svelte component with form handling

- [ ] 5.2.3.2 — Accept `targetPubkey` and optional `existingAttestation` props
  - [ ] Pre-fill form when existingAttestation provided (update mode)
  - [ ] [EH] Validate targetPubkey is non-empty before enabling submit

- [ ] 5.2.3.3 — Render form: method select, confidence buttons, scope buttons, context input, optional expiry
  - [ ] Method: `<select>` dropdown with METHOD_LABELS entries
  - [ ] Confidence: 3-button toggle (high/medium/low)
  - [ ] Scope: 3-button toggle (operational/personal/financial)
  - [ ] Context: text input with maxlength=280 and placeholder
  - [ ] Expiry: checkbox toggle + number input for days (1-365)
  - [ ] [EU] Form layout should be compact (fits within WotPopover tooltip)
  - [ ] [EU] Active selection state visually distinct (accent color)
  - [ ] [CR] Default values: method=in-person, confidence=high, scope=operational

- [ ] 5.2.3.4 — Submit via `buildAttestationTemplate()` → `signAndPublish()`
  - [ ] Build template from form values
  - [ ] Call signAndPublish (which handles sovereign mode automatically)
  - [ ] [EH] If signAndPublish throws → show error toast "Attestation failed"
  - [ ] [EH] If buildAttestationTemplate throws → show validation error inline
  - [ ] [ER] Success: dispatch `attested` event, no explicit toast (parent handles)
  - [ ] [ER] Failure: toast with specific error message

- [ ] 5.2.3.5 — Dispatch `attested` event on success
  - [ ] Use Svelte `createEventDispatcher`
  - [ ] Parent component closes form on `attested` event
  - [ ] [CR] Event is fire-and-forget (no data payload needed)

- [ ] 5.2.3.6 — Disable submit while in-flight (`submitting` state)
  - [ ] Set `submitting = true` before signAndPublish, false in `finally`
  - [ ] Disable button and show "Attesting..." text
  - [ ] [EU] Prevent double-submission on slow networks
  - [ ] [EH] If component unmounts during submission → no-op (no state update on destroyed component)

### 5.3 Phase: Integration — Modified Files

#### 5.3.1 Step: Extend WotPopover

- [ ] 5.3.1.1 — Modify `src/app/shared/WotPopover.svelte`
  - [ ] Locate existing WotPopover component structure
  - [ ] [CR] Minimal changes — extend, don't rewrite

- [ ] 5.3.1.2 — Import AttestationBadge, AttestationPanel, AttestForm
  - [ ] Add import statements
  - [ ] Import attestationsByTarget and getAttestationSummary from attestation module
  - [ ] [CR] Verify no circular dependencies

- [ ] 5.3.1.3 — Add ✦ badge in trigger slot alongside WoT score ring
  - [ ] Position AttestationBadge adjacent to existing WotScore SVG ring
  - [ ] [EU] Badge should not obscure or overlap the WoT score ring
  - [ ] [CR] Badge only renders when attestation exists (zero DOM footprint otherwise)

- [ ] 5.3.1.4 — Add attestation section in tooltip: panel + form toggle
  - [ ] Add new `<div>` section below existing WoT score content
  - [ ] Separate with border-top
  - [ ] Include AttestationPanel
  - [ ] [EU] Section heading: "Attestations" in muted text

- [ ] 5.3.1.5 — Show "Attest this person" / "Update attestation" button (not for own pubkey)
  - [ ] Conditional: `{#if pubkey !== $session?.pubkey}`
  - [ ] Dynamic text: "Update attestation" when already attested
  - [ ] Toggle `showAttestForm` on click
  - [ ] [EH] Handle $session being null (not logged in) → hide button
  - [ ] [EU] Button styled as text link (not primary button — it's secondary action)

- [ ] 5.3.1.6 — Wire form submission → close form on success
  - [ ] Listen for `attested` event from AttestForm
  - [ ] Set `showAttestForm = false` on event
  - [ ] [EU] Attestation panel updates reactively (new attestation appears without refresh)

#### 5.3.2 Step: Extend Map Markers

##### 5.3.2.1 Task: Modify `marker-derivation.ts`

- [ ] 5.3.2.1.1 — Add `attested: boolean` field to `ChannelMarker` interface
  - [ ] Add to existing interface definition
  - [ ] [CR] Type is boolean, not the full attestation — keep marker lightweight

- [ ] 5.3.2.1.2 — Add optional `attestationMap` parameter to `deriveMarkers()`
  - [ ] Parameter: `attestationMap?: Map<string, Attestation[]>`
  - [ ] [CR] Optional parameter preserves backward compatibility
  - [ ] [CR] Existing callers without the parameter continue to work unchanged

- [ ] 5.3.2.1.3 — Set `attested` to true when target has active attestation, false otherwise
  - [ ] Check attestationMap for event author pubkey
  - [ ] Filter to non-expired attestations
  - [ ] `attested = activeAttestations.length > 0`
  - [ ] [EH] Handle attestationMap being undefined → all markers `attested: false`

- [ ] 5.3.2.1.4 — Default to `false` when `attestationMap` not provided (backward compatible)
  - [ ] [CR] Conservative default — unattested is safe (more cautious)

##### 5.3.2.2 Task: Modify `MapView.svelte`

- [ ] 5.3.2.2.1 — Pass `attestationsByTarget` map to `deriveMarkers()`
  - [ ] Import `attestationsByTarget` store
  - [ ] Pass `$attestationsByTarget` as second argument
  - [ ] [CR] Reactive — markers re-derive when attestation data changes

- [ ] 5.3.2.2.2 — Render attested markers: full opacity (1.0) + solid green border (2px)
  - [ ] Set marker icon opacity to 1.0
  - [ ] Set border: `2px solid rgba(34,197,94,0.8)` (green)
  - [ ] [EU] Green border is the clearest trust signal at a glance

- [ ] 5.3.2.2.3 — Render unattested markers: half opacity (0.5) + dashed gray border (2px)
  - [ ] Set marker icon opacity to 0.5
  - [ ] Set border: `2px dashed rgba(156,163,175,0.6)` (gray)
  - [ ] [EU] Reduced opacity is pre-attentive — visible at any zoom level

- [ ] 5.3.2.2.4 — Render expired markers: dim opacity (0.6) + dashed amber border
  - [ ] Set marker icon opacity to 0.6
  - [ ] Set border: `2px dashed rgba(245,158,11,0.7)` (amber)
  - [ ] [EU] Amber signals "caution" — was attested but attestation expired
  - [ ] [EH] Handle marker with mixed expired + active attestations → treat as attested (active wins)

- [ ] 5.3.2.2.5 — Extend marker popup: show attestation status ("✦ Attested" or "Not attested")
  - [ ] Add attestation line to popup HTML template
  - [ ] Show method and confidence when attested
  - [ ] [EU] "Not attested" shown in muted style (not alarming)
  - [ ] [EH] Handle popup for marker with no attestation data → show "Not attested"

#### 5.3.3 Step: Extend Relay Subscriptions

- [ ] 5.3.3.1 — Modify `src/engine/requests.ts`
  - [ ] Locate group event subscription setup
  - [ ] [CR] Minimal change — one additional filter clause

- [ ] 5.3.3.2 — Add filter `{kinds: [30078], "#p": memberPubkeys}` alongside existing group event requests
  - [ ] Append filter to existing relay request set
  - [ ] [EH] Handle empty memberPubkeys array → skip filter (don't send empty #p query)
  - [ ] [CR] Uses existing relay subscription infrastructure
  - [ ] [CR] Filter scoped by #p ensures we only get attestations for known members

- [ ] 5.3.3.3 — Scope to known group member pubkeys only
  - [ ] Extract pubkeys from group projections
  - [ ] [CR] Don't fetch attestations for every pubkey on every relay — too expensive
  - [ ] [CR] New members joining → subscription re-evaluates with updated pubkey list
  - [ ] [EH] If no group members loaded yet → skip attestation subscription (will fire when members arrive)

#### 5.3.4 Step: Board Integration — Trust Overview Tile

- [ ] 5.3.4.1 — Create `src/app/board/tiles/TrustOverviewTile.svelte`
  - [ ] Create Svelte component
  - [ ] Import attestation stores and group data

- [ ] 5.3.4.2 — Compute attestation coverage: attested count vs unattested count across all groups
  - [ ] Iterate all unique members across all groups
  - [ ] Count attested vs unattested
  - [ ] Display as "N attested / M total"
  - [ ] [EH] Handle no members → show "No members to evaluate"
  - [ ] [EU] Show as percentage bar or fraction for quick visual assessment

- [ ] 5.3.4.3 — Show 5 most recent attestations
  - [ ] Aggregate all active attestations, sort by createdAt descending, take 5
  - [ ] Display: method, target (truncated pubkey or name), relative time
  - [ ] [EH] Handle no attestations → show "No attestations recorded"
  - [ ] [EU] Compact format (one line per attestation)

- [ ] 5.3.4.4 — Add `"trust-overview"` entry to `TILE_REGISTRY` in `board-state.ts`
  - [ ] `{name: "Trust Overview", icon: "✦", description: "..."}`
  - [ ] [CR] Extends existing registry — no changes to Board infrastructure

- [ ] 5.3.4.5 — Add `"trust-overview"` to `TileType` union
  - [ ] Extend the union type in board-state.ts
  - [ ] [CR] BoardView dynamic dispatch handles new type via tile component lookup

### 5.4 Phase: Testing — Trust Attestation

#### 5.4.1 Step: Unit Tests

- [ ] 5.4.1.1 — Create `tests/unit/engine/trust/attestation.spec.ts`
  - [ ] Set up test fixtures: mock kind-30078 events with various d-tag patterns
  - [ ] [CR] Tests for pure functions only — no store mocking needed for parser/builder

- [ ] 5.4.1.2 — Unit test: `isAttestationEvent()` true for attestation d-tag prefix
  - [ ] Mock event with kind=30078 and d-tag "attestation:abc123"
  - [ ] Assert returns true

- [ ] 5.4.1.3 — Unit test: `isAttestationEvent()` false for delegation d-tag prefix
  - [ ] Mock event with kind=30078 and d-tag "delegation:abc123"
  - [ ] Assert returns false

- [ ] 5.4.1.4 — Unit test: `isAttestationEvent()` false for non-30078 kinds
  - [ ] Mock event with kind=1 and attestation d-tag
  - [ ] Assert returns false

- [ ] 5.4.1.5 — Unit test: `parseAttestation()` parses valid attestation
  - [ ] Build complete attestation event with all tags
  - [ ] Assert all Attestation fields correctly populated
  - [ ] Assert expired=false for future valid-until

- [ ] 5.4.1.6 — Unit test: `parseAttestation()` returns null for delegation events
  - [ ] Pass delegation event to parser
  - [ ] Assert null returned

- [ ] 5.4.1.7 — Unit test: `parseAttestation()` returns null for mismatched d-tag and p-tag
  - [ ] d-tag target ≠ p-tag pubkey
  - [ ] Assert null returned
  - [ ] [CR] Catches malformed or suspicious events

- [ ] 5.4.1.8 — Unit test: `parseAttestation()` marks expired attestations
  - [ ] Set valid-until to past timestamp
  - [ ] Assert expired=true

- [ ] 5.4.1.9 — Unit test: `parseAttestation()` handles missing optional tags
  - [ ] Omit valid-until and context tags
  - [ ] Assert attestation parsed with defaults (expired=false, context="")

- [ ] 5.4.1.10 — Unit test: `parseAttestation()` defaults confidence to "low" when missing
  - [ ] Omit confidence tag
  - [ ] Assert confidence === "low"

- [ ] 5.4.1.11 — Unit test: `parseAttestation()` defaults method to "self-declared" when missing
  - [ ] Omit method tag
  - [ ] Assert method === "self-declared"

- [ ] 5.4.1.12 — Unit test: `getAttestationSummary()` isAttested=true with active attestations
  - [ ] Map with pubkey → [active attestation]
  - [ ] Assert summary.isAttested === true

- [ ] 5.4.1.13 — Unit test: `getAttestationSummary()` isAttested=false with only expired
  - [ ] Map with pubkey → [expired attestation only]
  - [ ] Assert summary.isAttested === false

- [ ] 5.4.1.14 — Unit test: `getAttestationSummary()` computes highestConfidence
  - [ ] Map with pubkey → [low, high, medium]
  - [ ] Assert highestConfidence === "high"

- [ ] 5.4.1.15 — Unit test: `getAttestationSummary()` collects unique methods
  - [ ] Map with pubkey → [in-person, in-person, video-call]
  - [ ] Assert methods === ["in-person", "video-call"] (deduplicated)

- [ ] 5.4.1.16 — Unit test: `getAttestationSummary()` returns empty summary for unknown pubkey
  - [ ] Query for pubkey not in map
  - [ ] Assert {isAttested: false, count: 0, ...}

- [ ] 5.4.1.17 — Unit test: `buildAttestationTemplate()` builds correct kind 30078 event
  - [ ] Call builder with all params
  - [ ] Assert kind === 30078
  - [ ] Assert d-tag starts with "attestation:"
  - [ ] Assert all expected tags present

- [ ] 5.4.1.18 — Unit test: `buildAttestationTemplate()` includes p-tag matching target
  - [ ] Assert p-tag value === target pubkey

- [ ] 5.4.1.19 — Unit test: `buildAttestationTemplate()` omits valid-until when not provided
  - [ ] Call builder without validUntil
  - [ ] Assert no valid-until tag in event

- [ ] 5.4.1.20 — Unit test: `buildAttestationTemplate()` truncates context to 280 chars
  - [ ] Pass 500-char context string
  - [ ] Assert context tag value is ≤ 280 chars

#### 5.4.2 Step: E2E Tests

- [ ] 5.4.2.1 — Create `cypress/e2e/beta/trust-attestation.cy.ts`
  - [ ] Set up E2E fixtures with groups and members
  - [ ] Seed some attestation events for known members
  - [ ] [CR] Test isolation: clean attestation state between tests

- [ ] 5.4.2.2 — E2E test: WotPopover shows attestation section
  - [ ] Hover over a member to show WotPopover
  - [ ] Assert "Attestations" heading or section visible
  - [ ] Assert "Attest this person" button visible

- [ ] 5.4.2.3 — E2E test: creating an attestation via AttestForm
  - [ ] Open WotPopover for a member
  - [ ] Click "Attest this person"
  - [ ] Fill form: method=in-person, confidence=high, scope=operational
  - [ ] Submit
  - [ ] Assert ✦ badge appears on the member
  - [ ] [EH] Verify form error handling: submit with sovereign mode → queued, not failed

- [ ] 5.4.2.4 — E2E test: map markers differentiate attested vs unattested (opacity)
  - [ ] Navigate to MAP mode
  - [ ] Assert attested markers have full opacity
  - [ ] Assert unattested markers have reduced opacity
  - [ ] [CR] Verify both attested and unattested markers are visible (opacity > 0)

- [ ] 5.4.2.5 — E2E test: attestation badge appears on attested members in lists
  - [ ] Navigate to OPS mode (Board)
  - [ ] Assert ✦ badge next to attested members
  - [ ] Assert no badge next to unattested members

- [ ] 5.4.2.6 — E2E test: "Attest this person" button not shown for own pubkey
  - [ ] Open WotPopover for self
  - [ ] Assert "Attest this person" button NOT visible
  - [ ] [CR] Self-attestation is meaningless — UI prevents it

### 5.5 Phase: Phase 4 Validation

- [ ] 5.5.1 — Validate all 19 acceptance criteria for Trust Attestation
  - [ ] Map each criterion to at least one automated test
  - [ ] [CR] All criteria covered by unit or E2E tests

- [ ] 5.5.2 — Verify WoT score system unchanged (additive, not replacement)
  - [ ] `getUserWotScore()` returns same values as before
  - [ ] WotScore.svelte SVG ring renders identically
  - [ ] [CR] Attestation is alongside WoT, not instead of WoT

- [ ] 5.5.3 — Verify delegation system unchanged
  - [ ] `parseDelegationCertificate()` still works
  - [ ] `chain.ts` TrustLevel computation unchanged
  - [ ] [CR] Attestation events don't collide with delegation d-tag namespace

- [ ] 5.5.4 — Verify kind 30078 app data usage unchanged
  - [ ] `setAppData()` still works for non-attestation d-tags
  - [ ] [CR] d-tag "attestation:" prefix uniquely identifies attestation events

- [ ] 5.5.5 — Run full beta test suite and confirm no regressions
  - [ ] All prior phase specs pass
  - [ ] All original 243+ specs pass
  - [ ] New trust-attestation spec passes
  - [ ] [ER] Any regression → isolate to Phase 4 changes

- [ ] 5.5.6 — Verify map marker trust overlay across tile sets (street/satellite/terrain)
  - [ ] Test opacity rendering on street tiles
  - [ ] Test opacity rendering on satellite tiles
  - [ ] Test opacity rendering on terrain tiles
  - [ ] [EU] Green border visible on all backgrounds
  - [ ] [EU] Gray dashed border visible on all backgrounds

- [ ] 5.5.7 — Git commit Phase 4 work
  - [ ] Stage all Phase 4 files (4+ new, 4 modified)
  - [ ] Commit with descriptive message

- [ ] 5.5.8 — Update playbook.md status dashboard for Phase 4 completion
  - [ ] Set Trust Attestation row to COMPLETE
  - [ ] Record any design decisions made during implementation

---

## Stage 6: Cross-Cutting Validation & Release

### 6.1 Phase: Full Integration Testing

- [ ] 6.1.1 — Run complete beta test suite (all phases combined)
  - [ ] Execute all Cypress spec files in cypress/e2e/beta/
  - [ ] Verify zero test failures
  - [ ] [ER] Capture full test output and timing report
  - [ ] [CR] Run twice to confirm no flaky tests

- [ ] 6.1.2 — Verify all 6 innovations compose correctly in a single build
  - [ ] Run `pnpm build` (production build) — zero errors
  - [ ] Verify output bundle contains all innovation modules
  - [ ] [EH] Import resolution: all cross-innovation imports resolve without error
  - [ ] [CR] No duplicate module instances (check bundle analyzer)
  - [ ] [CR] Total bundle size within acceptable limits (document delta from pre-transmutation baseline)

- [ ] 6.1.3 — Verify Phase 1 Presence data flows into Phase 3 Board tiles
  - [ ] Navigate OPS mode → Board → Presence tile
  - [ ] Confirm presence badges reflect live data from `groupPresence` store
  - [ ] [EH] Handle Phase 1 store returning empty data → tile shows "No data" gracefully

- [ ] 6.1.4 — Verify Phase 1 Relay Gate data flows into Phase 3 Security tile
  - [ ] Navigate OPS mode → Board → Security tile
  - [ ] Confirm relay fingerprint violations appear in tile
  - [ ] [EH] Handle relay gate returning zero violations → tile shows "All Clear" state

- [ ] 6.1.5 — Verify Phase 2 Connection State data flows into Phase 3 Connection tile
  - [ ] Navigate OPS mode → Board → Connection tile
  - [ ] Confirm `connectionState` store value renders correctly
  - [ ] Test transition: go offline → tile shows sovereign mode state
  - [ ] [EH] Handle connection store in unknown state → tile shows fallback message

- [ ] 6.1.6 — Verify Phase 4 Trust data flows into Phase 3 Trust Overview tile
  - [ ] Navigate OPS mode → Board → Trust Overview tile
  - [ ] Confirm attestation coverage computed from `attestationsByTarget` store
  - [ ] [EH] Handle no attestation data → tile shows "No attestations yet"

- [ ] 6.1.7 — Verify Phase 4 attestation events queue correctly in Phase 2 sovereign mode
  - [ ] Go offline → submit an attestation via AttestForm
  - [ ] Confirm event stored in IndexedDB outbox
  - [ ] Go online → confirm event drains to relays
  - [ ] [EH] Handle drain failure → event remains in queue for retry
  - [ ] [CR] Attestation event is encrypted in outbox like all other sovereign events

### 6.2 Phase: Per-Mode Validation

- [ ] 6.2.1 — COMMS mode: message send/receive, Signal check-in, presence badges, sovereign queuing
  - [ ] Send a message in COMMS mode → verify delivery
  - [ ] Verify Signal check-in copy from Phase 1 Briefing renders correctly
  - [ ] Verify presence badges appear alongside member names
  - [ ] Go offline → send message → verify queued in outbox
  - [ ] Go online → verify queued message drains
  - [ ] [EU] All COMMS mode features functional and visually correct
  - [ ] [EH] Test rapid mode switching (COMMS → MAP → COMMS) → no stale state

- [ ] 6.2.2 — MAP mode: marker rendering, trust overlay, sovereign tile unavailable, offline behavior
  - [ ] Verify map renders with markers at correct coordinates
  - [ ] Verify attested markers have green solid border, unattested dashed gray
  - [ ] Verify expired attestation markers have amber dashed border
  - [ ] Test Map mode while offline → map tiles may fail, but app doesn't crash
  - [ ] [EH] Handle map tile loading failure → show placeholder, not blank
  - [ ] [EU] Map controls (zoom, pan) remain functional even offline

- [ ] 6.2.3 — OPS mode (Board): all 7 tiles render, edit mode, persistence, responsive layout, sovereign rendering
  - [ ] Navigate to OPS mode → Board renders with default layout
  - [ ] Verify all 7 tile types render (Security, Presence, Relay Health, Connection, Quick Compose, Navigation, Trust Overview)
  - [ ] Enter edit mode → add/move/remove tile → save
  - [ ] Refresh → verify persisted layout restored from localStorage
  - [ ] Test on mobile viewport → responsive grid adapts
  - [ ] Enter sovereign mode → verify Connection tile and SovereignBar update
  - [ ] [EH] Handle corrupted localStorage board data → reset to default layout
  - [ ] [EU] Edit mode toggle visually distinct, mobile-friendly

### 6.3 Phase: Documentation Finalization

- [ ] 6.3.1 — Update playbook.md status dashboard: all 4 phases marked COMPLETE
  - [ ] Set Phase 1 status: COMPLETE
  - [ ] Set Phase 2 status: COMPLETE
  - [ ] Set Phase 3 status: COMPLETE
  - [ ] Set Phase 4 status: COMPLETE
  - [ ] Record actual completion dates

- [ ] 6.3.2 — Update architecture-patterns.md with any new patterns discovered during implementation
  - [ ] Review implementation for patterns not already documented
  - [ ] Add any new store patterns, component patterns, or integration patterns
  - [ ] [CR] Keep patterns doc accurate as living reference for future contributors

- [ ] 6.3.3 — Verify decision log captures all runtime decisions made during implementation
  - [ ] Cross-reference each phase section for "Decision:" entries
  - [ ] Add entries for any decisions made but not logged
  - [ ] [CR] Decision log is the authoritative record of "why" for future archaeology

- [ ] 6.3.4 — Final review: all acceptance criteria tables checked off (98 total)
  - [ ] Phase 1: 17 criteria table — all checked
  - [ ] Phase 2: 28 criteria table — all checked
  - [ ] Phase 3: 34 criteria table — all checked
  - [ ] Phase 4: 19 criteria table — all checked
  - [ ] [CR] If any unchecked, document why (deferred, descoped, or adjusted)

### 6.4 Phase: Release

- [ ] 6.4.1 — Final git commit with all phases merged
  - [ ] Stage all files
  - [ ] Commit message: "feat: NavCom Transmutation — all 6 innovations across 4 phases"
  - [ ] [CR] Ensure no untracked files left behind (git status clean)

- [ ] 6.4.2 — Tag release version
  - [ ] `git tag -a v<next> -m "NavCom Transmutation"`
  - [ ] [CR] Follow existing version convention from CHANGELOG.md

- [ ] 6.4.3 — Verify build succeeds in production mode
  - [ ] `pnpm build` — zero errors, zero warnings
  - [ ] Verify output in dist/ is deployable
  - [ ] [CR] Test with `pnpm preview` — app loads correctly in browser
  - [ ] [EH] If build fails → fix before tagging release

---

## Summary

| Stage | Phase Count | Step Count | Task Count | Subtask Count | Total Checkboxes |
|-------|------------|------------|------------|---------------|------------------|
| 1 — Foundation & Planning | 1 | 3 | 12 | 43 | 55 |
| 2 — Phase 1: Prove the Direction | 4 | 13 | 106 | 299 | 405 |
| 3 — Phase 2: Sovereign Mode | 4 | 10 | 63 | 215 | 278 |
| 4 — Phase 3: The Board | 5 | 14 | 86 | 269 | 355 |
| 5 — Phase 4: Trust Attestation | 5 | 11 | 93 | 286 | 379 |
| 6 — Cross-Cutting & Release | 4 | 4 | 17 | 73 | 90 |
| **TOTAL** | **23** | **55** | **377** | **1,185** | **1,562** |
