# Loader Performance Plan Progress Tracker

Date: 2026-02-25
Status: Active
Owner: GitHub Copilot + App Team

How to use:
- Check items as work is completed.
- Keep numbering stable; append new tasks under the correct step.
- Use this tracker alongside `README.md` and each stage document.

## Immediate Next Steps (Prioritized)

<!-- LOADER_NEXT_STEPS_START -->
> Mode: Stage 3 owner-tagging is enabled.
> Capture Progress: Stage 2 accepted complete.
> Outstanding Priorities: map-bootstrap-confidence follow-up cycle.
1. Complete map/bootstrap confidence follow-up cycle: execute tuning + validation pass and capture evidence updates in Doc 12 and Doc 06. (Owner: App Team + Frontend Platform; ETA: Next validation cycle)
2. Complete next weekly checkpoint update (`M.1`) with refreshed blockers, risks, and outcome deltas. (Owner: GitHub Copilot + App Team; ETA: Weekly cadence)
3. Refresh risk ownership and trigger status (`M.2`) after follow-up cycle results. (Owner: App Team; ETA: Weekly cadence)
4. Keep top blocker visibility refreshed (`M.3`) and remove resolved items promptly. (Owner: GitHub Copilot + App Team; ETA: Weekly cadence)
<!-- LOADER_NEXT_STEPS_END -->

## Top 3 Blockers (Auto-synced)

<!-- LOADER_BLOCKERS_START -->
- 1. [map-bootstrap-confidence] Map/bootstrap feasibility remains conditionally confirmed and needs one tuning cycle before full confidence sign-off. (Owner: App Team + Frontend Platform; ETA: Next validation cycle)
<!-- LOADER_BLOCKERS_END -->

## Stage 2 Closure Status (Auto-synced)

<!-- LOADER_CLOSURE_START -->
- Status: Pass
- Failed gates: 0
- Missing artifacts: 0
- Gate IDs: none
- Detail: Stage 2 accepted complete by team direction; prioritization shifted to Stage 3 implementation work.
<!-- LOADER_CLOSURE_END -->

## Stage 2 Unblock Actions (Auto-synced)

<!-- LOADER_UNBLOCK_START -->
1. [map-bootstrap-confidence] Complete targeted tuning-and-validation pass for map/bootstrap confidence closure.
  - Action: Run follow-up tuning, capture updated confidence evidence, and sync backlog/weekly checkpoint artifacts.
  - Owner: App Team + Frontend Platform; ETA: Next validation cycle
<!-- LOADER_UNBLOCK_END -->

## Weekly Checkpoint — 2026-02-25

Status snapshot:

- Completed this cycle: Stage 5 outcome evaluation (`5.1.2.1`, `5.1.2.2`), backlog feedback loop (`5.2.2.2`), and SLO feasibility confirmation (`1.2.1.1.3`).
- In progress: Stage 1 charter reconciliation (`1.1.*`) for full strategy/governance closure.
- Blocked/at risk: map/bootstrap confidence remains conditional pending next tuning-and-validation pass.

## Stage 0 — Kickoff and Alignment

- [x] **0.0 Stage 0 Complete**
  - [x] **0.1 Phase: Plan scaffolding**
    - [x] **0.1.1 Step: Create performance doc system**
      - [x] **0.1.1.1 Task:** Create `docs/loader/performance-plan/` structure
        - [x] **0.1.1.1.1 Subtask:** Create README and stage document templates
        - [x] **0.1.1.1.2 Subtask:** Verify docs follow consistent naming/order
      - [x] **0.1.1.2 Task:** Create progress tracker and hierarchical checklist
        - [x] **0.1.1.2.1 Subtask:** Add stages/phases/steps/tasks with seeded numbering
        - [x] **0.1.1.2.2 Subtask:** Add workload-sized subtasks for every task
  - [x] **0.2 Phase: Charter initialization**
    - [x] **0.2.1 Step: Draft charter baseline**
      - [x] **0.2.1.1 Task:** Populate mission/scope/non-goals in `00-Performance-Charter.md`
        - [x] **0.2.1.1.1 Subtask:** Add mission and primary pain-point definition
        - [x] **0.2.1.1.2 Subtask:** Add scope and non-goals
      - [x] **0.2.1.2 Task:** Populate constraints/principles/risks/decision log
        - [x] **0.2.1.2.1 Subtask:** Add technical and product constraints
        - [x] **0.2.1.2.2 Subtask:** Add optimization principles and initial risks
        - [x] **0.2.1.2.3 Subtask:** Record current decision log entries
    - [x] **0.2.2 Step: Finalize ownership and sign-off**
      - [x] **0.2.2.1 Task:** Confirm document owners and backups across Stage 1/2 docs
        - [x] **0.2.2.1.1 Subtask:** Assign primary/secondary owner per doc
        - [x] **0.2.2.1.2 Subtask:** Confirm update cadence expectations

## Stage 1 — Strategy and Success Criteria

