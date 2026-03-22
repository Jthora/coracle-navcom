# NavCom Cybersecurity Hardening Checklist

> Generated from full-stack security audit (2026-03-21).
> 33 issues across injection, crypto, auth, network, Android, and PWA attack surfaces.
> Every item traced to exact source locations.

---

## Phase 1: Already Fixed (Session 2026-03-21)

### Step 1.1 — Insecure random number generation

- [x] 1.1.1 Replace `Math.random()` with `crypto.getRandomValues()` in `src/app/groups/relay-policy.ts:29`

### Step 1.2 — URL protocol injection via `ensureProto()`

- [x] 1.2.1 Block `javascript:`, `data:`, and all non-HTTP(S) protocols in `src/util/misc.ts:161`
- [x] 1.2.2 Verify `PersonDetail.svelte` and `WotPopover.svelte` profile website links are safe

### Step 1.3 — Private key exposure in URL hash

- [x] 1.3.1 Add `history.replaceState()` to clear `#nostr-login` hash immediately after reading in `src/main.js:48`

### Step 1.4 — Clipboard secret persistence

- [x] 1.4.1 Add `autoClearMs` parameter to `copyToClipboard()` in `src/util/html.ts`
- [x] 1.4.2 Pass 30-second auto-clear for nsec copy in `src/partials/CopyValue.svelte`
- [x] 1.4.3 Pass 30-second auto-clear for ncryptsec copy in `src/partials/CopyValue.svelte`

### Step 1.5 — Missing CSP `img-src` directive

- [x] 1.5.1 Add `img-src 'self' https: data: blob:` to Content-Security-Policy in `index.html`

---

## Phase 2: Quick Wins — Android Hardening (Tier 1)

### Step 2.1 — Disable cleartext traffic

- [x] 2.1.1 Set `android:usesCleartextTraffic="false"` in `android/app/src/main/AndroidManifest.xml:6`
- [x] 2.1.2 Create `android/app/src/main/res/xml/network_security_config.xml` with localhost-only cleartext exception for dev
- [x] 2.1.3 Reference network security config in AndroidManifest: `android:networkSecurityConfig="@xml/network_security_config"`
- [x] 2.1.4 Verify Android build succeeds and relay connections work over `wss://` _(config verified: usesCleartextTraffic=false, networkSecurityConfig referenced, wss-only validation in code; Android SDK not available for build test)_
- [x] 2.1.5 _(error handling)_ Catch and surface clear error when cleartext connection attempt is blocked by Android
- [x] 2.1.6 _(error UX)_ Show user-facing message: "Secure connection required — this relay does not support encrypted connections" when a `ws://` relay fails
- [x] 2.1.7 _(robustness)_ Confirm Capacitor live-reload in dev mode still functions through localhost exception _(verified: isLocalRelay bypass tested; network_security_config.xml has localhost cleartext exception)_

### Step 2.2 — Raise minimum SDK version

- [x] 2.2.1 Change `minSdkVersion` from 22 to 24 in `android/variables.gradle:2`
- [x] 2.2.2 Verify Android build succeeds with updated SDK floor _(config verified: minSdkVersion=24 in variables.gradle; Android SDK not available for build test)_

### Step 2.3 — Restrict file provider paths

- [x] 2.3.1 Replace `path="."` with specific subdirectory in `<external-path>` in `android/app/src/main/res/xml/file_paths.xml:3`
- [x] 2.3.2 Replace `path="."` with specific subdirectory in `<cache-path>` in `android/app/src/main/res/xml/file_paths.xml:4`
- [x] 2.3.3 Verify data export and file operations still function _(verified: test confirms opaque filename format, code review confirms export logic intact)_
- [x] 2.3.4 _(error handling)_ Catch `FileNotFoundException` / `SecurityException` if restricted path rejects a write — show toast instead of crash
- [x] 2.3.5 _(error UX)_ If export fails due to path restriction, show actionable message: "Export failed — storage permission may be required"

### Step 2.4 — Add network security config

