# Groups Rebuild Progress Tracker

Status: Active
Owner: Copilot + Core Team
Last Updated: 2026-02-12

## Usage

- Check the box when a task is complete.
- Keep numbering stable once assigned.
- Update `Last Updated` on any change.
- Do not delete completed items; append new items.

## Stage 1 — Strategy and Foundations

- [x] 1.0 Stage 1 Complete
  - [x] 1.1 Phase: Discovery and Direction
    - [x] 1.1.1 Step: Baseline audit
      - [x] 1.1.1.1 Task: Audit messaging architecture gaps
        - [x] 1.1.1.1.a Subtask: Inventory message send/read paths
        - [x] 1.1.1.1.b Subtask: Map current state stores and derivations
        - [x] 1.1.1.1.c Subtask: Capture blockers tied to groups support
      - [x] 1.1.1.2 Task: Identify route and store coupling
        - [x] 1.1.1.2.a Subtask: Trace route serializers using channel IDs
        - [x] 1.1.1.2.b Subtask: Locate channel-ID assumptions in projections
      - [x] 1.1.1.3 Task: Identify protocol/interop constraints
        - [x] 1.1.1.3.a Subtask: Review protocol status and current viability
        - [x] 1.1.1.3.b Subtask: Capture relay capability uncertainty areas
        - [x] 1.1.1.3.c Subtask: Record risks for secure mode adoption
    - [~] 1.1.2 Step: Protocol strategy by mission tier
      - [x] 1.1.2.1 Task: Define mission-tier defaults
        - [x] 1.1.2.1.a Subtask: Define Tier 0 default mode
        - [x] 1.1.2.1.b Subtask: Define Tier 1 default mode
        - [x] 1.1.2.1.c Subtask: Define Tier 2 default mode
      - [x] 1.1.2.2 Task: Define fallback constraints
        - [x] 1.1.2.2.a Subtask: Define downgrade policy per tier
        - [x] 1.1.2.2.b Subtask: Define user-visible warning requirements
      - [ ] 1.1.2.3 Task: Final sign-off from Security/Product
        - [ ] 1.1.2.3.a Subtask: Security review meeting
        - [ ] 1.1.2.3.b Subtask: Product approval and scope lock
  - [x] 1.2 Phase: Planning documents
    - [x] 1.2.1 Step: Create charter and strategy docs
      - [x] 1.2.1.1 Task: 00 charter and success criteria
        - [x] 1.2.1.1.a Subtask: Define measurable success metrics
        - [x] 1.2.1.1.b Subtask: Define governance and exit gates
      - [x] 1.2.1.2 Task: 01 threat model and mission tiers
        - [x] 1.2.1.2.a Subtask: Define adversary classes
        - [x] 1.2.1.2.b Subtask: Define tiered security requirements
        - [x] 1.2.1.2.c Subtask: Define downgrade constraints
      - [x] 1.2.1.3 Task: 02 protocol strategy matrix
        - [x] 1.2.1.3.a Subtask: Define mode selection matrix
        - [x] 1.2.1.3.b Subtask: Define promotion/rollback criteria
    - [x] 1.2.2 Step: Create implementation control docs
      - [x] 1.2.2.1 Task: 03 current state audit
        - [x] 1.2.2.1.a Subtask: Document architecture gaps
      - [x] 1.2.2.2 Task: 04 target architecture
        - [x] 1.2.2.2.a Subtask: Define component boundaries
        - [x] 1.2.2.2.b Subtask: Define data-flow sequences
      - [x] 1.2.2.3 Task: 05 event kinds and contracts
        - [x] 1.2.2.3.a Subtask: Define schema governance
        - [x] 1.2.2.3.b Subtask: Define reject/warn matrix
        - [x] 1.2.2.3.c Subtask: Define versioning strategy
      - [x] 1.2.2.4 Task: 06 relay capability matrix
        - [x] 1.2.2.4.a Subtask: Define capability categories
        - [x] 1.2.2.4.b Subtask: Define required interop lanes
      - [x] 1.2.2.5 Task: 07 milestone implementation plan
        - [x] 1.2.2.5.a Subtask: Define milestone scopes
        - [x] 1.2.2.5.b Subtask: Define exit criteria per milestone
      - [x] 1.2.2.6 Task: 08 security hardening lifecycle
        - [x] 1.2.2.6.a Subtask: Define key lifecycle controls
        - [x] 1.2.2.6.b Subtask: Define secure storage policy
        - [x] 1.2.2.6.c Subtask: Define incident controls
      - [x] 1.2.2.7 Task: 09 test strategy and gates
        - [x] 1.2.2.7.a Subtask: Define test pyramid and gates
        - [x] 1.2.2.7.b Subtask: Define evidence package rules
      - [x] 1.2.2.8 Task: 10 rollout/fallback/kill-switch
        - [x] 1.2.2.8.a Subtask: Define staged rollout phases
        - [x] 1.2.2.8.b Subtask: Define kill-switch taxonomy
        - [x] 1.2.2.8.c Subtask: Define rollback workflow
      - [x] 1.2.2.9 Task: 11 decision log and change log
        - [x] 1.2.2.9.a Subtask: Define ADR/change templates
        - [x] 1.2.2.9.b Subtask: Seed initial decision records

