# Cryptography Requirements (Real Encryption)

Status: Draft
Owner: Security Engineering
Last Updated: 2026-02-22

## Objective

Define what “authentic encryption that actually works” means for group modes.

## Baseline Rule

Encoding, wrapping metadata, or base64 transformations are not sufficient evidence of confidentiality.

## Required Crypto Properties (for Secure/Max)

1. Confidentiality
   - Group message plaintext is not recoverable without authorized key material.
2. Integrity/Authenticity
   - Message tampering is detectable with cryptographic verification.
3. Recipient Binding
   - Cryptographic context binds sender, recipients, and message identifiers.
4. Replay/Nonce Safety
   - Deterministic protections against nonce misuse/replay confusion.

## Max (Navcom-Only PQC) Additional Requirements

1. Hybrid/PQC-capable negotiation succeeds for all required recipients.
2. Valid peer PQC key material is present and fresh.
3. Strict fail-closed behavior when PQC preconditions fail.
4. Compatibility fallback is disabled unless explicit emergency override policy is active.

## Implementation Evidence Required

- Crypto design note with primitive selection and threat model.
- Unit tests covering tamper, replay, recipient mismatch, and downgrade attempts.
- Integration tests showing create → join → send/receive in strict mode.
- Negative tests proving strict blocking when key/capability requirements fail.

## Claim Gate

Do not claim “true PQC encryption” until all evidence in this document is satisfied.
