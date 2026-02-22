# Progress Tracker — Relay Auth + UX Hardening

Date: 2026-02-22
Legend: `Phase -> Task -> Sub-task`

- [x] 0.0 Program Setup

  - [x] 0.1 Publish planning docs
    - [x] 0.1.1 Create README and implementation plan
    - [x] 0.1.2 Create progress tracker + UX/telemetry/QA references

- [x] 0.2 Baseline preflight scaffolding

  - [x] 0.2.1 Add relay capability status model (`ready`, `auth-required`, `no-groups`, `unreachable`)
  - [x] 0.2.2 Add create/join relay check UI with status badges
  - [x] 0.2.3 Add auth-required gating with explicit user acknowledgement state

- [ ] 1.0 Capability Probe Robustness

  - [x] 1.1 Add timeout/retry policy
    - [x] 1.1.1 Configure probe timeout defaults
    - [x] 1.1.2 Add bounded retry/backoff
  - [x] 1.2 Add probe cache + TTL
    - [x] 1.2.1 Cache by normalized relay URL
    - [x] 1.2.2 Expire and refresh stale records
  - [ ] 1.3 Enforce viability gate
    - [x] 1.3.1 Require at least one ready relay for create/join
    - [x] 1.3.2 Add actionable blocking copy

- [ ] 2.0 Relay Auth UX (Challenge/Response)

  - [ ] 2.1 Implement handshake flow
    - [x] 2.1.1 Request challenge from relay
    - [x] 2.1.2 Sign challenge via user signer
    - [x] 2.1.3 Submit auth event and confirm state
  - [x] 2.2 Handle auth lifecycle
    - [x] 2.2.1 Track auth state per relay
    - [x] 2.2.2 Handle expiry and retry paths

- [ ] 3.0 Secured Relay Credential UX

  - [ ] 3.1 Add credential profile inputs
    - [x] 3.1.1 Relay-level auth method indicators
    - [x] 3.1.2 Missing-credential warnings
  - [x] 3.2 Document local secret handling constraints

- [ ] 4.0 Share Access Package

  - [x] 4.1 Create sender-side access package
    - [x] 4.1.1 Include relay list and auth requirements
    - [x] 4.1.2 Include security mode and fallback expectations
  - [x] 4.2 Create receiver-side setup checklist

- [ ] 5.0 Validation + Rollout
  - [ ] 5.1 Unit/integration/e2e coverage
    - [x] 5.1.1 Expand unit coverage for relay auth + share/checklist helpers
    - [x] 5.1.2 Add e2e smoke for group setup create/join relay UX surfaces
    - [ ] 5.1.3 Run staged QA pass for relay-auth setup scenarios
  - [x] 5.2 Telemetry + alert thresholds
  - [ ] 5.3 Staged rollout recommendation

## Prioritized Execution Order

Priority `P0` (Blockers for secure real-world use)

1. **2.1 Implement handshake flow**

- Why first: current auth-required path is acknowledgement-only; secured relays need real challenge/response.

2. **1.3 Enforce viability gate**

- Why second: prevents failed create/join submissions when no usable relay path exists.

3. **2.2 Handle auth lifecycle**

- Why third: avoids brittle auth behavior (expired sessions, retry loops) after handshake lands.

Priority `P1` (Reliability + operability)

4. **1.1 Timeout/retry policy**
5. **1.2 Probe cache + TTL**
6. **5.2 Telemetry + alert thresholds**

Priority `P2` (Completion + scale)

7. **3.0 Secured Relay Credential UX**
8. **4.0 Share Access Package**
9. **5.1 Test expansion**
10. **5.3 Staged rollout recommendation**

## Immediate Next Sprint (Recommended)

- [x] S1.1 Implement `2.1.1` request challenge from relay.
- [x] S1.2 Implement `2.1.2` sign challenge via signer.
- [x] S1.3 Implement `2.1.3` submit auth event + relay state transition.
- [x] S1.4 Implement `1.3.1` require at least one `ready` relay before create/join submit.
- [x] S1.5 Implement `1.3.2` blocking copy with explicit remediation actions.

## Dependency Notes

- `2.2` depends on `2.1`.
- `3.0` depends on stable `2.1/2.2` auth states.
- `4.0` should consume final relay/auth state model from `2.x` and viability rules from `1.3`.
- `5.x` validation should expand after `2.1 + 1.3` land to avoid test churn.
