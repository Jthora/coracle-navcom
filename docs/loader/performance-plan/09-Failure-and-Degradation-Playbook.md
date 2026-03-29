# 09 - Failure and Degradation Playbook

Status: In Progress
Owner: App Team + Frontend Platform
Last Updated: 2026-02-24

## Failure Modes

Primary failure/degradation scenarios for current loader architecture:

1. Relay response slowness (long-tail latency, partial responses).
2. Relay timeout / request exhaustion without required payload.
3. Route module fetch failure.
4. Feed stream interruption/abort during navigation or reload.
5. Map module/bootstrap failure.
6. Submit pipeline stalls (upload, signer, publish, delayed window).

Severity rubric:

- S1: blocks core app entry/navigation.
- S2: blocks high-priority content surface (feed/map/group hydration).
- S3: non-blocking utility lookup degradation.

## Degraded Mode Behavior

| Failure Mode | Degraded Behavior | User Impact Control |
|---|---|---|
| Relay slowness on feed/map/groups | Remain in truthful slow-state stage copy; keep collecting partial events; avoid premature hard-fail | Preserve partial content rendering when available |
| Relay timeout/no payload | Exit operation cleanly; keep previously rendered data/window; surface owner-view fallback copy where available | Avoid spinner deadlock and stale blocking state |
| Route module fetch failure | Switch to route error panel and expose Retry CTA | User can reattempt without full app restart |
| Feed stream aborted by navigation/reload | Abort controller cancels in-flight stream and exits old operation ID | Prevent stale status leakage across screens |
| Map module/init failure | Capture `loadError`, exit loader status, preserve map view fallback surface | User can retry by revisiting view/reloading |
| Post submit pipeline stall/failure | Keep stage-accurate submit phase copy, then exit on failure/cancel path | User keeps control during delayed-window phase |

## Retry/Backoff Rules

Operational retry model:

- Route load failures: explicit manual retry (`LazyRouteHost.svelte` retry action).
- Relay utility fetches (`loadAll`, `deriveEvent`): bounded fetch loops + lifecycle stop/exit guards.
- Feed/map refresh loops: periodic refresh with controlled load sizes; no unbounded tight loops.

Backoff guidance for future extensions:

- Use jittered exponential backoff for repeated network-level failures.
- Cap automatic retry attempts for blocking operations before requiring user-triggered retry.
- Emit per-attempt reason tags for observability (`timeout`, `abort`, `network-error`, `validation-error`).

Retry ceilings (recommended defaults):

- Blocking route/module operations: max 2 automatic retries, then require explicit user retry.
- Feed/map background refresh: max 3 automatic retries per cycle window, then cool-down before next attempt.
- Relay utility lookup/fetch: max 2 automatic retries before fallback to partial/no-result state.

Backoff profile:

- Base delay: 500ms; multiplier: 2x; jitter: ±20%; max delay cap: 8s.
- Reset retry counter after one successful cycle.

## User Messaging for Failures

Messaging principles:

- Must map 1:1 to real operation stage.
- Must avoid synthetic promises (“almost done”) unless supported by measurable state.
- Must expose action only when action exists.

Failure messaging inventory:

- Route load failure: explicit route error text + Retry button.
- Map load failure: explicit `loadError` text in map view.
- Submit failures: owner flow-specific error handling after stage exit.
- Generic relay slowness: stage slow-state copy from loader templates.

User-safe fallback UX rules:

1. Never trap user on blocking spinner when a safe fallback exists.
2. Prefer partial-content continuity over hard reset when stale data is acceptable.
3. Show explicit retry action only when retry path is implemented and bounded.
4. Preserve cancel affordance for delayed-send flows (`post.submit.delayed-window`).
5. Use plain failure language; avoid speculative diagnostics in user copy.

Persistent failure UX path:

- First failure: show scoped error + retry affordance.
- Repeated failure after retry ceiling: show stable fallback state and defer to non-blocking background retries where possible.
- Long-tail degraded state: keep slow-state copy truthful and offer context-appropriate action (`retry`, `back`, `open another surface`).

Accessibility expectations:

- All recovery controls keyboard reachable.
- Error/fallback text concise and understandable without color-only cues.
- Avoid rapid message flicker during retry loops.

## Operational Escalation

Escalation ownership matrix:

- Frontend Platform: loader-stage correctness, operation lifecycle, stale-state arbitration.
- App Team: UX copy fidelity, actionable recovery controls, failure-view behavior.
- Engine maintainers: relay request primitives and cancellation behavior.

Operational ownership + response-time expectations:

| Failure Class | Primary Owner | Secondary Owner | Initial Response Target | Escalation Target |
|---|---|---|---|---|
| S1 bootstrap/route blocking | Frontend Platform | App Team | 30 minutes | 2 hours |
| S2 feed/map/groups degradation | App Team | Frontend Platform | 60 minutes | 4 hours |
| S3 relay utility degradation | Engine maintainers | Frontend Platform | 4 hours | 1 business day |

Trigger conditions:

- S1 trigger: app bootstrap/route failures recurring in release build.
- S2 trigger: feed/map/groups degraded behavior persisting beyond slow-state thresholds with no recovery.
- S3 trigger: relay lookup/fetch utility regressions affecting non-blocking workflows.

Response expectations:

1. Confirm operation lifecycle exits correctly (no stale blocking banner).
2. Confirm error/slow copy matches actual emitting stage.
3. Apply rollback or feature-flag disable for recent high-risk changes if stop-ship criteria are hit.

## Failure Simulation Scenarios

| Scenario ID | Scenario | Injection Method | Expected System Behavior | Expected UX Behavior |
|---|---|---|---|---|
| SIM-01 | Relay lag (high latency) | Delay relay responses and throttle event batches | Loader remains in truthful slow-state stage; operations remain cancelable; no stale stage leakage | Slow copy appears; existing content remains visible when available |
| SIM-02 | Relay timeout | Force request timeouts on feed/map/group flows | Operation exits cleanly after retry policy; fallback path retained | No infinite spinner; fallback/error state with available retry action |
| SIM-03 | Partial cache + sparse network | Return incomplete cache snapshot with delayed live events | Snapshot renders partial state; live stream updates continue; settle when possible | User sees partial content first, then progressive completion |
| SIM-04 | Route module fetch failure | Fail lazy import for target route | Route operation exits; retry path available | Route error panel + Retry button rendered |
| SIM-05 | Abort during navigation | Trigger navigation mid-feed/map load | Old operation aborted/exited; new operation ID enters cleanly | No stale prior status message after navigation |
| SIM-06 | Submit signer/publish failure | Fail signer or relay publish step | Submit pipeline exits failed stage; no dangling submit loader | Clear submit failure message; retry/cancel semantics preserved |

Simulation pass criteria:

- No scenario leaves loader status active after operation teardown/failure.
- Recovery action availability matches implemented UI controls.
- Stage copy remains consistent with real underlying operation state.
