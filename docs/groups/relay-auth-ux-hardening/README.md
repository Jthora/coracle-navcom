# Groups Relay Auth + UX Hardening

Purpose: track and execute the next wave of Groups UX/security work focused on relay capability probing, challenge/response auth, and shareable access flows.

## Scope

- Create flow and join flow preflight checks for selected relays.
- Relay capability detection (`supports groups`, `auth required`, reachability).
- Auth-required relay UX for challenge/response flow.
- Share/access guidance so recipients can reliably join secured groups.

## Out of Scope (for this track)

- Re-architecture of core transport adapters.
- New cryptographic protocol design.
- Non-groups relay feature work.

## Document Map

- [Implementation Plan](implementation-plan.md)
- [Progress Tracker](progress-tracker.md)
- [UX Flows](ux-flows.md)
- [Telemetry + Alerts](telemetry-alerts.md)
- [QA Checklist](qa-checklist.md)
- [Local Secret Handling Constraints](local-secret-handling.md)

## Related References

- [Groups PQC audit action plan](../audits/2026-02-21/groups-pqc-code-audit/action-plan.md)
- [Groups PQC progress tracker](../audits/2026-02-21/groups-pqc-code-audit/progress-tracker.md)
