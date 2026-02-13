# Baseline Lane Evidence — 2026-02-12

Status: Complete
Owner: QA Lead
Reviewers: Interop Lead
Related Tracker Tasks: 6.1.1.1.b, 6.1.1.1.c

## 1. Execution Context

Execution Type: Baseline lane matrix execution batch (unit-lane aligned full run).
Environment: Local workspace test run via Vitest.
Command:

`pnpm vitest run tests/unit/app/groups tests/unit/app/invite tests/unit/engine/group-* tests/unit/domain/group-*`

## 2. Summary Results

- Test Files: 42 passed
- Tests: 160 passed
- Duration: 18.53s
- Non-blocking note: IndexedDB not available, running without persistence (expected in this environment).

## 3. Lane Mapping Coverage

| Lane ID | Coverage Source | Result |
| --- | --- | --- |
| L-BASE-001 | `routes.spec.ts`, `create-join.spec.ts`, `serializers.spec.ts` | PASS |
| L-BASE-002 | `create-join.spec.ts`, `audit-history.spec.ts`, `group-transport-baseline.spec.ts` | PASS |
| L-BASE-003 | `moderation-composer.spec.ts`, `admin-visibility.spec.ts`, `group-control.spec.ts` | PASS |
| L-BASE-004 | `policy.spec.ts`, `group-tier-policy.spec.ts`, `group-transport.spec.ts` | PASS |
| L-BASE-005 | `invite/schema.spec.ts`, `invite/create.spec.ts`, `invite/accept.spec.ts`, `invite-router-serializer.spec.ts` | PASS |

## 4. Completion Notes for 6.1.1.1

Baseline lane execution coverage for `L-BASE-001..005` is complete for current validation scope.
Lane outcomes are fully green in the consolidated matrix run.
No baseline blocking variances remain open for Stage 6.1.1 closure.

## 5. Artifact IDs

- EVID-L-BASE-001
- EVID-L-BASE-002
- EVID-L-BASE-003
- EVID-L-BASE-004
- EVID-L-BASE-005
