# Onboarding Implementation Progress Tracker

Legend: [ ] = todo, [x] = done. Numbers are seeded for reference.

1. [x] Stage 1: Planning and Alignment
  1.1 [x] Phase 1.1: Requirements and Scope
    1.1.1 [x] Step 1.1.1: Define scope and principles
      1.1.1.1 [x] Task 1.1.1.1: Capture overview/goals
        1.1.1.1.1 [x] Subtask: List goals and guardrails
        1.1.1.1.2 [x] Subtask: Identify non-goals
      1.1.1.2 [x] Task 1.1.1.2: Document core flow structure
        1.1.1.2.1 [x] Subtask: Outline Start/Key/Profile/Done
        1.1.1.2.2 [x] Subtask: Note post-gate return behavior
    1.1.2 [x] Step 1.1.2: Define user paths and custody model
      1.1.2.1 [x] Task 1.1.2.1: Key custody paths (managed/self/import/external)
        1.1.2.1.1 [x] Subtask: Describe managed default
        1.1.2.1.2 [x] Subtask: Capture advanced options
      1.1.2.2 [x] Task 1.1.2.2: State/criteria for completion and posting rules
        1.1.2.2.1 [x] Subtask: Define gating for posting
        1.1.2.2.2 [x] Subtask: Define backup flags and resume
    1.1.3 [x] Step 1.1.3: Define defaults and experience framing
      1.1.3.1 [x] Task 1.1.3.1: Defaults/curation (relays, starter follows)
        1.1.3.1.1 [x] Subtask: Relay defaults strategy
        1.1.3.1.2 [x] Subtask: Starter follows toggle rules
      1.1.3.2 [x] Task 1.1.3.2: Copy/voice and CTA placement
        1.1.3.2.1 [x] Subtask: Tone and key strings
        1.1.3.2.2 [x] Subtask: CTA surfaces and labels
  1.2 [x] Phase 1.2: Risk, Recovery, and Telemetry
    1.2.1 [x] Step 1.2.1: Edge cases and recovery paths
      1.2.1.1 [x] Task 1.2.1.1: Enumerate edge cases and fallbacks
        1.2.1.1.1 [x] Subtask: Signer/import failure handling
        1.2.1.1.2 [x] Subtask: Offline/resume scenarios
    1.2.2 [x] Step 1.2.2: Observability and checks
      1.2.2.1 [x] Task 1.2.2.1: Telemetry/events, gates, dashboards
        1.2.2.1.1 [x] Subtask: Core funnel events
        1.2.2.1.2 [x] Subtask: Edge/error events and alerts

2. [ ] Stage 2: Design Finalization
  2.1 [ ] Phase 2.1: UX flows and components
    2.1.1 [x] Step 2.1.1: Wireframes for Start/Key/Profile/Done
      2.1.1.1 [x] Task 2.1.1.1: Desktop wireframes
        2.1.1.1.1 [x] Subtask: Start/Key screens desktop layout
        2.1.1.1.2 [x] Subtask: Profile/Done screens desktop layout
      2.1.1.2 [x] Task 2.1.1.2: Mobile wireframes
        2.1.1.2.1 [x] Subtask: Start/Key screens mobile layout
        2.1.1.2.2 [x] Subtask: Profile/Done screens mobile layout
    2.1.2 [x] Step 2.1.2: CTA placement specs
      2.1.2.1 [x] Task 2.1.2.1: Nav/login/post-gate layouts
        2.1.2.1.1 [x] Subtask: Desktop nav placement
        2.1.2.1.2 [x] Subtask: Mobile nav placement
        2.1.2.1.3 [x] Subtask: Post-gate intercept design
      2.1.2.2 [x] Task 2.1.2.2: Notifications strip (optional) layout
        2.1.2.2.1 [x] Subtask: Banner copy and style
        2.1.2.2.2 [x] Subtask: Dismiss/visibility rules
  2.2 [ ] Phase 2.2: Copy and UX review
    2.2.1 [x] Step 2.2.1: Copy freeze
      2.2.1.1 [x] Task 2.2.1.1: Validate strings against constraints
        2.2.1.1.1 [x] Subtask: Mobile truncation audit
        2.2.1.1.2 [x] Subtask: Tone consistency check
      2.2.1.2 [ ] Task 2.2.1.2: i18n pass and truncation checks
        2.2.1.2.1 [ ] Subtask: Key strings tagged for i18n
        2.2.1.2.2 [ ] Subtask: Length limits verified

