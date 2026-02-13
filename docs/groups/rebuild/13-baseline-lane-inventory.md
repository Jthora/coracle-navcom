# Baseline Lane Inventory

Status: Active
Owner: Interop Lead
Reviewers: QA Lead, Core Team
Last Updated: 2026-02-12

## 1. Purpose

Define the required baseline (NIP-29) integration lanes.
Provide deterministic lane IDs for execution and evidence capture.
Bind lane scope to Stage 6.1.1.1 tracker tasks.

## 2. Scope

Applies to baseline-nip29 transport lanes only.
Covers required relay profiles for Tier 0 and Tier 1 baseline behavior.
Excludes secure-pilot-only lanes (tracked under 6.1.1.2).

## 3. Baseline Relay Sets

- RSET-B0: Local deterministic relay set for P0 baseline validation.
- RSET-B1: Public mixed relay set for P1 baseline validation.
- RSET-B2: Curated mission relay set for P2 baseline validation.

## 4. Lane Inventory (Stage 6.1.1.1.a)

| Lane ID | Tier | Mode | Profile | Relay Set | Primary Objective | Required Checks |
| --- | --- | --- | --- | --- | --- | --- |
| L-BASE-001 | 0 | baseline-nip29 | P0 | RSET-B0 | Validate create/join/control happy-path behavior in deterministic local conditions. | Route/serializer correctness, create/join publish acknowledgements, projection convergence. |
| L-BASE-002 | 0 | baseline-nip29 | P1 | RSET-B1 | Validate baseline compatibility on mixed public relays. | Capability probe readiness, fallback warnings, membership update convergence. |
| L-BASE-003 | 1 | baseline-nip29 | P1 | RSET-B1 | Validate moderation/admin action pipeline in baseline mode. | Role guardrails, moderation action persistence, audit history visibility. |
| L-BASE-004 | 1 | baseline-nip29 | P2 | RSET-B2 | Validate mission relay control actions and policy metadata updates. | Policy editor workflow, metadata edit publish/ack, roster update consistency. |
| L-BASE-005 | 1 | baseline-nip29 | P2 | RSET-B2 | Validate invite create/accept group-context workflow in baseline lane. | Structured invite payload decode, join prefill path, invalid-entry warning handling. |

## 5. Execution Binding

- Execution owner for 6.1.1.1.b: Interop Lead with QA co-review.
- Evidence owner for 6.1.1.1.c: QA Lead.
- Required evidence artifact key format: `EVID-L-BASE-###`.

## 6. Readiness Criteria Before Execution

Lane definition approved by Interop + QA.
Required test fixtures available for each lane objective.
Failure classification and variance recording path confirmed.

## 7. Exit Criteria for 6.1.1.1.a

All baseline lane IDs are defined.
Each lane has profile, relay set, objective, and required checks.
Lane inventory is referenced by interop matrix and test strategy docs.