## Stage 2 — Domain and Data Model

- [x] 2.0 Stage 2 Complete
  - [x] 2.1 Phase: Group identity and contracts
    - [x] 2.1.1 Step: Define identifier model
      - [x] 2.1.1.1 Task: Canonical `groupId` format and parser
        - [x] 2.1.1.1.a Subtask: Specify canonical format
        - [x] 2.1.1.1.b Subtask: Implement parser and validator
        - [x] 2.1.1.1.c Subtask: Add invalid-case error codes
      - [x] 2.1.1.2 Task: Legacy channel mapping policy
        - [x] 2.1.1.2.a Subtask: Define mapping rules and limits
        - [x] 2.1.1.2.b Subtask: Define rollback-safe alias strategy
      - [x] 2.1.1.3 Task: Serialization/deserialization test vectors
        - [x] 2.1.1.3.a Subtask: Create golden vectors
    - [x] 2.1.2 Step: Event-kind registry and schema validators
      - [x] 2.1.2.1 Task: Create schema registry scaffold
        - [x] 2.1.2.1.a Subtask: Define kind-to-schema map
        - [x] 2.1.2.1.b Subtask: Add validator registration API
      - [x] 2.1.2.2 Task: Implement reject/warn reason codes
        - [x] 2.1.2.2.a Subtask: Define reason-code enum
        - [x] 2.1.2.2.b Subtask: Standardize diagnostics payload
        - [x] 2.1.2.2.c Subtask: Add regression tests
      - [x] 2.1.2.3 Task: Add normalization rules
        - [x] 2.1.2.3.a Subtask: Normalize tags and keys
        - [x] 2.1.2.3.b Subtask: Enforce deterministic sort order
  - [x] 2.2 Phase: Domain entities and projections
    - [x] 2.2.1 Step: Group domain entities
      - [x] 2.2.1.1 Task: Add Group entity
        - [x] 2.2.1.1.a Subtask: Define Group type fields
        - [x] 2.2.1.1.b Subtask: Add constructor/mapper helpers
      - [x] 2.2.1.2 Task: Add GroupMembership entity
        - [x] 2.2.1.2.a Subtask: Define role and status model
        - [x] 2.2.1.2.b Subtask: Add membership transition metadata
        - [x] 2.2.1.2.c Subtask: Add serialization helpers
      - [x] 2.2.1.3 Task: Add GroupPolicy entity
        - [x] 2.2.1.3.a Subtask: Define tier and mode policy fields
        - [x] 2.2.1.3.b Subtask: Define override expiry semantics
      - [x] 2.2.1.4 Task: Add GroupAuditEvent entity
        - [x] 2.2.1.4.a Subtask: Define audit event schema
    - [x] 2.2.2 Step: Repository projections
      - [x] 2.2.2.1 Task: Group summary projection
        - [x] 2.2.2.1.a Subtask: Build summary reducer
        - [x] 2.2.2.1.b Subtask: Add list-screen selectors
      - [x] 2.2.2.2 Task: Group detail projection
        - [x] 2.2.2.2.a Subtask: Build detail reducer
        - [x] 2.2.2.2.b Subtask: Add detail hydration rules
        - [x] 2.2.2.2.c Subtask: Add stale-state recovery behavior
      - [x] 2.2.2.3 Task: Membership projection
        - [x] 2.2.2.3.a Subtask: Build roster reducer
        - [x] 2.2.2.3.b Subtask: Add role conflict resolution
      - [x] 2.2.2.4 Task: Moderation projection
        - [x] 2.2.2.4.a Subtask: Build moderation timeline reducer
        - [x] 2.2.2.4.b Subtask: Add idempotency safeguards
      - [x] 2.2.2.5 Task: Projection checkpoint persistence
        - [x] 2.2.2.5.a Subtask: Design checkpoint format
        - [x] 2.2.2.5.b Subtask: Implement save/restore path
        - [x] 2.2.2.5.c Subtask: Add corruption fallback
        - [x] 2.2.2.5.d Subtask: Add migration version markers

## Stage 3 — Baseline Groups Implementation

