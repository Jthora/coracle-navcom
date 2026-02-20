# Navcom PQC Capability Negotiation

Status: Draft
Owner: Client Engineering + Security Architecture
Last Updated: 2026-02-18
Depends On: 03-architecture-overview.md, 05-key-distribution-and-lifecycle.md

Navigation: Previous: [05-key-distribution-and-lifecycle.md](05-key-distribution-and-lifecycle.md) | Next: [07-dm-integration-design.md](07-dm-integration-design.md)

## Purpose

This document defines capability signaling and negotiation for security mode selection.
It ensures deterministic behavior across mixed-client and mixed-policy environments.

## Audience

- Client protocol implementers
- Security reviewers
- UX designers for trust signaling

## Negotiation Goals

- Select strongest mutually supported mode by policy.
- Prevent silent downgrade in strict contexts.
- Produce deterministic outcomes with explicit reason codes.
- Keep behavior interoperable with legacy clients.

## Capability Vocabulary

- `mode.classical`: classical-only encrypted transport profile.
- `mode.hybrid`: PQ + classical hybrid profile.
- `mode.strict`: policy requiring hybrid-only send.
- `mode.compat`: policy allowing controlled fallback.

## Capability Signaling Fields

- `caps.version`: capability schema version.
- `caps.modes`: supported mode list.
- `caps.algs`: supported algorithm profiles.
- `caps.key_id`: active PQ key reference.
- `caps.updated_at`: freshness timestamp.

## Discovery Sources

- Local cached capability snapshot.
- Signed peer capability events.
- Fallback heuristic from observed message behavior.

Signed data is preferred when available.

## Selection Algorithm (Deterministic)

1. Load sender policy mode.
2. Resolve peer capabilities and freshness.
3. Intersect supported modes and algorithms.
4. Choose highest-priority compatible profile.
5. If none available, evaluate fallback policy.
6. Emit mode decision and reason code.

## Priority Rules

- Strict mode prefers hybrid only.
- Compatibility mode prefers hybrid then classical.
- Unknown/ambiguous capabilities do not imply hybrid support.
- Expired PQ key support invalidates hybrid eligibility.

## Fallback Rules

- Strict mode: block send if no valid hybrid path.
- Compatibility mode: fallback to classical with warning.
- Group strict policy may block send if any required participant lacks support.
- Group compatibility policy may allow partial strategy by defined rule set.

## Downgrade Reason Codes

- `NEGOTIATION_NO_CAPS`
- `NEGOTIATION_STALE_CAPS`
- `NEGOTIATION_NO_SHARED_ALG`
- `NEGOTIATION_MISSING_KEY`
- `NEGOTIATION_POLICY_BLOCKED`
- `NEGOTIATION_RELAY_LIMIT`

## Group Negotiation Considerations

- Group capability state is aggregate across active participants.
- Secure mode eligibility should account for membership roles and policy.
- Epoch transitions may require refreshed capability checks.
- Partial support strategies must be explicit and deterministic.

## User-Facing Behavior

- Show lock/trust indicator corresponding to negotiated mode.
- Show warning when message is downgraded.
- Provide reason summary in diagnostics or details panel.
- Require explicit confirmation for sensitive downgrade contexts if configured.

## Freshness Requirements

- Capability data has finite freshness window.
- Stale capabilities trigger refresh attempt before final mode decision.
- Refresh failure maps to fallback or block by policy.

## Ambiguity Handling

- Conflicting capability records resolved by deterministic latest-valid rule.
- Invalid signatures invalidate capability claim.
- Missing required fields treated as unsupported capability state.

## Security Considerations

- Capability spoofing must be mitigated by signed data validation.
- Replay of old capability records mitigated by freshness checks.
- Silent fallback is prohibited where strict mode applies.

## Interop Considerations

- Legacy peers with no capability signal should remain reachable in compatibility mode.
- Versioned capability schema allows gradual evolution.
- Unknown future modes should not crash negotiation logic.

## Testing Matrix Requirements

- Strict sender vs no-cap recipient.
- Strict sender vs stale-cap recipient.
- Compatibility sender vs no-shared-alg recipient.
- Group with mixed-capability members.
- Conflicting capability records.
- Capability refresh failures.

## Telemetry Requirements

- Negotiation mode outcomes distribution.
- Downgrade reasons by category.
- Blocked sends due to strict policy.
- Capability refresh success/failure rates.

## Decision Log

- 2026-02-18: Defined deterministic negotiation sequence and reason taxonomy.
- 2026-02-18: Established strict-mode no-silent-downgrade rule.
- 2026-02-18: Added group aggregate capability constraints.

## Open Questions

- Should group compatibility mode allow per-recipient dual wrapping in first release?
- What freshness interval offers best reliability/security tradeoff?
- Which UX confirmation moments are mandatory vs optional?

## Review Checklist

- Is mode selection deterministic in all known edge cases?
- Are downgrade reasons actionable and testable?
- Are strict/compatibility semantics clearly distinct?
- Is group behavior consistent with membership and epoch policies?

## Exit Criteria

- Security sign-off on downgrade prevention behavior.
- Product sign-off on user-visible warnings and confirmations.
- QA sign-off on matrix coverage feasibility.
