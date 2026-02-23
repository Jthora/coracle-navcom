# Decision Log

Status: Active
Owner: Product + Security + Engineering
Last Updated: 2026-02-22

## Usage

Record all decisions that affect security mode guarantees, protocol behavior, or release claims.

## Template

- ID:
- Date:
- Decision:
- Context:
- Alternatives considered:
- Consequences:
- Owner:
- Follow-up tasks:

## Seed Decisions

### DEC-001

- Date: 2026-02-22
- Decision: Mode labels are runtime contracts, not preference hints.
- Consequence: Any unresolved strict-mode implementation gap blocks claim readiness.

### DEC-002

- Date: 2026-02-22
- Decision: Max mode is Navcom-only until interoperability evidence is established.
- Consequence: Max mode rollout is cohort-gated and defaults off.

### DEC-003

- Date: 2026-02-22
- Decision: NIP-104 is not treated as sole proof of PQC runtime encryption.
- Consequence: PQC claims require cryptographic and runtime evidence from validation gates.
