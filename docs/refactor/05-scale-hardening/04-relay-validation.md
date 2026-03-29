# 05-04: Relay Validation & Allowlisting

> Validate relay URLs and enforce an allowlist before opening WebSocket connections.

**Priority**: HIGH — unauthenticated connections to arbitrary URLs are a security and stability risk.  
**Effort**: LOW-MEDIUM  
**Depends on**: Nothing (standalone hardening)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §4 "Relay URL Injection"

> **NIP Reference**: Relay URLs originate from NIP-65 relay lists (kind 10002), NIP-29 group metadata (kinds 39000-39003), and NIP-EE key package relays (kind 10051). This task creates a validation gate that overrides NIP-65 user relay sovereignty when operator policy demands it. See [NIP Inventory](../nip-inventory.md).

---

## Problem

Currently, relay URLs from Nostr events (kind 10002 / NIP-65 relay lists, kind 39000+ / NIP-29 group metadata, user relay lists) are used with minimal validation. Risks:

1. **Malformed URLs** — typos or garbage strings crash WebSocket constructors
2. **Non-WSS URLs** — `ws://` connections leak data over unencrypted transport
3. **Internal network SSRF** — `wss://localhost:*` or `wss://192.168.*` could probe internal services
4. **Hostile relays** — known-bad relays that harvest metadata or inject spam
5. **Relay explosion** — users connected to 50+ relays, each with its own WebSocket, drains battery and bandwidth

---

## Solution

### 1. URL Format Validation

```typescript
// src/engine/relay/validate-url.ts

export function isValidRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Must be wss:// (or ws:// only in dev mode)
    if (parsed.protocol !== "wss:") {
      if (parsed.protocol === "ws:" && import.meta.env.DEV) return true
      return false
    }
    // Block private/internal IPs
    if (isPrivateHost(parsed.hostname)) return false
    // Must have a valid hostname (not empty, not just a port)
    if (!parsed.hostname || parsed.hostname.length < 3) return false
    return true
  } catch {
    return false
  }
}

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.") ||
    hostname.endsWith(".local")
  )
}
```

### 2. Operator-Configured Allowlist / Denylist

NavCom operators should be able to specify approved relays and block known-bad ones:

```env
# .env
VITE_RELAY_ALLOWLIST=wss://relay.damus.io,wss://relay.navcom.example
VITE_RELAY_DENYLIST=wss://spam-relay.example
VITE_RELAY_MAX_COUNT=8
```

Behavior:
- If allowlist is set, **only** those relays are used (strict mode)
- If only denylist is set, any relay is allowed except those listed (permissive mode)
- Max relay count caps WebSocket connections (default: 8)

### 3. Relay Pool Gate

Insert validation before any WebSocket connection:

```typescript
// src/engine/relay/pool-gate.ts

export function shouldConnect(url: string): boolean {
  if (!isValidRelayUrl(url)) return false
  if (isDenylisted(url)) return false
  if (hasAllowlist() && !isAllowlisted(url)) return false
  if (getActiveCount() >= getMaxRelayCount()) return false
  return true
}
```

### 4. Connection Limit

Track active WebSocket connections. When the limit is reached:
- Refuse new connections with a logged warning
- Prefer relays the operator configured over user-discovered relays
- On the settings UI, show "N/M relays connected" with the limit visible

### 5. NIP-65 Policy Resolution

There is an inherent tension between NIP-65 (users publish their own relay preferences) and operator-controlled relay policy. Resolution:

| Scenario | Behavior |
|----------|----------|
| Allowlist set + user has NIP-65 relays | **Allowlist wins** — only operator-approved relays used, user's NIP-65 list is silently filtered |
| No allowlist + user has NIP-65 relays | User relays used, subject to denylist and connection limit |
| Group metadata specifies relay | Group relay used if it passes validation, even if not in user's NIP-65 list |
| User manually adds relay in Settings | Passes through validation gate like any other relay |

In operator-controlled deployments (the primary NavCom use case), the operator's relay policy is authoritative. This intentionally overrides NIP-65's "user sovereignty" model — NavCom is an organizational tool, not a personal social client.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/relay/validate-url.ts` | URL format validation + private IP blocking | ~40 |
| `src/engine/relay/pool-gate.ts` | Allowlist/denylist + connection limit enforcement | ~50 |

## Files to Modify

| File | Change |
|------|--------|
| `.env.template` | Add `VITE_RELAY_ALLOWLIST`, `VITE_RELAY_DENYLIST`, `VITE_RELAY_MAX_COUNT` |
| Relay pool connection code | Call `shouldConnect()` before opening WebSocket |
| Settings / relay list UI | Show connection count vs. limit, mark blocked relays |

---

## Verification

- [ ] Malformed URL (e.g., "not a url") → rejected, not attempted
- [ ] `ws://` URL → rejected in production, allowed in dev
- [ ] `wss://localhost:8080` → rejected (private IP block)
- [ ] URL on denylist → rejected
- [ ] URL not on allowlist (when allowlist is set) → rejected
- [ ] Connection count at max → new connection refused, warning logged
- [ ] Valid relay URL → connection proceeds normally
- [ ] Unit tests for `isValidRelayUrl` covering edge cases
