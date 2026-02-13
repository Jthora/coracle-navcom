# Mixed-Capability Lane Evidence — 2026-02-12

Status: Draft
Owner: Interop Lead
Reviewers: QA Lead, Security Lead
Related Tracker Tasks: 6.1.1.3.a, 6.1.1.3.b

## 1. Execution Context

Execution Type: Mixed-capability mismatch simulation and fallback telemetry validation.
Environment: Local workspace test run via Vitest.
Command:

`pnpm vitest run tests/unit/app/groups/mixed-capability-lanes.spec.ts tests/unit/app/groups/capability-gate.spec.ts tests/unit/engine/group-transport.spec.ts`

## 2. Summary Results

- Test Files: 3 passed
- Tests: 12 passed
- Duration: 3.86s
- Non-blocking note: IndexedDB not available, running without persistence (expected in this environment).

## 3. Simulation Cases (6.1.1.3.a)

| Case ID | Scenario | Expected Outcome | Result |
| --- | --- | --- | --- |
| MIX-CASE-001 | Secure capability mismatch (`R3`, missing signer feature) with fallback enabled. | Fallback to baseline with fallback telemetry event. | PASS |
| MIX-CASE-002 | Same mismatch with fallback disabled. | Capability-blocked error with capability-blocked telemetry event. | PASS |
| MIX-CASE-003 | Tier-1 unresolved downgrade under mismatch. | Tier-policy blocked result with policy-block telemetry event. | PASS |

## 4. Fallback UX + Telemetry Validation (6.1.1.3.b)

- Capability gate warning includes secure mismatch readiness and reason context when secure pilot is enabled.
- Transport diagnostics emit fallback, capability-blocked, and tier-policy-blocked telemetry-aligned events.
- Telemetry summary counters correctly aggregate fallback/blocked event counts.

## 5. Artifact IDs

- EVID-L-MIX-001
- EVID-L-MIX-002
- EVID-L-MIX-003