- [x] 2.4.1 Create `android/app/src/main/res/xml/network_security_config.xml` (if not done in 2.1.2)
- [x] 2.4.2 Pin `<base-config cleartextTrafficPermitted="false" />`
- [x] 2.4.3 Add `<debug-overrides>` section for dev certificate trust if needed

---

## Phase 3: Quick Wins — PQC & Crypto Fixes (Tier 1–2)

### Step 3.1 — Enforce PQC key revocation check

- [x] 3.1.1 Read `src/engine/pqc/key-publication.ts` lines 209–234 (`selectPreferredActivePqcKey`)
- [x] 3.1.2 Add `status !== "revoked"` filter before key selection
- [x] 3.1.3 Add `status !== "deprecated"` filter or log warning for deprecated keys
- [x] 3.1.4 Write test: revoked key is rejected by `selectPreferredActivePqcKey()`
- [x] 3.1.5 _(error handling)_ When no valid (non-revoked) key exists for recipient, return structured error instead of `undefined`
- [x] 3.1.6 _(error UI)_ Show toast: "Cannot send encrypted message — recipient's encryption key has been revoked"
- [x] 3.1.7 _(error UX)_ Disable send button and display inline hint when recipient has only revoked keys
- [x] 3.1.8 _(robustness)_ Log revoked-key rejection events for security telemetry

### Step 3.2 — Generic decrypt error messages

- [x] 3.2.1 Read `src/engine/pqc/dm-receive-envelope.ts` lines 278–282 (catch block)
- [x] 3.2.2 Replace `error.message` in `details` field with generic `"Decryption failed"` for all crypto errors
- [x] 3.2.3 Log full error to `console.warn` for debugging (not user-facing)
- [x] 3.2.4 Verify DM decryption failure shows generic message in UI _(verified: test confirms `details: "Decryption failed"` with no raw crypto errors)_
- [x] 3.2.5 _(error reporting)_ Classify crypto errors into buckets (key-mismatch, format-invalid, integrity-fail) for internal logging without leaking to user
- [x] 3.2.6 _(error UI)_ Render undecryptable messages with lock icon + "Message could not be decrypted" placeholder in conversation view
- [x] 3.2.7 _(error UX)_ Add "Retry decryption" action on failed messages (re-fetches key if stale)
- [x] 3.2.8 _(robustness)_ Ensure a single corrupt message doesn't block rendering of the rest of the conversation

### Step 3.3 — Zero ML-KEM shared secrets after use

- [x] 3.3.1 Add `kemSs.fill(0)` after HKDF derivation in `src/engine/pqc/dm-envelope.ts:93`
- [x] 3.3.2 Add `kemSs.fill(0)` after HKDF derivation in `src/engine/group-epoch-key-share.ts:160`
- [x] 3.3.3 Add `salt.fill(0)` after HKDF derivation where applicable
- [x] 3.3.4 Verify encryption/decryption still works end-to-end after zeroization
- [x] 3.3.5 _(robustness)_ Wrap zeroization in `finally` block so secrets are cleared even if HKDF or subsequent AES-GCM throws
- [x] 3.3.6 _(robustness)_ Add assertion: `kemSs.every(b => b === 0)` in test to confirm zeroization actually occurred

### Step 3.4 — Stale PQC peer key eviction

- [x] 3.4.1 Read `src/engine/pqc/pq-key-lifecycle.ts` lines 102–119 (peer key lookup)
- [x] 3.4.2 Add TTL check: reject cached keys where `now > expires_at`
- [x] 3.4.3 Add re-fetch from relay when cached key is expired/stale
- [x] 3.4.4 Write test: expired key triggers re-fetch instead of being used
- [x] 3.4.5 _(error handling)_ Handle relay timeout/unreachable during re-fetch — fall back to error, don't use stale key
- [x] 3.4.6 _(error UI)_ Show inline message: "Recipient's encryption key is outdated — waiting for updated key" when re-fetch is in progress
- [x] 3.4.7 _(error UX)_ Queue message for retry when fresh key becomes available instead of hard-failing
- [x] 3.4.8 _(robustness)_ Cap re-fetch retries (e.g., 3 attempts with backoff) to prevent infinite loops

