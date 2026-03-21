# 05-03: Offline Message Queue

> Queue messages when offline, send them when connectivity returns.

**Priority**: MEDIUM — critical for NavCom's target use case (intermittent connectivity).  
**Effort**: HIGH  
**Depends on**: 02-01 (message path wiring — queue must handle encrypted and plaintext messages)  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §12, [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gap #8

---

## Problem

Currently, if the user is offline:
- A toast says "You're offline"
- If they compose and send, the message may silently fail (no relay to publish to)
- When they reconnect, the message is lost
- No background sync exists

For a communications platform designed for field operations, this is catastrophic.

---

## Solution: IndexedDB Outbox Queue

### Architecture

```
Compose → Create Event → Encrypt (if applicable)
    ↓
  Can publish to relay?
    ├── YES → Publish immediately
    └── NO  → Store in IndexedDB outbox queue
              ↓
         On reconnect → Drain queue → Publish each event
              ↓
         On success → Remove from queue, mark as sent
         On failure → Retry with exponential backoff
```

### Outbox Schema

```typescript
interface QueuedMessage {
  id: string                    // Event ID
  event: NostrEvent             // The full signed event
  channel: string               // Target channel/group ID
  createdAt: number             // When the user composed it
  status: "queued" | "sending" | "sent" | "failed"
  retryCount: number
  lastRetryAt: number | null
}
```

### User Feedback

- **Queued**: Message appears in the stream with a clock icon (⏳) instead of sent checkmark
- **Sending**: Clock icon animates
- **Sent**: Normal message appearance (no special indicator)
- **Failed (after N retries)**: Red warning icon, "Tap to retry"

### Draft Persistence

Separately from the outbox, persist compose bar drafts in localStorage:
- Key: `draft/${channelId}`
- Value: text content + any attached message type metadata
- Clear on successful send
- Survives app close/reopen

---

## Implementation Layers

### 1. IndexedDB Store

```typescript
// src/engine/offline/outbox.ts
import {openDB} from "idb"  // or use raw IndexedDB API

const db = await openDB("navcom-outbox", 1, {
  upgrade(db) {
    db.createObjectStore("messages", {keyPath: "id"})
  },
})

export async function enqueue(event: NostrEvent, channel: string) { /* ... */ }
export async function dequeue(id: string) { /* ... */ }
export async function getPending(): Promise<QueuedMessage[]> { /* ... */ }
```

### 2. Network Awareness

Listen for online/offline transitions:

```typescript
window.addEventListener("online", drainQueue)
window.addEventListener("offline", () => { /* pause publishing */ })
```

Also monitor actual relay connectivity (the `online` event only tracks browser-level connectivity, not relay reachability).

### 3. Queue Drain

On reconnect, process queued messages in order:
- Attempt to publish each event
- On success: remove from IndexedDB, update message status
- On failure: increment retry count, schedule next retry with exponential backoff
- After 5 failures: mark as failed, stop retrying (user can manually retry)

### 4. Service Worker Background Sync (Optional Enhancement)

Use the Background Sync API so the queue drains even if the PWA is backgrounded:

```javascript
// In service worker
self.addEventListener("sync", event => {
  if (event.tag === "navcom-outbox-drain") {
    event.waitUntil(drainOutboxQueue())
  }
})
```

This is a progressive enhancement — falls back to in-app drain if Background Sync isn't available.

---

## Dependencies

Consider: `idb` (IndexedDB wrapper, ~1KB) for cleaner API. Or use raw IndexedDB if avoiding dependencies.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/offline/outbox.ts` | IndexedDB outbox queue | ~100 |
| `src/engine/offline/queue-drain.ts` | Drain logic with retry | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| Message send function | Try publish → fallback to enqueue |
| Message rendering component | Show queued/sending/failed indicators |
| Compose component | Persist drafts to localStorage |
| App initialization | Attempt queue drain on startup |

---

## Verification

- [ ] Go offline → compose and send message → message shows with ⏳ icon
- [ ] Go online → message publishes automatically → ⏳ replaced with normal state
- [ ] Kill app while offline → reopen → queued messages still in outbox
- [ ] Relay rejects event → retry with backoff → mark failed after 5 attempts
- [ ] Draft text persists across app close/reopen
- [ ] Queue drain processes messages in order (FIFO)
