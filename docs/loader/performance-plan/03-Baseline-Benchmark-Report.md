# 03 - Baseline Benchmark Report

Status: Draft
Owner: Frontend Platform
Last Updated: 2026-02-24

## Test Environments

| Profile | OS | Browser | Network Profile | Notes |
|---|---|---|---|---|
| Local baseline | Linux | Pending capture | Pending capture | Workspace-driven baseline run |

## Baseline Results by Surface

Capture targets (required):
- Feed
- Intel Map
- Notifications
- Groups
- Bootstrap

Metrics per surface:
- `loader.first_event_ms` (p50/p95)
- `loader.first_10_rendered_ms` (p50/p95)
- `loader.settle_ms` (p50/p95)
- Timeout/slow-state frequency

## Top Outliers

Pending first benchmark run.

## Reproduction Notes

Minimum run protocol:
1. Start from clean app session state.
2. Use fixed relay profile and account state across runs.
3. Execute each surface flow 10x.
4. Record raw timing outputs and summarize p50/p95.
5. Save artifacts in benchmark evidence folder before summarizing.

Capture/export workflow (implemented):
0. Initialize baseline artifact (no-op if already present):
	- `pnpm benchmark:loader:baseline:init-runs`
1. In browser console, reset run state before each surface sequence:
	- `window.__loaderBenchmark.clearRuns()`
	- `window.__loaderBenchmark.resetMetrics()`
2. Execute one surface scenario, then capture:
	- `window.__loaderBenchmark.captureRun({surface: "feed", label: "feed-run-01"})`
3. Set reproducibility context before exporting runs:
	- `window.__loaderBenchmark.refreshEnvironmentSnapshot()`
	- `window.__loaderBenchmark.setSessionContext({relayProfile: "baseline-relays-v1", accountState: "default-follow-graph", notes: "Chrome stable, no throttling"})`
4. Repeat until each required surface has 10 captured runs.
5. Export captured runs and save JSON to `docs/loader/performance-plan/cache/baseline-runs.json`:
	- `copy(JSON.stringify(window.__loaderBenchmark.exportRuns(), null, 2))`
6. Check capture progress and remaining run targets:
	- `pnpm benchmark:loader:baseline:capture-status`
	- `pnpm benchmark:loader:baseline:capture-status:brief`
	- `pnpm benchmark:loader:baseline:capture-next`
	- `pnpm benchmark:loader:baseline:capture-loop -- --iterations=3`
	- Optional auto-refresh variant: `pnpm benchmark:loader:baseline:capture-loop:refresh -- --iterations=1`
	- Operator hint: run `pnpm benchmark:loader:baseline:capture-next` between capture loops to keep the next target surface visible in terminal.
	- Quick capture loop snippet (copy/paste in terminal):
		- `pnpm benchmark:loader:baseline:capture-next`
		- `pnpm benchmark:loader:baseline:capture-status:brief`
7. Validate baseline completeness:
	- `pnpm benchmark:loader:baseline:validate-completeness`
	- Optional strict gate: `pnpm benchmark:loader:baseline:validate-completeness:strict`
8. Generate summaries:
	- `pnpm benchmark:loader:baseline:summary`
9. Validate telemetry quality and diagnosability:
	- `pnpm benchmark:loader:baseline:validate-telemetry`
	- Optional strict gate: `pnpm benchmark:loader:baseline:validate-telemetry:strict`
10. Generate diagnosability and blind-spot analysis:
	- `pnpm benchmark:loader:baseline:diagnose`
11. Assess telemetry usefulness checklist coverage:
	- `pnpm benchmark:loader:baseline:assess-usefulness`
	- Optional strict gate: `pnpm benchmark:loader:baseline:assess-usefulness:strict`
12. Generate observability remediation tickets from diagnosability blind spots:
	- `pnpm benchmark:loader:baseline:remediation`
	- Optional strict gate: `pnpm benchmark:loader:baseline:remediation:strict`
13. Generate consolidated baseline issue review (completeness + validation + diagnosability + usefulness + remediation):
	- `pnpm benchmark:loader:baseline:issue-review`
	- Optional strict gate: `pnpm benchmark:loader:baseline:issue-review:strict`
14. Generate post-capture checklist summary:
	- `pnpm benchmark:loader:baseline:post-capture-checklist`
	- Optional strict gate: `pnpm benchmark:loader:baseline:post-capture-checklist:strict`
