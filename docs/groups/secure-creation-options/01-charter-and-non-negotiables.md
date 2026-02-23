# Charter and Non-Negotiables

Status: Draft
Owner: Product + Security + Engineering
Last Updated: 2026-02-22

## Mission

Deliver secure group creation options that are technically honest, cryptographically grounded, and operationally reliable.

## Required User-Facing Modes

- `Auto`: best available path with explicit fallback disclosure.
- `Basic`: interoperability-first path.
- `Secure`: secure lane required, no silent fallback.
- `Max`: Navcom-only PQC-capable path with strict gating.

## Non-Negotiable Principles

1. **No label without enforcement**
   - Mode labels must map to enforceable runtime behavior.
2. **No silent downgrade in strict modes**
   - `Secure` and `Max` must block or require explicit override policy.
3. **No cryptographic overclaiming**
   - “PQC encryption” claims require actual cryptographic implementation evidence.
4. **No hidden protocol ambiguity**
   - Requested and resolved protocol/mode must be inspectable.
5. **No release without evidence gates**
   - Functional, crypto, and interoperability gates must pass before broad rollout.

## Definition of Success

- Create, join, and first-message flow works per mode contract.
- Failure states return deterministic, actionable reason codes.
- Security reviewers sign off that claims match implementation.