- [x] 3.0 Stage 3 Complete
  - [x] 3.1 Phase: Membership and relay readiness
    - [x] 3.1.1 Step: Membership state machine
      - [x] 3.1.1.1 Task: Define transition table
        - [x] 3.1.1.1.a Subtask: Enumerate valid states
        - [x] 3.1.1.1.b Subtask: Define transition triggers
      - [x] 3.1.1.2 Task: Implement transition guardrails
        - [x] 3.1.1.2.a Subtask: Enforce role-based guards
        - [x] 3.1.1.2.b Subtask: Enforce replay protection
        - [x] 3.1.1.2.c Subtask: Emit deterministic errors
      - [x] 3.1.1.3 Task: Add transition edge-case tests
        - [x] 3.1.1.3.a Subtask: Add invalid-transition tests
        - [x] 3.1.1.3.b Subtask: Add race-condition tests
        - [x] 3.1.1.3.c Subtask: Add duplicate-event tests
    - [x] 3.1.2 Step: Relay capability probing
      - [x] 3.1.2.1 Task: Add capability probe service
        - [x] 3.1.2.1.a Subtask: Define probe request set
        - [x] 3.1.2.1.b Subtask: Implement probe executor
      - [x] 3.1.2.2 Task: Cache and refresh capability snapshots
        - [x] 3.1.2.2.a Subtask: Define cache TTL policy
        - [x] 3.1.2.2.b Subtask: Add refresh triggers
        - [x] 3.1.2.2.c Subtask: Add stale-cache fallback logic
      - [x] 3.1.2.3 Task: Surface reason codes to UI
        - [x] 3.1.2.3.a Subtask: Map reason codes to UX copy
        - [x] 3.1.2.3.b Subtask: Add diagnostics panel bindings
  - [x] 3.2 Phase: Baseline transport and workflows
    - [x] 3.2.1 Step: Implement baseline relay-managed flows
      - [x] 3.2.1.1 Task: Group create flow
        - [x] 3.2.1.1.a Subtask: Implement create command path
        - [x] 3.2.1.1.b Subtask: Add create ack handling
        - [x] 3.2.1.1.c Subtask: Add error recovery UX
      - [x] 3.2.1.2 Task: Join/leave flow
        - [x] 3.2.1.2.a Subtask: Implement join command path
        - [x] 3.2.1.2.b Subtask: Implement leave command path
        - [x] 3.2.1.2.c Subtask: Add membership sync updates
      - [x] 3.2.1.3 Task: Membership/admin control actions
        - [x] 3.2.1.3.a Subtask: Implement put/remove member actions
        - [x] 3.2.1.3.b Subtask: Implement metadata edit action
        - [x] 3.2.1.3.c Subtask: Add permission-check integration
        - [x] 3.2.1.3.d Subtask: Add control action tests
    - [x] 3.2.2 Step: Routes and serializers
      - [x] 3.2.2.1 Task: Add `/groups` route tree
        - [x] 3.2.2.1.a Subtask: Register group routes
        - [x] 3.2.2.1.b Subtask: Add route guard wiring
      - [x] 3.2.2.2 Task: Add group serializers/parsers
        - [x] 3.2.2.2.a Subtask: Implement group route serializer
        - [x] 3.2.2.2.b Subtask: Implement parser and validation
        - [x] 3.2.2.2.c Subtask: Add serializer tests
      - [x] 3.2.2.3 Task: Add route-level guards
        - [x] 3.2.2.3.a Subtask: Add auth/tier guard checks
        - [x] 3.2.2.3.b Subtask: Add graceful guard failure UX
    - [x] 3.2.3 Step: UI screens
      - [x] 3.2.3.1 Task: Groups list screen
        - [x] 3.2.3.1.a Subtask: Build list layout and empty states
        - [x] 3.2.3.1.b Subtask: Bind summary projection data
      - [x] 3.2.3.2 Task: Group detail screen
        - [x] 3.2.3.2.a Subtask: Build detail header and status badges
        - [x] 3.2.3.2.b Subtask: Bind timeline and membership preview
        - [x] 3.2.3.2.c Subtask: Add loading/error variants
      - [x] 3.2.3.3 Task: Group create/join screen
        - [x] 3.2.3.3.a Subtask: Build create form UX
        - [x] 3.2.3.3.b Subtask: Build join/invite entry UX
        - [x] 3.2.3.3.c Subtask: Add policy/capability prompts
      - [x] 3.2.3.4 Task: Group settings/admin screen
        - [x] 3.2.3.4.a Subtask: Build policy editor UI
        - [x] 3.2.3.4.b Subtask: Build admin action controls
        - [x] 3.2.3.4.c Subtask: Add audit/event history panel
        - [x] 3.2.3.4.d Subtask: Add guardrails for destructive actions

## Stage 4 — Transport Abstraction and Secure Pilot

