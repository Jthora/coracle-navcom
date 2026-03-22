# Relay Trust Assumptions & DNS Rebinding Mitigations

> NavCom relay connection security model (2026-03-21).

## Trust Model

NavCom treats relay connections as **untrusted transport**. All security-critical
properties are enforced at the application layer:

1. **Event integrity** — Nostr events are Schnorr-signed; NavCom verifies
   signatures at ingestion (`src/engine/event-verification.ts`).
2. **Confidentiality** — PQC envelopes (ML-KEM-768 + AES-GCM-256) encrypt
   message content end-to-end. Relays see only opaque ciphertext.
3. **Replay resistance** — Bounded dedup set (`src/engine/event-dedup.ts`)
   with ±600s time window and IndexedDB persistence across reloads.
4. **Rate limiting** — Per-relay adaptive rate limiter
   (`src/engine/relay/rate-limiter.ts`) prevents flood-based DoS.

## DNS Rebinding Mitigations

### Browser-Level Protections

Modern browsers enforce **same-origin policy** on WebSocket connections:
- The `Origin` header is immutable and set by the browser.
- WebSocket connections inherit the page's origin context.
- TLS certificate validation occurs at the browser level for `wss://`.

However, DNS rebinding attacks can bypass same-origin by pointing a hostname
to an internal IP after the initial DNS lookup expires:

1. Attacker registers `evil.relay.example` resolving to `203.0.113.1` (public).
2. User's browser opens `wss://evil.relay.example` — DNS resolves to public IP.
3. Attacker changes DNS to `192.168.1.1` — rebinding to internal network.
4. When WebSocket reconnects, it may reach an internal service.

### NavCom Mitigations

| Layer | Mitigation | Location |
|-------|-----------|----------|
| URL validation | Reject `ws://` in production (TLS only) | `validate-url.ts` |
| Private IP block | Block 127.x, 10.x, 172.16-31.x, 192.168.x, ::1 | `validate-url.ts` |
| IPv6-mapped IPv4 | Block `::ffff:` mapped private addresses | `validate-url.ts` |
| IP-literal reject | Block raw IP relay URLs (must use domain names) | `validate-url.ts` |
| Android network | `usesCleartextTraffic="false"` in manifest | `AndroidManifest.xml` |
| Audit logging | All rejections logged with `[SecurityAudit]` prefix | `validate-url.ts` |

### Remaining Assumptions

1. **DNS resolution is honest** — We cannot inspect resolved IPs in the browser
   WebSocket API. If a legitimate-looking domain rebinds to a private IP after
   initial connection, the browser may allow it. This is a fundamental browser
   limitation.
2. **TLS mitigates most rebinding** — For `wss://` connections, the TLS
   certificate must match the hostname. Internal services rarely have valid
   certificates for attacker-controlled domains, making TLS rebinding
   impractical in most scenarios.
3. **Relay operators are semi-trusted for availability** — While relays cannot
   forge or decrypt messages, they can withhold or delay delivery.
   Relay reputation tracking (planned Step 8.3) will add redundancy.

### Limitations

- The browser WebSocket API does not expose resolved IP addresses, so
  post-connection IP validation is not possible in a web context.
- On Android (Capacitor), native-layer certificate pinning (planned Step 8.4)
  would provide additional protection for known relay infrastructure.
