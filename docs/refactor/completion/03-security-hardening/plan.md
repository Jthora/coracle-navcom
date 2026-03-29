# WS-03: Security Hardening

> **Pillar 5 — "Resilience is architecture, not a feature."**
> If the system has a single point of failure, the system has already failed.

## Status: NOT STARTED

**Priority**: HIGH — Security defects in a comms platform designed for adversarial environments
**Effort**: ~120 lines across 4 files
**Blocks**: Precondition for any production deployment
**Dependencies**: None

---

## Problem

The self-critique identified four security issues in code built during turns 6-7:

1. **SSRF in local relay bypass** — Any URL configured as "local" bypasses all relay validation
2. **No input validation in peer-transport** — `JSON.parse()` with no error handling
3. **Silent NaN coercion in hexToBytes** — Invalid hex produces NaN bytes, not errors
4. **Queue-drain data loss** — Messages permanently lost after 62 seconds of retry

These aren't hypothetical. For an operator in a denied environment:
- SSRF means a misconfigured URL silently exfiltrates all events to an adversary's relay
- Malformed SDP in peer exchange crashes the connection attempt with no recovery
- Corrupted mesh packets produce silently-wrong data instead of flagging errors
- Network outage > 62 seconds loses queued messages forever

---

## Fix 1: SSRF in local-relay.ts

### Current (vulnerable)
```typescript
// isValidLocalRelayUrl() — only checks protocol
export function isValidLocalRelayUrl(url: string): boolean {
  const parsed = new URL(url)
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return false
  if (!parsed.hostname || parsed.hostname.length < 1) return false
  return true  // ← Accepts wss://attacker.com
}

// isLocalRelay() — any configured URL bypasses ALL validation
export function isLocalRelay(url: string): boolean {
  const all = getAllLocalRelayUrls()
  return all.includes(url)
}
```

### Target (hardened)
```typescript
const PRIVATE_IP_PATTERNS = [
  /^10\./,                          // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,    // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^127\./,                          // Loopback
  /^169\.254\./,                     // Link-local
  /^fc[0-9a-f]{2}:/i,               // IPv6 ULA (fc00::/7)
  /^fe80:/i,                         // IPv6 link-local
  /^::1$/,                           // IPv6 loopback
]

export function isValidLocalRelayUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return false
    if (!parsed.hostname || parsed.hostname.length < 1) return false
    // MUST resolve to private/local IP range
    const host = parsed.hostname
    if (host === "localhost") return true
    if (host.endsWith(".local")) return true
    return PRIVATE_IP_PATTERNS.some(p => p.test(host))
  } catch {
    return false
  }
}
```

**File**: `src/engine/relay/local-relay.ts`
**Lines**: Replace lines 39-50
**Effort**: ~25 lines
**Tests**: Add test cases for `wss://attacker.com` (reject), `ws://192.168.1.5:4444` (accept), `ws://10.0.0.1:7777` (accept)

---

## Fix 2: Input validation in peer-transport.ts

### Current (crashes on malformed input)
```typescript
export async function acceptOffer(peerId: string, offerSdp: string): Promise<string> {
  // ...setup...
  const offer = JSON.parse(offerSdp)  // ← Throws on malformed JSON
  await pc.setRemoteDescription(new RTCSessionDescription(offer))
  // ...
}

export async function completeConnection(peerId: string, answerSdp: string) {
  const peer = peers.get(peerId)
  if (!peer) throw new Error(`Unknown peer: ${peerId}`)
  const answer = JSON.parse(answerSdp)  // ← Throws on malformed JSON
  await peer.pc.setRemoteDescription(new RTCSessionDescription(answer))
}
```