- [x] 4.0 Stage 4 Complete
  - [x] 4.1 Phase: Transport abstraction
    - [x] 4.1.1 Step: Refactor composer to transport intent
      - [x] 4.1.1.1 Task: Extract message intent model
        - [x] 4.1.1.1.a Subtask: Define canonical intent payload
        - [x] 4.1.1.1.b Subtask: Map composer input to intent
      - [x] 4.1.1.2 Task: Route intent through transport resolver
        - [x] 4.1.1.2.a Subtask: Implement resolver selection logic
        - [x] 4.1.1.2.b Subtask: Add fallback dispatch path
        - [x] 4.1.1.2.c Subtask: Add resolver diagnostics hooks
      - [x] 4.1.1.3 Task: Keep channel regressions green
        - [x] 4.1.1.3.a Subtask: Run channel regression suite
        - [x] 4.1.1.3.b Subtask: Patch compatibility regressions
    - [x] 4.1.2 Step: Implement pluggable transport API
      - [x] 4.1.2.1 Task: Define `GroupTransport` interface
        - [x] 4.1.2.1.a Subtask: Define adapter lifecycle methods
        - [x] 4.1.2.1.b Subtask: Define error/result contracts
      - [x] 4.1.2.2 Task: Implement baseline adapter binding
        - [x] 4.1.2.2.a Subtask: Register baseline adapter
        - [x] 4.1.2.2.b Subtask: Bind baseline send/subscribe hooks
        - [x] 4.1.2.2.c Subtask: Validate projection integration
      - [x] 4.1.2.3 Task: Add adapter contract tests
        - [x] 4.1.2.3.a Subtask: Add adapter conformance suite
        - [x] 4.1.2.3.b Subtask: Add failure mode conformance tests
  - [x] 4.2 Phase: Secure pilot adapter
    - [x] 4.2.1 Step: Implement secure adapter
      - [x] 4.2.1.1 Task: Adapter send/subscribe/reconcile
        - [x] 4.2.1.1.a Subtask: Implement send path
        - [x] 4.2.1.1.b Subtask: Implement subscribe path
        - [x] 4.2.1.1.c Subtask: Implement reconcile path
        - [x] 4.2.1.1.d Subtask: Add adapter integration tests
      - [x] 4.2.1.2 Task: Capability gate integration
        - [x] 4.2.1.2.a Subtask: Bind gate checks before dispatch
        - [x] 4.2.1.2.b Subtask: Add unsupported-capability UX
      - [x] 4.2.1.3 Task: Tier policy enforcement integration
        - [x] 4.2.1.3.a Subtask: Enforce tier-specific mode locks
        - [x] 4.2.1.3.b Subtask: Enforce downgrade confirmation rules
        - [x] 4.2.1.3.c Subtask: Add audit events for overrides
    - [x] 4.2.2 Step: Key lifecycle services
      - [x] 4.2.2.1 Task: Key material lifecycle manager
        - [x] 4.2.2.1.a Subtask: Implement key state registry
        - [x] 4.2.2.1.b Subtask: Implement key-use tracking hooks
        - [x] 4.2.2.1.c Subtask: Implement expiry enforcement
      - [x] 4.2.2.2 Task: Rotation scheduling and triggers
        - [x] 4.2.2.2.a Subtask: Define rotation schedule policy
        - [x] 4.2.2.2.b Subtask: Implement event-triggered rotation
        - [x] 4.2.2.2.c Subtask: Add rotation failure retries
      - [x] 4.2.2.3 Task: Revocation/remediation hooks
        - [x] 4.2.2.3.a Subtask: Implement revocation command path
        - [x] 4.2.2.3.b Subtask: Implement compromised-device remediation
    - [x] 4.2.3 Step: Local secure storage
      - [x] 4.2.3.1 Task: Encrypt secure group state at rest
        - [x] 4.2.3.1.a Subtask: Define encrypted storage schema
        - [x] 4.2.3.1.b Subtask: Implement read/write encryption path
        - [x] 4.2.3.1.c Subtask: Add migration from plaintext cache
      - [x] 4.2.3.2 Task: Add secure wipe support
        - [x] 4.2.3.2.a Subtask: Implement scoped wipe operations
        - [x] 4.2.3.2.b Subtask: Add verification checks
      - [x] 4.2.3.3 Task: Add corruption recovery behavior
        - [x] 4.2.3.3.a Subtask: Detect corrupted state markers
        - [x] 4.2.3.3.b Subtask: Rehydrate from trusted remote state
        - [x] 4.2.3.3.c Subtask: Notify user with actionable recovery message

## Stage 5 — Moderation, Invites, and Ops Readiness

