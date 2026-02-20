# PQC Internal Dogfood Cohort Enablement

Generated At: 2026-02-20T00:04:43.857Z
Operator: release-operations
Complete: yes
Readiness Ready Snapshot: no
Rollout Window: internal-dogfood-week-1

## Inputs

- Requested By: release-operations
- Approved By: security-architecture
- Cohort Count: 1
- Total Users: 2

## Flag Set

- pqc_enabled
- pqc_dm_enabled
- pqc_groups_enabled
- pqc_chunking_enabled

## Cohorts

| # | Cohort | Stage | Ticket | Owner | Users | Invalid Users | Status |
| ---: | --- | ---: | --- | --- | ---: | ---: | --- |
| 1 | internal-core | 1 | PQC-DOGFOOD-001 | client-engineering | 2 | 0 | ready-to-enable |

## Validation Issues

- none

## Guidance
- Apply listed flags for enableable internal cohorts in cohort-stage order.
- Run baseline expansion confirmation before adding additional internal cohorts.
- Keep readiness telemetry refreshed daily during dogfood expansion.

