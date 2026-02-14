# Cache Implementation Progress Tracker

Status: Active
Owner: Copilot + Core Team
Last Updated: 2026-02-13
Related Spec: `docs/cache/spec.md`

## Usage

- Check the box when a task is complete.
- Keep numbering stable once assigned.
- Update `Last Updated` on any change.
- Do not delete completed items; append new items.

## Stage 1 — Contracts and Instrumentation (Phase 1)

- [x] 1.0 Stage 1 Complete
  - [x] 1.1 Create cache implementation tracker
  - [x] 1.2 Add query-key contracts and canonical hashing utilities
  - [x] 1.3 Add cache policy contracts + defaults
  - [x] 1.4 Add cache metrics hooks for baseline visibility
  - [x] 1.5 Wire baseline metrics into shared feed lifecycle
  - [x] 1.6 Wire baseline metrics into Intel nav map lifecycle
  - [x] 1.7 Add unit tests for query-key and policy stability
  - [x] 1.8 Run targeted validation and record results

## Stage 2 — Shared Read Service (Phase 2)

- [x] 2.0 Stage 2 Complete
  - [x] 2.1 Introduce FeedDataService read contract
  - [x] 2.2 Implement local snapshot + background revalidate scaffolding
  - [x] 2.3 Adapt shared Feed consumer to service
  - [x] 2.4 Adapt Intel Nav Map consumer to service

## Stage 3 — Retention and Bypass Rationalization

- [x] 3.0 Stage 3 Complete
  - [x] 3.1 Implement retention class model
  - [x] 3.2 Tune storage limits/eviction by class
  - [x] 3.3 Audit and reduce unnecessary `skipCache: true` callsites
  - [x] 3.4 Document strict-freshness exceptions

## Stage 4 — Groups Integration

- [x] 4.0 Stage 4 Complete
  - [x] 4.1 Establish canonical groups projection hydration path
  - [x] 4.2 Align groups with shared cache substrate or dedicated lane
  - [x] 4.3 Verify group list/chat/details warm-start behavior

## Stage 5 — Stabilization and Acceptance

- [~] 5.0 Stage 5 In Progress
  - [x] 5.1 Add integration coverage for feed/map/groups warm-start + revalidate
  - [~] 5.2 Validate mute/delete/order correctness under cached + fresh merges
  - [~] 5.3 Validate unread counters for notifications + groups under cache replay
  - [ ] 5.4 Capture baseline cache metrics (hit ratio, first-data latency, stale age)
  - [~] 5.5 Run focused runtime smoke pass on feed, map, and group routes
  - [~] 5.6 Record acceptance sign-off and open follow-up issues

## Implementation Notes

- Current focus: Stage 5 stabilization and follow-up runtime telemetry checks.
- Groups now hydrate via a dedicated lane in `src/app/groups/state.ts` (repository-first + background revalidate request).

### Stage 5 Scope

- Stage 5 is a post-implementation verification gate focused on acceptance testing and telemetry baselining.
- No major architecture changes are planned in this stage; only fixes required to satisfy acceptance criteria.
- Stage 5 execution report: `docs/cache/stage5-acceptance.md`.

### Strict-Freshness Exceptions (remaining `skipCache: true`)

- `src/engine/requests.ts` `deriveEvent`: targeted identity/address miss fetch must bypass stale local cache.
- `src/engine/requests.ts` `createPeopleLoader`: search UX expects strict relay freshness for incremental term updates.
- `src/engine/requests.ts` `listenForNotifications`: live unread correctness depends on network-first subscription path.
- `src/engine/requests.ts` `listenForMessages` (3 subscriptions): DM/wrap streams stay strict-fresh for message consistency.
- `src/engine/group-transport-secure-ops.ts` secure group subscribe path: trust and reconciliation lane requires strict-fresh relay reads.

## Validation Log

- 2026-02-13: `pnpm -s vitest run tests/unit/engine/cache.spec.ts` (pass, 6/6)
- 2026-02-13: `pnpm -s eslint src/app/shared/Feed.svelte src/app/views/IntelNavMap.svelte src/engine/cache.ts tests/unit/engine/cache.spec.ts` (pass)
- 2026-02-13: editor diagnostics check for touched files via VS Code errors API (no errors)
- 2026-02-13: `pnpm -s vitest run tests/unit/engine/cache.spec.ts tests/unit/engine/feed-data-service.spec.ts` (pass, 9/9)
- 2026-02-13: `pnpm -s eslint src/engine/feed-data-service.ts src/app/shared/Feed.svelte src/app/views/IntelNavMap.svelte tests/unit/engine/cache.spec.ts tests/unit/engine/feed-data-service.spec.ts` (pass)
- 2026-02-13: `pnpm -s vitest run tests/unit/engine/cache.spec.ts tests/unit/engine/feed-data-service.spec.ts tests/unit/engine/storage-retention.spec.ts` (pass, 12/12)
- 2026-02-13: `pnpm -s eslint src/engine/storage.ts src/engine/state.ts src/engine/requests.ts src/engine/cache.ts tests/unit/engine/storage-retention.spec.ts` (pass)
- 2026-02-13: `pnpm -s eslint src/app/groups/state.ts src/app/views/GroupList.svelte src/app/views/GroupDetail.svelte src/app/views/GroupConversation.svelte` (pass)
- 2026-02-13: `pnpm -s vitest run tests/unit/engine/group-transport-projection.spec.ts tests/unit/engine/group-transport.spec.ts tests/unit/engine/group-transport-secure-ops.spec.ts` (pass, 11/11)
- 2026-02-13: `pnpm -s vitest run tests/unit/engine/cache.spec.ts tests/unit/engine/feed-data-service.spec.ts tests/unit/engine/storage-retention.spec.ts tests/unit/engine/utils/events.spec.ts tests/unit/domain/group-projection.spec.ts tests/unit/domain/group-control.spec.ts tests/unit/app/groups/state.spec.ts tests/unit/app/util/geoint.spec.ts` (pass, 54/54)
- 2026-02-13: `pnpm -s check:errors` (pass, 0 type/lint errors)
- 2026-02-13: `pnpm -s cypress run --spec cypress/e2e/feed.cy.ts,cypress/e2e/search.cy.ts` (pass, 3/3)