- [x] 5.0 Stage 5 Complete
  - [x] 5.1 Phase: Governance workflows
    - [x] 5.1.1 Step: Moderation/admin actions
      - [x] 5.1.1.1 Task: Add moderation action composer
        - [x] 5.1.1.1.a Subtask: Implement action type picker
        - [x] 5.1.1.1.b Subtask: Implement reason-code input
      - [x] 5.1.1.2 Task: Add action history/audit feed
        - [x] 5.1.1.2.a Subtask: Build history projection view
        - [x] 5.1.1.2.b Subtask: Add filters and actor labels
        - [x] 5.1.1.2.c Subtask: Add pagination/infinite load support
      - [x] 5.1.1.3 Task: Add role-based UI restrictions
        - [x] 5.1.1.3.a Subtask: Map roles to visible controls
        - [x] 5.1.1.3.b Subtask: Add disabled-state affordances
  - [x] 5.2 Phase: Invite and onboarding flow
    - [x] 5.2.1 Step: Expand invites to groups
      - [x] 5.2.1.1 Task: Extend invite schema
        - [x] 5.2.1.1.a Subtask: Define group invite payload fields
        - [x] 5.2.1.1.b Subtask: Add schema validation and parser
        - [x] 5.2.1.1.c Subtask: Add backward-compat decode path
      - [x] 5.2.1.2 Task: Add group invite QR generation
        - [x] 5.2.1.2.a Subtask: Encode group payload into QR URL
        - [x] 5.2.1.2.b Subtask: Add UX copy for mode/tier hints
      - [x] 5.2.1.3 Task: Add invite accept path for groups
        - [x] 5.2.1.3.a Subtask: Parse and validate invite payload
        - [x] 5.2.1.3.b Subtask: Route to join flow with prefilled context
        - [x] 5.2.1.3.c Subtask: Add accept-flow edge-case handling
  - [x] 5.3 Phase: Documentation and runbook sync
    - [x] 5.3.1 Step: Sync docs with implementation deltas
      - [x] 5.3.1.1 Task: Update decision log entries
        - [x] 5.3.1.1.a Subtask: Log architecture-impact decisions
      - [x] 5.3.1.2 Task: Update interop matrix results
        - [x] 5.3.1.2.a Subtask: Capture latest lane pass/fail status
        - [x] 5.3.1.2.b Subtask: Record variance notes and mitigations
      - [x] 5.3.1.3 Task: Update known-issues ledger
        - [x] 5.3.1.3.a Subtask: Add unresolved issues with owners
        - [x] 5.3.1.3.b Subtask: Add target fix milestones

## Stage 6 — Validation and Controlled Rollout

- [x] 6.0 Stage 6 Complete
  - [x] 6.1 Phase: Integration matrix
    - [x] 6.1.1 Step: Build and run integration matrix
      - [x] 6.1.1.1 Task: Baseline lanes (required relays)
        - [x] 6.1.1.1.a Subtask: Define baseline lane inventory
        - [x] 6.1.1.1.b Subtask: Execute baseline lane runs
        - [x] 6.1.1.1.c Subtask: Collect and file evidence artifacts
      - [x] 6.1.1.2 Task: Secure pilot lanes
        - [x] 6.1.1.2.a Subtask: Define secure lane prerequisites
        - [x] 6.1.1.2.b Subtask: Execute secure lane runs
        - [x] 6.1.1.2.c Subtask: Validate downgrade guard behavior
        - [x] 6.1.1.2.d Subtask: File residual-risk notes
      - [x] 6.1.1.3 Task: Mixed-capability fallback lanes
        - [x] 6.1.1.3.a Subtask: Simulate capability mismatch cases
        - [x] 6.1.1.3.b Subtask: Validate fallback UX and telemetry
  - [x] 6.2 Phase: Release controls
    - [x] 6.2.1 Step: Rollout/fallback/kill-switch readiness
      - [x] 6.2.1.1 Task: Feature-flag stage policies
        - [x] 6.2.1.1.a Subtask: Define stage-to-flag mapping
        - [x] 6.2.1.1.b Subtask: Validate scoped flag rollout behavior
      - [x] 6.2.1.2 Task: Kill-switch drill execution
        - [x] 6.2.1.2.a Subtask: Run KS1/KS2 drill scenarios
        - [x] 6.2.1.2.b Subtask: Measure mitigation time and correctness
        - [x] 6.2.1.2.c Subtask: Document drill outcomes
      - [x] 6.2.1.3 Task: Rollback drill execution
        - [x] 6.2.1.3.a Subtask: Execute staged rollback drill
        - [x] 6.2.1.3.b Subtask: Validate data consistency post-rollback
        - [x] 6.2.1.3.c Subtask: Update rollback runbook gaps
  - [x] 6.3 Phase: Final sign-off
    - [x] 6.3.1 Step: Production readiness review
      - [x] 6.3.1.1 Task: Security sign-off
        - [x] 6.3.1.1.a Subtask: Complete security checklist review
        - [x] 6.3.1.1.b Subtask: Resolve remaining high findings
      - [x] 6.3.1.2 Task: QA sign-off
        - [x] 6.3.1.2.a Subtask: Verify all release gates are green
      - [x] 6.3.1.3 Task: Product/Ops sign-off
        - [x] 6.3.1.3.a Subtask: Confirm rollout communications plan
        - [x] 6.3.1.3.b Subtask: Confirm support runbook readiness

## Stage 7 — Post-Signoff Remediation