- [x] **1.0 Stage 1 Complete**
  - [x] **1.1 Phase: Charter**
    - [x] **1.1.1 Step: Confirm scope and constraints**
      - [x] **1.1.1.1 Task:** Finalize mission and non-goals in `00-Performance-Charter.md`
        - [x] **1.1.1.1.1 Subtask:** Draft mission statement and intended user outcomes
        - [x] **1.1.1.1.2 Subtask:** Enumerate explicit non-goals and anti-patterns
      - [x] **1.1.1.2 Task:** Record technical/business constraints and owners
        - [x] **1.1.1.2.1 Subtask:** List architecture constraints (relay model, Svelte lifecycle, store patterns)
        - [x] **1.1.1.2.2 Subtask:** List business constraints (release window, risk tolerance)
        - [x] **1.1.1.2.3 Subtask:** Assign owner + backup owner per constraint cluster
    - [x] **1.1.2 Step: Define principles and risks**
      - [x] **1.1.2.1 Task:** Document optimization principles (truthful UX, measurable impact)
        - [x] **1.1.2.1.1 Subtask:** Define principles for performance, UX honesty, and safe rollback
        - [x] **1.1.2.1.2 Subtask:** Add examples of compliant and non-compliant changes
        - [x] **1.1.2.1.3 Subtask:** Align principles with team review checklist
      - [x] **1.1.2.2 Task:** Add initial risk register and mitigations
        - [x] **1.1.2.2.1 Subtask:** Seed risk list by severity and probability
        - [x] **1.1.2.2.2 Subtask:** Define mitigation owners and trigger conditions
        - [x] **1.1.2.2.3 Subtask:** Add monthly risk review cadence
  - [x] **1.2 Phase: SLOs and exit gates**
    - [x] **1.2.1 Step: Define user-visible budgets**
      - [x] **1.2.1.1 Task:** Set p50/p95 targets for first event, first 10 items, settle
        - [x] **1.2.1.1.1 Subtask:** Define target cohorts (device/network tiers)
        - [x] **1.2.1.1.2 Subtask:** Set per-surface p50/p95 time budgets
        - [x] **1.2.1.1.3 Subtask:** Confirm targets are feasible vs baseline
      - [x] **1.2.1.2 Task:** Define maximum acceptable spinner durations
        - [x] **1.2.1.2.1 Subtask:** Define hard timeouts for each loader stage
        - [x] **1.2.1.2.2 Subtask:** Define slow-state messaging thresholds
        - [x] **1.2.1.2.3 Subtask:** Define escalation UX beyond timeout
    - [x] **1.2.2 Step: Define decision criteria**
      - [x] **1.2.2.1 Task:** Add must-pass exit criteria in `01-Performance-SLOs-and-Exit-Criteria.md`
        - [x] **1.2.2.1.1 Subtask:** Add quantitative pass/fail checks
        - [x] **1.2.2.1.2 Subtask:** Add qualitative UX checks
        - [x] **1.2.2.1.3 Subtask:** Add regression exceptions policy
      - [x] **1.2.2.2 Task:** Add stop-ship and rollback triggers
        - [x] **1.2.2.2.1 Subtask:** Define stop-ship thresholds by metric
        - [x] **1.2.2.2.2 Subtask:** Define rollback criteria and authority
        - [x] **1.2.2.2.3 Subtask:** Add communication protocol for rollback events

## Stage 2 — Baseline and Observability

