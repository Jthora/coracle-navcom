# Navcom PQC Test and Validation Plan

Status: Draft
Owner: QA + Security Engineering
Last Updated: 2026-02-18
Depends On: 02-security-requirements.md, 04-wire-format-envelope.md, 07-10 docs

Navigation: Previous: [10-implementation-plan.md](10-implementation-plan.md) | Next: [12-operations-and-incident-playbook.md](12-operations-and-incident-playbook.md)

## Purpose

This document defines the validation strategy for Navcom PQC communications.
It ensures correctness, security, interop, and performance are verified before rollout.

## Audience

- QA engineers
- Security reviewers
- Client engineers
- Release managers

## Validation Principles

- Threat-driven testing first.
- Deterministic pass/fail criteria.
- Coverage across strict and compatibility modes.
- Include mixed-client and mixed-relay scenarios.

## Test Categories

- Unit tests
- Integration tests
- End-to-end tests
- Interop matrix tests
- Performance and resource tests
- Failure and chaos tests
- Security regression tests

## Unit Test Scope

- Capability negotiation decision logic.
- Envelope parse/serialize canonical rules.
- Key freshness and selection rules.
- Downgrade reason code mapping.
- Epoch transition calculations.

## Integration Test Scope (DM)

- Hybrid send and receive success.
- Strict mode block behavior.
- Compatibility fallback behavior.
- Missing key and stale key handling.
- Decrypt failure classification.

## Integration Test Scope (Group)

- Secure group send and receive success.
- Membership add triggers rekey.
- Membership remove excludes future decrypt access.
- Epoch mismatch reconciliation.
- Churn batching behavior.

## End-to-End Scenarios

- New-to-new client secure DM.
- New-to-legacy client compatibility DM.
- Group with mixed capability members.
- Relay size-limit rejection and fallback.
- Incident-mode kill-switch behavior.

## Interop Matrix

Dimensions:

- Sender capability: hybrid / classical-only.
- Receiver capability: hybrid / classical-only / stale-key.
- Policy mode: strict / compatibility.
- Relay profile: permissive / constrained / mixed.

Matrix outputs:

- Expected send mode.
- Expected user-facing state.
- Expected telemetry reason code.

## Security Validation Cases

- Malformed envelope field rejection.
- Duplicate critical field rejection.
- Unknown critical algorithm handling.
- Replay-like event processing behavior.
- Signed capability spoof attempts.

## Performance Benchmarks

- Encrypt latency p50/p95/p99.
- Decrypt latency p50/p95/p99.
- Group rekey latency distribution.
- CPU and memory usage under load.
- Battery impact in mobile test runs.

## Relay Compatibility Validation

- Envelope size preflight correctness.
- Publish success by relay limit profile.
- Chunking behavior (if enabled).
- Partial relay success visibility.
- Retry and backoff correctness.

## Telemetry Validation

- Secure mode outcome counts.
- Downgrade reasons completeness.
- Decrypt failure reason normalization.
- No plaintext leakage in telemetry payloads.

## Test Data and Fixtures

- Golden envelope fixtures.
- Negative malformed fixtures.
- Capability snapshots for stale/fresh/conflict cases.
- Group membership churn event streams.
- Relay policy simulation profiles.

## Automation Strategy

- Unit and integration in CI per PR.
- Extended interop matrix nightly.
- Performance baselines on scheduled runs.
- Gate fail on MUST-requirement regressions.

## Manual and Exploratory Testing

- UX clarity for trust indicators.
- Error-message usability under failures.
- Real-device performance spot checks.
- Network instability and partial outage behavior.

## Release Gates

- Gate A: Unit + integration green for DM baseline.
- Gate B: Group secure scenarios and membership transitions green.
- Gate C: Relay compatibility and performance thresholds met.
- Gate D: Security regression suite green.

## Defect Severity Model

- Sev-1: confidentiality/integrity failure.
- Sev-2: strict-mode policy bypass.
- Sev-3: fallback/UX inconsistency.
- Sev-4: non-critical diagnostics mismatch.

## Exit Criteria by Stage

- Prototype: core tests and negative parser tests pass.
- Beta: interop matrix and perf baseline pass.
- Production: full gate suite pass with no open Sev-1/Sev-2 defects.

## Reporting Requirements

- Daily validation dashboard during beta.
- Weekly trend report for security outcome metrics.
- Release candidate validation summary with gate decisions.
- Stage 4 baseline artifact: `performance-baseline-report.md` (initial DM benchmark publication).
- Stage 4 baseline artifact updated with group rekey latency benchmarks and threshold checks.
- Stage 4 baseline artifact includes adaptive fallback thresholds and policy-safe behavior limits.
- Stage 4 baseline artifact includes profiled sustained workload runs (baseline + constrained) with CPU/memory metrics and cached snapshots in `docs/security/pqc/cache/perf-profiles.json`.
- Stage 4 baseline artifact includes phase-tagged pre/post power snapshots and analyzer summary output in `docs/security/pqc/cache/power-metrics-summary.json`.

## Decision Log

- 2026-02-18: Established multi-layer validation strategy.
- 2026-02-18: Added strict/compatibility matrix as mandatory coverage.
- 2026-02-18: Added relay constraint and performance gates.

## Open Questions

- Which mobile device set defines minimum performance baseline?
- Should chunking validation be mandatory for first beta?
- What failure-rate threshold blocks rollout escalation?

## Review Checklist

- Does every MUST requirement have automated coverage?
- Are interop cases representative of real deployment?
- Are performance thresholds realistic and enforced?
- Are security regressions monitored continuously?

## Exit Criteria

- QA and security approve test completeness.
- CI and nightly pipelines include required suites.
- Release manager confirms gate criteria enforcement.
