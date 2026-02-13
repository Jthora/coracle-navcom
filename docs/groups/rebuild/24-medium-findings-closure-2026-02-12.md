# Medium Findings Closure — 2026-02-12

Status: Complete
Owner: Core Team
Reviewers: QA Lead, Product Lead
Related Issues: GI-2026-003, GI-2026-004

## 1. Scope

Close the remaining medium-severity findings after Stage 6 sign-off:

- GI-2026-003: Invite accept requires manual action to enter group join flow.
- GI-2026-004: Mixed-capability fallback requires matrix-grade validation beyond prior narrow scenarios.

## 2. Implementation Summary

### GI-2026-003

- Added deterministic auto-join resolution helper in `src/app/invite/accept.ts`:
  - `resolveAutoJoinGroupInvite(...)`
- Wired invite accept view to auto-open group join flow only when all conditions are met:
  - active session
  - exactly one valid group invite
  - no invalid group entries
  - no people/relay invite payload sections
- View integration implemented in `src/app/views/InviteAccept.svelte`.

### GI-2026-004

- Added matrix-grade mixed-capability validation suite:
  - `tests/unit/app/groups/mixed-capability-matrix.spec.ts`
- Matrix validates seven deterministic scenarios across readiness/tier/fallback combinations, including:
  - R4 success path
  - capability fallback path
  - strict capability block path
  - tier-policy block paths
  - tier override-confirmed fallback path

## 3. Validation Evidence

Command:

`pnpm vitest run tests/unit/app/groups/mixed-capability-lanes.spec.ts tests/unit/app/groups/mixed-capability-matrix.spec.ts tests/unit/app/groups/capability-gate.spec.ts tests/unit/engine/group-transport.spec.ts tests/unit/app/invite/accept.spec.ts`

Result:

- Test Files: 5 passed
- Tests: 19 passed
- Duration: 3.92s
- Non-blocking note: IndexedDB runtime warnings are expected in this environment.

## 4. Closure Decision

- GI-2026-003: Closed (auto-join path implemented with strict guard conditions).
- GI-2026-004: Closed (matrix-grade mixed-capability coverage added and passing).

## 5. Residual Risk

- Low: Invite auto-join triggers only in constrained group-only invite payloads.
- Low: Mixed-capability validation remains simulation-based; operational controls remain protected by rollback and kill-switch runbooks.
