# 05-05: Key Storage Security

> Migrate private key material from localStorage to secure storage.

**Priority**: CRITICAL — localStorage keys are accessible to any XSS, browser extension, or compromised dependency.  
**Effort**: HIGH  
**Depends on**: 02-02 (key generation UI — coordinate on key lifecycle), 01-08 (enrollment flow — keygen during onboarding)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §3 (Severity: CRITICAL), [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §AUTH pillar

---

## Problem

Currently, all private key material (Nostr `nsec`, PQC private keys from the `feat/real-pqc-crypto` branch) is stored in `localStorage`:

- **Any XSS vulnerability** can exfiltrate keys with `localStorage.getItem()`
- **Browser extensions** with `storage` permission can read all localStorage
- **Supply chain attacks** on any npm dependency can steal keys
- **No access control** — keys are plaintext strings, no unlock required

For a sovereign communications platform, this is the most critical vulnerability.

---

## Solution: Tiered Key Storage

### Tier 1 — WebCrypto `CryptoKey` (Non-Extractable)

Use the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) to generate and store keys as non-extractable `CryptoKey` objects in IndexedDB:

```typescript
// Generate a wrapping key from user's passphrase
const wrappingKey = await crypto.subtle.deriveKey(
  {name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256"},
  passphraseKey,
  {name: "AES-GCM", length: 256},
  false,  // non-extractable
  ["wrapKey", "unwrapKey"]
)

// Wrap the private key for storage
const wrapped = await crypto.subtle.wrapKey("raw", privateKey, wrappingKey, {name: "AES-GCM", iv})

// Store wrapped key in IndexedDB (not localStorage)
await db.put("keys", {id: "nsec", wrapped, salt, iv})
```

**Result**: Even if XSS accesses IndexedDB, they get an encrypted blob, not the raw key.

### Tier 2 — NIP-46 Remote Signing (Nostr Connect)

For maximum security, support delegated signing via NIP-46:
- Private key never leaves the user's signing device (e.g., Amber on Android, nsecBunker)
- NavCom sends unsigned events to the signer, receives signed events back
- Key material is never in the browser at all

This is the gold standard but requires the user to have a separate signer app.

### Tier 3 — Platform Secure Storage (Capacitor)

For the native Android build:
- Use `@capacitor/preferences` or the Android Keystore via a Capacitor plugin
- Keys stored in hardware-backed secure enclave when available

---

## Implementation Plan

### Phase A: Passphrase-Protected Keys (Tier 1)

1. On first key creation or migration, prompt user for a passphrase
2. Derive wrapping key from passphrase using PBKDF2 (600k iterations)
3. Wrap the private key with AES-GCM-256
4. Store wrapped key blob + salt + IV in IndexedDB
5. On app start, prompt for passphrase → unwrap key → hold in memory only
6. Clear in-memory key on app background (optional, configurable)

### Phase B: NIP-46 Support (Tier 2)

1. Add NIP-46 client (Nostr Connect)
2. On login, offer "Use remote signer" option
3. When remote signer is active, route all signing through NIP-46
4. No private key in browser at all

### Phase C: Migration from localStorage

1. On app update, detect keys in localStorage
2. Prompt user: "Secure your keys with a passphrase"
3. Wrap and migrate to IndexedDB
4. **Delete from localStorage** only after confirming IndexedDB write succeeded
5. Log migration event (not the key itself)

---

## Passphrase UX

- **Setup**: "Create a passphrase to protect your keys" — minimum 8 characters, show strength meter
- **Unlock**: On app start, "Enter your passphrase" — with biometric unlock option on mobile
- **Recovery**: "If you forget your passphrase, you'll need your nsec backup" — no server-side recovery
- **Timeout**: Auto-lock after configurable idle period (default: 15 minutes)

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/keys/secure-store.ts` | WebCrypto key wrapping + IndexedDB storage | ~120 |
| `src/engine/keys/passphrase.ts` | PBKDF2 derivation + passphrase validation | ~60 |
| `src/engine/keys/migrate.ts` | localStorage → IndexedDB migration | ~50 |
| `src/app/UnlockScreen.svelte` | Passphrase prompt on app start | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/state.ts` (or equivalent) | Use secure store instead of localStorage for key access |
| Key generation (enrollment, settings) | Store via secure store API |
| App initialization | Check for locked keys → show UnlockScreen |
| PQC key manager (`epoch-key-manager.ts`) | Use secure store for PQC private keys |

---

## Security Considerations

- **Never log key material** — not even to console in dev mode
- **Clear memory on lock** — zero out key buffers when locking
- **Constant-time comparison** — for passphrase-derived values
- **PBKDF2 iteration count** — 600,000 minimum (OWASP 2023 recommendation)
- **Salt** — unique per key, stored alongside wrapped key (not secret)
- **IV** — unique per wrap operation, stored alongside wrapped key

---

## Verification

- [ ] New user → keygen stores key in IndexedDB, NOT localStorage
- [ ] Existing user → migration prompt → key moved to IndexedDB, removed from localStorage
- [ ] XSS simulation: `localStorage.getItem("key")` returns null after migration
- [ ] Wrong passphrase → decryption fails → user prompted to retry
- [ ] App backgrounded → key cleared from memory (if auto-lock enabled)
- [ ] NIP-46: connect to nsecBunker → sign event → key never in browser
- [ ] PBKDF2 with 600k iterations takes >200ms (prevents brute force)
