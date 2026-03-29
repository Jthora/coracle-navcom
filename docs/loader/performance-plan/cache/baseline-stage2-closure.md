# Loader Baseline Stage 2 Closure Check

Generated: 2026-02-25T04:47:34.099Z
Overall status: Fail

## Gates

- Baseline completeness: Fail
- Telemetry validation: Pass
- Diagnosability: Pass
- Telemetry usefulness: Fail
- Observability remediation: Pass
- Issue review: Fail
- Post-capture checklist: Fail

## Missing Artifacts

- None.

## Failed Gates

- completeness: 5 issues detected (0/50 runs).
  - Action: Capture additional baseline runs, then re-run refresh-and-sync.
- telemetry-usefulness: Checklist coverage 5/6.
  - Action: Capture missing diagnostic evidence called out in baseline-telemetry-usefulness.md.
- issue-review: 2 blockers active (completeness, telemetry-usefulness).
  - Action: Resolve active gate failures, then re-run refresh-and-sync to clear issue-review blockers.
- post-capture-checklist: 4 checks failing (capture-target, completeness-gate, usefulness-gate, issue-review).
  - Action: Execute failed post-capture checklist actions, then re-run refresh-and-sync.
