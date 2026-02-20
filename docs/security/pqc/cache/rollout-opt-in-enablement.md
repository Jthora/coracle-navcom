# PQC External Opt-In Enablement Plan

Generated At: 2026-02-19T23:39:16.150Z
Executable: no
Operator: release-operations
Recommendation: hold-populate-readiness-metrics
Cohort ID: external-opt-in-beta

## Inputs

- Approved users file: /home/jono/workspace/coracle-navcom/coracle-navcom/docs/security/pqc/cache/external-opt-in-approved-users.json
- Ticket ID: RFC-EXTERNAL-BETA-000
- Requested By: release-operations@navcom.local
- Approved By: security-architecture@navcom.local

## Flag Set

- pqc_enabled
- pqc_dm_enabled
- pqc_groups_enabled

## Approved User Rows

| # | Pubkey | External ID | Cohort | Status |
| ---: | --- | --- | --- | --- |
| 1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa | beta-user-001 | external-opt-in-beta | blocked |

## Blocked Reasons

- checkpoint-not-ready: hold-populate-readiness-metrics

## Guidance
- Do not enable external opt-in flags yet.
- Resolve blocked reasons, then rerun enablement workflow.
- Keep checkpoint and instruction artifacts up to date before cohort changes.

