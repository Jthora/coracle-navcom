# Security Hardening and Key Lifecycle

Status: Draft
Owner: Security Lead
Reviewers: Architecture, Core Team
Last Updated: 2026-02-12

## 1. Purpose

Define security controls required for group functionality.
Define lifecycle rules for group-related key material.
Ensure secure-tier behavior is enforceable and testable.

## 2. Scope

In scope: application-level key handling and policy.
In scope: local storage protections and runtime hygiene.
In scope: secure mode downgrade and override controls.
Out of scope: OS-level secure enclave internals.

## 3. Security Principles

Least privilege for secrets.
Minimize key material lifetime in memory and disk.
No silent downgrade of confidentiality posture.
Deterministic policy enforcement over best effort.

## 4. Secret Classes

S1: Long-lived identity key references.
S2: Transport session keys.
S3: Group state secrets.
S4: Temporary derivation artifacts.
S5: Invite-related sensitive payloads.

## 5. Lifecycle Stages

Generate.
Store.
Use.
Rotate.
Revoke.
Destroy.
Audit.

## 6. Generation Requirements

Use approved cryptographic primitives.
Use secure randomness source.
Tag generated material with scope metadata.
Record generation context for audit (non-secret fields only).

## 7. Storage Requirements

Store secure-tier secrets encrypted at rest.
Separate storage namespace by account and environment.
Prevent cross-workspace key material reuse by default.
Support explicit secure wipe operation.

## 8. Runtime Handling Requirements

Avoid plaintext secret logs.
Avoid long-lived in-memory references.
Zero sensitive buffers where practical.
Wrap sensitive operations in strict error boundaries.

## 9. Rotation Policy

Rotate signing/session material per policy intervals.
Rotate on membership changes when required by transport mode.
Rotate after suspected compromise events.
Record rotation events in audit log.

## 10. Revocation Policy

Revocation supported for compromised devices.
Revocation propagated through membership state machine.
Revocation blocks future message decryption where applicable.
Revocation state visible to operators.

## 11. Destruction Policy

Destroy expired temporary secrets promptly.
Destroy deprecated group-state versions beyond retention window.
Support emergency wipe for secure-tier groups.
Verify destruction success via integrity markers.

## 12. Device Compromise Workflow

Detect compromise signal.
Freeze sensitive actions if policy requires.
Initiate membership remediation path.
Force key rotation sequence.
Log incident with redacted identifiers.

## 13. Downgrade Guardrails

Tier 2 groups cannot auto-downgrade.
Any forced downgrade requires explicit admin override.
Override requires reason code and expiry.
Override creates high-priority audit event.

## 14. Local Encryption Requirements

Use per-account encryption root.
Derive per-group encryption contexts.
Protect metadata indexes for secure-tier groups when feasible.
Provide migration path for legacy plaintext caches.

## 15. Backup and Recovery

Define which secrets are recoverable versus non-recoverable.
Avoid backup of ephemeral secrets where prohibited.
Document operator recovery playbook.
Test recovery drills before broad rollout.

## 16. Audit Requirements

Log security-relevant actions with correlation IDs.
Do not log secret values.
Retain audit logs for defined operational window.
Support audit export with redaction.

## 17. Policy Enforcement Points

Create group flow.
Join group flow.
Send message flow.
Membership change flow.
Mode transition flow.

## 18. Security Telemetry Requirements

Count policy-denied operations.
Count downgrade attempts.
Count key rotation failures.
Count secure storage read/write failures.
Never include secret payloads in telemetry.

## 19. Security Test Requirements

Unit tests for policy gates.
Integration tests for key rotation and revocation.
Fuzz tests for malformed secure events.
Failure-injection tests for storage corruption.

## 20. Red-Team Checklist

Attempt unauthorized mode downgrade.
Attempt stale key replay.
Attempt role escalation through malformed control events.
Attempt secret leakage through diagnostics path.
Attempt projection poisoning with malformed payloads.

## 21. Incident Severity Mapping

Critical: confirmed confidentiality compromise.
High: unauthorized admin/membership action.
Medium: repeated secure-mode fallback faults.
Low: isolated non-sensitive policy warning.

## 22. Response Expectations

Critical incident immediate mitigation and freeze options.
High incident limited blast radius containment.
Medium incident monitored remediation within defined SLA.
Low incident batched remediation with trend analysis.

## 23. Compliance with Threat Tiers

Tier 0 requires baseline hardening subset.
Tier 1 requires policy and audit controls.
Tier 2 requires full hardening and strict downgrade prevention.
Tier requirements enforced by policy engine.

## 24. Open Questions

Final secure storage backend abstraction details.
Cross-device secure-state sync policy.
Operator-controlled key retention windows.

## 25. Exit Criteria For This Document

Security controls approved by security review board.
Lifecycle rules mapped to implementation tasks.
Tests mapped to quality gates.
Referenced by rollout and incident runbooks.