### Target (graceful failure)
```typescript
export async function acceptOffer(peerId: string, offerSdp: string): Promise<string | null> {
  try {
    const offer = JSON.parse(offerSdp)
    if (!offer?.type || !offer?.sdp) return null
    // ...rest of function...
  } catch {
    return null  // Malformed offer — signal failure to caller
  }
}

export async function completeConnection(peerId: string, answerSdp: string): Promise<boolean> {
  const peer = peers.get(peerId)
  if (!peer) return false
  try {
    const answer = JSON.parse(answerSdp)
    if (!answer?.type || !answer?.sdp) return false
    await peer.pc.setRemoteDescription(new RTCSessionDescription(answer))
    return true
  } catch {
    return false
  }
}
```

**File**: `src/engine/mesh/peer-transport.ts`
**Lines**: ~100-137
**Effort**: ~25 lines modified
**Tests**: Add test for malformed SDP string → returns null/false (not throws)

---

## Fix 3: hexToBytes NaN coercion

### Current (silent corruption)
```typescript
export function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    // parseInt("zz", 16) returns NaN
    // NaN assigned to Uint8Array becomes 0 — silent corruption
  }
  return bytes
}
```

### Target (fail-fast)
```typescript
export function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null
  if (!/^[0-9a-fA-F]*$/.test(hex)) return null
  const len = hex.length / 2
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
```

**File**: `src/engine/mesh/meshtastic-bridge.ts`
**Lines**: 174-180
**Effort**: ~5 lines added
**Caller impact**: `decodePacket()` and `eventToPacket()` must handle null return
**Tests**: Add test for invalid hex → returns null

---

## Fix 4: Queue-drain permanent message loss

### Current (drops messages after 62 seconds)
```typescript
const MAX_RETRIES = 5
const BASE_DELAY_MS = 2_000
// Backoff: 2s → 4s → 8s → 16s → 32s → marked "failed" forever
// Total duration: ~62 seconds of outage = messages permanently lost
```

### Target (network-aware retry tiers)
```typescript
const MAX_FAST_RETRIES = 5          // For relay rejection errors
const NETWORK_RETRY_INTERVAL = 30_000  // 30s between network checks

async function drainQueue() {
  const pending = await getPending()
  for (const msg of pending) {
    if (!navigator.onLine) {
      // Network down — don't count against retry limit
      // Re-queue and wait for 'online' event
      break
    }
    const result = await trySend(msg)
    if (result === "relay-rejected") {
      // Relay explicitly rejected — count retries, give up after MAX_FAST_RETRIES
      if (msg.retryCount >= MAX_FAST_RETRIES) {
        await updateStatus(msg.id, "failed", msg.retryCount)
      }
    } else if (result === "network-error") {
      // Network unreachable — do NOT count against retry limit
      // Will be retried when 'online' event fires
      break
    }
  }
}
```

**File**: `src/engine/offline/queue-drain.ts`
**Lines**: Core drain loop
**Effort**: ~40 lines modified
**Tests**: Add test for network-error retry (should not increment retryCount)

---

## Verification Items Unblocked

These are preconditions for safe operation, not tracker checkboxes:

- Relay validation tests (line 637): verify local relay URL rejects public IPs
- Offline queue tests (lines 610-615): verify messages survive extended outage
- Mesh networking: malformed SDP gracefully handled

---

## Test Strategy

| Fix | New Tests | Assertions |
|-----|-----------|------------|
| SSRF | 5 | Public IPs rejected, private IPs accepted, localhost accepted, `.local` accepted |
| Peer transport | 3 | Malformed JSON → null, missing type/sdp → null, valid JSON → works |
| hexToBytes | 3 | Invalid hex → null, odd length → null, empty → empty array |
| Queue drain | 4 | Network-error doesn't count, relay-reject counts, online event triggers drain |

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/engine/relay/local-relay.ts` | Private IP validation | ~25 |
| `src/engine/mesh/peer-transport.ts` | JSON.parse error handling | ~25 |
| `src/engine/mesh/meshtastic-bridge.ts` | hex validation | ~10 |
| `src/engine/offline/queue-drain.ts` | Network-aware retry tiers | ~40 |
| Tests (4 files) | Security regression tests | ~60 |
| **Total** | | **~160** |