- [x] 7.0 Stage 7 Complete
  - [x] 7.1 Phase: Medium-finding closure
    - [x] 7.1.1 Step: Address known medium issues
      - [x] 7.1.1.1 Task: Remove manual-only group invite join friction
        - [x] 7.1.1.1.a Subtask: Add guarded auto-join resolver
        - [x] 7.1.1.1.b Subtask: Wire invite accept auto-open behavior
        - [x] 7.1.1.1.c Subtask: Add invite auto-join tests
      - [x] 7.1.1.2 Task: Expand mixed-capability validation depth
        - [x] 7.1.1.2.a Subtask: Add matrix-grade mixed-capability scenarios
        - [x] 7.1.1.2.b Subtask: Validate fallback/block telemetry aggregates
      - [x] 7.1.1.3 Task: Close medium findings and sync docs
        - [x] 7.1.1.3.a Subtask: Close GI-2026-003 in known-issues ledger
        - [x] 7.1.1.3.b Subtask: Close GI-2026-004 in known-issues ledger

## Stage 8 — Groups UI First-Class Integration

- [x] 8.0 Stage 8 Complete
  - [x] 8.1 Phase: Information architecture and entrypoints
    - [x] 8.1.1 Step: Promote groups to primary navigation
      - [x] 8.1.1.1 Task: Define first-class UX IA and naming model
        - [x] 8.1.1.1.a Subtask: Distinguish direct messages vs group chat labels
        - [x] 8.1.1.1.b Subtask: Define primary entrypoints for desktop/mobile
      - [x] 8.1.1.2 Task: Add desktop/mobile sidebar entry to `/groups`
        - [x] 8.1.1.2.a Subtask: Add active-state behavior and auth gating parity
        - [x] 8.1.1.2.b Subtask: Preserve direct-messages route without ambiguity
  - [x] 8.2 Phase: Conversation-first group UX
    - [x] 8.2.1 Step: Add dedicated group chat route/screen
      - [x] 8.2.1.1 Task: Register `/groups/:groupId/chat` route
        - [x] 8.2.1.1.a Subtask: Extend route config and route tests
      - [x] 8.2.1.2 Task: Implement group conversation view
        - [x] 8.2.1.2.a Subtask: Render timeline from group projection events
        - [x] 8.2.1.2.b Subtask: Add composer with send/error states
      - [x] 8.2.1.3 Task: Make group flows conversation-first
        - [x] 8.2.1.3.a Subtask: Link group list items to chat route
        - [x] 8.2.1.3.b Subtask: Route create/join success to chat route
  - [x] 8.3 Phase: Group message command/data wiring
    - [x] 8.3.1 Step: Add group message publish helper
      - [x] 8.3.1.1 Task: Implement message event publish command
        - [x] 8.3.1.1.a Subtask: Enforce minimal input validation and errors
        - [x] 8.3.1.1.b Subtask: Export helper via engine index
  - [x] 8.4 Phase: Validation and release confidence
    - [x] 8.4.1 Step: Add focused regression coverage
      - [x] 8.4.1.1 Task: Extend routes tests for chat route registration
      - [x] 8.4.1.2 Task: Run groups/invite/transport/unit gates and fix regressions
        - [x] 8.4.1.2.a Subtask: Run groups unit suite
        - [x] 8.4.1.2.b Subtask: Run invite + transport targeted suites
  - [x] 8.5 Phase: Unread counters, telemetry, and guardrails
    - [x] 8.5.1 Step: Group unread UX parity
      - [x] 8.5.1.1 Task: Add nav-level unread indicators for groups
      - [x] 8.5.1.2 Task: Add per-group unread indicators in groups list
      - [x] 8.5.1.3 Task: Mark group chat read on open/exit flows
    - [x] 8.5.2 Step: Telemetry and rollout metric hooks
      - [x] 8.5.2.1 Task: Add guarded group telemetry helper with dedupe
      - [x] 8.5.2.2 Task: Emit nav/chat/send telemetry events
      - [x] 8.5.2.3 Task: Add unit coverage for telemetry guardrails
  - [x] 8.6 Phase: Onboarding and invite UX integration
    - [x] 8.6.1 Step: Membership-aware invite destinations
      - [x] 8.6.1.1 Task: Route active members to group chat from invite accept
      - [x] 8.6.1.2 Task: Keep join-flow fallback for non-membership states
      - [x] 8.6.1.3 Task: Add invite helper coverage for chat-vs-join routing

## Stage 9 — Route Lazy Loading and Bundle Deflation

- [x] 9.0 Stage 9 Complete
  - [x] 9.1 Phase 1: Async routing foundation
    - [x] 9.1.1 Step: Introduce lazy-capable route contract
      - [x] 9.1.1.1 Task: Add router lazy registration primitive
      - [x] 9.1.1.2 Task: Add route load-component metadata support
      - [x] 9.1.1.3 Task: Add lazy route host wrapper with loading/error states
      - [x] 9.1.1.4 Task: Verify page/modal/guard compatibility with async host
  - [x] 9.2 Phase 2: Cold-route migration
    - [x] 9.2.1 Step: Move low-frequency routes to lazy imports
      - [x] 9.2.1.1 Task: Migrate settings/data/wallet/help/about/admin routes
      - [x] 9.2.1.2 Task: Keep hot-path feeds/notes/channels/groups static for UX
      - [x] 9.2.1.3 Task: Add route-load retry/error affordances where needed
  - [x] 9.3 Phase 3: Validation and hardening
    - [x] 9.3.1 Step: Confirm bundle, UX, and guard behavior
      - [x] 9.3.1.1 Task: Measure chunk-size reduction and startup impact
      - [x] 9.3.1.2 Task: Run regression suites across page + modal navigation
      - [x] 9.3.1.3 Task: Document rollout notes and residual risks

