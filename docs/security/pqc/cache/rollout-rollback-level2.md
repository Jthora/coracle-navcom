# PQC Rollback Level 2 Validation

Generated At: 2026-02-20T00:35:50.830Z
Operator: release-operations
Complete: yes
Ticket ID: PQC-ROLLBACK-001
Environment: staging

## Rollback Summary

- Level: 2
- Executed at: 2026-02-20T00:30:00.000Z
- Trigger reason: Incident drill: validate staged rollback level 2 (disable hybrid send, preserve receive).
- Impact: Hybrid sends disabled to contain sender risk; hybrid receive remains available for continuity.

## Restoration Prerequisites

- Sender-path issue remediation confirmed with owner sign-off.
- Receive-path compatibility metrics remain below alert thresholds.

## Validation Issues

- none

## Guidance
- Rollback level 2 validated: hybrid send disabled while receive support remains active.
- Proceed to rollback level 3 validation only when full PQ disable is required.

