# 05 - Bottleneck Hypotheses and Evidence

Status: In Progress
Owner: Frontend Platform
Last Updated: 2026-02-24

## Hypothesis Register

| ID | Hypothesis | Current Status | Linked Backlog Item(s) |
|---|---|---|---|
| H-01 | Feed reducer path is serialized by await-heavy preparation, driving p95 spinner tail time. | Validated | #1 |
| H-02 | Duplicate dedupe/sort layers in service and UI create redundant CPU work during loadMore and snapshot handling. | Validated | #2 |
| H-03 | Generic loader stages hide true bottleneck phase, causing poor diagnosis and less truthful UX messaging. | Validated | #3 |
| H-04 | Missing reducer span + first-window metrics prevents precise attribution of delay between ingest/reduce/render. | Validated | #4 |
| H-05 | Reactive reload churn causes avoidable cold starts and duplicate reduction work. | Validated | #5 |
| H-06 | Operation status cross-talk from non-unique IDs causes stale state and incorrect stage arbitration. | Validated | #6, #8 |
| H-07 | Lack of abort contract for feed stream keeps unnecessary in-flight work after navigation/context changes. | Validated | #7 |
| H-08 | Immediate worker offload is required to hit current performance goals. | Disproved (for current wave) | #9 (deferred) |
| H-09 | Adaptive load-size tuning by device/network reduces first-window latency without correctness regressions. | Validated | #10 |

## Evidence Table

| ID | Code-path / Artifact Evidence | Measurable Signal | Evidence Summary |
|---|---|---|---|
| H-01 | `src/engine/partials/NoteReducer.svelte`; Stage 3.2.6 implementation notes in tracker | `reducer_start` → `reducer_end` span; p95 first-window latency | Refactor split prepare/apply and batched async waits; hypothesis confirmed by implementation direction and telemetry model updates. |
| H-02 | Feed service/UI dedupe ownership cleanup; Stage 3.2.7 checklist | Reduced duplicate sort/dedupe passes; lower CPU churn | Removed UI-side duplicate `uniqBy + sortEventsDesc` path and made stream snapshot authoritative. |
| H-03 | Loader stage model + feed phase mapping updates; Stage 3.2.8 checklist | Truthful stage transition coverage | Added ingest/context/reduce/render stage lifecycle and reducer phase mapping; diagnosis signal fidelity improved. |
| H-04 | Cache metric phase model changes; Stage 3.2.4 checklist | Presence of `first_10_rendered`, `reducer_start`, `reducer_end` | Instrumentation points added to support diagnosis granularity and backlog proof. |
| H-05 | Feed reload signature gating and handler simplification; Stage 3.2.5 checklist | Reduced redundant reload invocations | Removed duplicate manual reload triggers and gated reactive reload on stable signature changes. |
| H-06 | Route loader operation-ID correctness fixes; Stage 3.2.3.1 + 3.2.3.3 checklist | Fewer stale/incorrect stage transitions | Unique per-navigation operation IDs and arbitration tie-break alignment remove stale status cross-talk paths. |
| H-07 | Feed stream API contract changes; Stage 3.2.3.2 checklist | Reduced wasted work after abort/cancel | `abort()` contract wired to underlying controller while preserving stream API compatibility. |
| H-08 | `docs/loader/performance-plan/07-Concurrency-and-Worker-Feasibility.md` | Worker ROI threshold not met for current wave | No-go decision for immediate rollout; fallback/threshold model indicates defer until stronger baseline evidence. |
| H-09 | Adaptive load-size utility + integration; Stage 3.2.9 checklist | Improved first-window behavior for constrained profiles | Adaptive initial/incremental plan introduced with bounded parameters and query metadata tagging. |

## Confidence / Impact Scoring

### Scoring Rubric (1-5)

- Impact: expected user-visible latency/UX benefit (higher is better).
- Confidence: strength of evidence from code-path audits + instrumentation (higher is stronger).
- Effort: implementation complexity and delivery cost (higher is harder).
- Risk: regression and operational risk (higher is riskier).

Weighted prioritization score:

$$
	ext{PriorityScore} = (2 \times \text{Impact}) + (2 \times \text{Confidence}) - \text{Effort} - \text{Risk}
$$

### Scored Hypotheses

| ID | Impact | Confidence | Effort | Risk | PriorityScore | Rationale |
|---|---:|---:|---:|---:|---:|---|
| H-01 | 5 | 5 | 3 | 3 | 14 | Core reducer bottleneck with direct effect on p95 tail behavior; implementation already delivered strong directional evidence. |
| H-02 | 5 | 4 | 3 | 3 | 11 | Eliminates redundant work across layers with immediate CPU-path simplification. |
| H-03 | 4 | 5 | 2 | 2 | 12 | High confidence and low risk; improves diagnosis and truthful UX at low implementation cost. |
| H-04 | 4 | 5 | 2 | 1 | 13 | Instrumentation unlocks objective validation for other hypotheses and has low rollback risk. |
| H-05 | 4 | 4 | 3 | 3 | 8 | Important churn reduction with moderate complexity/risk. |
| H-06 | 3 | 4 | 2 | 2 | 8 | Correctness-focused, moderate user impact, low complexity. |
| H-07 | 3 | 4 | 2 | 2 | 8 | Lifecycle safety gain with low risk and clear cancellation correctness value. |
| H-08 | 4 | 3 | 4 | 3 | 3 | Potential upside exists, but current baseline evidence and cost model do not justify immediate rollout. |
| H-09 | 3 | 3 | 3 | 2 | 4 | Useful incremental gain after core bottleneck fixes; lower priority than primary latency path work. |

Normalization notes:

- Scoring aligned with rankings already captured in `06-Optimization-Backlog-Prioritized.md` to keep prioritization consistent across docs.
- Disproved/deferred hypotheses remain scored for transparency but are excluded from immediate execution wave.

## Disproved Hypotheses

| ID | Hypothesis | Disproof Evidence | Guardrail / Follow-up |
|---|---|---|---|
| H-08 | Immediate worker offload is required to meet current goals. | Doc 07 no-go decision: worker transfer/coordination overhead and fallback risk do not currently beat main-thread path for target workloads. | Revisit only after refreshed baseline evidence in Doc 03 and updated reducer hotspot measurements confirm threshold eligibility. |

### Disproof Test Setup References

| Hypothesis | Test Setup Reference | What Was Measured | Outcome |
|---|---|---|---|
| H-08 | `07-Concurrency-and-Worker-Feasibility.md` → Main-Thread vs Worker Cost Model + Go/No-Go Criteria | Transfer overhead (`S + R`), worker fallback/timeout behavior, threshold eligibility, ordering/correctness risk | Immediate worker rollout rejected for current wave; defer to post-baseline refresh evidence cycle. |

### False-Positive Patterns and Guardrails

- Pattern FP-01: assuming CPU-heavy path always benefits from worker offload without accounting for transfer overhead.
	- Guardrail: require cost-model check `C_w + S + R < C_m` before enabling any worker path.
- Pattern FP-02: extrapolating gains from synthetic/high-volume bursts to standard user sessions.
	- Guardrail: require dual-cohort validation (high-volume + typical-volume) before promotion.
- Pattern FP-03: accepting worker wins that regress deterministic ordering or increase fallback noise.
	- Guardrail: block promotion when fallback/timeout rate exceeds 1% or ordering inconsistencies are detected.
- Pattern FP-04: promoting advanced-path optimization before core reducer/churn correctness baseline is stable.
	- Guardrail: maintain prerequisite gate on baseline capture/telemetry refresh and Stage 3 stability-wave completion.