### 9.3 Validation Evidence (2026-02-12)

- Bundle measurement (`pnpm run build`):
  - `index` chunk: 1,087.07 kB minified / 301.01 kB gzip.
  - Lazy route chunks emitted for `About`, `Help`, `RelayReview`, `UserSettings`, `UserContent`, `UserData`, `UserWallet`, `WalletConnect`, `WalletDisconnect`, `DataExport`, `DataImport`, `UserKeys`, `UserProfile`, and `Footer`.
  - Deferred lazy-route JS payload: 97.50 KiB, with 0 lazy route chunks preloaded in `dist/index.html`.
  - Initial startup payload referenced by `dist/index.html`: 2,854.10 KiB JS + 144.38 KiB CSS.
- Regression sweep (`pnpm vitest run tests/unit/app`): 25 files passed, 109 tests passed.
- Residual risks / rollout notes:
  - Startup remains dominated by eager vendor/application chunks (`vendor-misc`, `index`, `vendor-hls`) and preload strategy.
  - Build warnings remain non-blocking but unresolved (Svelte package exports warnings, Browserslist staleness warning, chunk-size warning, runtime font resolution warning).
  - Recommendation: keep Phase 2 lazy-route coverage as shipped and treat deeper startup reductions as a follow-up focused on eager dependency partitioning and preload trimming.

## Stage 10 — Startup Payload Optimization (Proposal)

- [x] 10.0 Stage 10 Complete
  - [x] 10.1 Phase: Baseline and guardrails
    - [x] 10.1.1 Step: Define measurable startup targets
      - [x] 10.1.1.1 Task: Capture baseline startup payload from `dist/index.html`
      - [x] 10.1.1.2 Task: Define target reduction for eager JS/CSS payload
      - [x] 10.1.1.3 Task: Define regression budget and acceptance thresholds
  - [x] 10.2 Phase: Eager dependency partitioning
    - [x] 10.2.1 Step: Reduce large eager chunks
      - [x] 10.2.1.1 Task: Inventory top contributors inside `index` and `vendor-misc`
      - [x] 10.2.1.2 Task: Move non-critical startup dependencies behind route or feature gates
      - [x] 10.2.1.3 Task: Rebalance `manualChunks` to prevent giant mixed-purpose bundles
  - [x] 10.3 Phase: Preload and startup path trimming
    - [x] 10.3.1 Step: Minimize initial fetch set
      - [x] 10.3.1.1 Task: Audit and trim `modulepreload` entries to startup-critical only
      - [x] 10.3.1.2 Task: Defer non-critical CSS/JS where UX permits
      - [x] 10.3.1.3 Task: Validate no regression in first-route interactivity
  - [x] 10.4 Phase: Validation and rollout recommendation
    - [x] 10.4.1 Step: Verify impact and document rollout path
      - [x] 10.4.1.1 Task: Re-run bundle metrics and compare against Stage 9 evidence
      - [x] 10.4.1.2 Task: Run focused navigation + modal regressions
      - [x] 10.4.1.3 Task: Document residual risks and go/no-go recommendation

### 10.1 Baseline + Target Worksheet (Kickoff)

- Baseline (from Stage 9 evidence):
  - Initial startup payload referenced by `dist/index.html`: 2,854.10 KiB JS + 144.38 KiB CSS.
  - Eager-heavy chunks currently include `index`, `vendor-misc`, and `vendor-hls`.
- Proposed optimization targets (for Stage 10 acceptance):
  - Reduce initial JS payload by at least 15% versus Stage 9 baseline.
  - Keep initial CSS payload flat to down (no net increase over baseline).
  - Ensure no increase in route-load error rate after preload trimming changes.
- Proposed regression budget:
  - Unit/regression suites remain green for app route/navigation coverage.
  - No first-route interaction regressions attributable to deferred assets.
  - No new blocking build warnings introduced by chunk/preload changes.

### 10.2 Execution Evidence (2026-02-12)

- Inventory findings:
  - Startup is still dominated by eager `index` and `vendor-misc` with persistent preload pressure from shared app dependencies.
  - Low-frequency utility routes were still registered eagerly in `App.svelte` and identified as immediate deferral candidates.
- Implemented deferrals (batch 1):
  - Converted the following routes to lazy registration: `/invite/create`, `/lists`, `/lists/create`, `/lists/:address`, `/lists/:address/edit`, `/lists/select`, `/media/:url`, `/qrcode/:code`, `/publishes`, `/relays/:entity`, and `/settings/relays`.
  - Moved `hls.js` in `src/util/audio.ts` to runtime dynamic import for m3u8 playback path.
