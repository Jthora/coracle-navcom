# Android Certificate Pinning Strategy

> Research, pin set definition, and rotation strategy for NavCom relay connections.
> Items 8.4.1, 8.4.2, 8.4.4 from the cybersecurity checklist.
> Implementation (8.4.3, 8.4.5–8.4.10) deferred to a dedicated native Android sprint.

---

## 1. Research: Approaches (8.4.1)

### Recommended: OkHttp CertificatePinner via Capacitor Plugin

Capacitor 7+ uses OkHttp for HTTP on Android. WebSocket connections also go through OkHttp's stack, making `CertificatePinner` the natural integration point.

**Architecture:**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Svelte/TS App  │ ──► │  Capacitor Bridge │ ──► │  OkHttp     │
│  (WebSocket)    │     │  + Custom Plugin   │     │  + CertPin  │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

**Option A — Custom Capacitor Plugin (Recommended)**

Create a Capacitor plugin that intercepts WebSocket creation and attaches `CertificatePinner` to the OkHttp client:

```kotlin
// Pseudocode — CertPinPlugin.kt
val pinner = CertificatePinner.Builder()
    .add("relay.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .add("relay.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")  // backup
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(pinner)
    .build()
```

**Option B — Network Security Config (Limited)**

Android's `network_security_config.xml` supports `<pin-set>` but only for HTTP connections, not WebSocket. Since NavCom relays use WebSocket (`wss://`), this alone is insufficient. Use in combination with Option A.

**Option C — TrustManager Override (Not Recommended)**

Custom `X509TrustManager` gives full control but is error-prone and disables system CA validation. Avoid unless OkHttp `CertificatePinner` proves insufficient.

### Decision

**Use Option A** — Custom Capacitor plugin wrapping OkHttp `CertificatePinner`. It's the standard, well-tested approach for Android TLS pinning and integrates cleanly with Capacitor's native bridge.

---

## 2. Pin Set Definition (8.4.2)

### Primary NavCom Relay Infrastructure

Pin sets should be defined for relays that NavCom connects to by default or recommends. Each relay gets a primary pin + 2 backup pins.

**Pin format:** SHA-256 hash of the Subject Public Key Info (SPKI) of the server's TLS certificate.

**Obtaining pins:**
```bash
# Extract SPKI pin from a live server
openssl s_client -connect relay.example.com:443 -servername relay.example.com </dev/null 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform DER \
  | openssl dgst -sha256 -binary \
  | base64
```

**Pin set template:**

| Relay Host | Primary Pin (current cert) | Backup Pin 1 (next cert) | Backup Pin 2 (CA intermediate) | Expiry |
|---|---|---|---|---|
| `relay1.navcom.example` | `sha256/...` | `sha256/...` | `sha256/...` | 2027-03-01 |
| `relay2.navcom.example` | `sha256/...` | `sha256/...` | `sha256/...` | 2027-03-01 |

> **NOTE:** Pin values must be populated with actual SPKI hashes from production relay certificates before implementation. The table above is a template.

### Pin Scope

- **Pin only NavCom-operated relays** — not arbitrary user-added relays, since those certificates are not under NavCom's control.
- **User-added relays** use standard system CA validation (already enforced by Android's trust store + `cleartextTrafficPermitted=false`).
- **Group relays** inherit the trust tier from the relay reputation system (Step 8.3).

---

## 3. Pin Rotation Strategy (8.4.4)

### Multi-Pin Approach

Each pinned relay carries **3 pins**:

1. **Primary** — Current leaf certificate SPKI hash
2. **Backup 1** — Next planned certificate SPKI hash (pre-generated CSR)
3. **Backup 2** — Intermediate CA SPKI hash (survives leaf rotation)

### Rotation Cadence

| Event | Action |
|---|---|
| **Certificate renewal** (every 90 days for Let's Encrypt) | Promote Backup 1 → Primary, generate new Backup 1, keep Backup 2 |
| **CA change** | Update Backup 2. Ship app update with new pin set before old CA expires |
| **Emergency revocation** | Push app update with new pin set. Kill-switch disables pinning until update propagates |

### App Update Decoupling

To avoid bricking the app when certificates rotate before an app update:

1. **Remote pin config** — Fetch pin set from a signed JSON endpoint on app start. Verify JSON signature (Ed25519) before applying. Fall back to bundled pins if fetch fails.
2. **Pin expiry dates** — Each pin entry has an `expires` field. After expiry, fall back to standard CA validation (don't hard-fail).
3. **Grace period** — Accept both old and new pins for 30 days after rotation.

### Kill Switch

If pinning causes widespread connection failures:

1. Push remote config with `pinningEnabled: false`
2. The plugin skips `CertificatePinner` attachment
3. Connections fall back to standard system CA validation
4. Investigate and fix pin set, then re-enable

---

## 4. Implementation Roadmap (for native sprint)

### Prerequisites
- Android Studio + Android SDK
- Capacitor plugin development environment
- Access to production relay TLS certificates

### Steps (maps to checklist 8.4.3, 8.4.5–8.4.10)

1. **Create Capacitor plugin** `capacitor-cert-pin`
   - Kotlin plugin class wrapping OkHttp `CertificatePinner`
   - JSON pin config loader (bundled + remote)
   - Ed25519 config signature verification

2. **Wire into WebSocket creation**
   - Override Capacitor's default OkHttp client factory
   - Attach `CertificatePinner` for pinned relay hostnames only

3. **Error handling** (8.4.6, 8.4.7)
   - On pin mismatch: disconnect immediately, do not send data
   - Surface structured error to JS layer via Capacitor bridge
   - JS layer shows security alert toast (8.4.8)

4. **Logging** (8.4.9)
   - Log pin failures: relay URL, expected pin hash, actual cert chain
   - Forward to NavCom telemetry endpoint

5. **Testing** (8.4.5)
   - Unit test: pinned relay connects successfully
   - Unit test: wrong cert triggers pin failure + disconnect
   - Integration test: pin rotation (swap primary ↔ backup) works without downtime

6. **Robustness** (8.4.10)
   - Maintain ≥2 backup pins per relay
   - Test pin expiry graceful degradation
   - Test kill switch flow end-to-end

---

## 5. Network Security Config Enhancement

When cert pinning is implemented natively, augment the existing `network_security_config.xml` with `<pin-set>` as an additional defense layer for HTTP (non-WebSocket) connections:

```xml
<domain-config>
    <domain includeSubdomains="true">relay1.navcom.example</domain>
    <pin-set expiration="2027-03-01">
        <pin digest="SHA-256">PRIMARY_PIN_BASE64</pin>
        <pin digest="SHA-256">BACKUP1_PIN_BASE64</pin>
        <pin digest="SHA-256">BACKUP2_PIN_BASE64</pin>
    </pin-set>
</domain-config>
```

This provides defense-in-depth: OkHttp `CertificatePinner` for WebSocket, Android OS-level pinning for HTTP.
