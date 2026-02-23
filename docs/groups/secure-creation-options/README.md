# Secure Creation Options

Status: Active planning
Owner: Core Team + Security + App
Last Updated: 2026-02-23

## Purpose

This directory is the execution source of truth for making group creation options **actually enforce runtime behavior** for:

- `Auto`
- `Basic`
- `Secure`
- `Max`

The goal is to ensure group create/join/chat behavior aligns with protocol and crypto guarantees, including authentic PQC-capable operation where explicitly supported.

## Scope

- Security mode contracts and runtime enforcement rules.
- NIP profile support requirements (`NIP-29`, `NIP-EE`, `NIP-104` signaling/profile alignment).
- Real cryptographic requirements for “Secure” and “Max” modes.
- Validation evidence needed before claiming mode readiness.

## Non-Goals

- Marketing copy that overstates guarantees.
- Implicit fallback behavior in strict modes.
- Shipping “PQC-ready” claims without cryptographic and runtime proof.

## Document Map

### Core Contracts

1. [01-charter-and-non-negotiables.md](01-charter-and-non-negotiables.md)
2. [02-security-mode-contracts.md](02-security-mode-contracts.md)
3. [03-cryptography-requirements.md](03-cryptography-requirements.md)
4. [04-protocol-support-matrix.md](04-protocol-support-matrix.md)

### Execution Plan

5. [05-implementation-milestones.md](05-implementation-milestones.md)
6. [06-validation-and-evidence-gates.md](06-validation-and-evidence-gates.md)
7. [07-rollout-and-risk-controls.md](07-rollout-and-risk-controls.md)
8. [08-decision-log.md](08-decision-log.md)

### Audit + Backlog + Evidence Boundaries

9. [09-deep-codebase-audit-and-coverage-gaps.md](09-deep-codebase-audit-and-coverage-gaps.md)
10. [10-m1-m2-file-by-file-implementation-backlog.md](10-m1-m2-file-by-file-implementation-backlog.md)
11. [11-surface-evidence-reporting.md](11-surface-evidence-reporting.md)
12. [12-test-coverage-edge-case-plan.md](12-test-coverage-edge-case-plan.md)

### Program Tracking

13. [progress-tracker.md](progress-tracker.md)

### P1 Contract Alignment Artifacts

14. [13-p1-contract-freeze-workbook.md](13-p1-contract-freeze-workbook.md)
15. [14-telemetry-schema-freeze-v1.md](14-telemetry-schema-freeze-v1.md)
16. [15-invite-mode-mapping-contract.md](15-invite-mode-mapping-contract.md)

## How To Execute This Plan

1. Start with [05-implementation-milestones.md](05-implementation-milestones.md) for phase intent and exit criteria.
2. Use [06-validation-and-evidence-gates.md](06-validation-and-evidence-gates.md) to determine what counts as proof.
3. Track delivery state and task checkboxes in [progress-tracker.md](progress-tracker.md).
4. Keep surface-specific evidence boundaries enforced via [11-surface-evidence-reporting.md](11-surface-evidence-reporting.md).

## Core Success Criteria

- Mode selection drives runtime behavior deterministically.
- `Secure` and `Max` modes fail closed when guarantees cannot be met.
- PQC claims are tied to verifiable cryptographic and interoperability evidence.
- Telemetry exposes requested vs resolved mode and downgrade/blocked reasons.

## Current Deep-Audit Snapshot

See [09-deep-codebase-audit-and-coverage-gaps.md](09-deep-codebase-audit-and-coverage-gaps.md) for implementation realities discovered after initial plan drafting, including secure control-path gaps, protocol signaling limits, and test-drift risks that must be addressed in milestone execution.