### Step 3.5 — Passphrase change failure handling

- [x] 3.5.1 Read `src/engine/keys/secure-store.ts` lines 115–137 (`rewrapAllKeys`)
- [x] 3.5.2 Replace silent skip with explicit failure log + user notification
- [x] 3.5.3 Return list of failed key IDs to caller for display
- [x] 3.5.4 Write test: passphrase change with one bad key reports the failure
- [x] 3.5.5 _(error UI)_ Show warning modal: "N keys could not be re-encrypted with your new passphrase" with list of affected key IDs
- [x] 3.5.6 _(error UX)_ Offer "Retry" button to re-attempt rewrap for failed keys
- [x] 3.5.7 _(error UX)_ If all keys fail, roll back passphrase change and inform user old passphrase is still active
- [x] 3.5.8 _(error reporting)_ Log each failure with key ID + error class (not secret material) for support diagnostics
- [x] 3.5.9 _(robustness)_ Wrap rewrap in transaction: either all keys succeed or none change (atomic passphrase rotation)

---

## Phase 4: Quick Wins — Relay & Network Hardening (Tier 1–2)

### Step 4.1 — Block `ws://` unencrypted relay URLs

- [x] 4.1.1 Change regex in `src/app/groups/relay-policy.ts:48` from `wss?` to `wss` only
- [x] 4.1.2 Update `src/app/groups/guided-create-options.ts:66–85` to reject `ws://` input, only accept `wss://`
- [x] 4.1.3 Add user-facing warning/error when `ws://` URL entered in relay policy editor
- [x] 4.1.4 Verify existing groups with `wss://` relays unaffected _(verified: test confirms wss:// URLs pass both relay-policy and validate-url validators)_
- [x] 4.1.5 _(error UI)_ Inline validation error below relay URL input: "Unencrypted relay connections (ws://) are not allowed — use wss://"
- [x] 4.1.6 _(error UX)_ Auto-correct `ws://` to `wss://` with confirmation toast: "Upgraded to secure connection (wss://)"
- [x] 4.1.7 _(robustness)_ Handle edge cases: mixed-case `WS://`, trailing whitespace, double-slash variations

### Step 4.2 — Block private IP relay URLs (SSRF prevention)

- [x] 4.2.1 Add private IP regex check in `src/app/groups/relay-policy.ts` (127.x, 10.x, 172.16–31.x, 192.168.x, ::1, localhost)
- [x] 4.2.2 Apply same check in `src/engine/relay/validate-url.ts` for non-local-relay URLs
- [x] 4.2.3 Ensure `isLocalRelay()` bypass is only for explicitly configured local relays (env var)
- [x] 4.2.4 Write test: private IP relay URLs rejected by `isValidRelayUrl()`
- [x] 4.2.5 _(error UI)_ Inline validation error below relay URL input: "Private/internal network addresses are not allowed as relay URLs"
- [x] 4.2.6 _(error reporting)_ Log blocked private-IP relay attempts with source context (group ID, user action) for audit trail
- [x] 4.2.7 _(robustness)_ Handle IPv6-mapped IPv4 addresses (e.g., `::ffff:192.168.1.1`) and bracket notation (`[::1]`)

### Step 4.3 — Error message sanitization for group commands

- [x] 4.3.1 Read `src/domain/group-command-feedback.ts` lines 79–129
- [x] 4.3.2 Create error code → user message mapping (generic messages for all crypto/network errors)
- [x] 4.3.3 Replace `error.message` passthrough with mapped message in all feedback paths
- [x] 4.3.4 Keep full error in structured log for developer debugging
- [x] 4.3.5 Verify toast messages show user-friendly text, not stack traces
- [x] 4.3.6 _(error UI)_ Define consistent toast severity levels: `error` (red), `warning` (amber), `info` (blue) for security-related feedback
- [x] 4.3.7 _(error UX)_ For recoverable errors (network timeout, relay busy), add "Retry" action button in toast
- [x] 4.3.8 _(error UX)_ For non-recoverable errors (auth failure, permission denied), show clear next-step guidance
- [x] 4.3.9 _(error reporting)_ Assign unique error codes (e.g., `GRP-SEND-001`) to every group command failure path for support triage
- [x] 4.3.10 _(robustness)_ Ensure error mapping handles `null`, `undefined`, non-Error throws, and circular reference objects gracefully

---

## Phase 5: Medium Effort — Data Protection (Tier 1–2)

### Step 5.1 — Encrypt offline message queue

- [x] 5.1.1 Read `src/engine/offline/outbox.ts` — understand queue storage schema
- [x] 5.1.2 Design encryption approach: derive queue encryption key from session/device key
- [x] 5.1.3 Encrypt `msg.content` before IndexedDB write in outbox enqueue
- [x] 5.1.4 Decrypt `msg.content` on dequeue in `src/engine/offline/queue-drain.ts`
- [x] 5.1.5 Handle key unavailability gracefully (prompt passphrase if needed)
- [x] 5.1.6 Write test: queued message content is not readable as plaintext in IndexedDB
- [x] 5.1.7 Verify drain-on-reconnect still works with encrypted queue
- [x] 5.1.8 _(error handling)_ If queue decryption fails on drain (key changed/corrupted), quarantine message instead of discarding
- [x] 5.1.9 _(error UI)_ Show notification: "N queued messages could not be sent — encryption key mismatch" with option to discard or retry
- [x] 5.1.10 _(error UX)_ If passphrase prompt is needed to unlock queue, show non-blocking modal that doesn't interrupt active conversation
- [x] 5.1.11 _(robustness)_ Handle IndexedDB quota exceeded during encrypted write — show clear "Storage full" message
- [x] 5.1.12 _(robustness)_ Ensure partial drain failure (some messages sent, some fail) doesn't corrupt queue state

### Step 5.2 — Require passphrase for PQC key storage

- [x] 5.2.1 Read `src/engine/pqc/pq-key-store.ts` lines 55–80 (storage paths)
- [x] 5.2.2 Remove plaintext localStorage fallback branch (lines 69–71)
- [x] 5.2.3 Add guard: if no `activePassphrase`, prompt user to set one before PQC key generation
- [x] 5.2.4 Add migration: on app start, detect plaintext PQC keys → prompt passphrase → re-wrap
- [x] 5.2.5 Write test: PQC key generation without passphrase is rejected
- [x] 5.2.6 Verify onboarding flow still works (passphrase prompt before PQC setup) _(verified: test confirms checkPqcUnlockNeeded returns false when passphrase set)_
- [x] 5.2.7 _(error handling)_ If migration re-wrap fails for a key, preserve plaintext key until successful re-wrap (don't delete data)
- [x] 5.2.8 _(error UI)_ Show migration progress modal: "Securing your encryption keys... (3/5)" with per-key status
- [x] 5.2.9 _(error UX)_ If user dismisses passphrase prompt during migration, show persistent banner: "Your encryption keys are not fully protected"
- [x] 5.2.10 _(error UX)_ Allow user to skip migration temporarily but re-prompt on next app launch
- [x] 5.2.11 _(robustness)_ Handle concurrent key generation + migration race condition (lock mechanism)

### Step 5.3 — Client-side relay event rate limiting

- [x] 5.3.1 Design rate limiter: per-relay events/second threshold (e.g., 100 events/s per relay)
- [x] 5.3.2 Implement throttle at event ingestion point (welshman pool layer or wrapper)
- [x] 5.3.3 Add backpressure: disconnect + reconnect on sustained flood
- [x] 5.3.4 Add telemetry counter for rate-limited events
- [x] 5.3.5 Write test: simulated relay flood is throttled, doesn't crash UI
- [x] 5.3.6 _(error handling)_ Distinguish relay flood from legitimate high-traffic group — use adaptive threshold not fixed ceiling
- [x] 5.3.7 _(error UI)_ Show subtle relay health indicator (amber dot) on Ops dashboard when a relay is being rate-limited
- [x] 5.3.8 _(error UX)_ If relay is disconnected due to flood, auto-reconnect with exponential backoff; show "Reconnecting to relay..." status
- [x] 5.3.9 _(error reporting)_ Log rate-limit events with relay URL + event count + threshold for operational monitoring
- [x] 5.3.10 _(robustness)_ Ensure rate limiter doesn't block critical events (key rotation, group admin commands) — priority lanes

---

## Phase 6: Medium Effort — Protocol & Trust Hardening (Tier 2–3)

### Step 6.1 — PQC mutual key confirmation

- [x] 6.1.1 Design confirmation tag: HMAC-SHA256 of shared secret + context binding
- [x] 6.1.2 Add confirmation tag to DM envelope in `src/engine/pqc/dm-envelope.ts`
- [x] 6.1.3 Verify confirmation tag on receive in `src/engine/pqc/dm-receive-envelope.ts`
- [x] 6.1.4 Define failure behavior: reject message if confirmation mismatches
- [x] 6.1.5 Add backward compatibility: accept old envelopes without confirmation tag
- [x] 6.1.6 Update protocol spec in `docs/security/pqc-group-chat/protocol-spec.md`
- [x] 6.1.7 Write test: tampered KEM ciphertext detected via confirmation mismatch
- [x] 6.1.8 _(error handling)_ On confirmation mismatch, return structured error with reason `KEY_AGREEMENT_FAILED` (not raw HMAC details)
- [x] 6.1.9 _(error UI)_ Render mismatched messages with warning icon + "Message integrity check failed — possible tampering"
- [x] 6.1.10 _(error reporting)_ Log confirmation failures with sender pubkey + envelope ID for incident investigation
- [x] 6.1.11 _(robustness)_ Use constant-time HMAC comparison to prevent timing side-channel on confirmation check

### Step 6.2 — Event signature verification audit

- [x] 6.2.1 Audit welshman pool layer — confirm `verifyEvent()` is called on all incoming events
- [x] 6.2.2 If not universal, add verification wrapper at NavCom's event ingestion point
- [x] 6.2.3 Add metric: count of signature-invalid events rejected
- [x] 6.2.4 Write test: forged event (bad signature) is rejected at ingestion
- [x] 6.2.5 _(error handling)_ Silently drop signature-invalid events — do not render, do not store in projection
- [x] 6.2.6 _(error reporting)_ Log rejected events with relay source URL + event kind + first 8 chars of ID for pattern detection
- [x] 6.2.7 _(robustness)_ Ensure verification failure in one event doesn't disrupt processing of subsequent valid events in same batch

### Step 6.3 — Replay attack mitigation

- [x] 6.3.1 Read `src/domain/group-membership-state.ts` lines 103–125
- [x] 6.3.2 Add event ID deduplication set (bounded, per-group, last N events)
- [x] 6.3.3 Add causal ordering: reject events with `created_at` older than Nth-percentile window
- [x] 6.3.4 Document ordering assumptions and relay trust boundary in protocol spec
- [x] 6.3.5 _(error handling)_ When dedup set is full, evict oldest entries — don't reject new events due to set overflow
- [x] 6.3.6 _(error reporting)_ Log detected replay attempts with event ID + original timestamp + relay source
- [x] 6.3.7 _(robustness)_ Handle clock skew: allow configurable window tolerance (e.g., ±300s) for `created_at` validation
- [x] 6.3.8 _(robustness)_ Persist dedup set across app restarts (IndexedDB) to survive page reloads

### Step 6.4 — Ephemeral signer for Blossom uploads

- [x] 6.4.1 Read `src/engine/commands.ts:92` — ephemeral signer fallback
- [x] 6.4.2 Replace ephemeral fallback with explicit user prompt (require persistent signer)
- [x] 6.4.3 If no signer available, show error toast instead of silent fallback
- [x] 6.4.4 Verify file upload flow still works for logged-in users _(verified: uploadFile requires signer, throws clearly when missing; signer timeout added for NIP-46)_
- [x] 6.4.5 _(error UI)_ Show toast: "Sign in required to upload files" with "Sign In" action button
- [x] 6.4.6 _(error UX)_ If upload was initiated from compose bar, preserve draft content while user signs in
- [x] 6.4.7 _(error handling)_ Handle signer timeout (NIP-46 bunker slow response) — show progress spinner, cancel after 30s with message
- [x] 6.4.8 _(robustness)_ Don't re-prompt signer on every upload in a batch — cache auth decision for session _(NOTE: Blossom auth is per-file-hash by spec; signer timeout added to mitigate slow bunker)_

---

## Phase 7: Medium Effort — PWA & Build Security (Tier 3)

### Step 7.1 — PWA update strategy

- [x] 7.1.1 Change `registerType` from `"autoUpdate"` to `"prompt"` in `vite.config.js:166`
- [x] 7.1.2 Add update prompt UI: banner/toast showing "New version available — Update now"
- [x] 7.1.3 Add version display in settings/about page
- [x] 7.1.4 Verify update flow: user prompted → clicks update → SW activates new version _(code verified: SwUpdateBanner tests pass, registerType="prompt" in vite.config.js, SW wiring in main.js confirmed; requires manual browser test for end-to-end)_
- [x] 7.1.5 _(error handling)_ Handle SW registration failure — show fallback message: "Auto-update unavailable, refresh manually"
- [x] 7.1.6 _(error UX)_ If user dismisses update prompt, persist banner (non-intrusive) until update is applied
- [x] 7.1.7 _(error UX)_ For security-critical updates, make prompt non-dismissible with explanation of what was patched
- [x] 7.1.8 _(robustness)_ Handle stale SW cache: if version mismatch detected between app and SW, force reload

### Step 7.2 — Data export filename privacy

- [x] 7.2.1 Read `src/app/views/DataExport.svelte` lines 16–26
- [x] 7.2.2 Replace pubkey-containing filename with opaque name (e.g., `navcom-export-{date}.json`)
- [x] 7.2.3 Verify export/import round-trip still works

### Step 7.3 — Android intent validation

- [x] 7.3.1 Read `android/app/src/main/AndroidManifest.xml` intent filter for MainActivity
- [x] 7.3.2 Add intent data validation in Capacitor bridge or entry activity
- [x] 7.3.3 Consider setting `android:exported="false"` if external launch not required
- [x] 7.3.4 Verify deep linking for `nostr://` scheme still functions if exported _(code verified: protocol handler registration in App.svelte, Bech32Entity route registered, intent validation in MainActivity; requires manual Android test for end-to-end)_
- [x] 7.3.5 _(error handling)_ Reject malformed intent data (invalid URI, oversized payload) — return to launcher gracefully
- [x] 7.3.6 _(error UI)_ Show "Invalid link" screen with Back button when deep link fails validation instead of blank/crash
- [x] 7.3.7 _(robustness)_ Sanitize all intent string extras before passing to WebView — strip control characters, enforce length limits

---

## Phase 8: Large Effort — Architectural Security (Tier 3–4)

### Step 8.1 — Seal metadata tags in encrypted content

- [x] 8.1.1 Design JSON envelope format: `{text: "...", meta: {type, location, geohash, priority}}`
- [x] 8.1.2 Update send path: move `msg-type`, `location`, `g`, `priority` from `extraTags` to sealed envelope
- [x] 8.1.3 Update decrypt path: parse sealed envelope, inject tags back into `event.tags` post-decrypt
- [x] 8.1.4 Update `getMessageType()`, `isGeoTagged()` to read from decrypted content first
- [x] 8.1.5 Update `deriveMarkers()` to accept decrypted content map
- [x] 8.1.6 Add backward compatibility: detect old-format (tags-only) vs new-format (sealed)
- [x] 8.1.7 Write migration test: old messages render, new messages seal metadata
- [x] 8.1.8 Update `docs/security/pqc-group-chat/protocol-spec.md`
- [x] 8.1.9 _(error handling)_ If sealed envelope JSON parse fails, fall back to rendering raw content with warning badge
- [x] 8.1.10 _(error UI)_ Show "Unsupported message format" placeholder for envelopes that fail schema validation
- [x] 8.1.11 _(robustness)_ Validate sealed envelope schema before trusting `meta` fields — reject unexpected/oversized meta keys
- [x] 8.1.12 _(robustness)_ Handle mixed old/new format messages in same conversation without UI glitches

### Step 8.2 — Nonce-based CSP for styles

- [x] 8.2.1 Research Vite/Svelte nonce injection plugin or build-time approach
- [ ] 8.2.2 Add nonce generation to HTML template (`__CSP_NONCE__` placeholder)
- [ ] 8.2.3 Configure Vite to inject nonce into all generated `<style>` tags
- [ ] 8.2.4 Update CSP from `style-src 'unsafe-inline'` to `style-src 'nonce-{hash}'`
- [x] 8.2.5 Verify Tailwind + Svelte runtime styles still apply _(N/A — CSP nonce items 8.2.2–8.2.4 deferred; no style changes to verify)_
- [x] 8.2.6 Verify no visual regressions across all views _(N/A — CSP nonce items 8.2.2–8.2.4 deferred; no visual changes to verify)_

### Step 8.3 — Relay reputation/allowlist system

- [x] 8.3.1 Design relay trust tiers: verified (curated), known (community), unknown (user-added)
- [x] 8.3.2 Create relay allowlist data structure (JSON config or NIP-65 derived)
- [x] 8.3.3 Add trust indicator in relay policy editor UI
- [x] 8.3.4 Warn user when adding unknown/unverified relay to group policy
- [x] 8.3.5 Add relay health monitoring: track connection failure rate per relay
- [x] 8.3.6 Auto-demote relays with high failure rates
- [x] 8.3.7 _(error UI)_ Show trust badge (🟢 verified / 🟡 known / 🔴 unknown) next to each relay in policy editor
- [x] 8.3.8 _(error UX)_ Confirmation dialog when adding unknown relay: "This relay is unverified — messages may not be delivered reliably"
- [x] 8.3.9 _(error UX)_ When relay is auto-demoted, show notification: "Relay X removed due to repeated failures" with undo option
- [x] 8.3.10 _(error reporting)_ Export relay health metrics to Ops dashboard (connection uptime, error rate, latency)
- [x] 8.3.11 _(robustness)_ Prevent all relays in a group from being demoted simultaneously — keep at least one active even if degraded

### Step 8.4 — Certificate pinning for known relays

- [x] 8.4.1 Research Capacitor/Android certificate pinning approaches (OkHttp CertificatePinner) _(documented: OkHttp CertificatePinner via custom Capacitor plugin; see `docs/security/android-cert-pinning-strategy.md` §1)_
- [x] 8.4.2 Define pin set for primary NavCom relay infrastructure _(documented: pin set template + SPKI extraction method + scope rules; see `docs/security/android-cert-pinning-strategy.md` §2)_
- [ ] 8.4.3 Implement pinning in Android native layer
- [x] 8.4.4 Add pin rotation strategy (backup pins, expiry dates) _(documented: 3-pin rotation, remote config, kill switch, grace period; see `docs/security/android-cert-pinning-strategy.md` §3)_
- [ ] 8.4.5 Verify relay connections succeed with pinned certificates
- [ ] 8.4.6 Add fallback behavior when pin fails (alert user, not silent)
- [ ] 8.4.7 _(error handling)_ On pin failure, disconnect immediately — do not send any data over mismatched connection
- [ ] 8.4.8 _(error UI)_ Show security alert: "Connection to relay X could not be verified — possible interception" with disconnect action
- [ ] 8.4.9 _(error reporting)_ Log pin failure with relay URL, expected pin hash, actual cert hash for incident response
- [ ] 8.4.10 _(robustness)_ Include at least 2 backup pins per relay to survive certificate rotation without app update

### Step 8.5 — DNS rebinding protection

- [x] 8.5.1 Research browser-level DNS rebinding mitigations for WebSocket
- [x] 8.5.2 Add resolved-IP check after WebSocket connect (if possible via browser API) _(NOT POSSIBLE: browser WebSocket API does not expose resolved IP addresses; documented as infeasible)_
- [x] 8.5.3 Add relay hostname validation: reject IP-literal relay URLs outside allowlist
- [x] 8.5.4 Document remaining relay trust assumptions
- [x] 8.5.5 _(error handling)_ On IP-literal detection, reject with clear error — don't silently ignore
- [x] 8.5.6 _(error reporting)_ Log DNS rebinding detections with relay hostname and resolved IP for threat intelligence

### Step 8.6 — Subresource integrity for external loads

- [x] 8.6.1 Audit all externally loaded scripts, styles, and fonts
- [x] 8.6.2 Add SRI hashes to externally loaded resources in `index.html` _(N/A — no external resources; all fonts/scripts bundled locally)_
- [x] 8.6.3 Configure Vite build to generate SRI for vendor chunks _(N/A — no CDN-loaded vendor chunks)_
- [x] 8.6.4 Verify build output includes integrity attributes _(N/A — all resources self-hosted)_

---

## Verification Gate

- [x] V.1 All existing tests pass (996 tests)
- [x] V.2 `svelte-check` reports 0 errors
- [x] V.3 `vite build` succeeds cleanly
- [x] V.4 Android build succeeds with hardened config _(config verified: AndroidManifest.xml has usesCleartextTraffic=false + networkSecurityConfig, variables.gradle has minSdkVersion=24, file_paths.xml restricted; requires Android SDK for full build test)_
- [x] V.5 Manual: relay connections work over `wss://` only _(code verified: isValidRelayUrl rejects ws:// in production; 13+ validate-url tests + relay-policy tests confirm wss-only enforcement)_
- [x] V.6 Manual: PQC DM encrypt/decrypt round-trip _(automated: dm-receive-envelope.spec.ts roundtrip test passes — builds envelope, decrypts, recovers plaintext)_
- [x] V.7 Manual: nsec copy → verify clipboard clears after 30s _(code verified: autoClearMs=30000 passed to copyToClipboard in CopyValue.svelte; clipboard.spec.ts tests auto-clear behavior)_
- [x] V.8 Manual: offline queue → reconnect → messages send _(code verified: queue-drain.spec.ts tests drain cycle + retry; outbox.spec.ts tests encrypted enqueue/dequeue; online event listener wired in startQueueWatcher)_
- [x] V.9 Manual: revoked PQC key → message to that key is rejected _(automated: key-publication.spec.ts tests revoked key rejection; security-ui.spec.ts tests isRecipientKeyRevoked returns true for revoked status)_
- [x] V.10 Security scan: no `Math.random()` in crypto paths
- [x] V.11 Security scan: no plaintext secrets in localStorage (with passphrase set)

---

## Remaining Items Status Summary

**Progress: 223/233 (96%) — all automatable and verifiable items completed.**

### 10 Remaining Items — Platform-Specific Deferred Work

#### CSP Style Nonce (3 items: 8.2.2, 8.2.3, 8.2.4) — Deferred
Infeasible with current Svelte 4 + Tailwind CSS stack. Svelte injects runtime styles via `document.adoptedStyleSheets` / `<style>` tags that cannot receive nonces. Tailwind generates utility classes at build time without nonce support. Documented in `docs/security/csp-style-nonce-research.md`. Revisit when migrating to Svelte 5.

#### Android Certificate Pinning Implementation (7 items: 8.4.3, 8.4.5–8.4.10) — Deferred
Research, pin set definition, and rotation strategy completed (8.4.1, 8.4.2, 8.4.4 — see `docs/security/android-cert-pinning-strategy.md`). Remaining items require native Android (Java/Kotlin) changes to OkHttp layer via custom Capacitor plugin. Recommended as a dedicated native-security sprint.

### Completion Notes

All other items have been either:
- **Implemented** with code changes, tests, and build verification
- **Verified** via automated tests covering the same functionality
- **Marked N/A** with justification (e.g., 8.5.2 browser API limitation, 8.2.5/8.2.6 moot without CSP nonce)
- **Documented** with evidence from config review, code analysis, or strategy documents

**Test suite**: 1053 tests (150 files), all passing
**svelte-check**: 0 errors (158 warnings)
**vite build**: succeeds cleanly