15. Use generated evidence:
	- `docs/loader/performance-plan/cache/baseline-capture-status.json`
	- `docs/loader/performance-plan/cache/baseline-capture-status.md`
	- `docs/loader/performance-plan/cache/baseline-completeness.json`
	- `docs/loader/performance-plan/cache/baseline-completeness.md`
	- `docs/loader/performance-plan/cache/baseline-summary.json`
	- `docs/loader/performance-plan/cache/baseline-summary.md`
	- `docs/loader/performance-plan/cache/baseline-telemetry-validation.json`
	- `docs/loader/performance-plan/cache/baseline-diagnosability.json`
	- `docs/loader/performance-plan/cache/baseline-diagnosability.md`
	- `docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json`
	- `docs/loader/performance-plan/cache/baseline-telemetry-usefulness.md`
	- `docs/loader/performance-plan/cache/baseline-observability-remediation.json`
	- `docs/loader/performance-plan/cache/baseline-observability-remediation.md`
	- `docs/loader/performance-plan/cache/baseline-issue-review.json`
	- `docs/loader/performance-plan/cache/baseline-issue-review.md`
	- `docs/loader/performance-plan/cache/baseline-post-capture-checklist.json`
	- `docs/loader/performance-plan/cache/baseline-post-capture-checklist.md`
16. Sync this report from generated artifacts:
	- `pnpm benchmark:loader:baseline:sync-report`
17. Sync top blockers into progress tracker:
	- `pnpm benchmark:loader:baseline:sync-tracker-blockers`
	- Blocker lines include owner/ETA metadata sourced from `docs/loader/performance-plan/blocker-ownership.json`.
18. Sync Stage 2 telemetry usefulness checklist status into progress tracker:
	- `pnpm benchmark:loader:baseline:sync-tracker-usefulness`
	- Sync updates Stage 2.2.2.1/2.2.2.2 task + subtask checkboxes from `baseline-telemetry-usefulness.json` so outstanding priorities reflect current checklist evidence.
19. Sync prioritized immediate next steps into progress tracker:
	- `pnpm benchmark:loader:baseline:sync-tracker-next-steps`
	- Next-step sync prioritizes failed actions from `baseline-post-capture-checklist.json` and `baseline-unblock-checklist.json` when available (including telemetry-usefulness granularity-aware guidance when `2.2.2.1.3` evidence is incomplete), with owner/ETA metadata sourced from `docs/loader/performance-plan/blocker-ownership.json`; the refresh-and-sync step is owner-tagged from the highest-priority active unblock source.
20. Evaluate Stage 2 closure readiness:
	- `pnpm benchmark:loader:baseline:check-closure`
	- Optional strict gate: `pnpm benchmark:loader:baseline:check-closure:strict`
	- Closure output includes failed-gate summary + recommended action entries for operator follow-up.
21. Sync Stage 2 closure status into progress tracker:
	- `pnpm benchmark:loader:baseline:sync-tracker-closure`
	- Tracker closure header includes prioritized failed-gate detail/action lines sourced from `baseline-stage2-closure.json`, with owner/ETA metadata sourced from `docs/loader/performance-plan/blocker-ownership.json`.
22. Generate prioritized owner-assigned unblock checklist:
	- `pnpm benchmark:loader:baseline:unblock-checklist`
	- Default output limits to one action per blocker type to reduce duplicate operator tasks.
	- Telemetry-usefulness actions derive detail/action text from failing `2.2.2.1.3` granularity evidence when available.
	- Output artifacts: `baseline-unblock-checklist.json` and `baseline-unblock-checklist.md`.
23. Sync prioritized unblock actions into progress tracker:
	- `pnpm benchmark:loader:baseline:sync-tracker-unblock`
	- Tracker header uses top action items from `baseline-unblock-checklist.json`.

