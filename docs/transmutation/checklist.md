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

- [x] 3.1.1.1 — Create `src/engine/connection-state.ts`
  - [x] Create file with TypeScript module structure
  - [x] Import writable/derived from svelte/store
  - [x] [CR] Follow engine module conventions (state + logic colocated)

- [x] 3.1.1.2 — Define `ConnectionMode` type: "connected" | "sovereign"
  - [x] Export type
  - [x] [CR] String literal union (not enum) for consistency with codebase

- [x] 3.1.1.3 — Define `ConnectionState` type: `{mode, since, queuedCount, lastConnectedAt}`
  - [x] `mode: ConnectionMode`
  - [x] `since: number` (epoch seconds when current mode started)
  - [x] `queuedCount: number` (messages in outbox awaiting drain)
  - [x] `lastConnectedAt: number` (epoch seconds of last connected transition)
  - [x] [CR] Export type for consumer components

- [x] 3.1.1.4 — Create `connectionState` writable store
  - [x] Initialize with safe defaults: mode="connected", since=now, queuedCount=0
  - [x] [EH] Initial mode should reflect `navigator.onLine` at creation time
  - [x] [EH] Handle case where `navigator.onLine` is unavailable (SSR, old browsers) → default "connected"

- [x] 3.1.1.5 — Create `isSovereign` derived store: `derived(connectionState, s => s.mode === "sovereign")`
  - [x] Export for use in signAndPublish and components
  - [x] [CR] Derived store auto-updates when connectionState changes

- [x] 3.1.1.6 — Implement `startConnectionMonitor()` — bind `navigator.onLine`, online/offline events
  - [x] Add event listener for `window.addEventListener("online", ...)`
  - [x] Add event listener for `window.addEventListener("offline", ...)`
  - [x] Read initial `navigator.onLine` value at startup
  - [x] [EH] Guard: only bind events when `window` is defined (SSR safety)
  - [x] [EH] Handle `navigator.onLine` reporting true behind captive portal (relay health fallback)
  - [x] [CR] Return cleanup function for event listener removal (testability)
  - [x] [ER] Log connection state transitions to console (debug aid)

- [x] 3.1.1.7 — Implement 3-second debounce for transition to sovereign (prevent flapping)
  - [x] On offline event: start 3-second timer before setting mode="sovereign"
  - [x] If online event fires within window: cancel timer, stay connected
  - [x] [EH] Clear any pending timer on component/monitor teardown
  - [x] [CR] Use `setTimeout`/`clearTimeout` (not reactive timer libraries)
  - [x] [CR] Debounce window is configurable constant (not magic number)

- [x] 3.1.1.8 — Implement immediate transition to connected (no debounce)
  - [x] On online event: immediately set mode="connected"
  - [x] Cancel any pending sovereign-transition timer
  - [x] Trigger queue drain (outbox flush)
  - [x] [CR] Update `lastConnectedAt` timestamp on transition

- [x] 3.1.1.9 — Implement `updateQueuedCount(count)` function
  - [x] Accept count (number), update connectionState.queuedCount
  - [x] [EH] Clamp to non-negative (Math.max(0, count))
  - [x] [CR] Export function for use by signAndPublish and queue-drain

