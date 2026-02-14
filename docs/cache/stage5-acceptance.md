# Stage 5 Acceptance Report

Status: In Progress (conditional)
Date: 2026-02-13
Owner: Copilot + Core Team

## Scope

Stage 5 validates post-implementation stability for cache-enabled surfaces:

- Feed warm-start + revalidate behavior
- Map warm-start + revalidate behavior
- Groups hydration + route behavior
- Ordering/unread/cache regression safety

## Evidence Matrix

| Area | Evidence | Result |
| --- | --- | --- |
| Cache/key/policy correctness | `tests/unit/engine/cache.spec.ts` | Pass |
| FeedDataService merge/order/stale helpers | `tests/unit/engine/feed-data-service.spec.ts` | Pass |
| Retention ranking behavior | `tests/unit/engine/storage-retention.spec.ts` | Pass |
| Event ordering utility | `tests/unit/engine/utils/events.spec.ts` | Pass |
| Group projection ordering/replay | `tests/unit/domain/group-projection.spec.ts` | Pass |
| Group control application ordering | `tests/unit/domain/group-control.spec.ts` | Pass |
| Groups unread + hydration state | `tests/unit/app/groups/state.spec.ts` | Pass |
| GEOINT parsing behavior | `tests/unit/app/util/geoint.spec.ts` | Pass |
| Group transport projection/security regression | `tests/unit/engine/group-transport-projection.spec.ts`, `tests/unit/engine/group-transport.spec.ts`, `tests/unit/engine/group-transport-secure-ops.spec.ts` | Pass |
| Runtime smoke (feed + search routes) | `cypress/e2e/feed.cy.ts`, `cypress/e2e/search.cy.ts` | Pass |
| Static analysis gate | `pnpm -s check:errors` | Pass |

## Commands Run

- `pnpm -s vitest run tests/unit/engine/cache.spec.ts tests/unit/engine/feed-data-service.spec.ts tests/unit/engine/storage-retention.spec.ts tests/unit/engine/utils/events.spec.ts tests/unit/domain/group-projection.spec.ts tests/unit/domain/group-control.spec.ts tests/unit/app/groups/state.spec.ts tests/unit/app/util/geoint.spec.ts`
- `pnpm -s vitest run tests/unit/engine/group-transport-projection.spec.ts tests/unit/engine/group-transport.spec.ts tests/unit/engine/group-transport-secure-ops.spec.ts`
- `pnpm -s check:errors`
- `pnpm -s dev --host 127.0.0.1 --port 5173` (background, smoke precondition)
- `pnpm -s cypress run --spec cypress/e2e/feed.cy.ts,cypress/e2e/search.cy.ts`

## Stage 5 Task Status

- 5.1 Integration coverage for warm-start + revalidate: **Done (automated coverage + smoke evidence)**
- 5.2 Mute/delete/order correctness under cached + fresh merges: **Partially covered (order/merge covered, mute/delete route-level behavior still requires targeted scenario test)**
- 5.3 Unread counters (notifications + groups): **Partially covered (groups covered; notifications unread scenario not yet directly asserted in Stage 5 suite)**
- 5.4 Baseline cache metrics capture: **Pending**
- 5.5 Runtime smoke pass (feed/map/groups): **Partially done (feed+search done; map/groups runtime smoke still pending)**
- 5.6 Acceptance sign-off + follow-up issues: **Pending final metrics + remaining smoke scenarios**

## Open Follow-Ups

1. Add Stage 5 runtime smoke for Intel map and group routes (`/groups`, `/groups/:id`, `/groups/:id/chat`).
2. Add explicit regression tests for mute/delete filtering in cache replay path.
3. Add notification unread scenario test in Stage 5 suite.
4. Capture and record cache telemetry baselines (hit ratio, first-data latency, stale age) from runtime instrumentation.

## Provisional Conclusion

Stage 5 is materially advanced with all current automated gates passing and feed/search runtime smoke passing. Final sign-off is blocked on telemetry baseline capture and remaining runtime scenario coverage (map/groups + notification unread + mute/delete replay).