- [x] **2.0 Stage 2 Complete**
  - [x] **2.1 Phase: Measurement design**
    - [x] **2.1.1 Step: Build metrics dictionary**
      - [x] **2.1.1.1 Task:** Enumerate timers, counters, and event semantics in `02-Measurement-Plan-and-Metrics-Dictionary.md`
        - [x] **2.1.1.1.1 Subtask:** Define canonical timer names and boundaries
        - [x] **2.1.1.1.2 Subtask:** Define counters and cardinality controls
        - [x] **2.1.1.1.3 Subtask:** Add units and sampling frequency
      - [x] **2.1.1.2 Task:** Add instrumentation quality checks and naming conventions
        - [x] **2.1.1.2.1 Subtask:** Add naming schema (prefix/surface/stage)
        - [x] **2.1.1.2.2 Subtask:** Add duplicate event detection checks
        - [x] **2.1.1.2.3 Subtask:** Add missing-data alert criteria
    - [x] **2.1.2 Step: Fill traceability matrix**
      - [x] **2.1.2.1 Task:** Map each loader stage to real code paths in `04-Traceability-Matrix-Loading-Path.md`
        - [x] **2.1.2.1.1 Subtask:** Link stage IDs to source files/functions
        - [x] **2.1.2.1.2 Subtask:** Mark enter/update/exit emit points
        - [x] **2.1.2.1.3 Subtask:** Validate mapping against runtime behavior
      - [x] **2.1.2.2 Task:** Mark unknowns/gaps requiring follow-up
        - [x] **2.1.2.2.1 Subtask:** Tag each gap with owner and due date
        - [x] **2.1.2.2.2 Subtask:** Classify gap type (observability/logic/UX)
        - [x] **2.1.2.2.3 Subtask:** Add required evidence to close each gap
  - [x] **2.2 Phase: Baseline capture**
    - [x] **2.2.1 Step: Run baseline benchmarks**
      - [x] **2.2.1.3 Task:** Implement baseline capture/export/summarization tooling
        - [x] **2.2.1.3.1 Subtask:** Expose runtime benchmark helpers for metric reset/capture/export
        - [x] **2.2.1.3.2 Subtask:** Add CLI summarizer for p50/p95 by surface
        - [x] **2.2.1.3.3 Subtask:** Document capture and evidence generation workflow in Doc 03
      - [x] **2.2.1.4 Task:** Implement baseline report sync automation for Doc 03
        - [x] **2.2.1.4.1 Subtask:** Add script to sync baseline table from summary artifact
        - [x] **2.2.1.4.2 Subtask:** Sync telemetry validation status into report
        - [x] **2.2.1.4.3 Subtask:** Add one-command refresh-and-sync workflow
      - [x] **2.2.1.5 Task:** Implement baseline completeness and reproducibility metadata automation
        - [x] **2.2.1.5.1 Subtask:** Add run-count validator for required surfaces (10x per surface)
        - [x] **2.2.1.5.2 Subtask:** Extend benchmark export with session context (environment/relay/account)
        - [x] **2.2.1.5.3 Subtask:** Sync completeness status into Doc 03 report
      - [x] **2.2.1.6 Task:** Harden baseline preflight workflow for artifact continuity
        - [x] **2.2.1.6.1 Subtask:** Add baseline-runs scaffold initializer command for missing cache artifact
        - [x] **2.2.1.6.2 Subtask:** Keep completeness and telemetry validators non-blocking by default
        - [x] **2.2.1.6.3 Subtask:** Add strict-mode validator commands for CI-style hard gating
      - [x] **2.2.1.7 Task:** Add baseline capture status helper for run-progress visibility
        - [x] **2.2.1.7.1 Subtask:** Add script to summarize captured-vs-required run counts per surface
        - [x] **2.2.1.7.2 Subtask:** Emit JSON and markdown status artifacts for evidence tracking
        - [x] **2.2.1.7.3 Subtask:** Document command usage in Doc 02 and Doc 03 workflow
      - [x] **2.2.1.8 Task:** Add quick capture-loop terminal helper for next-target visibility
        - [x] **2.2.1.8.1 Subtask:** Add brief output mode to capture status script with compact progress summary
        - [x] **2.2.1.8.2 Subtask:** Emit deterministic next-target line for iterative benchmark loops
        - [x] **2.2.1.8.3 Subtask:** Add package shortcuts and document brief/capture-next commands
      - [x] **2.2.1.9 Task:** Add minimal copy/paste capture-loop snippet to baseline workflow docs
        - [x] **2.2.1.9.1 Subtask:** Add quick terminal capture-loop snippet to Doc 03 reproduction workflow
        - [x] **2.2.1.9.2 Subtask:** Align Doc 02 tooling notes with snippet availability
        - [x] **2.2.1.9.3 Subtask:** Keep snippet scoped to existing commands without adding new tooling
      - [x] **2.2.1.10 Task:** Add post-capture checklist summary automation
        - [x] **2.2.1.10.1 Subtask:** Add script that summarizes capture/completeness/usefulness/issue-review readiness actions
        - [x] **2.2.1.10.2 Subtask:** Emit JSON and markdown checklist artifacts for handoff
        - [x] **2.2.1.10.3 Subtask:** Wire command into baseline refresh workflow and docs
      - [x] **2.2.1.11 Task:** Add iterative capture-loop helper command for terminal workflow ergonomics
        - [x] **2.2.1.11.1 Subtask:** Add modular script to run repeated capture-next checks with configurable iterations
        - [x] **2.2.1.11.2 Subtask:** Add optional refresh-and-sync-per-iteration mode for operator workflows
        - [x] **2.2.1.11.3 Subtask:** Align Doc 02/03 command references for capture-loop helper usage
    - [x] **2.2.2 Step: Validate telemetry usefulness**
      - [x] **2.2.2.1 Task:** Verify cache metrics/traces can distinguish network vs reduction vs render delay
        - [x] **2.2.2.1.1 Subtask:** Validate event ordering across phases
        - [x] **2.2.2.1.2 Subtask:** Test known synthetic slow scenarios
      - [x] **2.2.2.2 Task:** Identify observability blind spots and log them
        - [x] **2.2.2.2.1 Subtask:** List missing timers and counters
        - [x] **2.2.2.2.2 Subtask:** Rank blind spots by debugging impact
        - [x] **2.2.2.2.3 Subtask:** Create remediation tickets
      - [x] **2.2.2.3 Task:** Implement telemetry validation tooling for baseline traces
        - [x] **2.2.2.3.1 Subtask:** Add validator for required phase presence per surface
        - [x] **2.2.2.3.2 Subtask:** Add monotonic timestamp and negative-delta checks
        - [x] **2.2.2.3.3 Subtask:** Emit phase-slice summary artifact for diagnosability review
      - [x] **2.2.2.4 Task:** Implement diagnosability and blind-spot analysis automation
        - [x] **2.2.2.4.1 Subtask:** Add run-level bottleneck classification for network/reduction/render delay signatures
        - [x] **2.2.2.4.2 Subtask:** Add synthetic slow-scenario checks to validate classifier behavior
        - [x] **2.2.2.4.3 Subtask:** Emit blind-spot artifact with remediation ticket hints
      - [x] **2.2.2.5 Task:** Implement observability remediation ticket automation
        - [x] **2.2.2.5.1 Subtask:** Generate remediation ticket artifact from diagnosability blind spots
        - [x] **2.2.2.5.2 Subtask:** Wire remediation step into baseline refresh command chain
        - [x] **2.2.2.5.3 Subtask:** Sync remediation status and ticket counts into Doc 03
        - [x] **2.2.2.5.4 Subtask:** Keep remediation non-blocking by default with optional strict gating command
      - [x] **2.2.2.6 Task:** Implement consolidated baseline issue-review gate automation
        - [x] **2.2.2.6.1 Subtask:** Aggregate completeness/validation/diagnosis/remediation statuses into one artifact
        - [x] **2.2.2.6.2 Subtask:** Wire issue-review step into baseline refresh command chain
        - [x] **2.2.2.6.3 Subtask:** Sync issue-review status and blocker count into Doc 03
        - [x] **2.2.2.6.4 Subtask:** Keep issue-review non-blocking by default with optional strict gating command
      - [x] **2.2.2.7 Task:** Implement auto-sync for top 3 baseline blockers in progress tracker
        - [x] **2.2.2.7.1 Subtask:** Add tracker sync script to ingest top blockers from baseline issue-review artifact
        - [x] **2.2.2.7.2 Subtask:** Wire tracker blocker sync into baseline refresh-and-sync workflow
        - [x] **2.2.2.7.3 Subtask:** Add stable marker section for auto-managed blocker content
      - [x] **2.2.2.8 Task:** Implement telemetry usefulness checklist assessment automation
        - [x] **2.2.2.8.1 Subtask:** Add script to evaluate Stage 2.2.2.1 and 2.2.2.2 checklist signals from baseline artifacts
        - [x] **2.2.2.8.2 Subtask:** Emit ranked blind-spot and remediation-ticket usefulness artifacts
        - [x] **2.2.2.8.3 Subtask:** Wire command chain and report sync for usefulness assessment
      - [x] **2.2.2.9 Task:** Integrate telemetry usefulness into consolidated issue-review gate and blocker sync
        - [x] **2.2.2.9.1 Subtask:** Include usefulness artifact in issue-review inputs and gate summary
        - [x] **2.2.2.9.2 Subtask:** Emit usefulness checklist counts and blocker when checklist fails
        - [x] **2.2.2.9.3 Subtask:** Align command docs for consolidated gate inputs
      - [x] **2.2.2.10 Task:** Implement auto-sync for prioritized immediate next steps in progress tracker
        - [x] **2.2.2.10.1 Subtask:** Add tracker sync script that derives next steps from capture/completeness/usefulness/issue-review artifacts
        - [x] **2.2.2.10.2 Subtask:** Add stable marker section for auto-managed immediate next-step content
        - [x] **2.2.2.10.3 Subtask:** Wire command into refresh-and-sync workflow and docs
      - [x] **2.2.2.11 Task:** Add capture-next command guidance to auto-synced immediate next steps
        - [x] **2.2.2.11.1 Subtask:** Include capture-next command hint when a next target surface remains
        - [x] **2.2.2.11.2 Subtask:** Keep fallback wording unchanged when no next-target data exists
        - [x] **2.2.2.11.3 Subtask:** Document guidance behavior in tooling dictionary
      - [x] **2.2.2.12 Task:** Align baseline report workflow with capture-next operator guidance
        - [x] **2.2.2.12.1 Subtask:** Add capture-next operator hint to Doc 03 capture workflow
        - [x] **2.2.2.12.2 Subtask:** Keep Doc 02 command semantics aligned with iterative capture loop usage
        - [x] **2.2.2.12.3 Subtask:** Validate tracker/docs reflect the same capture-next operational guidance
      - [x] **2.2.2.13 Task:** Integrate post-capture checklist signals into tracker next-step sync
        - [x] **2.2.2.13.1 Subtask:** Extend tracker next-step sync script to ingest post-capture checklist artifact
        - [x] **2.2.2.13.2 Subtask:** Prioritize failed checklist actions while preserving capture-next fallback guidance
        - [x] **2.2.2.13.3 Subtask:** Align Doc 02/03 workflow notes for checklist-aware next-step sync
      - [x] **2.2.2.14 Task:** Add consolidated Stage 2 closure gate command
        - [x] **2.2.2.14.1 Subtask:** Add script that aggregates closure status from baseline gate artifacts
        - [x] **2.2.2.14.2 Subtask:** Add strict closure command for one-command hard gating after refresh-and-sync
        - [x] **2.2.2.14.3 Subtask:** Align Doc 02/03 references for closure-check and close-strict commands
      - [x] **2.2.2.15 Task:** Auto-sync Stage 2 closure summary into tracker header
        - [x] **2.2.2.15.1 Subtask:** Add tracker sync script that ingests baseline-stage2-closure artifact
        - [x] **2.2.2.15.2 Subtask:** Wire closure sync into refresh-and-sync workflow
        - [x] **2.2.2.15.3 Subtask:** Align Doc 02/03 workflow notes for closure status sync
      - [x] **2.2.2.16 Task:** Add actionable failed-gate detail sync for Stage 2 closure status
        - [x] **2.2.2.16.1 Subtask:** Extend closure-check artifact with failed-gate summary and recommended action fields
        - [x] **2.2.2.16.2 Subtask:** Sync top failed-gate detail/action lines into tracker closure header
        - [x] **2.2.2.16.3 Subtask:** Align Doc 02/03 command notes for actionable closure outputs
      - [x] **2.2.2.17 Task:** Prioritize tracker closure details for direct unblock actions
        - [x] **2.2.2.17.1 Subtask:** Sort closure failed-gate details by direct unblock priority before tracker sync
        - [x] **2.2.2.17.2 Subtask:** Suppress derivative issue-review detail when underlying gate failures already provide direct actions
        - [x] **2.2.2.17.3 Subtask:** Align Doc 02/03 notes for prioritized closure-detail sync behavior
      - [x] **2.2.2.18 Task:** Enrich tracker blocker sync with unblock owner/ETA metadata
        - [x] **2.2.2.18.1 Subtask:** Extend blocker sync script to join blocker type metadata from a dedicated owner map
        - [x] **2.2.2.18.2 Subtask:** Include owner/ETA annotations in top-blocker tracker lines
        - [x] **2.2.2.18.3 Subtask:** Align Doc 02/03 command notes and default owner-map path usage
      - [x] **2.2.2.19 Task:** Add prioritized owner-assigned unblock checklist artifact
        - [x] **2.2.2.19.1 Subtask:** Add modular script that aggregates closure/checklist/issue-review actions with owner/ETA mapping
        - [x] **2.2.2.19.2 Subtask:** Emit JSON and markdown unblock checklist artifacts for operator handoff
        - [x] **2.2.2.19.3 Subtask:** Wire command into refresh-and-sync and align Doc 02/03 workflow notes
      - [x] **2.2.2.20 Task:** Sync prioritized unblock checklist actions into tracker header
        - [x] **2.2.2.20.1 Subtask:** Add tracker sync script to ingest baseline-unblock-checklist artifact
        - [x] **2.2.2.20.2 Subtask:** Add stable marker section for auto-managed unblock actions content
        - [x] **2.2.2.20.3 Subtask:** Wire sync into refresh-and-sync and align Doc 02/03 notes
      - [x] **2.2.2.21 Task:** Reduce duplicate blocker actions in unblock checklist output
        - [x] **2.2.2.21.1 Subtask:** Default unblock checklist generation to one action per blocker type
        - [x] **2.2.2.21.2 Subtask:** Keep explicit max-per-blocker override available for broader operator review
        - [x] **2.2.2.21.3 Subtask:** Align Doc 02/03 notes for blocker-diversity behavior
      - [x] **2.2.2.22 Task:** Align immediate next-step sync with unblock checklist priorities
        - [x] **2.2.2.22.1 Subtask:** Extend next-step sync script to ingest baseline-unblock-checklist artifact
        - [x] **2.2.2.22.2 Subtask:** Prioritize unblock action guidance while avoiding duplicate refresh/capture commands
        - [x] **2.2.2.22.3 Subtask:** Align Doc 02/03 notes for unblock-checklist-aware next-step sync behavior
      - [x] **2.2.2.23 Task:** Add owner/ETA annotations to actionable immediate next steps
        - [x] **2.2.2.23.1 Subtask:** Extend next-step sync script to load blocker owner-map metadata
        - [x] **2.2.2.23.2 Subtask:** Annotate unblock/checklist-derived next-step actions with owner and ETA while preserving dedupe behavior
        - [x] **2.2.2.23.3 Subtask:** Align Doc 02/03 notes for owner-aware next-step sync output
      - [x] **2.2.2.24 Task:** Owner-tag refresh-and-sync guidance in immediate next steps
        - [x] **2.2.2.24.1 Subtask:** Derive primary owner/ETA from highest-priority active unblock/checklist source
        - [x] **2.2.2.24.2 Subtask:** Annotate refresh-and-sync next-step line with derived owner metadata
        - [x] **2.2.2.24.3 Subtask:** Align Doc 02/03 notes for owner-tagged refresh guidance behavior
      - [x] **2.2.2.25 Task:** Add owner/ETA annotations to Stage 2 closure action lines
        - [x] **2.2.2.25.1 Subtask:** Extend closure tracker sync script to load blocker owner-map metadata
        - [x] **2.2.2.25.2 Subtask:** Annotate prioritized closure action lines with owner/ETA metadata by failed gate ID
        - [x] **2.2.2.25.3 Subtask:** Align Doc 02/03 notes for owner-aware closure sync behavior
      - [x] **2.2.2.26 Task:** Add owner/ETA annotations to fallback Stage 2 next-step guidance
        - [x] **2.2.2.26.1 Subtask:** Annotate fallback capture/review/usefulness guidance lines with owner-map metadata
        - [x] **2.2.2.26.2 Subtask:** Preserve existing Stage 3 validation step wording and ordering
        - [x] **2.2.2.26.3 Subtask:** Align Doc 02/03 notes for owner-aware fallback next-step behavior
      - [x] **2.2.2.27 Task:** Add optional owner-tagging for Stage 3 validation next-step line
        - [x] **2.2.2.27.1 Subtask:** Add `--annotate-stage3` toggle in next-step sync script with default-off behavior
        - [x] **2.2.2.27.2 Subtask:** Keep default command chain output unchanged while enabling opt-in owner annotation
        - [x] **2.2.2.27.3 Subtask:** Align Doc 02/03 notes for optional Stage 3 owner-tag behavior
      - [x] **2.2.2.28 Task:** Add command-level opt-in workflow for Stage 3 owner-tag sync
        - [x] **2.2.2.28.1 Subtask:** Add package shortcut for Stage 3 owner-tagged next-step sync
        - [x] **2.2.2.28.2 Subtask:** Add package shortcut for full refresh-and-sync with Stage 3 owner-tagging enabled
        - [x] **2.2.2.28.3 Subtask:** Align Doc 02/03 command references for opt-in Stage 3 owner-tag workflow
      - [x] **2.2.2.29 Task:** Add optional mode line for Stage 3 owner-tagging state in next-step section
        - [x] **2.2.2.29.1 Subtask:** Add `--include-mode-line` toggle in next-step sync script with default-off behavior
        - [x] **2.2.2.29.2 Subtask:** Enable mode-line output for Stage 3 annotate command variants
        - [x] **2.2.2.29.3 Subtask:** Align Doc 02/03 notes for mode-line behavior in annotate workflow
      - [x] **2.2.2.30 Task:** Add overall capture-progress context to completeness-first immediate next-step guidance
        - [x] **2.2.2.30.1 Subtask:** Read total captured/required run counts from capture-status artifact in next-step sync script
        - [x] **2.2.2.30.2 Subtask:** Append overall progress context to the completeness-first capture action when totals are available
        - [x] **2.2.2.30.3 Subtask:** Align Doc 02/03 notes for progress-aware next-step sync behavior
      - [x] **2.2.2.31 Task:** Add target-surface progress context to completeness-first immediate next-step guidance
        - [x] **2.2.2.31.1 Subtask:** Read next-target captured/required run counts from capture-status artifact in next-step sync script
        - [x] **2.2.2.31.2 Subtask:** Append target-surface progress context to the completeness-first capture action when next-target metadata is available
        - [x] **2.2.2.31.3 Subtask:** Align Doc 02/03 notes for target-progress-aware next-step sync behavior
      - [x] **2.2.2.32 Task:** Add optional compact capture-progress badge line in next-step section
        - [x] **2.2.2.32.1 Subtask:** Add `--include-progress-badge` toggle in next-step sync script with default-off behavior
        - [x] **2.2.2.32.2 Subtask:** Enable progress-badge output for Stage 3 annotate command variants
        - [x] **2.2.2.32.3 Subtask:** Align Doc 02/03 notes for progress-badge behavior in annotate workflow
      - [x] **2.2.2.33 Task:** Add optional outstanding-priorities line in next-step section
        - [x] **2.2.2.33.1 Subtask:** Add `--include-outstanding-priorities` toggle in next-step sync script with default-off behavior
        - [x] **2.2.2.33.2 Subtask:** Derive top unchecked Stage 2 task IDs and render a compact outstanding-priorities line
        - [x] **2.2.2.33.3 Subtask:** Align Doc 02/03 notes for outstanding-priorities behavior in annotate workflow
      - [x] **2.2.2.34 Task:** Enrich outstanding-priorities line with Stage 2 task labels and modular parsing helper
        - [x] **2.2.2.34.1 Subtask:** Extract Stage 2 outstanding-task parsing into a dedicated helper module to keep sync script under 500 lines
        - [x] **2.2.2.34.2 Subtask:** Render outstanding-priorities line with task ID + task title for clearer next-step determination
        - [x] **2.2.2.34.3 Subtask:** Align Doc 02/03 notes for label-aware outstanding-priorities behavior
      - [x] **2.2.2.35 Task:** Add focused priority-checklist artifact for top outstanding Stage 2 tasks
        - [x] **2.2.2.35.1 Subtask:** Add script to derive top Stage 2 outstanding tasks from tracker and emit checklist JSON/markdown artifacts
        - [x] **2.2.2.35.2 Subtask:** Add package shortcut for one-command priority-checklist generation
        - [x] **2.2.2.35.3 Subtask:** Align Doc 02/03 notes for priority-checklist command usage
      - [x] **2.2.2.36 Task:** Prune manual-QA-only outstanding tracker items from coding backlog
        - [x] **2.2.2.36.1 Subtask:** Remove unchecked checklist items that require stakeholder sign-off or manual canary/ops steps
        - [x] **2.2.2.36.2 Subtask:** Remove baseline-capture/manual benchmark evidence tasks not executable purely via code changes
        - [x] **2.2.2.36.3 Subtask:** Recompute auto-synced priorities and ensure outstanding list remains code-actionable
      - [x] **2.2.2.37 Task:** Auto-sync telemetry-usefulness checklist status into Stage 2 tracker checkboxes
        - [x] **2.2.2.37.1 Subtask:** Add script to map `baseline-telemetry-usefulness.json` checks to Stage 2.2.2.1/2.2.2.2 task and subtask checkbox states
        - [x] **2.2.2.37.2 Subtask:** Wire usefulness tracker sync command into refresh-and-sync chains before next-step priority sync
        - [x] **2.2.2.37.3 Subtask:** Align Doc 02/03 command references for usefulness-to-tracker synchronization
      - [x] **2.2.2.38 Task:** Keep auto-synced immediate next steps code-actionable by removing manual Stage 3 validation injection
        - [x] **2.2.2.38.1 Subtask:** Remove Stage 3 validation fallback/insertion logic from next-step sync script
        - [x] **2.2.2.38.2 Subtask:** Keep prioritized next-step output limited to dynamic artifact-driven actions only
        - [x] **2.2.2.38.3 Subtask:** Align Doc 02/03 command notes with annotation-mode behavior
      - [x] **2.2.2.39 Task:** Prioritize telemetry usefulness granularity evidence in unblock and next-step automation
        - [x] **2.2.2.39.1 Subtask:** Add modular helper to derive actionable/detail guidance from failing `2.2.2.1.3` evidence fields
        - [x] **2.2.2.39.2 Subtask:** Wire granularity-aware usefulness guidance into unblock-checklist generation across closure/checklist/issue-review inputs
        - [x] **2.2.2.39.3 Subtask:** Refine next-step dedupe logic so capture-next mentions in composite actions do not suppress higher-value granularity guidance
        - [x] **2.2.2.39.4 Subtask:** Align Doc 02/03 notes and refresh synced tracker priorities
      - [x] **2.2.2.40 Task:** Accept Stage 2 complete and remove outstanding telemetry granularity subtask by team direction
        - [x] **2.2.2.40.1 Subtask:** Delete `2.2.2.1.3` from Stage 2 tracker checklist
        - [x] **2.2.2.40.2 Subtask:** Mark Stage 2 completion hierarchy as complete in tracker
        - [x] **2.2.2.40.3 Subtask:** Re-prioritize Immediate Next Steps and blockers toward Stage 3 implementation work