3. [ ] Stage 3: Implementation
  3.1 [ ] Phase 3.1: Routing and entry points
    3.1.1 [ ] Step 3.1.1: Wire /signup and post-gate return paths
      3.1.1.1 [x] Task 3.1.1.1: Nav/login CTA routing
        3.1.1.1.1 [x] Subtask: Desktop nav link wiring
        3.1.1.1.2 [x] Subtask: Mobile nav link wiring
      3.1.1.2 [x] Task 3.1.1.2: Post-gate redirect with return target
        3.1.1.2.1 [x] Subtask: Preserve intent in state/query
        3.1.1.2.2 [x] Subtask: Redirect to intent after completion
  3.2 [ ] Phase 3.2: Flow screens
    3.2.1 [x] Step 3.2.1: Start screen
      3.2.1.1 [x] Task 3.2.1.1: UI build and copy
        3.2.1.1.1 [x] Subtask: Desktop Start component
        3.2.1.1.2 [x] Subtask: Mobile Start component
    3.2.2 [x] Step 3.2.2: Key choice screen (managed default + advanced)
      3.2.2.1 [x] Task 3.2.2.1: Managed key generation/storage wiring
        3.2.2.1.1 [x] Subtask: Managed key creation hook
        3.2.2.1.2 [x] Subtask: Managed key secure storage integration
      3.2.2.2 [x] Task 3.2.2.2: Advanced options (self/import/external signer)
        3.2.2.2.1 [x] Subtask: Self-custody local gen flow
        3.2.2.2.2 [x] Subtask: Import validation flow
        3.2.2.2.3 [x] Subtask: External signer handshake
    3.2.3 [x] Step 3.2.3: Profile-lite screen
      3.2.3.1 [x] Task 3.2.3.1: Handle/display name fields with skip
        3.2.3.1.1 [x] Subtask: Form validation and skip
        3.2.3.1.2 [x] Subtask: Storage/submit wiring
      3.2.3.2 [x] Task 3.2.3.2: Starter follows toggle
        3.2.3.2.1 [x] Subtask: Toggle UI state
        3.2.3.2.2 [x] Subtask: Toggle persistence and apply
    3.2.4 [x] Step 3.2.4: Completion screen
      3.2.4.1 [x] Task 3.2.4.1: Return target handling and success state
        3.2.4.1.1 [x] Subtask: Success messaging and CTA
        3.2.4.1.2 [x] Subtask: Redirect logic to intent/home
  3.3 [ ] Phase 3.3: Defaults and automation
    3.3.1 [ ] Step 3.3.1: Relay defaults application
      3.3.1.1 [x] Task 3.3.1.1: Detect existing relays and apply defaults if empty
        3.3.1.1.1 [x] Subtask: Relay presence check
        3.3.1.1.2 [x] Subtask: Apply DEFAULT_RELAYS if none
      3.3.1.2 [x] Task 3.3.1.2: Background retry and dedupe logic
        3.3.1.2.1 [x] Subtask: Retry scheduling/backoff
        3.3.1.2.2 [x] Subtask: Relay list dedupe
    3.3.2 [ ] Step 3.3.2: Starter follows
      3.3.2.1 [x] Task 3.3.2.1: Toggle state and publish
        3.3.2.1.1 [x] Subtask: Toggle state storage
        3.3.2.1.2 [x] Subtask: Publish starter follows
      3.3.2.2 [x] Task 3.3.2.2: Failure handling without blocking
        3.3.2.2.1 [x] Subtask: Background retry on failure
        3.3.2.2.2 [x] Subtask: User notification (non-blocking)
  3.4 [x] Phase 3.4: State and persistence
    3.4.1 [x] Step 3.4.1: Onboarding flags and resume
      3.4.1.1 [x] Task 3.4.1.1: Implement `onboarding_stage`/`onboarding_path`
        3.4.1.1.1 [x] Subtask: Store schema and defaults
        3.4.1.1.2 [x] Subtask: Path selection persistence
      3.4.1.2 [x] Task 3.4.1.2: Resume logic and account switch resets
        3.4.1.2.1 [x] Subtask: Resume from last stage
        3.4.1.2.2 [x] Subtask: Reset on account change
    3.4.2 [x] Step 3.4.2: Backup reminders
      3.4.2.1 [x] Task 3.4.2.1: Self/import backup_needed reminder
        3.4.2.1.1 [x] Subtask: Reminder UI surfaces
        3.4.2.1.2 [x] Subtask: Dismiss/confirm handling
      3.4.2.2 [x] Task 3.4.2.2: Managed export prompt (light)
        3.4.2.2.1 [x] Subtask: Prompt placement post-signup
        3.4.2.2.2 [x] Subtask: Export entry point in settings
  3.5 [ ] Phase 3.5: Edge cases and recovery
    3.5.1 [ ] Step 3.5.1: Offline and retry handling
      3.5.1.1 [x] Task 3.5.1.1: Queue/pending_publish flows
        3.5.1.1.1 [x] Subtask: Offline queue for relays/follows
        3.5.1.1.2 [x] Subtask: Flush on reconnect with dedupe
      3.5.1.2 [x] Task 3.5.1.2: Signer timeout fallback to managed
        3.5.1.2.1 [x] Subtask: Timeout detection
        3.5.1.2.2 [x] Subtask: Managed fallback path selection
    3.5.2 [ ] Step 3.5.2: Import validation
      3.5.2.1 [x] Task 3.5.2.1: nsec validation and error copy
        3.5.2.1.1 [x] Subtask: Bech32 format checks
        3.5.2.1.2 [x] Subtask: Error messaging and retries
      3.5.2.2 [x] Task 3.5.2.2: Encrypted backup + password prompt
        3.5.2.2.1 [x] Subtask: Password prompt UX
        3.5.2.2.2 [x] Subtask: Decrypt and validation path

