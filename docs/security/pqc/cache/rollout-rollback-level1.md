# PQC Rollback Level 1 Validation

Generated At: 2026-02-20T00:35:48.751Z
Operator: release-operations
Complete: yes
Ticket ID: PQC-ROLLBACK-001
Environment: staging

## Rollback Summary

- Level: 1
- Executed at: 2026-02-20T00:20:00.000Z
- Trigger reason: Incident drill: validate staged rollback level 1 (disable strict defaults).
- Impact: Strict defaults disabled; PQC send/receive remains enabled while reducing policy risk.

## Restoration Prerequisites

- Daily telemetry monitor returns stable secure success and downgrade rates.
- Kill-switch and rollback audit logs recorded for this drill window.

## Validation Issues

- none

## Guidance
- Rollback level 1 validated: strict defaults disabled while PQC paths remain active.
- Proceed to rollback level 2 validation when operationally required.