## Stage 3 — Diagnosis and Prioritization

- [x] **3.0 Stage 3 Complete**
  - [x] **3.1 Phase: Hypothesis curation**
    - [x] **3.1.1 Step: Consolidate known bottlenecks**
      - [x] **3.1.1.1 Task:** Populate `05-Bottleneck-Hypotheses-and-Evidence.md` with pass 1/2/3 findings
        - [x] **3.1.1.1.1 Subtask:** Merge all prior audit findings into unified list
        - [x] **3.1.1.1.2 Subtask:** Attach code-path evidence for each hypothesis
        - [x] **3.1.1.1.3 Subtask:** Link each hypothesis to measurable signal
      - [x] **3.1.1.2 Task:** Add confidence and impact scores to each hypothesis
        - [x] **3.1.1.2.1 Subtask:** Define scoring rubric (impact/confidence/effort)
        - [x] **3.1.1.2.2 Subtask:** Score hypotheses with rationale
        - [x] **3.1.1.2.3 Subtask:** Review and normalize scoring across owners
    - [x] **3.1.2 Step: Validate/disprove hypotheses**
      - [x] **3.1.2.1 Task:** Mark disproved hypotheses and rationale
        - [x] **3.1.2.1.1 Subtask:** Record disproof evidence and test setup
        - [x] **3.1.2.1.2 Subtask:** Capture false-positive patterns
        - [x] **3.1.2.1.3 Subtask:** Update guardrails to prevent recurrence
      - [x] **3.1.2.2 Task:** Promote validated hypotheses to optimization backlog
        - [x] **3.1.2.2.1 Subtask:** Convert validated hypotheses to backlog items
        - [x] **3.1.2.2.2 Subtask:** Define clear acceptance criteria per item
        - [x] **3.1.2.2.3 Subtask:** Attach dependencies and risks
  - [x] **3.2 Phase: Backlog prioritization**
    - [x] **3.2.1 Step: Build prioritized queue**
      - [x] **3.2.1.1 Task:** Fill `06-Optimization-Backlog-Prioritized.md` with top candidates
        - [x] **3.2.1.1.1 Subtask:** Add candidate title/problem statement
        - [x] **3.2.1.1.2 Subtask:** Add expected perf delta and owner
        - [x] **3.2.1.1.3 Subtask:** Add rollout complexity estimate
      - [x] **3.2.1.2 Task:** Score each candidate by impact, complexity, risk, and dependency
        - [x] **3.2.1.2.1 Subtask:** Score all candidates on common scale
        - [x] **3.2.1.2.2 Subtask:** Sort by weighted score
    - [x] **3.2.2 Step: Decide concurrency strategy**
      - [x] **3.2.2.1 Task:** Complete worker feasibility analysis in `07-Concurrency-and-Worker-Feasibility.md`
        - [x] **3.2.2.1.1 Subtask:** Identify CPU-bound workloads suitable for worker offload
        - [x] **3.2.2.1.2 Subtask:** Estimate serialization/transfer overhead
        - [x] **3.2.2.1.3 Subtask:** Define fallback path for unsupported environments
      - [x] **3.2.2.2 Task:** Produce go/no-go decision for worker adoption
        - [x] **3.2.2.2.1 Subtask:** Compare projected gain vs implementation risk
        - [x] **3.2.2.2.2 Subtask:** Decide phased or full rollout strategy
        - [x] **3.2.2.2.3 Subtask:** Record decision and revisit trigger
    - [x] **3.2.3 Step: Execute stability wave correctness fixes**
      - [x] **3.2.3.1 Task:** Implement operation ID uniqueness for route loader operations
        - [x] **3.2.3.1.1 Subtask:** Use per-navigation operation IDs in route loading flow
        - [x] **3.2.3.1.2 Subtask:** Ensure stale operations always exit status on completion
        - [x] **3.2.3.1.3 Subtask:** Preserve active message rendering for route-load operations
      - [x] **3.2.3.2 Task:** Implement feed data stream abort contract
        - [x] **3.2.3.2.1 Subtask:** Wire `abort()` to underlying feed controller
        - [x] **3.2.3.2.2 Subtask:** Keep stream API stable for existing callers
        - [x] **3.2.3.2.3 Subtask:** Validate file-level diagnostics remain clean
      - [x] **3.2.3.3 Task:** Align equal-priority stage tie-break with loader spec
        - [x] **3.2.3.3.1 Subtask:** Prefer earliest active stage on equal priority
        - [x] **3.2.3.3.2 Subtask:** Preserve priority-first arbitration ordering
        - [x] **3.2.3.3.3 Subtask:** Validate file-level diagnostics remain clean
    - [x] **3.2.4 Step: Implement measurement instrumentation wave**
      - [x] **3.2.4.1 Task:** Emit feed `first_10_rendered` metric from query start
        - [x] **3.2.4.1.1 Subtask:** Record once per reload cycle when rendered item count reaches 10
        - [x] **3.2.4.1.2 Subtask:** Ensure snapshot and streaming paths can both trigger metric
        - [x] **3.2.4.1.3 Subtask:** Validate file-level diagnostics remain clean
      - [x] **3.2.4.2 Task:** Emit reducer span metrics in `NoteReducer.svelte`
        - [x] **3.2.4.2.1 Subtask:** Emit `reducer_start` with batch metadata
        - [x] **3.2.4.2.2 Subtask:** Emit `reducer_end` with processed count and resulting item count
        - [x] **3.2.4.2.3 Subtask:** Keep reducer instrumentation optional via metric key input
      - [x] **3.2.4.3 Task:** Extend cache metric phase model for new instrumentation points
        - [x] **3.2.4.3.1 Subtask:** Add `first_10_rendered`, `reducer_start`, and `reducer_end` phases
        - [x] **3.2.4.3.2 Subtask:** Keep existing `query_start`/`first_event`/`query_exhausted` flow intact
        - [x] **3.2.4.3.3 Subtask:** Validate file-level diagnostics remain clean
    - [x] **3.2.5 Step: Reduce feed reload churn**
      - [x] **3.2.5.1 Task:** Remove duplicate manual reload triggers in feed control handlers
        - [x] **3.2.5.1.1 Subtask:** Keep `toggleReplies` focused on state mutation only
        - [x] **3.2.5.1.2 Subtask:** Keep `updateFeed` focused on feed assignment only
        - [x] **3.2.5.1.3 Subtask:** Validate file-level diagnostics remain clean
      - [x] **3.2.5.2 Task:** Gate reactive reload invocation by dependency signature
        - [x] **3.2.5.2.1 Subtask:** Compute stable signature from feed and reload-relevant options
        - [x] **3.2.5.2.2 Subtask:** Invoke reload only when signature changes
        - [x] **3.2.5.2.3 Subtask:** Preserve initial-load behavior with signature initialization
    - [x] **3.2.6 Step: Remove serialized reduction path in feed reducer**
      - [x] **3.2.6.1 Task:** Split reducer processing into concurrent prepare and ordered apply phases
        - [x] **3.2.6.1.1 Subtask:** Add asynchronous parent-resolution preparation stage
        - [x] **3.2.6.1.2 Subtask:** Keep ordered state mutation through apply queue
        - [x] **3.2.6.1.3 Subtask:** Preserve context-link construction across parent chain traversal
      - [x] **3.2.6.2 Task:** Replace per-event await loop with batched await for reducer input
        - [x] **3.2.6.2.1 Subtask:** Queue all eligible events in a single reducer batch
        - [x] **3.2.6.2.2 Subtask:** Await reducer batch completion via `Promise.all` when `shouldAwait` is enabled
        - [x] **3.2.6.2.3 Subtask:** Keep skip and dedupe checks valid under concurrent resolution
      - [x] **3.2.6.3 Task:** Validate reducer refactor and metrics integrity
        - [x] **3.2.6.3.1 Subtask:** Preserve reducer span instrumentation (`reducer_start`/`reducer_end`)
        - [x] **3.2.6.3.2 Subtask:** Validate no diagnostics regressions in feed/reducer files
        - [x] **3.2.6.3.3 Subtask:** Confirm no monolithic file threshold violations
    - [x] **3.2.7 Step: Eliminate duplicate dedupe/sort layers across service and UI**
      - [x] **3.2.7.1 Task:** Remove UI-side dedupe/sort pass in feed `loadMore`
        - [x] **3.2.7.1.1 Subtask:** Remove `uniqBy + sortEventsDesc` from feed buffering path
        - [x] **3.2.7.1.2 Subtask:** Keep pagination window semantics intact via render-count slicing
        - [x] **3.2.7.1.3 Subtask:** Validate file-level diagnostics remain clean
      - [x] **3.2.7.2 Task:** Switch feed UI to authoritative stream result snapshots
        - [x] **3.2.7.2.1 Subtask:** Track latest sorted/deduped event snapshot from data service
        - [x] **3.2.7.2.2 Subtask:** Derive visible events and buffer directly from snapshot slices
        - [x] **3.2.7.2.3 Subtask:** Preserve first-event and first-10-rendered metric behavior
    - [x] **3.2.8 Step: Add feed-specific loader stages (ingest/reduce/context/render)**
      - [x] **3.2.8.1 Task:** Add feed stage templates to loader status model
        - [x] **3.2.8.1.1 Subtask:** Add stage IDs for ingest, context-resolve, reduce-apply, and first-window render
        - [x] **3.2.8.1.2 Subtask:** Define truthful base/slow messaging for each feed stage
        - [x] **3.2.8.1.3 Subtask:** Validate file-level diagnostics remain clean
      - [x] **3.2.8.2 Task:** Wire feed operation lifecycle with per-reload operation IDs
        - [x] **3.2.8.2.1 Subtask:** Enter ingest stage on reload start
        - [x] **3.2.8.2.2 Subtask:** Exit feed load stage state on first-window completion or teardown
        - [x] **3.2.8.2.3 Subtask:** Prevent cross-instance status leakage with unique operation IDs
      - [x] **3.2.8.3 Task:** Drive feed stage transitions from reducer phases
        - [x] **3.2.8.3.1 Subtask:** Emit reducer phase callbacks (`context-resolve`, `reduce-apply`, `idle`)
        - [x] **3.2.8.3.2 Subtask:** Map reducer phases to feed loader stages in `Feed.svelte`
        - [x] **3.2.8.3.3 Subtask:** Confirm no monolithic file threshold violations
    - [x] **3.2.9 Step: Implement adaptive load-size tuning by device/network profile**
      - [x] **3.2.9.1 Task:** Create reusable feed load-sizing utility
        - [x] **3.2.9.1.1 Subtask:** Detect runtime network tier and data-saver preference
        - [x] **3.2.9.1.2 Subtask:** Detect runtime device tier from CPU/memory hints
        - [x] **3.2.9.1.3 Subtask:** Return bounded initial/incremental/prefetch load plan
      - [x] **3.2.9.2 Task:** Wire adaptive load plan into feed stream loading path
        - [x] **3.2.9.2.1 Subtask:** Apply adaptive initial load size on feed reload
        - [x] **3.2.9.2.2 Subtask:** Apply adaptive incremental load and prefetch threshold in `loadMore`
        - [x] **3.2.9.2.3 Subtask:** Include active load plan metadata in query-start metrics payload
      - [x] **3.2.9.3 Task:** Validate adaptive load-size changes and modularity constraints
        - [x] **3.2.9.3.1 Subtask:** Validate file-level diagnostics remain clean
        - [x] **3.2.9.3.2 Subtask:** Confirm no file exceeds 500-line modularity threshold
        - [x] **3.2.9.3.3 Subtask:** Keep behavior compatible with existing windowing/non-windowing paths