4. [ ] Stage 4: Telemetry and QA
  4.1 [ ] Phase 4.1: Event instrumentation
      4.1.1 [x] Step 4.1.1: Core funnel events
        4.1.1.1 [x] Task 4.1.1.1: entry/path/step/completion events
          4.1.1.1.1 [x] Subtask: Emit entry/path events
          4.1.1.1.2 [x] Subtask: Emit step/completion events
        4.1.1.2 [x] Task 4.1.1.2: post_first_after_onboarding timing
          4.1.1.2.1 [x] Subtask: Capture start timestamp
          4.1.1.2.2 [x] Subtask: Emit timing on first post
      4.1.2 [ ] Step 4.1.2: Edge/error events
        4.1.2.1 [x] Task 4.1.2.1: onboarding_error with type/is_retry
          4.1.2.1.1 [x] Subtask: Map error types
          4.1.2.1.2 [x] Subtask: Add is_retry flag
        4.1.2.2 [x] Task 4.1.2.2: onboarding_edge_case (relay/starter/signer/offline)
          4.1.2.2.1 [x] Subtask: Define edge_case schema
          4.1.2.2.2 [x] Subtask: Hook into recovery paths
  4.2 [ ] Phase 4.2: Testing
    4.2.1 [ ] Step 4.2.1: Unit/integration coverage
      4.2.1.1 [x] Task 4.2.1.1: Flow stage transitions and flags
        4.2.1.1.1 [x] Subtask: Stage progression tests
        4.2.1.1.2 [x] Subtask: Resume state tests
      4.2.1.2 [ ] Task 4.2.1.2: Defaults application/dedupe logic
        4.2.1.2.1 [x] Subtask: Relay defaults tests
        4.2.1.2.2 [x] Subtask: Starter follows apply/dedupe tests
    4.2.2 [ ] Step 4.2.2: E2E scenarios
      4.2.2.1 [ ] Task 4.2.2.1: Managed happy path desktop/mobile
        4.2.2.1.1 [ ] Subtask: Desktop managed E2E
        4.2.2.1.2 [ ] Subtask: Mobile managed E2E
      4.2.2.2 [ ] Task 4.2.2.2: Advanced/import/signer and offline flows
        4.2.2.2.1 [ ] Subtask: Import flow E2E
        4.2.2.2.2 [ ] Subtask: External signer/timeout E2E
        4.2.2.2.3 [ ] Subtask: Offline/queue E2E

5. [ ] Stage 5: Rollout and Monitoring
  5.1 [ ] Phase 5.1: Launch prep
    5.1.1 [ ] Step 5.1.1: Feature gating and config
      5.1.1.1 [x] Task 5.1.1.1: Gate /signup changes behind flag
        5.1.1.1.1 [x] Subtask: Flag plumbing in app config
        5.1.1.1.2 [x] Subtask: Default/off-by-default rollout plan
      5.1.1.2 [ ] Task 5.1.1.2: Configure DEFAULT_RELAYS/starter follows lists
        5.1.1.2.1 [x] Subtask: Validate relay health
        5.1.1.2.2 [ ] Subtask: Curate starter follows list
  5.2 [ ] Phase 5.2: Deploy and verify
    5.2.1 [ ] Step 5.2.1: Staging validation
      5.2.1.1 [ ] Task 5.2.1.1: Verify funnels and error rates in staging
        5.2.1.1.1 [ ] Subtask: Funnel completeness check
        5.2.1.1.2 [ ] Subtask: Error rate thresholds review
      5.2.1.2 [ ] Task 5.2.1.2: Shadow-mode telemetry sanity checks
        5.2.1.2.1 [ ] Subtask: Schema validation in shadow mode
        5.2.1.2.2 [ ] Subtask: Volume sanity in shadow mode
    5.2.2 [ ] Step 5.2.2: Production rollout
      5.2.2.1 [ ] Task 5.2.2.1: Gradual enablement and alert thresholds
        5.2.2.1.1 [ ] Subtask: Enablement ramp plan
        5.2.2.1.2 [ ] Subtask: Alert rules configured
      5.2.2.2 [ ] Task 5.2.2.2: Post-launch review (completion, TTFP, errors)
        5.2.2.2.1 [ ] Subtask: KPI review after launch
        5.2.2.2.2 [ ] Subtask: Backlog follow-ups from findings