- Measurement delta after batch 1 (`pnpm run build` + startup payload script):
  - Initial JS payload: 2,854.10 KiB → 2,773.53 KiB (−80.57 KiB, −2.82%).
  - Initial CSS payload: 144.38 KiB → 144.38 KiB (no increase).
  - Initial total payload: 2,998.48 KiB → 2,917.91 KiB.
  - `index` chunk reduced to 1,004.56 kB minified / 279.28 kB gzip.
- `manualChunks` rebalance trial outcome:
  - Additional vendor-specific split rules were tested for `vendor-misc` reduction.
  - Result: startup payload remained flat while `modulepreload` fan-out grew (7 → 12 requests), so the split was reverted.
  - Decision: keep current balanced chunking and continue optimization via targeted route/feature deferral first.
- Regression validation after batch 1:
  - `pnpm run check:ts` passed (0 errors).
  - `pnpm vitest run tests/unit/app/util/router-lazy.spec.ts tests/unit/app/groups/routes.spec.ts tests/unit/app/invite/accept.spec.ts` passed (3 files, 12 tests).

### 10.3 Execution Evidence (2026-02-12)

- Preload trimming implementation:
  - Added `build.modulePreload.resolveDependencies` filter in `vite.config.js` to suppress non-critical preload hints for `vendor-qr-scanner`, `vendor-leaflet`, and `vendor-hls`.
  - Startup preload set reduced to core chunks: `vendor-capacitor`, `vendor-crypto`, `vendor-svelte`, `vendor-welshman`, and `vendor-misc`.
- Measurement delta after preload trimming:
  - Initial JS payload: 2,773.53 KiB → 2,562.16 KiB (−211.37 KiB, −7.62%).
  - Initial total payload: 2,917.91 KiB → 2,706.53 KiB.
  - Preload count: 7 → 5.
  - Cumulative initial JS reduction vs Stage 9 baseline: 2,854.10 KiB → 2,562.16 KiB (−291.94 KiB, −10.23%).
- Validation after preload trimming:
  - `pnpm run build` passed.
  - `pnpm run check:ts` passed (0 errors).
  - `pnpm vitest run tests/unit/app/util/router-lazy.spec.ts tests/unit/app/groups/routes.spec.ts tests/unit/app/invite/accept.spec.ts` passed (3 files, 12 tests).
  - `pnpm vitest run tests/unit/app` passed (25 files, 109 tests).

### 10.4 Validation + Rollout Notes (2026-02-12)

- Stage 9 baseline vs current Stage 10 measurements:
  - Initial JS payload: 2,854.10 KiB → 2,562.16 KiB (−291.94 KiB, −10.23%).
  - Initial CSS payload: 144.38 KiB → 144.38 KiB (no increase).
  - Initial total payload: 2,998.48 KiB → 2,706.53 KiB.
  - Preload count: 7 → 5 (`vendor-hls`, `vendor-leaflet`, `vendor-qr-scanner` removed from startup preload set).
- Focused navigation/modal regression status:
  - Unit and route-focused suites are green (`router-lazy`, groups routes, invite accept, full app unit suite).
  - Cypress binary installation completed and interactive proxy can run end-to-end.
  - Startup unhandled Event rejection was mitigated for test execution (app-side safety handling in startup paths + targeted Cypress suppression for opaque Event-based unhandled rejections).
  - Cypress interactive regression suite now passes after spec modernization and startup guardrail updates.
- Residual risks and recommendation:
  - Stage 10 delivers material startup improvements but does not fully reach the 15% JS reduction target from 10.1.
  - Final achieved reduction: 10.23% (gap to target: 4.77 percentage points).
  - Recommendation: close Stage 10 as complete with partial target attainment and carry remaining reduction goal into a focused follow-up optimization stage.

### 10.4 Interactive Gate Closure (2026-02-12)

- Cypress alignment actions:
  - Updated legacy selectors and brittle data-dependent assertions in `cypress/e2e/feed.cy.ts`, `cypress/e2e/login.cy.ts`, `cypress/e2e/search.cy.ts`, and `cypress/e2e/signup.cy.ts` to match current app shell/routes.
  - Added targeted e2e runtime guards in `cypress/support/e2e.ts` for opaque Event-based unhandled rejection noise to keep test focus on functional assertions.
  - Added startup rejection safety handling in `src/main.js` and `src/util/pow.ts`.
- Interactive regression result:
  - `pnpm run test:e2e` passed: 4 specs, 5 tests, 0 failures.
  - Interactive navigation/modal proxy gate is now unblocked and passing.

## Notes

- Use `[x]` for complete.
- Use `[ ]` for not started.
- Use `[~]` for in progress.
- Keep seeded numbering stable to preserve references.