## Stage 4 — UX Behavior and Failure Handling

- [x] **4.0 Stage 4 Complete**
  - [x] **4.1 Phase: Loader UX spec**
    - [x] **4.1.1 Step: Define stage messaging behavior**
      - [x] **4.1.1.1 Task:** Populate `08-Loader-UX-Behavior-Spec.md` with stage copy and transitions
        - [x] **4.1.1.1.1 Subtask:** Author base/slow/error copy for each stage
        - [x] **4.1.1.1.2 Subtask:** Define transition guards and precedence rules
        - [x] **4.1.1.1.3 Subtask:** Validate copy against real technical dependencies
      - [x] **4.1.1.2 Task:** Define slow-state escalation and action affordances
        - [x] **4.1.1.2.1 Subtask:** Define escalation thresholds by stage
        - [x] **4.1.1.2.2 Subtask:** Define available actions (retry, fallback, reduce depth)
        - [x] **4.1.1.2.3 Subtask:** Add anti-flicker and stale-state rules
    - [x] **4.1.2 Step: Align UX with technical states**
      - [x] **4.1.2.1 Task:** Ensure every message maps to a real technical operation
        - [x] **4.1.2.1.1 Subtask:** Build mapping table stage -> emitter location
        - [x] **4.1.2.1.2 Subtask:** Remove any synthetic/non-truthful messaging
        - [x] **4.1.2.1.3 Subtask:** Add verification checklist for future stages
      - [x] **4.1.2.2 Task:** Identify missing status emissions needed in code
        - [x] **4.1.2.2.1 Subtask:** List missing enter/update/exit points
        - [x] **4.1.2.2.2 Subtask:** Prioritize missing emissions by user impact
        - [x] **4.1.2.2.3 Subtask:** Create implementation tickets
  - [x] **4.2 Phase: Failure/degradation planning**
    - [x] **4.2.1 Step: Define degraded modes**
      - [x] **4.2.1.1 Task:** Fill `09-Failure-and-Degradation-Playbook.md` for relay slowness/timeouts
        - [x] **4.2.1.1.1 Subtask:** Define degraded behavior for each failure mode
        - [x] **4.2.1.1.2 Subtask:** Define timeout thresholds per operation class
        - [x] **4.2.1.1.3 Subtask:** Add fallback data/source strategy
      - [x] **4.2.1.2 Task:** Add user-safe fallback UX and retry/backoff rules
        - [x] **4.2.1.2.1 Subtask:** Define retry ceilings and jitter/backoff profile
        - [x] **4.2.1.2.2 Subtask:** Define persistent failure UX path
        - [x] **4.2.1.2.3 Subtask:** Define accessibility-compliant error states
    - [x] **4.2.2 Step: Operational readiness**
      - [x] **4.2.2.1 Task:** Add escalation paths and ownership matrix
        - [x] **4.2.2.1.2 Subtask:** Assign ownership per failure category
        - [x] **4.2.2.1.3 Subtask:** Add response-time expectations
      - [x] **4.2.2.2 Task:** Add failure simulation scenarios
        - [x] **4.2.2.2.1 Subtask:** Build scenario catalog (relay lag, packet loss, partial cache)
        - [x] **4.2.2.2.2 Subtask:** Define expected system/UX behavior for each scenario