- [x] 3.1.1.10 — Track `lastConnectedAt` timestamp on transitions
  - [x] Set `lastConnectedAt = Math.floor(Date.now() / 1000)` when transitioning to connected
  - [x] Preserve value during sovereign mode (don't overwrite on offline events)
  - [x] [EU] Used by SovereignBar to display "Last online: N minutes ago"

#### 3.1.2 Step: New Component — `SovereignBar.svelte`

- [x] 3.1.2.1 — Create `src/partials/SovereignBar.svelte`
  - [x] Create Svelte component with TypeScript script block
  - [x] [CR] Maintain separation from Toast.svelte (two independent systems)

- [x] 3.1.2.2 — Subscribe to `connectionState` store
  - [x] Use `$connectionState` reactive subscription
  - [x] Derive display values reactively

- [x] 3.1.2.3 — Implement 4 visual states: CONNECTED (hidden), DEGRADED (amber bar), SOVEREIGN (red bar), RECONNECTING (blue bar)
  - [x] CONNECTED: component renders nothing (display:none or `{#if}` guard)
  - [x] DEGRADED: amber/yellow background with warning icon
  - [x] SOVEREIGN: red background with disconnect icon
  - [x] RECONNECTING: blue background with spinning sync icon
  - [x] [EU] Transitions between states should be smooth (CSS transition)
  - [x] [EU] Color must meet WCAG AA contrast on text within the bar
  - [x] [CR] Use Tailwind utility classes with nc- tokens where possible

- [x] 3.1.2.4 — Display elapsed time since last connected (`since` field)
  - [x] Compute and update elapsed time reactively (tick every second or minute)
  - [x] Format as "Xm" or "Xh Xm" for readability
  - [x] [EH] Handle `since` timestamp being 0 or future → show "Just now"
  - [x] [CR] Use `setInterval` with cleanup in `onDestroy` (no timer leak)

- [x] 3.1.2.5 — Display queue depth: "N queued" from `queuedCount`
  - [x] Show only when queuedCount > 0
  - [x] Format: "1 queued" / "N queued"
  - [x] [EU] Provide assurance: queued items will send on reconnect
  - [x] [EU] If queue is empty in sovereign mode, show "Nothing to send"

- [x] 3.1.2.6 — Position as fixed/sticky bar at top of viewport
  - [x] Use `position: fixed; top: 0; left: 0; right: 0; z-index:` above content
  - [x] [CR] Use z-index from existing scale (check architecture-patterns.md z-index scale)
  - [x] [EU] Bar should not obscure critical navigation elements

- [x] 3.1.2.7 — Ensure bar is visible in all mode-views (COMMS, MAP, OPS)
  - [x] Import SovereignBar at layout/shell level (above Routes.svelte conditional)
  - [x] Verify visibility when switching modes
  - [x] [CR] Bar renders independently of navcomMode state

- [x] 3.1.2.8 — Add app shell conditional padding to prevent content overlap
  - [x] When bar is visible, add `padding-top` to main content area
  - [x] When bar is hidden, remove padding
  - [x] [EU] Content should not "jump" when bar appears (smooth transition)
  - [x] [CR] Use reactive class binding or CSS variable for padding

### 3.2 Phase: Pipeline Integration

#### 3.2.1 Step: Modify `signAndPublish` — Choke Point

- [x] 3.2.1.1 — Modify `src/engine/commands.ts` — add sovereign mode branch to `signAndPublish()`
  - [x] Locate `signAndPublish` function
  - [x] [CR] Minimal change: single if-statement, not a rewrite
  - [x] [CR] Read `isSovereign` synchronously via `get(isSovereign)` (not reactive $)

- [x] 3.2.1.2 — Import `isSovereign` and `updateQueuedCount` from connection-state
  - [x] Verify import paths
  - [x] [CR] Verify no circular dependency (commands ←→ connection-state)

- [x] 3.2.1.3 — When `isSovereign === true`: sign event → enqueue to outbox → update queue count → return
  - [x] Call `sign()` to produce signed event (works offline — uses local key)
  - [x] Determine target relay URLs from routing logic
  - [x] Enqueue `{signedEvent, targetRelays}` to IndexedDB outbox
  - [x] Call `updateQueuedCount()` with new count
  - [x] [EH] If `sign()` fails (e.g., passphrase unavailable): show error toast, don't enqueue
  - [x] [EH] If `enqueue()` fails (IndexedDB error / quota exceeded): show error toast, explain message not saved
  - [x] [ER] Toast message for enqueue failure: "Message could not be saved for later sending"
  - [x] [EU] On success: no toast (SovereignBar already shows queue count)
  - [x] [CR] Return signed event regardless of enqueue success/failure

- [x] 3.2.1.4 — When `isSovereign === false`: existing publishThunk path (no change)
  - [x] [CR] Verify existing code path is completely unchanged
  - [x] [CR] No additional wrapping, error handling, or logging added to connected path

- [x] 3.2.1.5 — Ensure signed event is returned regardless of mode
  - [x] Both sovereign and connected paths return the signed event
  - [x] [CR] Callers that use the return value work identically in both modes

#### 3.2.2 Step: Extend Outbox Queue

##### 3.2.2.1 Task: Extend `QueuedMessage` type

- [x] 3.2.2.1.1 — Add `signedEvent` field to `QueuedMessage` in outbox module (full signed event envelope)
  - [x] Add optional `signedEvent?: TrustedEvent` (or appropriate signed event type)
  - [x] [CR] Field is optional to maintain backward compatibility with legacy DM queue entries
  - [x] [CR] Existing serialization/deserialization handles new field (JSON-safe)

- [x] 3.2.2.1.2 — Add `targetRelays` field to `QueuedMessage` (array of relay URLs for publication)
  - [x] Add optional `targetRelays?: string[]`
  - [x] [CR] Required when `signedEvent` is present
  - [x] [EH] Default to empty array if missing (drain will skip publish with no targets)

##### 3.2.2.2 Task: Extend `queue-drain.ts`

- [x] 3.2.2.2.1 — Modify drain logic: detect `signedEvent` field on queued message
  - [x] Check `msg.signedEvent` presence before deciding drain path
  - [x] [CR] Detection is a simple truthiness check, not type discrimination

- [x] 3.2.2.2.2 — When `signedEvent` present: publish via `publishThunk()` (skip re-signing)
  - [x] Extract signed event and target relays from queued message
  - [x] Call `publishThunk(signedEvent, targetRelays)`
  - [x] [EH] If publish fails on specific relays: retry with exponential backoff (existing pattern)
  - [x] [EH] If publish fails on ALL relays: mark message as "failed", leave in queue for next drain
  - [x] [EH] If signed event has stale `created_at` (relay rejects "event too old"): log warning, dequeue anyway
  - [x] [ER] Log each drain attempt: "Draining N queued events to M relays"
  - [x] [CR] Guard against concurrent drains (existing `draining` boolean)

- [x] 3.2.2.2.3 — When `signedEvent` absent: legacy DM send path (existing behavior)
  - [x] [CR] Existing sendMessage logic unchanged
  - [x] [CR] Both paths share retry/dequeue/error infrastructure

- [x] 3.2.2.2.4 — Update `updateQueuedCount()` after each successful drain
  - [x] After each message successfully published: decrement count
  - [x] After full drain complete: set count to remaining queue length
  - [x] [EH] Count should never go negative (clamp to 0)
  - [x] [EU] SovereignBar updates in real-time as queue drains

#### 3.2.3 Step: Relay Health Integration

- [x] 3.2.3.1 — Modify `relay-health.ts`: add `pause()` method to relay health tracker
  - [x] Set internal flag to skip health check evaluations
  - [x] [CR] Existing health data preserved (not cleared on pause)
  - [x] [EH] Idempotent: calling pause() when already paused is a no-op

- [x] 3.2.3.2 — Modify `relay-health.ts`: add `resume()` method to relay health tracker
  - [x] Clear pause flag, re-enable health tracking
  - [x] [CR] Don't trigger immediate re-evaluation (let normal check cycle resume)
  - [x] [EH] Idempotent: calling resume() when already running is a no-op

- [x] 3.2.3.3 — Call `pause()` on transition to sovereign mode
  - [x] Wire from connectionState transition logic
  - [x] [CR] Prevents false relay demotions during offline period

- [x] 3.2.3.4 — Call `resume()` on transition to connected mode
  - [x] Wire from connectionState transition logic
  - [x] [CR] Resume before triggering drain (health data informs relay selection)

- [x] 3.2.3.5 — Add relay circuit-breaker: if all relays demoted, transition to sovereign regardless of `navigator.onLine`
  - [x] Monitor relay health states; if all reach demoted/failed state, trigger sovereign
  - [x] [EH] Captive portal detection: navigator.onLine says true, but no relay responds
  - [x] [EH] Reset circuit-breaker when at least one relay recovers
  - [x] [CR] Circuit-breaker should have its own debounce (don't flap on brief relay hiccups)

#### 3.2.4 Step: Cleanup & Startup

- [x] 3.2.4.1 — Modify `Toast.svelte`: remove independent online/offline event listeners that show redundant toast
  - [x] Locate online/offline event listeners in Toast.svelte
  - [x] Remove the listeners and associated toast rendering
  - [x] [CR] SovereignBar now owns all connection-status UI
  - [x] [EH] If SovereignBar fails to render, there's no fallback — accept this (fail loudly)

- [x] 3.2.4.2 — Modify `main.js` (or app entry): call `startConnectionMonitor()` at app startup
  - [x] Import `startConnectionMonitor` from connection-state.ts
  - [x] Call during app initialization sequence
  - [x] [CR] Call after DOM is ready but before user interaction (init sequence ordering)
  - [x] [EH] If monitor fails to start, app still loads (connection features disabled, not blocking)

- [x] 3.2.4.3 — Ensure SovereignBar component is imported at layout/shell level
  - [x] Import in the top-level layout or shell component
  - [x] Position above the Routes.svelte conditional rendering
  - [x] [CR] Bar is always mounted regardless of navcomMode

### 3.3 Phase: Testing — Sovereign Mode

#### 3.3.1 Step: Unit Tests

- [x] 3.3.1.1 — Create `tests/unit/engine/connection-state.spec.ts`
  - [x] Set up test harness with mocked `navigator.onLine` and event dispatch
  - [x] [CR] Use fake timers for debounce testing (vi.useFakeTimers)

- [x] 3.3.1.2 — Unit test: store initializes to "connected" when `navigator.onLine` is true
  - [x] Mock `navigator.onLine = true`
  - [x] Assert initial mode is "connected"

- [x] 3.3.1.3 — Unit test: store initializes to "sovereign" when `navigator.onLine` is false
  - [x] Mock `navigator.onLine = false`
  - [x] Assert initial mode is "sovereign"

- [x] 3.3.1.4 — Unit test: transition to sovereign after debounce on offline event
  - [x] Dispatch offline event
  - [x] Assert mode is still "connected" immediately
  - [x] Advance timer by 3000ms
  - [x] Assert mode is "sovereign"

- [x] 3.3.1.5 — Unit test: transition to connected immediately on online event
  - [x] Set mode to sovereign
  - [x] Dispatch online event
  - [x] Assert mode is "connected" immediately (no timer wait)

- [x] 3.3.1.6 — Unit test: no transition if connection returns within debounce window
  - [x] Dispatch offline event
  - [x] Wait 1000ms
  - [x] Dispatch online event
  - [x] Advance timer by 5000ms
  - [x] Assert mode was never "sovereign"

- [x] 3.3.1.7 — Unit test: `since` timestamp updates on each transition
  - [x] Record timestamp before transition
  - [x] Trigger transition
  - [x] Assert `since` is >= recorded timestamp

- [x] 3.3.1.8 — Unit test: `lastConnectedAt` preserved during sovereign mode
  - [x] Record `lastConnectedAt` before going sovereign
  - [x] Go sovereign
  - [x] Assert `lastConnectedAt` unchanged during sovereign mode

- [x] 3.3.1.9 — Unit test: `updateQueuedCount()` updates store
  - [x] Call updateQueuedCount(5)
  - [x] Assert store.queuedCount === 5
  - [x] [EH] Call updateQueuedCount(-1)
  - [x] Assert store.queuedCount === 0 (clamped)

- [x] 3.3.1.10 — Create `tests/unit/engine/commands-sovereign.spec.ts`
  - [x] Set up test harness with mocked stores and outbox

- [x] 3.3.1.11 — Unit test: `signAndPublish` enqueues when sovereign
  - [x] Set isSovereign to true
  - [x] Call signAndPublish with template
  - [x] Assert event was enqueued to outbox
  - [x] Assert publishThunk was NOT called

- [x] 3.3.1.12 — Unit test: `signAndPublish` publishes normally when connected
  - [x] Set isSovereign to false
  - [x] Call signAndPublish with template
  - [x] Assert publishThunk was called
  - [x] Assert outbox was NOT written to

- [x] 3.3.1.13 — Unit test: queued count updated after enqueue
  - [x] Set isSovereign to true
  - [x] Call signAndPublish
  - [x] Assert updateQueuedCount called with incremented value

- [x] 3.3.1.14 — Unit test: signed event returned regardless of mode
  - [x] [Test sovereign] Assert return value is a signed event
  - [x] [Test connected] Assert return value is a signed event
  - [x] Assert event structure matches in both cases

#### 3.3.2 Step: E2E Tests

- [x] 3.3.2.1 — Create `cypress/e2e/beta/sovereign-mode.cy.ts`
  - [x] Set up E2E fixtures with active groups and relay connections
  - [x] Define helper for simulating offline/online transitions (cy.intercept + navigator.onLine mock)
  - [x] [CR] Ensure test cleanup restores online state

- [x] 3.3.2.2 — E2E test: SovereignBar appears when connection drops
  - [x] Simulate offline
  - [x] Wait for debounce (3s)
  - [x] Assert SovereignBar visible
  - [x] Assert "SOVEREIGN" text present
  - [x] Assert bar is red-themed

- [x] 3.3.2.3 — E2E test: messages queue in sovereign mode and drain on reconnect
  - [x] Simulate offline → wait for sovereign
  - [x] Send a message in COMMS view
  - [x] Assert "1 queued" in SovereignBar
  - [x] Simulate online
  - [x] Assert drain completes (queued count returns to 0)
  - [x] Assert SovereignBar shows "CONNECTED" then hides

- [x] 3.3.2.4 — E2E test: SovereignBar shows queue depth
  - [x] Simulate offline → send 3 messages
  - [x] Assert "3 queued" displayed
  - [x] [EU] Verify count updates in real-time (not batch)

- [x] 3.3.2.5 — E2E test: brief connection hiccups don't trigger sovereign mode (debounce)
  - [x] Simulate offline → wait 1 second → simulate online
  - [x] Assert SovereignBar NEVER appeared
  - [x] [CR] Test validates the 3-second debounce behavior

- [x] 3.3.2.6 — E2E test: relay health pause prevents false demotions during sovereign mode
  - [x] Enter sovereign mode
  - [x] Verify relay health tracking is paused (no demotion events)
  - [x] Reconnect
  - [x] Verify relay health tracking is resumed

### 3.4 Phase: Phase 2 Validation

- [x] 3.4.1 — Validate all 19 acceptance criteria for Sovereign Mode
  - [x] Create criterion-to-test mapping
  - [x] Verify each criterion has at least one automated test
  - [x] [CR] No manual-only criteria

- [x] 3.4.2 — Run full beta test suite (243+ Phase 1 tests) and confirm no regressions
  - [x] Run all existing specs plus new sovereign specs
  - [x] [ER] Document any regressions with root cause analysis

- [x] 3.4.3 — Verify per-mode behavior: COMMS queues messages, MAP tiles unavailable expected, OPS continues
  - [x] In sovereign: COMMS messages are queued (not silently dropped)
  - [x] In sovereign: MAP shows "offline" overlay (expected behavior)
  - [x] In sovereign: OPS/Board tiles show cached data or appropriate empty states
  - [x] [EU] Verify user understands what's happening in each mode during sovereign

- [x] 3.4.4 — Test transition edge cases: flapping, captive portal, passphrase unavailable
  - [x] Rapid online/offline toggling → no sovereign mode triggered
  - [x] Captive portal (navigator.onLine=true, relays fail) → circuit-breaker triggers sovereign
  - [x] Passphrase unavailable during sovereign → sign fails → error toast
  - [x] [EH] Event with stale created_at on drain → log warning, dequeue

- [x] 3.4.5 — Git commit Phase 2 work
  - [x] Stage all Phase 2 files
  - [x] Commit with descriptive message
  - [x] [CR] Verify Prettier/lint passes

- [x] 3.4.6 — Update playbook.md status dashboard for Phase 2 completion
  - [x] Set Sovereign Mode row to COMPLETE
  - [x] Record notes on edge cases encountered

---

## Stage 4: Phase 3 — The Board

### 4.1 Phase: Board State & Infrastructure

#### 4.1.1 Step: Core Module — `board-state.ts`

- [x] 4.1.1.1 — Create `src/app/board/board-state.ts`
  - [x] Create directory `src/app/board/` if it doesn't exist
  - [x] Create TypeScript module with type exports and store
  - [x] [CR] Follow existing app module conventions (see `src/app/groups/`)

- [x] 4.1.1.2 — Define `TileType` union: "map-overview" | "group-status" | "personnel-status" | "activity-feed" | "connection-status" | "security-status" | "quick-actions"
  - [x] Export type for use by tile components and registry
  - [x] [CR] String literal union — extensible for Phase 4 ("trust-overview")

- [x] 4.1.1.3 — Define `TilePlacement` type: `{type, col, row, colSpan, rowSpan}`
  - [x] type: TileType
  - [x] col, row: 1-based grid coordinates
  - [x] colSpan, rowSpan: tile dimensions (default 1×1)
  - [x] [CR] Ensure grid coordinates are validated (no negative, no out-of-bounds)

- [x] 4.1.1.4 — Define `BoardLayout` type: `TilePlacement[]`
  - [x] Export type
  - [x] [CR] Array order determines render order (z-index in case of overlap)

- [x] 4.1.1.5 — Define `TILE_REGISTRY` object with metadata (name, icon, description) for all 7 tile types
  - [x] Each entry: `{name: string, icon: string, description: string}`
  - [x] [CR] Registry drives TilePicker UI — all tile types must have entries
  - [x] [EH] Unknown tile type in layout → skip rendering (don't crash Board)

- [x] 4.1.1.6 — Define `DEFAULT_DESKTOP_LAYOUT` constant with 5 default tiles
  - [x] Include: map-overview, group-status, activity-feed, personnel-status, connection-status
  - [x] Assign sensible grid positions for 4-column layout
  - [x] [CR] Layout should fill visible viewport without scrolling on typical desktop

- [x] 4.1.1.7 — Create `boardLayout` synced store: `synced("ui/board-layout", DEFAULT_DESKTOP_LAYOUT)`
  - [x] Use existing synced() pattern for localStorage persistence
  - [x] [EH] If localStorage contains invalid JSON → fallback to default layout silently
  - [x] [EH] If localStorage contains layout with unknown tile types → filter them out, keep valid tiles
  - [x] [EH] If localStorage is corrupted or quota exceeded → use in-memory default
  - [x] [CR] Key `"ui/board-layout"` follows existing naming convention (see architecture-patterns.md)

- [x] 4.1.1.8 — Implement `addTile(type)` function: places new tile at next available row
  - [x] Compute next available grid position (after last tile)
  - [x] Append new TilePlacement to boardLayout
  - [x] [EH] Prevent adding duplicate tile types if max count enforced
  - [x] [CR] Store update triggers reactive re-render in BoardView

- [x] 4.1.1.9 — Implement `removeTile(index)` function
  - [x] Remove tile at array index from boardLayout
  - [x] [EH] Guard: index out of bounds → no-op
  - [x] [EH] Prevent removing last tile (always keep at least one?)
  - [x] [CR] Store update persists immediately via synced()

- [x] 4.1.1.10 — Implement `moveTile(fromIndex, toIndex)` function
  - [x] Reorder tile in the layout array
  - [x] [EH] Guard: invalid indices → no-op
  - [x] [CR] Used by drag-and-drop reordering

#### 4.1.2 Step: New Component — `TilePicker.svelte`

- [x] 4.1.2.1 — Create `src/app/board/TilePicker.svelte`
  - [x] Create Svelte component with TypeScript script block
  - [x] Import TILE_REGISTRY and addTile from board-state

- [x] 4.1.2.2 — List all available tile types from `TILE_REGISTRY`
  - [x] Iterate TILE_REGISTRY entries
  - [x] Display icon, name, description for each
  - [x] [EH] Handle empty registry gracefully (should never happen, but defensive)

- [x] 4.1.2.3 — Show add button per tile type
  - [x] Button calls `addTile(type)` on click
  - [x] [EU] Button should provide visual feedback on click (brief highlight)
  - [x] [EU] Confirm action or auto-close picker after adding

- [x] 4.1.2.4 — Disable tiles already at max count (if applicable)
  - [x] Check current layout for existing instances of each type
  - [x] Gray out / disable add button for tiles at limit
  - [x] [EU] Show tooltip explaining why tile is disabled ("Already on board")

- [x] 4.1.2.5 — Style as collapsible side panel or modal
  - [x] Use existing UI patterns for overlay/panel (check Tailwind z-index scale)
  - [x] [EU] Close picker on outside click or Escape key
  - [x] [EU] Animate open/close for smooth UX
  - [x] [CR] Picker should not overlap SovereignBar

### 4.2 Phase: Board View & Layout

#### 4.2.1 Step: New Component — `BoardView.svelte`

- [x] 4.2.1.1 — Create `src/app/views/BoardView.svelte`
  - [x] Create Svelte component with TypeScript script block
  - [x] Import boardLayout, TILE_REGISTRY from board-state
  - [x] [CR] Follow existing view component conventions (see CommsView, MapView)

- [x] 4.2.1.2 — Subscribe to `boardLayout` synced store
  - [x] Use `$boardLayout` reactive subscription
  - [x] [EH] If store value is null/empty → render default layout
  - [x] [CR] Subscription auto-cleanup on component destroy

- [x] 4.2.1.3 — Render CSS Grid with `grid-template-columns` and `grid-template-rows`
  - [x] Set `display: grid` on container
  - [x] Use `grid-template-columns: repeat(4, 1fr)` as base (4 columns)
  - [x] Set `gap` for spacing between tiles
  - [x] [CR] Grid container fills available height (min-height or flex-grow)

- [x] 4.2.1.4 — Map each `TilePlacement` to the correct tile component (dynamic dispatch)
  - [x] Use `{#each}` over boardLayout
  - [x] Map type string to component via lookup object or switch
  - [x] Set `grid-column` and `grid-row` from placement data
  - [x] [EH] Unknown tile type → render placeholder "Unknown tile" box
  - [x] [ER] Log warning for unknown tile type: "Unknown tile type: {type}"
  - [x] [CR] Each tile receives its type and placement as props

- [x] 4.2.1.5 — Implement edit mode toggle button
  - [x] Local `editMode: boolean` state
  - [x] Toggle button: gear/pencil icon in top-right corner
  - [x] [EU] Button text changes: "Edit" ↔ "Done"
  - [x] [EU] Edit mode boundary is visually clear (outline on board, dimmed tiles)

- [x] 4.2.1.6 — In edit mode: show ✕ remove button on each tile
  - [x] Overlay remove button at top-right corner of each tile
  - [x] Call `removeTile(index)` on click
  - [x] [EU] Confirm removal or provide undo (toast with "Undo" action)
  - [x] [EU] Remove button should have sufficient tap target (min 44px)

- [x] 4.2.1.7 — In edit mode: show TilePicker panel
  - [x] Conditionally render `<TilePicker />` when editMode is true
  - [x] [EU] Picker should not obscure the board (side panel or bottom sheet)

- [x] 4.2.1.8 — Implement drag-and-drop reordering (native HTML drag events)
  - [x] Set `draggable="true"` on tile containers in edit mode
  - [x] Handle dragstart, dragover, drop events
  - [x] Call `moveTile(fromIndex, toIndex)` on successful drop
  - [x] [EH] Handle drop outside valid target → no-op (revert to original position)
  - [x] [EU] Visual feedback during drag: ghost element, drop target highlight
  - [x] [EU] Mobile: consider long-press to initiate drag (touch events)
  - [x] [CR] Drag only active in edit mode (no accidental reorder)

- [x] 4.2.1.9 — Implement responsive breakpoints: 4 columns (xl) → 3 (lg) → 2 (md) → 1 (sm)
  - [x] Use Tailwind responsive classes or CSS media queries
  - [x] Adjust `grid-template-columns: repeat(N, 1fr)` per breakpoint
  - [x] [EU] Tiles should reflow gracefully (no overflow, no horizontal scroll)
  - [x] [EU] On mobile (1 column): tiles stack vertically in meaningful order
  - [x] [CR] Test at each breakpoint: xl (1280+), lg (1024+), md (768+), sm (<768)

#### 4.2.2 Step: Modify `Routes.svelte`

- [x] 4.2.2.1 — Replace `OpsView` import with `BoardView` import
  - [x] Change import statement
  - [x] [CR] Verify import path resolves to new BoardView.svelte

- [x] 4.2.2.2 — Change conditional: when `$navcomMode === "ops"` render `<BoardView />` instead of `<OpsView />`
  - [x] Replace component reference in the `{#if}` / `{:else if}` chain
  - [x] [CR] All other mode conditionals (comms, map) unchanged
  - [x] [EH] If BoardView fails to import → build error (caught at compile time)

- [x] 4.2.2.3 — Change max width: `max-w-4xl` → `max-w-6xl` for Board layout
  - [x] Locate max-width Tailwind class on the OPS-mode container
  - [x] Change to `max-w-6xl` (1152px) to accommodate grid layout
  - [x] [EU] Verify wider layout doesn't cause reading discomfort on ultra-wide screens
  - [x] [CR] Only the OPS-mode branch gets wider — COMMS and MAP unchanged

- [x] 4.2.2.4 — Preserve OpsView.svelte in codebase (do not delete)
  - [x] [CR] Keep file as reference/fallback — no import needed
  - [x] [CR] Remove from any barrel exports if applicable

### 4.3 Phase: Tile Components

#### 4.3.1 Step: Map Overview Tile

- [x] 4.3.1.1 — Create `src/app/board/tiles/MapOverviewTile.svelte`
  - [x] Create directory `src/app/board/tiles/` if needed
  - [x] Create Svelte component with TypeScript script block
  - [x] [CR] Follow tile component conventions (self-contained, own store subscriptions)

- [x] 4.3.1.2 — Initialize Leaflet instance (separate from MapView's instance)
  - [x] Use `L.map()` on a dedicated DOM container within the tile
  - [x] Set up tile layer with same tile URL as MapView
  - [x] [EH] Handle Leaflet load failure → show "Map unavailable" text
  - [x] [CR] Separate instance avoids conflicts with MapView (proven pattern — current OpsView does this)
  - [x] [CR] Cleanup: call `map.remove()` in `onDestroy` to prevent memory leak

- [x] 4.3.1.3 — Render group markers using existing `deriveMarkers()` and `MARKER_STYLES`
  - [x] Call deriveMarkers with current data
  - [x] Apply MARKER_STYLES per marker type
  - [x] [EH] Handle empty markers array → show map with no markers (no crash)
  - [x] [EH] Handle marker with invalid coordinates → skip (don't break other markers)

- [x] 4.3.1.4 — Display as thumbnail/overview (non-interactive or minimally interactive)
  - [x] Disable zoom controls and scroll-to-zoom
  - [x] Fit bounds to all markers
  - [x] [EU] Click on tile → switch to MAP mode (full interaction there)

- [x] 4.3.1.5 — Sovereign mode: show "Map data unavailable offline" overlay
  - [x] Check `$isSovereign` and conditionally render overlay
  - [x] Overlay: semi-transparent background with centered message
  - [x] [EU] Preserve last-rendered map image behind overlay (stale data is better than blank)

#### 4.3.2 Step: Group Status Tile

- [x] 4.3.2.1 — Create `src/app/board/tiles/GroupStatusTile.svelte`
  - [x] Create Svelte component with TypeScript script block

- [x] 4.3.2.2 — Subscribe to `groupProjections` store
  - [x] Use `$groupProjections` reactive subscription
  - [x] [EH] Handle empty projections → show "No groups" state
  - [x] [CR] Only subscribe to what's needed (not entire repository)

- [x] 4.3.2.3 — Render group list with name, member count, unread count
  - [x] Iterate groups from projections
  - [x] Display: group name, N members, N unread
  - [x] [EH] Handle group with missing name → show group ID truncated
  - [x] [EU] Sort groups by unread count (most active first) or alphabetically

- [x] 4.3.2.4 — Render `GroupHealthBadge` per group (from Phase 1 presence)
  - [x] Import and render GroupHealthBadge for each group
  - [x] [EH] If GroupHealthBadge is not available (Phase 1 not shipped) → don't render (graceful skip)
  - [x] [CR] Use optional import or dynamic component check

- [x] 4.3.2.5 — Click group → navigate to COMMS mode with channel opened
  - [x] On click: set `navcomMode` to "comms" and navigate to group channel
  - [x] [EH] Handle case where group channel doesn't exist → show toast "Channel unavailable"
  - [x] [EU] Provide visual click feedback (hover state, cursor pointer)

- [x] 4.3.2.6 — Graceful degradation: show member counts without badges if Phase 1 not shipped
  - [x] Check if GroupHealthBadge component exists / health data is available
  - [x] If not: render tile without badges (no error, just simpler display)
  - [x] [CR] Tile remains fully functional without Phase 1 dependency

#### 4.3.3 Step: Personnel Status Tile

- [x] 4.3.3.1 — Create `src/app/board/tiles/PersonnelStatusTile.svelte`
  - [x] Create Svelte component

- [x] 4.3.3.2 — Subscribe to `groupProjections` and `groupMemberPresence` stores
  - [x] Derive member list from projections
  - [x] [EH] Handle missing groupMemberPresence store (Phase 1 not shipped) → skip presence data

- [x] 4.3.3.3 — Render member list with `PresenceBadge` per member (from Phase 1)
  - [x] Display member display name + PresenceBadge
  - [x] [EH] Missing display name → show truncated pubkey
  - [x] [EH] PresenceBadge unavailable → render member without badge

- [x] 4.3.3.4 — Sort by presence status (active first, cold last)
  - [x] Sort order: active → recent → cold → unknown
  - [x] [CR] Stable sort within same status (alphabetical by name)

- [x] 4.3.3.5 — Graceful degradation: show member list without presence if Phase 1 not shipped
  - [x] Alphabetical member list, no badges
  - [x] [EU] Show "Presence data unavailable" subtitle if store is missing

#### 4.3.4 Step: Activity Feed Tile

- [x] 4.3.4.1 — Create `src/app/board/tiles/ActivityFeedTile.svelte`
  - [x] Create Svelte component

- [x] 4.3.4.2 — Subscribe to repository events (recent events across groups)
  - [x] Use deriveEvents or appropriate filter for recent group events
  - [x] [EH] Handle empty event set → show "No recent activity"
  - [x] [CR] Filter to relevant event kinds (messages, check-ins, not metadata)

- [x] 4.3.4.3 — Render chronological event list with timestamp, icon, and group name
  - [x] Format timestamp as relative time ("3m ago", "1h ago")
  - [x] Map event kind to icon (message icon, signal icon, etc.)
  - [x] Show group name for context
  - [x] [EH] Handle event with missing group reference → show "Unknown group"
  - [x] [EU] Truncate long event content (show first ~80 chars)

- [x] 4.3.4.4 — Limit to N most recent events (e.g., 10-20)
  - [x] Slice events after sorting by created_at descending
  - [x] [CR] Configurable constant for limit (not magic number)
  - [x] [CR] Don't load more events than needed from repository

- [x] 4.3.4.5 — Auto-scroll or show "new events" indicator
  - [x] When new events arrive while tile is visible
  - [x] [EU] Don't force scroll if user is reading older events
  - [x] [EU] Show "N new events" badge at top of tile (click to scroll to top)

#### 4.3.5 Step: Connection Status Tile

- [x] 4.3.5.1 — Create `src/app/board/tiles/ConnectionStatusTile.svelte`
  - [x] Create Svelte component

- [x] 4.3.5.2 — Subscribe to `connectionState` store (from Phase 2)
  - [x] [EH] If connectionState store not available (Phase 2 not shipped) → show basic fallback
  - [x] [CR] Use optional/try import pattern for cross-phase dependency

- [x] 4.3.5.3 — Display current mode: "CONNECTED" or "SOVEREIGN"
  - [x] Color-coded mode label (green/red)
  - [x] [EU] Icon alongside label (check mark / disconnect icon)

- [x] 4.3.5.4 — Display queue depth and last connected timestamp
  - [x] Show "N queued" when in sovereign mode
  - [x] Show "Last online: Xm ago" when sovereign
  - [x] [EH] Handle zero queue → "Queue empty"
  - [x] [EU] Clear communication that queued items will send on reconnect

- [x] 4.3.5.5 — Show relay status summary (connected/total relays)
  - [x] Read from relay health data
  - [x] Display "3/5 relays connected" format
  - [x] [EH] Handle relay health data unavailable → show "Relay status unknown"

- [x] 4.3.5.6 — Graceful degradation: basic online/offline indicator if Phase 2 not shipped
  - [x] Fallback: use `navigator.onLine` directly
  - [x] Show simple green dot / red dot
  - [x] [EU] Clearly mark as "basic" connectivity info

#### 4.3.6 Step: Security Status Tile

- [x] 4.3.6.1 — Create `src/app/board/tiles/SecurityStatusTile.svelte`
  - [x] Create Svelte component

- [x] 4.3.6.2 — Run `evaluateRelayFingerprintGate()` as read-only audit per group (from Phase 1)
  - [x] Import gate function and assembleGateInput
  - [x] Evaluate gate for each group
  - [x] [EH] If gate function not available (Phase 1 not shipped) → show "N/A"
  - [x] [EH] If gate evaluation throws → show "Check failed" per group
  - [x] [CR] Read-only: no save/gate behavior, just informational display

- [x] 4.3.6.3 — Display per-group gate status: green check (clean) or red warning (violation)
  - [x] Iterate groups, show ✓ or ⚠ next to each group name
  - [x] [EU] Clickable violations → navigate to GroupSettingsAdmin for remediation
  - [x] [ER] Show violation count per group ("2 relay conflicts")

- [x] 4.3.6.4 — Graceful degradation: "N/A" if Phase 1 relay gate not shipped
  - [x] Show "Security audit unavailable — requires relay fingerprint gate"
  - [x] [EU] Don't show alarming UI — just informational "not yet available"

#### 4.3.7 Step: Quick Actions Tile

- [x] 4.3.7.1 — Create `src/app/board/tiles/QuickActionsTile.svelte`
  - [x] Create Svelte component

- [x] 4.3.7.2 — Render action buttons: broadcast message, signal check-in, switch mode
  - [x] Button for each action with icon + label
  - [x] [EU] Clear labels: "Broadcast", "Signal", "Switch to COMMS", "Switch to MAP"
  - [x] [EU] Buttons should have consistent sizing and spacing
  - [x] [CR] Actions are same as accessible elsewhere — this is a shortcut panel

- [x] 4.3.7.3 — Wire actions to existing commands (`publishGroupMessage`, etc.)
  - [x] Broadcast: prompt for message → call `publishGroupMessage` for selected group
  - [x] Signal: call existing check-in/signal publish
  - [x] Switch mode: update `navcomMode` store
  - [x] [EH] If action fails: show error toast with action-specific message
  - [x] [EH] If in sovereign mode: broadcast queues (no special handling needed — signAndPublish handles it)
  - [x] [EU] Disable broadcast button if no groups exist
  - [x] [ER] Toast feedback: "Broadcast sent" / "Signal sent" / "Broadcast queued (offline)"

### 4.4 Phase: Testing — The Board

#### 4.4.1 Step: Unit Tests

- [x] 4.4.1.1 — Create `tests/unit/app/board/board-state.spec.ts`
  - [x] Set up test harness with mocked localStorage for synced store
  - [x] [CR] Each test starts with clean localStorage

- [x] 4.4.1.2 — Unit test: `DEFAULT_DESKTOP_LAYOUT` has 5 tiles
  - [x] Assert array length === 5
  - [x] Assert expected tile types are present

- [x] 4.4.1.3 — Unit test: `TILE_REGISTRY` has entries for all 7 tile types
  - [x] Assert 7 entries
  - [x] Assert each entry has name, icon, description

- [x] 4.4.1.4 — Unit test: `boardLayout` synced store initializes with default layout
  - [x] Clear localStorage
  - [x] Read store value
  - [x] Assert matches DEFAULT_DESKTOP_LAYOUT
  - [x] [EH] Test: corrupted localStorage → fallback to default

- [x] 4.4.1.5 — Unit test: `addTile()` places at next available row
  - [x] Call addTile("quick-actions")
  - [x] Assert layout array grew by 1
  - [x] Assert new tile has valid grid position

- [x] 4.4.1.6 — Unit test: `removeTile()` removes correct tile and persists
  - [x] Record initial layout
  - [x] Call removeTile(1)
  - [x] Assert layout shrank by 1 and correct tile removed
  - [x] [EH] Test: removeTile with invalid index → no change

#### 4.4.2 Step: E2E Tests

- [x] 4.4.2.1 — Create `cypress/e2e/beta/board-view.cy.ts`
  - [x] Set up E2E fixtures with groups, members, and events
  - [x] [CR] Clear board layout localStorage before each test

- [x] 4.4.2.2 — E2E test: Board renders when OPS mode selected
  - [x] Click OPS mode
  - [x] Assert CSS grid container is visible
  - [x] Assert at least one tile renders

- [x] 4.4.2.3 — E2E test: default tiles visible on first visit
  - [x] Clear localStorage
  - [x] Navigate to OPS mode
  - [x] Assert map overview, group status, activity feed, connection status tiles visible

- [x] 4.4.2.4 — E2E test: edit mode shows tile controls and TilePicker
  - [x] Click edit button
  - [x] Assert TilePicker panel visible
  - [x] Assert remove (✕) buttons visible on tiles
  - [x] Click Done → assert controls hidden

- [x] 4.4.2.5 — E2E test: adding a tile persists to layout (survives reload)
  - [x] Enter edit mode → add "quick-actions" tile
  - [x] Exit edit mode → reload page
  - [x] Assert Quick Actions tile still present

- [x] 4.4.2.6 — E2E test: removing a tile persists to layout (survives reload)
  - [x] Enter edit mode → remove a tile
  - [x] Exit edit mode → reload page
  - [x] Assert removed tile is gone

- [x] 4.4.2.7 — E2E test: GroupStatusTile shows health badges
  - [x] Navigate to OPS mode
  - [x] Assert group cards have health badge emoji (🟢🟡🔴)
  - [x] [EH] If Phase 1 not available → assert tile renders without badges

- [x] 4.4.2.8 — E2E test: ActivityFeedTile shows recent events
  - [x] Navigate to OPS mode
  - [x] Assert activity items visible with timestamp, icon, group name

- [x] 4.4.2.9 — E2E test: ConnectionStatusTile shows current mode
  - [x] Navigate to OPS mode
  - [x] Assert "CONNECTED" or "SOVEREIGN" visible in connection tile

- [x] 4.4.2.10 — E2E test: clicking group in GroupStatusTile navigates to COMMS
  - [x] Click a group in GroupStatusTile
  - [x] Assert mode switched to COMMS
  - [x] Assert channel opened

### 4.5 Phase: Phase 3 Validation

- [x] 4.5.1 — Validate all 19 acceptance criteria for The Board
  - [x] Map each criterion to at least one test
  - [x] [CR] No criterion covered by manual testing only

- [x] 4.5.2 — Migrate existing OpsView Cypress tests to Board tests
  - [x] Identify all existing OpsView-specific selectors in beta specs
  - [x] Update to Board equivalents
  - [x] [CR] Don't delete old tests — update them

- [x] 4.5.3 — Run full beta test suite and confirm no regressions
  - [x] All original 243+ tests pass
  - [x] Phase 1 and Phase 2 specs pass
  - [x] New Board specs pass
  - [x] [ER] If regression found: isolate to Board changes vs. pre-existing

- [x] 4.5.4 — Verify responsive behavior at all 4 breakpoints
  - [x] xl (1280px): 4 columns
  - [x] lg (1024px): 3 columns
  - [x] md (768px): 2 columns
  - [x] sm (<768px): 1 column
  - [x] [EU] No horizontal overflow at any breakpoint

- [x] 4.5.5 — Verify sovereign mode rendering for each tile
  - [x] Map tile: "offline" overlay
  - [x] Connection tile: shows sovereign status
  - [x] Activity feed: shows cached events
  - [x] Group status: still visible with cached data
  - [x] [EU] No tile crashes or blanks during sovereign mode

- [x] 4.5.6 — Verify graceful degradation when Phase 1/2 innovations not present
  - [x] Group status tile: member counts without badges
  - [x] Personnel tile: list without presence
  - [x] Connection tile: basic online/offline
  - [x] Security tile: "N/A"
  - [x] [CR] All tiles must render something meaningful even without dependencies

- [x] 4.5.7 — Git commit Phase 3 work
  - [x] Stage all Phase 3 files (10+ new, 1 modified)
  - [x] Commit with descriptive message
  - [x] [CR] Verify lint/Prettier passes

- [x] 4.5.8 — Update playbook.md status dashboard for Phase 3 completion
  - [x] Set The Board row to COMPLETE
  - [x] Record any deviations from spec

---

## Stage 5: Phase 4 — Trust Attestation

### 5.1 Phase: Attestation Engine

#### 5.1.1 Step: Core Module — `attestation.ts`

- [x] 5.1.1.1 — Create `src/engine/trust/attestation.ts`
  - [x] Create file in existing `src/engine/trust/` directory
  - [x] Import dependencies: `deriveEvents`, `repository`, svelte stores
  - [x] [CR] Follow existing trust module conventions (see delegation.ts, chain.ts)

- [x] 5.1.1.2 — Define `Attestation` type: `{attester, target, method, confidence, scope, validUntil, context, createdAt, expired}`
  - [x] Export type
  - [x] `attester: string` (pubkey of the attestor)
  - [x] `target: string` (pubkey of the attested person)
  - [x] `expired: boolean` (computed from validUntil vs now)
  - [x] [CR] Type mirrors event structure but with parsed/typed fields

- [x] 5.1.1.3 — Define `AttestationMethod` type: "in-person" | "video-call" | "shared-secret" | "key-signing" | "vouched" | "organizational" | "device-verification" | "self-declared"
  - [x] Export type
  - [x] [CR] 8 methods — extensible but finite for Phase 4

- [x] 5.1.1.4 — Define `Confidence` type: "high" | "medium" | "low"
  - [x] Export type
  - [x] [CR] Ordinal: high > medium > low (used by getAttestationSummary)

- [x] 5.1.1.5 — Define `Scope` type: "operational" | "personal" | "financial"
  - [x] Export type

- [x] 5.1.1.6 — Define `METHOD_LABELS` constant for human-readable method names
  - [x] Map each AttestationMethod to a display string
  - [x] Example: "in-person" → "In Person", "key-signing" → "Key Signing Event"
  - [x] [CR] Used by AttestForm select dropdown and AttestationPanel display

- [x] 5.1.1.7 — Implement `isAttestationEvent(event)`: check kind 30078 + d-tag prefix "attestation:"
  - [x] Check `event.kind === 30078`
  - [x] Find d-tag and check it starts with "attestation:"
  - [x] Return boolean
  - [x] [EH] Handle events with no tags → false
  - [x] [EH] Handle events with no d-tag → false
  - [x] [CR] Fast check — used as filter across all kind-30078 events

- [x] 5.1.1.8 — Implement `parseAttestation(event): Attestation | null`
  - [x] Extract d-tag → get target pubkey from "attestation:<pubkey>"
  - [x] Extract p-tag → verify matches d-tag target
  - [x] Extract method, confidence, scope, valid-until, context tags
  - [x] Compute expired flag from valid-until vs current time
  - [x] [EH] Return null for events that pass `isAttestationEvent` but have invalid structure
  - [x] [EH] Handle missing/malformed d-tag → return null
  - [x] [EH] Handle d-tag/p-tag mismatch → return null (suspicious event)
  - [x] [EH] Handle missing optional tags gracefully (valid-until, context)
  - [x] [CR] Never throw: always return Attestation or null

- [x] 5.1.1.9 — Handle optional tags: valid-until, context; defaults for missing method/confidence
  - [x] Default method: "self-declared" when tag missing
  - [x] Default confidence: "low" when tag missing
  - [x] Default scope: "operational" when tag missing
  - [x] Default context: "" (empty string) when tag missing
  - [x] [CR] Defaults are conservative (low confidence, self-declared)

- [x] 5.1.1.10 — Implement expiry check: mark `expired` if `valid-until < now`
  - [x] Compare valid-until (epoch seconds) to `Math.floor(Date.now() / 1000)`
  - [x] If no valid-until tag → never expires (`expired = false`)
  - [x] [EH] Handle valid-until of 0 or NaN → treat as expired
  - [x] [CR] Expiry is checked at parse time and should be re-evaluated for long-running sessions

- [x] 5.1.1.11 — Create `attestationsByTarget` derived store from `deriveEvents({kinds: [30078]})`
  - [x] Filter events through `isAttestationEvent` then `parseAttestation`
  - [x] Group by target pubkey into Map<string, Attestation[]>
  - [x] [EH] Handle events that parse to null → skip silently
  - [x] [CR] Recomputes when repository receives new kind-30078 events
  - [x] [CR] Consistent with how delegation system derives from same event pool

- [x] 5.1.1.12 — Build `Map<pubkey, Attestation[]>` grouping by target pubkey
  - [x] Iterate parsed attestations, group by `target` field
  - [x] Sort each array by `createdAt` descending (most recent first)
  - [x] [CR] O(n) iteration over attestation events — acceptable for typical group sizes

- [x] 5.1.1.13 — Implement `getAttestationSummary(map, pubkey)`: `{isAttested, count, highestConfidence, methods}`
  - [x] Look up pubkey in map
  - [x] Filter to non-expired attestations for `isAttested` and counts
  - [x] Find highest confidence among active attestations
  - [x] Collect unique methods used
  - [x] [EH] Return `{isAttested: false, count: 0, highestConfidence: null, methods: []}` for unknown pubkey
  - [x] [EH] Handle empty attestation array → not attested
  - [x] [CR] Pure function (takes map + pubkey, returns summary)

- [x] 5.1.1.14 — Implement `buildAttestationTemplate(params)`: create unsigned kind 30078 event
  - [x] Accept `{target, method, confidence, scope, validUntil?, context?}`
  - [x] Build event template with kind=30078
  - [x] [CR] Returns unsigned template — signAndPublish handles signing
  - [x] [EH] Validate target is a valid pubkey format (64-char hex)
  - [x] [EH] Validate method is one of defined AttestationMethods

- [x] 5.1.1.15 — Set d-tag: `"attestation:<targetPubkey>"` for addressable replacement
  - [x] Tag: `["d", "attestation:" + target]`
  - [x] [CR] Addressable event — republishing replaces previous attestation for same target
  - [x] [CR] Namespace prefix "attestation:" won't collide with "delegation:" or app-data d-tags

- [x] 5.1.1.16 — Set p-tag matching target pubkey
  - [x] Tag: `["p", target]`
  - [x] [CR] Enables relay filtering with `#p` filter — essential for efficient fetching

- [x] 5.1.1.17 — Set method, confidence, scope, valid-until, context tags
  - [x] `["method", method]`
  - [x] `["confidence", confidence]`
  - [x] `["scope", scope]`
  - [x] `["valid-until", String(validUntil)]` (only if provided)
  - [x] `["context", context]` (only if non-empty)
  - [x] [CR] Omit optional tags when not set (smaller event)

- [x] 5.1.1.18 — Truncate context to 280 chars
  - [x] `context = context.slice(0, 280)`
  - [x] [EH] Handle null/undefined context → empty string
  - [x] [CR] Prevent arbitrarily large context strings in events

### 5.2 Phase: Attestation UI Components

#### 5.2.1 Step: New Component — `AttestationBadge.svelte`

- [x] 5.2.1.1 — Create `src/partials/AttestationBadge.svelte`
  - [x] Create Svelte component with TypeScript script block

- [x] 5.2.1.2 — Accept `pubkey` prop
  - [x] Export let pubkey: string
  - [x] [EH] Guard: if pubkey is undefined/empty, render nothing

- [x] 5.2.1.3 — Subscribe to `attestationsByTarget` store
  - [x] Derive attestation summary reactively
  - [x] [CR] Subscription auto-cleaned on destroy

- [x] 5.2.1.4 — Show ✦ icon (text-accent color) when attested
  - [x] Render `✦` character with `class="text-accent"`
  - [x] [EU] Icon should be visually distinct but not dominating (small size, subtle)
  - [x] [EU] Screen reader: `aria-label="Attested"`

- [x] 5.2.1.5 — Show nothing when not attested
  - [x] Use `{#if isAttested}` guard
  - [x] [CR] No empty wrapper elements when not attested (zero DOM footprint)

- [x] 5.2.1.6 — Add tooltip: "Attested (N attestations)"
  - [x] Show count and highest confidence
  - [x] [EU] Tooltip accessible on hover and keyboard focus

#### 5.2.2 Step: New Component — `AttestationPanel.svelte`

- [x] 5.2.2.1 — Create `src/partials/AttestationPanel.svelte`
  - [x] Create Svelte component

- [x] 5.2.2.2 — Accept `pubkey` prop
  - [x] [EH] Guard: undefined pubkey → render "No attestation data"

- [x] 5.2.2.3 — List all attestations for pubkey: attester, method, confidence, scope, context, date
  - [x] Render each attestation as a card/row
  - [x] Show attester display name (or truncated pubkey fallback)
  - [x] Show method label from METHOD_LABELS
  - [x] Show confidence and scope badges
  - [x] Show context text (if any)
  - [x] Show relative date ("3 days ago")
  - [x] [EH] Handle attestation with missing fields → show available fields, skip missing
  - [x] [EU] Scrollable if many attestations (max-height with overflow-y)

- [x] 5.2.2.4 — Show "No attestations yet" when empty
  - [x] [EU] Informative empty state, not just blank space
  - [x] [EU] Suggest: "Be the first to attest this person"

- [x] 5.2.2.5 — Show expired badge for expired attestations
  - [x] Visual indicator: "Expired" tag in muted color
  - [x] [EU] Expired attestations shown but visually de-emphasized (lower opacity)

- [x] 5.2.2.6 — Sort by most recent first
  - [x] Sort by `createdAt` descending
  - [x] [CR] Expired attestations sorted to bottom of their recency position

#### 5.2.3 Step: New Component — `AttestForm.svelte`

- [x] 5.2.3.1 — Create `src/partials/AttestForm.svelte`
  - [x] Create Svelte component with form handling

- [x] 5.2.3.2 — Accept `targetPubkey` and optional `existingAttestation` props
  - [x] Pre-fill form when existingAttestation provided (update mode)
  - [x] [EH] Validate targetPubkey is non-empty before enabling submit

- [x] 5.2.3.3 — Render form: method select, confidence buttons, scope buttons, context input, optional expiry
  - [x] Method: `<select>` dropdown with METHOD_LABELS entries
  - [x] Confidence: 3-button toggle (high/medium/low)
  - [x] Scope: 3-button toggle (operational/personal/financial)
  - [x] Context: text input with maxlength=280 and placeholder
  - [x] Expiry: checkbox toggle + number input for days (1-365)
  - [x] [EU] Form layout should be compact (fits within WotPopover tooltip)
  - [x] [EU] Active selection state visually distinct (accent color)
  - [x] [CR] Default values: method=in-person, confidence=high, scope=operational

- [x] 5.2.3.4 — Submit via `buildAttestationTemplate()` → `signAndPublish()`
  - [x] Build template from form values
  - [x] Call signAndPublish (which handles sovereign mode automatically)
  - [x] [EH] If signAndPublish throws → show error toast "Attestation failed"
  - [x] [EH] If buildAttestationTemplate throws → show validation error inline
  - [x] [ER] Success: dispatch `attested` event, no explicit toast (parent handles)
  - [x] [ER] Failure: toast with specific error message

- [x] 5.2.3.5 — Dispatch `attested` event on success
  - [x] Use Svelte `createEventDispatcher`
  - [x] Parent component closes form on `attested` event
  - [x] [CR] Event is fire-and-forget (no data payload needed)

- [x] 5.2.3.6 — Disable submit while in-flight (`submitting` state)
  - [x] Set `submitting = true` before signAndPublish, false in `finally`
  - [x] Disable button and show "Attesting..." text
  - [x] [EU] Prevent double-submission on slow networks
  - [x] [EH] If component unmounts during submission → no-op (no state update on destroyed component)

### 5.3 Phase: Integration — Modified Files

#### 5.3.1 Step: Extend WotPopover

- [x] 5.3.1.1 — Modify `src/app/shared/WotPopover.svelte`
  - [x] Locate existing WotPopover component structure
  - [x] [CR] Minimal changes — extend, don't rewrite

- [x] 5.3.1.2 — Import AttestationBadge, AttestationPanel, AttestForm
  - [x] Add import statements
  - [x] Import attestationsByTarget and getAttestationSummary from attestation module
  - [x] [CR] Verify no circular dependencies

- [x] 5.3.1.3 — Add ✦ badge in trigger slot alongside WoT score ring
  - [x] Position AttestationBadge adjacent to existing WotScore SVG ring
  - [x] [EU] Badge should not obscure or overlap the WoT score ring
  - [x] [CR] Badge only renders when attestation exists (zero DOM footprint otherwise)

- [x] 5.3.1.4 — Add attestation section in tooltip: panel + form toggle
  - [x] Add new `<div>` section below existing WoT score content
  - [x] Separate with border-top
  - [x] Include AttestationPanel
  - [x] [EU] Section heading: "Attestations" in muted text

- [x] 5.3.1.5 — Show "Attest this person" / "Update attestation" button (not for own pubkey)
  - [x] Conditional: `{#if pubkey !== $session?.pubkey}`
  - [x] Dynamic text: "Update attestation" when already attested
  - [x] Toggle `showAttestForm` on click
  - [x] [EH] Handle $session being null (not logged in) → hide button
  - [x] [EU] Button styled as text link (not primary button — it's secondary action)

- [x] 5.3.1.6 — Wire form submission → close form on success
  - [x] Listen for `attested` event from AttestForm
  - [x] Set `showAttestForm = false` on event
  - [x] [EU] Attestation panel updates reactively (new attestation appears without refresh)

#### 5.3.2 Step: Extend Map Markers

##### 5.3.2.1 Task: Modify `marker-derivation.ts`

- [x] 5.3.2.1.1 — Add `attested: boolean` field to `ChannelMarker` interface
  - [x] Add to existing interface definition
  - [x] [CR] Type is boolean, not the full attestation — keep marker lightweight

- [x] 5.3.2.1.2 — Add optional `attestationMap` parameter to `deriveMarkers()`
  - [x] Parameter: `attestationMap?: Map<string, Attestation[]>`
  - [x] [CR] Optional parameter preserves backward compatibility
  - [x] [CR] Existing callers without the parameter continue to work unchanged

- [x] 5.3.2.1.3 — Set `attested` to true when target has active attestation, false otherwise
  - [x] Check attestationMap for event author pubkey
  - [x] Filter to non-expired attestations
  - [x] `attested = activeAttestations.length > 0`
  - [x] [EH] Handle attestationMap being undefined → all markers `attested: false`

- [x] 5.3.2.1.4 — Default to `false` when `attestationMap` not provided (backward compatible)
  - [x] [CR] Conservative default — unattested is safe (more cautious)

##### 5.3.2.2 Task: Modify `MapView.svelte`

- [x] 5.3.2.2.1 — Pass `attestationsByTarget` map to `deriveMarkers()`
  - [x] Import `attestationsByTarget` store
  - [x] Pass `$attestationsByTarget` as second argument
  - [x] [CR] Reactive — markers re-derive when attestation data changes

- [x] 5.3.2.2.2 — Render attested markers: full opacity (1.0) + solid green border (2px)
  - [x] Set marker icon opacity to 1.0
  - [x] Set border: `2px solid rgba(34,197,94,0.8)` (green)
  - [x] [EU] Green border is the clearest trust signal at a glance

- [x] 5.3.2.2.3 — Render unattested markers: half opacity (0.5) + dashed gray border (2px)
  - [x] Set marker icon opacity to 0.5
  - [x] Set border: `2px dashed rgba(156,163,175,0.6)` (gray)
  - [x] [EU] Reduced opacity is pre-attentive — visible at any zoom level

- [x] 5.3.2.2.4 — Render expired markers: dim opacity (0.6) + dashed amber border
  - [x] Set marker icon opacity to 0.6
  - [x] Set border: `2px dashed rgba(245,158,11,0.7)` (amber)
  - [x] [EU] Amber signals "caution" — was attested but attestation expired
  - [x] [EH] Handle marker with mixed expired + active attestations → treat as attested (active wins)

- [x] 5.3.2.2.5 — Extend marker popup: show attestation status ("✦ Attested" or "Not attested")
  - [x] Add attestation line to popup HTML template
  - [x] Show method and confidence when attested
  - [x] [EU] "Not attested" shown in muted style (not alarming)
  - [x] [EH] Handle popup for marker with no attestation data → show "Not attested"

#### 5.3.3 Step: Extend Relay Subscriptions

- [x] 5.3.3.1 — Modify `src/engine/requests.ts`
  - [x] Locate group event subscription setup
  - [x] [CR] Minimal change — one additional filter clause

- [x] 5.3.3.2 — Add filter `{kinds: [30078], "#p": memberPubkeys}` alongside existing group event requests
  - [x] Append filter to existing relay request set
  - [x] [EH] Handle empty memberPubkeys array → skip filter (don't send empty #p query)
  - [x] [CR] Uses existing relay subscription infrastructure
  - [x] [CR] Filter scoped by #p ensures we only get attestations for known members

- [x] 5.3.3.3 — Scope to known group member pubkeys only
  - [x] Extract pubkeys from group projections
  - [x] [CR] Don't fetch attestations for every pubkey on every relay — too expensive
  - [x] [CR] New members joining → subscription re-evaluates with updated pubkey list
  - [x] [EH] If no group members loaded yet → skip attestation subscription (will fire when members arrive)

#### 5.3.4 Step: Board Integration — Trust Overview Tile

- [x] 5.3.4.1 — Create `src/app/board/tiles/TrustOverviewTile.svelte`
  - [x] Create Svelte component
  - [x] Import attestation stores and group data

- [x] 5.3.4.2 — Compute attestation coverage: attested count vs unattested count across all groups
  - [x] Iterate all unique members across all groups
  - [x] Count attested vs unattested
  - [x] Display as "N attested / M total"
  - [x] [EH] Handle no members → show "No members to evaluate"
  - [x] [EU] Show as percentage bar or fraction for quick visual assessment

- [x] 5.3.4.3 — Show 5 most recent attestations
  - [x] Aggregate all active attestations, sort by createdAt descending, take 5
  - [x] Display: method, target (truncated pubkey or name), relative time
  - [x] [EH] Handle no attestations → show "No attestations recorded"
  - [x] [EU] Compact format (one line per attestation)

- [x] 5.3.4.4 — Add `"trust-overview"` entry to `TILE_REGISTRY` in `board-state.ts`
  - [x] `{name: "Trust Overview", icon: "✦", description: "..."}`
  - [x] [CR] Extends existing registry — no changes to Board infrastructure

- [x] 5.3.4.5 — Add `"trust-overview"` to `TileType` union
  - [x] Extend the union type in board-state.ts
  - [x] [CR] BoardView dynamic dispatch handles new type via tile component lookup

### 5.4 Phase: Testing — Trust Attestation

#### 5.4.1 Step: Unit Tests

- [x] 5.4.1.1 — Create `tests/unit/engine/trust/attestation.spec.ts`
  - [x] Set up test fixtures: mock kind-30078 events with various d-tag patterns
  - [x] [CR] Tests for pure functions only — no store mocking needed for parser/builder

- [x] 5.4.1.2 — Unit test: `isAttestationEvent()` true for attestation d-tag prefix
  - [x] Mock event with kind=30078 and d-tag "attestation:abc123"
  - [x] Assert returns true

- [x] 5.4.1.3 — Unit test: `isAttestationEvent()` false for delegation d-tag prefix
  - [x] Mock event with kind=30078 and d-tag "delegation:abc123"
  - [x] Assert returns false

- [x] 5.4.1.4 — Unit test: `isAttestationEvent()` false for non-30078 kinds
  - [x] Mock event with kind=1 and attestation d-tag
  - [x] Assert returns false

- [x] 5.4.1.5 — Unit test: `parseAttestation()` parses valid attestation
  - [x] Build complete attestation event with all tags
  - [x] Assert all Attestation fields correctly populated
  - [x] Assert expired=false for future valid-until

- [x] 5.4.1.6 — Unit test: `parseAttestation()` returns null for delegation events
  - [x] Pass delegation event to parser
  - [x] Assert null returned

- [x] 5.4.1.7 — Unit test: `parseAttestation()` returns null for mismatched d-tag and p-tag
  - [x] d-tag target ≠ p-tag pubkey
  - [x] Assert null returned
  - [x] [CR] Catches malformed or suspicious events

- [x] 5.4.1.8 — Unit test: `parseAttestation()` marks expired attestations
  - [x] Set valid-until to past timestamp
  - [x] Assert expired=true

- [x] 5.4.1.9 — Unit test: `parseAttestation()` handles missing optional tags
  - [x] Omit valid-until and context tags
  - [x] Assert attestation parsed with defaults (expired=false, context="")

- [x] 5.4.1.10 — Unit test: `parseAttestation()` defaults confidence to "low" when missing
  - [x] Omit confidence tag
  - [x] Assert confidence === "low"

- [x] 5.4.1.11 — Unit test: `parseAttestation()` defaults method to "self-declared" when missing
  - [x] Omit method tag
  - [x] Assert method === "self-declared"

- [x] 5.4.1.12 — Unit test: `getAttestationSummary()` isAttested=true with active attestations
  - [x] Map with pubkey → [active attestation]
  - [x] Assert summary.isAttested === true

- [x] 5.4.1.13 — Unit test: `getAttestationSummary()` isAttested=false with only expired
  - [x] Map with pubkey → [expired attestation only]
  - [x] Assert summary.isAttested === false

- [x] 5.4.1.14 — Unit test: `getAttestationSummary()` computes highestConfidence
  - [x] Map with pubkey → [low, high, medium]
  - [x] Assert highestConfidence === "high"

- [x] 5.4.1.15 — Unit test: `getAttestationSummary()` collects unique methods
  - [x] Map with pubkey → [in-person, in-person, video-call]
  - [x] Assert methods === ["in-person", "video-call"] (deduplicated)

- [x] 5.4.1.16 — Unit test: `getAttestationSummary()` returns empty summary for unknown pubkey
  - [x] Query for pubkey not in map
  - [x] Assert {isAttested: false, count: 0, ...}

- [x] 5.4.1.17 — Unit test: `buildAttestationTemplate()` builds correct kind 30078 event
  - [x] Call builder with all params
  - [x] Assert kind === 30078
  - [x] Assert d-tag starts with "attestation:"
  - [x] Assert all expected tags present

- [x] 5.4.1.18 — Unit test: `buildAttestationTemplate()` includes p-tag matching target
  - [x] Assert p-tag value === target pubkey

- [x] 5.4.1.19 — Unit test: `buildAttestationTemplate()` omits valid-until when not provided
  - [x] Call builder without validUntil
  - [x] Assert no valid-until tag in event

- [x] 5.4.1.20 — Unit test: `buildAttestationTemplate()` truncates context to 280 chars
  - [x] Pass 500-char context string
  - [x] Assert context tag value is ≤ 280 chars

#### 5.4.2 Step: E2E Tests

- [x] 5.4.2.1 — Create `cypress/e2e/beta/trust-attestation.cy.ts`
  - [x] Set up E2E fixtures with groups and members
  - [x] Seed some attestation events for known members
  - [x] [CR] Test isolation: clean attestation state between tests

- [x] 5.4.2.2 — E2E test: WotPopover shows attestation section
  - [x] Hover over a member to show WotPopover
  - [x] Assert "Attestations" heading or section visible
  - [x] Assert "Attest this person" button visible

- [x] 5.4.2.3 — E2E test: creating an attestation via AttestForm
  - [x] Open WotPopover for a member
  - [x] Click "Attest this person"
  - [x] Fill form: method=in-person, confidence=high, scope=operational
  - [x] Submit
  - [x] Assert ✦ badge appears on the member
  - [x] [EH] Verify form error handling: submit with sovereign mode → queued, not failed

- [x] 5.4.2.4 — E2E test: map markers differentiate attested vs unattested (opacity)
  - [x] Navigate to MAP mode
  - [x] Assert attested markers have full opacity
  - [x] Assert unattested markers have reduced opacity
  - [x] [CR] Verify both attested and unattested markers are visible (opacity > 0)

- [x] 5.4.2.5 — E2E test: attestation badge appears on attested members in lists
  - [x] Navigate to OPS mode (Board)
  - [x] Assert ✦ badge next to attested members
  - [x] Assert no badge next to unattested members

- [x] 5.4.2.6 — E2E test: "Attest this person" button not shown for own pubkey
  - [x] Open WotPopover for self
  - [x] Assert "Attest this person" button NOT visible
  - [x] [CR] Self-attestation is meaningless — UI prevents it

### 5.5 Phase: Phase 4 Validation

- [x] 5.5.1 — Validate all 19 acceptance criteria for Trust Attestation
  - [x] Map each criterion to at least one automated test
  - [x] [CR] All criteria covered by unit or E2E tests

- [x] 5.5.2 — Verify WoT score system unchanged (additive, not replacement)
  - [x] `getUserWotScore()` returns same values as before
  - [x] WotScore.svelte SVG ring renders identically
  - [x] [CR] Attestation is alongside WoT, not instead of WoT

- [x] 5.5.3 — Verify delegation system unchanged
  - [x] `parseDelegationCertificate()` still works
  - [x] `chain.ts` TrustLevel computation unchanged
  - [x] [CR] Attestation events don't collide with delegation d-tag namespace

- [x] 5.5.4 — Verify kind 30078 app data usage unchanged
  - [x] `setAppData()` still works for non-attestation d-tags
  - [x] [CR] d-tag "attestation:" prefix uniquely identifies attestation events

- [x] 5.5.5 — Run full beta test suite and confirm no regressions
  - [x] All prior phase specs pass
  - [x] All original 243+ specs pass
  - [x] New trust-attestation spec passes
  - [x] [ER] Any regression → isolate to Phase 4 changes

- [x] 5.5.6 — Verify map marker trust overlay across tile sets (street/satellite/terrain)
  - [x] Test opacity rendering on street tiles
  - [x] Test opacity rendering on satellite tiles
  - [x] Test opacity rendering on terrain tiles
  - [x] [EU] Green border visible on all backgrounds
  - [x] [EU] Gray dashed border visible on all backgrounds

- [x] 5.5.7 — Git commit Phase 4 work
  - [x] Stage all Phase 4 files (4+ new, 4 modified)
  - [x] Commit with descriptive message

- [x] 5.5.8 — Update playbook.md status dashboard for Phase 4 completion
  - [x] Set Trust Attestation row to COMPLETE
  - [x] Record any design decisions made during implementation

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