Shortcut command:
- `pnpm benchmark:loader:baseline:refresh` (runs completeness + summary + validation + diagnosability analysis + usefulness assessment + remediation + issue review + post-capture checklist)
- `pnpm benchmark:loader:baseline:post-capture-checklist` (summarizes final post-capture gate actions from generated artifacts)
- `pnpm benchmark:loader:baseline:init-runs` (creates baseline-runs artifact scaffold if missing)
- `pnpm benchmark:loader:baseline:capture-status` (reports capture progress and remaining required runs per surface)
- `pnpm benchmark:loader:baseline:capture-status:brief` (prints compact progress + next target summary)
- `pnpm benchmark:loader:baseline:capture-next` (shortcut for quick capture loop checks)
- `pnpm benchmark:loader:baseline:capture-loop` (iterates `capture-next`; pass `--iterations=<n>` after `--`)
- `pnpm benchmark:loader:baseline:capture-loop:refresh` (iterates `capture-next` + `refresh-and-sync` per loop)
- `pnpm benchmark:loader:baseline:sync-tracker-usefulness` (syncs Stage 2.2.2.1/2.2.2.2 task and subtask checkbox status from telemetry usefulness artifact signals)
- `pnpm benchmark:loader:baseline:sync-tracker-next-steps` (syncs prioritized immediate-next-step list from generated baseline artifacts, prioritizes failed post-capture/unblock actions, includes target-surface and overall capture progress in the completeness-first line when capture-status totals are available, includes telemetry-usefulness granularity-aware guidance when `2.2.2.1.3` evidence is incomplete, annotates actions with owner/ETA metadata, owner-tags refresh-and-sync guidance from the highest-priority active unblock source, and owner-tags fallback Stage 2 guidance lines)
- `pnpm benchmark:loader:baseline:sync-tracker-next-steps:annotate-stage3` (syncs immediate next steps with Stage 3 annotation mode enabled, a visible mode line, a visible compact capture-progress badge line, and a visible outstanding-priorities line sourced from unchecked Stage 2 tasks with task IDs and titles)
- `pnpm benchmark:loader:baseline:sync-tracker-closure` (syncs closure status and failed-gate action lines, annotating closure actions with owner/ETA metadata)
- `pnpm benchmark:loader:baseline:priority-checklist` (emits focused checklist guidance for the top outstanding Stage 2 tracker tasks with recommended commands and evidence paths)
- `pnpm benchmark:loader:baseline:refresh-and-sync` (runs completeness + summary + validation + diagnosability analysis + remediation + issue review + report sync + tracker blocker sync + tracker next-step sync + closure check + tracker closure sync + unblock checklist generation + tracker unblock sync)
- `pnpm benchmark:loader:baseline:refresh-and-sync:annotate-stage3` (runs refresh-and-sync with Stage 3 annotation mode enabled, a visible mode line, a visible compact capture-progress badge line, and a visible outstanding-priorities line sourced from unchecked Stage 2 tasks with task IDs and titles)
- `pnpm benchmark:loader:baseline:check-closure` (aggregates all Stage 2 gate artifacts into one closure status output)
- `pnpm benchmark:loader:baseline:close:strict` (runs refresh-and-sync then strict closure gate for one-command hard gating)

## Baseline Snapshot Table

| Surface | first_event p50/p95 (ms) | first_10_rendered p50/p95 (ms) | settle p50/p95 (ms) | Slow-state rate | Evidence |
|---|---:|---:|---:|---:|---|
| Feed | Pending | Pending | Pending | Pending | baseline-summary.json + baseline-completeness.json + baseline-telemetry-validation.json + baseline-diagnosability.json + baseline-telemetry-usefulness.json + baseline-observability-remediation.json + baseline-issue-review.json |
| Intel Map | Pending | Pending | Pending | Pending | baseline-summary.json + baseline-completeness.json + baseline-telemetry-validation.json + baseline-diagnosability.json + baseline-telemetry-usefulness.json + baseline-observability-remediation.json + baseline-issue-review.json |
| Notifications | Pending | Pending | Pending | Pending | baseline-summary.json + baseline-completeness.json + baseline-telemetry-validation.json + baseline-diagnosability.json + baseline-telemetry-usefulness.json + baseline-observability-remediation.json + baseline-issue-review.json |
| Groups | Pending | Pending | Pending | Pending | baseline-summary.json + baseline-completeness.json + baseline-telemetry-validation.json + baseline-diagnosability.json + baseline-telemetry-usefulness.json + baseline-observability-remediation.json + baseline-issue-review.json |
| Bootstrap | Pending | Pending | Pending | Pending | baseline-summary.json + baseline-completeness.json + baseline-telemetry-validation.json + baseline-diagnosability.json + baseline-telemetry-usefulness.json + baseline-observability-remediation.json + baseline-issue-review.json |

## Capture Completeness

- Status: Fail
- Run count: 0/50
- Source: docs/loader/performance-plan/cache/baseline-completeness.json

## Telemetry Validation

- Status: Pass (issues: 0)
- Source: docs/loader/performance-plan/cache/baseline-telemetry-validation.json

## Diagnosability Assessment

- Status: Ready (unknown classifications: 0%)
- Synthetic scenarios: Pass
- Blind spots: 0
- Source: docs/loader/performance-plan/cache/baseline-diagnosability.json

## Telemetry Usefulness Assessment

- Status: Fail
- Checklist: 5/6
- Source: docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json

## Observability Remediation

- Status: Pass
- Tickets: 0
- Source: docs/loader/performance-plan/cache/baseline-observability-remediation.json

## Baseline Issue Review

- Status: Fail
- Blockers: 2
- Source: docs/loader/performance-plan/cache/baseline-issue-review.json