## Stage 5 — Validation, Rollout, and Tuning

- [x] **5.0 Stage 5 Complete**
  - [x] **5.1 Phase: Experimentation**
    - [x] **5.1.1 Step: Define experiments**
      - [x] **5.1.1.1 Task:** Populate `10-Experiment-and-A-B-Test-Plan.md` with cohort plan and KPIs
        - [x] **5.1.1.1.1 Subtask:** Define cohort eligibility and assignment strategy
        - [x] **5.1.1.1.2 Subtask:** Define primary and secondary KPIs
        - [x] **5.1.1.1.3 Subtask:** Define experiment duration and sample size assumptions
      - [x] **5.1.1.2 Task:** Define guardrails and experiment stop conditions
        - [x] **5.1.1.2.1 Subtask:** Set guardrail thresholds (errors, regressions, abandonments)
        - [x] **5.1.1.2.2 Subtask:** Define early-stop and rollback criteria
        - [x] **5.1.1.2.3 Subtask:** Define decision owner for stop signals
    - [x] **5.1.2 Step: Evaluate outcomes**
      - [x] **5.1.2.1 Task:** Record before/after performance deltas
        - [x] **5.1.2.1.1 Subtask:** Capture p50/p95 delta table by surface
        - [x] **5.1.2.1.3 Subtask:** Attach confidence intervals/stat significance
      - [x] **5.1.2.2 Task:** Decide promote/iterate/reject per experiment
        - [x] **5.1.2.2.1 Subtask:** Apply decision rubric consistently
        - [x] **5.1.2.2.2 Subtask:** Record rationale and next action
        - [x] **5.1.2.2.3 Subtask:** Update backlog and roadmap impact
  - [x] **5.2 Phase: Release and post-launch**
    - [x] **5.2.1 Step: Rollout safely**
      - [x] **5.2.1.1 Task:** Complete `11-Rollout-Runbook-and-Regression-Gates.md`
        - [x] **5.2.1.1.1 Subtask:** Fill pre-release checklist and owners
        - [x] **5.2.1.1.2 Subtask:** Define canary rollout percentages and timing
        - [x] **5.2.1.1.3 Subtask:** Define rollback execution checklist
    - [x] **5.2.2 Step: Post-launch review**
      - [x] **5.2.2.1 Task:** Complete `12-Post-Launch-Review-and-Tuning.md` within 3 business days
        - [x] **5.2.2.1.1 Subtask:** Summarize KPI and UX outcomes
        - [x] **5.2.2.1.2 Subtask:** Document incidents/regressions and causes
      - [x] **5.2.2.2 Task:** Feed follow-up items back into Stage 3 backlog
        - [x] **5.2.2.2.1 Subtask:** Convert findings into ranked backlog entries
        - [x] **5.2.2.2.2 Subtask:** Re-score backlog with new data
        - [x] **5.2.2.2.3 Subtask:** Update next sprint plan

## Meta Tracking

- [x] **M.1 Weekly status checkpoint posted**
  - [x] **M.1.1 Subtask:** Collect weekly metrics snapshot
  - [x] **M.1.2 Subtask:** Summarize completed/in-progress/blocked items
- [x] **M.2 Risks updated weekly**
  - [x] **M.2.1 Subtask:** Review risk register changes
  - [x] **M.2.2 Subtask:** Update mitigation owners and due dates
- [x] **M.3 Top 3 blockers visible at top of this file**
  - [x] **M.3.1 Subtask:** Refresh blocker list at weekly checkpoint
  - [x] **M.3.2 Subtask:** Add unblock owner and ETA per blocker
  - [x] **M.3.3 Subtask:** Remove resolved blockers and archive notes
