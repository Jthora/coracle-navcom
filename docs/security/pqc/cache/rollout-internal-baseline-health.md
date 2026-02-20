# PQC Internal Baseline Expansion Health

Generated At: 2026-02-20T00:04:54.451Z
Operator: release-operations
Can Expand Cohort: no
Recommendation: hold-internal-expansion

## Gate Results

| Gate | Pass | Detail |
| --- | --- | --- |
| readiness-ready | no | Readiness thresholds are not passing; missing/failing metrics remain. |
| triage-owner-coverage | yes | Triage rows are owner-mapped. |
| checkpoint-gate | no | Checkpoint still has 3 failed gate(s). |
| cohort-plan-valid | yes | Internal cohort enablement plan is valid. |
| cohort-ready-exists | yes | At least one internal cohort is ready-to-enable. |

## Failed Gates

- readiness-ready: Readiness thresholds are not passing; missing/failing metrics remain.
- checkpoint-gate: Checkpoint still has 3 failed gate(s).

## Guidance
- Baseline health gates failed for internal expansion.
- Do not expand internal cohorts until failed gates are remediated and rerun.

