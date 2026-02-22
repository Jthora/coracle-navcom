# QA Checklist — Relay Auth + UX Hardening

## Functional

- [ ] Relay capability check returns status per selected relay.
- [ ] Create is blocked when all relays are non-viable.
- [ ] Join is blocked when required auth is unresolved.
- [ ] Auth-required relay can transition to authenticated state.
- [ ] Share package includes relay/auth requirements.

## Resilience

- [ ] Probe handles timeout and unreachable relays gracefully.
- [ ] Probe handles malformed relay info payloads.
- [ ] Auth flow handles signer unavailability and rejected signatures.

## UX Clarity

- [ ] Security mode copy remains explicit about security/trade-offs/PQC usage.
- [ ] Relay status badges are understandable and actionable.
- [ ] Blocking messages include clear next steps.

## Regression

- [ ] Existing group create/join flows still function with simple relay setups.
- [ ] Existing guided-create unit tests remain passing.
- [ ] New relay capability/auth tests pass.

## Release Readiness

- [ ] Telemetry events are emitted with required fields.
- [ ] Rollback instructions are documented.
- [ ] QA artifacts captured for staging sign-off.
