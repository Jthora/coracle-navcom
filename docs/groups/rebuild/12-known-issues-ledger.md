# Known Issues Ledger

Status: Active
Owner: Copilot + Core Team
Reviewers: QA, Security, Product
Last Updated: 2026-02-12

## 1. Purpose

Track unresolved implementation and rollout issues.
Assign explicit owners and target milestones.
Document mitigation status until closure.

## 2. Open Issues

| Issue ID | Summary | Severity | Owner | Target Milestone | Mitigation Status |
| --- | --- | --- | --- | --- | --- |
| None | — | — | — | — | No open issues at this time. |

## 2.1 Closed Issues

| Issue ID | Summary | Severity | Owner | Closure Date | Evidence | Residual Risk |
| --- | --- | --- | --- | --- | --- | --- |
| GI-2026-001 | Full relay interop lane runs (baseline and secure) not executed yet. | High | Interop Lead | 2026-02-12 | `14-baseline-lane-evidence-2026-02-12.md`, `16-secure-lane-evidence-2026-02-12.md` | Low; covered by rollout kill-switch and rollback drills (`19`, `20`). |
| GI-2026-002 | Secure profile variability across P2/P3 relays remains unquantified in lane artifacts. | High | Security Lead | 2026-02-12 | `16-secure-lane-evidence-2026-02-12.md` §4 variance outcomes | Low; mismatch paths validated with deterministic fallback/block behavior. |
| GI-2026-003 | Invite accept currently requires manual user action to enter join flow (no auto-join). | Medium | Product + Core Team | 2026-02-12 | `24-medium-findings-closure-2026-02-12.md`, `src/app/invite/accept.ts`, `src/app/views/InviteAccept.svelte` | Low; auto-join is restricted to single valid group-only invite payloads. |
| GI-2026-004 | Mixed capability fallback behavior requires matrix-grade validation beyond unit coverage. | Medium | QA Lead | 2026-02-12 | `24-medium-findings-closure-2026-02-12.md`, `tests/unit/app/groups/mixed-capability-matrix.spec.ts` | Low; broader matrix simulation coverage validates fallback/block determinism. |

## 3. Review Rules

Each issue must retain a named owner.
Each issue must include a target milestone.
Closed issues require evidence reference and closure date.
High-severity issues block milestone closure unless accepted via risk process.

## 4. Closure Format

Issue ID:
Closure Date:
Owner:
Evidence:
Residual Risk:
Follow-up Actions:
