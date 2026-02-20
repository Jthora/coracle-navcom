# Navcom PQC Relay Compatibility and Limits

Status: Draft
Owner: Platform Operations + Client Engineering
Last Updated: 2026-02-18
Depends On: 04-wire-format-envelope.md, 07-dm-integration-design.md, 08-group-chat-integration-design.md

Navigation: Previous: [08-group-chat-integration-design.md](08-group-chat-integration-design.md) | Next: [10-implementation-plan.md](10-implementation-plan.md)

## Purpose

This document defines relay-related constraints and operational guidance for PQC payloads.
It focuses on compatibility, size limits, and decentralized deployment strategies.

## Audience

- Relay operators
- Client engineers
- QA and release management

## Design Principle

Relays should not need cryptographic changes for Navcom PQC payload support.
Clients remain responsible for encryption/decryption and policy behavior.

## Relay Reality Constraints

- Event size limits vary by relay.
- Some relays reject large or unusual content patterns.
- Relay availability and policies can change over time.
- Public relays may provide limited observability.

## Compatibility Objectives

- Preserve publishability of signed events across common relay profiles.
- Avoid assumptions of large payload acceptance.
- Enable safe operation on both public and self-hosted relays.

## NIP-11 and Metadata Use

- Read relay metadata where available.
- Derive advertised size constraints and policy hints.
- Treat missing metadata conservatively.
- Cache relay capability hints with refresh windows.

## Payload Sizing Strategy

- Preflight estimate envelope size before publish.
- Compare against known relay budget for selected targets.
- Enforce local hard cap to avoid repeated rejection loops.
- Prefer compact encoding and minimized wrap payloads.

## DM Sizing Guidance

- Keep typical DM secure envelope below conservative relay threshold.
- If recipient count increases payload materially, use policy path for fallback or split.
- Warn user when target relay set likely rejects secure payload.

## Group Sizing Guidance

- Favor epoch-key reuse to avoid per-message full wrap overhead.
- Publish epoch package updates separately when feasible.
- Avoid embedding excessive per-member material in every group message.

## Chunking Policy

- Chunking is optional and policy-gated.
- Chunking should only be used where receiver support is confirmed.
- Chunk integrity and reassembly rules must be strict.
- Chunk timeout and cleanup rules should avoid indefinite partial state.

## Relay Selection Implications

- Secure sends may require relay subset selection by payload acceptance likelihood.
- In mixed relay sets, choose best-effort path while preserving policy constraints.
- For strict mode, rejection by all viable relays should block send.

## Self-Hosted Relay Recommendations

- Set explicit max event size suitable for secure envelopes.
- Monitor rejection rates and top rejection reasons.
- Keep relay software updated and policy documented.
- Provide local dashboards for secure publish health.

### Recommended Relay Size Settings (PQC Beta)

Initial baseline values for self-hosted operators:

- Minimum accepted max-event size: **16 KiB**
- Recommended default max-event size: **64 KiB**
- High-capacity target max-event size: **128–256 KiB**
- Client-side conservative preflight cap: **4 KiB** for baseline compatibility safety

These defaults balance compatibility with public-relay ecosystems and room for secure envelope expansion.
Operators with constrained infrastructure should keep client preflight caps conservative even when server-side limits are raised.

### Safe Defaults for PQC Beta

- Enable explicit size-based rejection messages in relay responses.
- Keep publish timeout and backoff policies enabled for oversized-event retries.
- Prefer progressive rollouts of higher size caps (16 KiB → 64 KiB → 128 KiB) with monitoring at each step.
- Document local policy for event-size exceptions to support incident triage.

## Public Relay Considerations

- Expect unpredictable size and spam policy behavior.
- Build robust retry/backoff and relay diversification.
- Keep compatibility fallback available where policy allows.

## Failure Handling

- Relay reject due to size -> classify and map to actionable UI.
- Relay timeout -> retry alternative relay path within policy.
- Partial publish success -> track per-relay status and show delivery caveats.

## Metrics to Track

- Secure payload publish success by relay.
- Rejection reasons by relay and payload class.
- Average envelope size by message type.
- Chunking usage and completion rates.
- Fallback due to relay constraints.

### Operator Monitoring KPIs

- **Size rejection rate**: percentage of publish attempts rejected due to relay size limits.
- **Secure publish success rate**: successful publish acknowledgements for secure payloads.
- **p95 relay publish latency**: publish acknowledgement latency for secure events.
- **Fallback activation rate**: compatibility fallback usage caused by relay constraints.

### Suggested Alert Thresholds (Initial)

- Size rejection rate > **5%** over 15 minutes.
- Secure publish success rate < **95%** over 15 minutes.
- p95 relay publish latency > **3s** sustained for 10 minutes.
- Fallback activation rate > **10%** over 30 minutes.

Thresholds should be tuned by environment and traffic profile after initial beta telemetry baselines are established.

## Security Considerations

- Relay constraints can induce downgrade pressure.
- Selective relay rejection can be used as disruption vector.
- Relay-visible metadata remains a privacy consideration.

## Operational Playbook Hooks

- Trigger alerts for rising size-based reject rates.
- Trigger alerts for unusual secure publish failure spikes.
- Provide recommendation to switch relay profile for affected users.

## Test Plan Requirements

- Simulate low-size-limit relay profiles.
- Simulate mixed relay sets with partial acceptance.
- Validate fallback behavior under strict and compatibility modes.
- Validate chunking end-to-end where enabled.

## Decision Log

- 2026-02-18: Confirmed no relay cryptographic feature changes required.
- 2026-02-18: Added preflight payload size checks as mandatory operational control.
- 2026-02-18: Established separate recommendations for self-hosted vs public relays.

## Open Questions

- What default hard cap should Navcom enforce before publish?
- Should chunking be enabled in first public beta?
- What minimum relay metadata confidence is required for adaptive routing?

## Review Checklist

- Are relay constraints reflected in send policy logic?
- Are operator recommendations concrete and actionable?
- Are failure reasons mapped to useful user guidance?
- Is test matrix realistic for mixed relay environments?

## Exit Criteria

- Relay compatibility guidance reviewed by operations.
- Client preflight strategy agreed by engineering.
- QA relay-limit scenarios added and passing.
