import {getPending, updateStatus, dequeue, getQuarantinedCount} from "./outbox"
import {requestBackgroundSync} from "./sw-sync"

const MAX_RELAY_RETRIES = 5
const BASE_DELAY_MS = 2_000

let draining = false
let sendMessageFn: ((channelId: string, content: string, delay: number) => Promise<any>) | null =
  null
let onQuarantineCallback: ((count: number) => void) | null = null
let onPassphraseNeededCallback: (() => void) | null = null

/** Register the sendMessage function to avoid circular imports. */
export function registerSendMessage(
  fn: (channelId: string, content: string, delay: number) => Promise<any>,
): void {
  sendMessageFn = fn
}

/** Register callback for quarantined message notifications. */
export function onQueueQuarantine(callback: (count: number) => void): void {
  onQuarantineCallback = callback
}

/** Register callback when queue drain fails because passphrase is needed. */
export function onQueuePassphraseNeeded(callback: () => void): void {
  onPassphraseNeededCallback = callback
}

function backoffDelay(retryCount: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** retryCount, 60_000)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Drain all pending messages from the outbox queue. */
export async function drainQueue(): Promise<void> {
  if (draining) return
  if (typeof navigator !== "undefined" && !navigator.onLine) return
  if (!sendMessageFn) return

  draining = true

  try {
    const pending = await getPending()

    for (const msg of pending) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break

      await updateStatus(msg.id, "sending")

      try {
        await sendMessageFn(msg.channelId, msg.content, 0)
        await dequeue(msg.id)
      } catch (err) {
        const isNetworkError = typeof navigator !== "undefined" && !navigator.onLine
        const errMsg = err instanceof Error ? err.message : String(err)

        // Passphrase needed — stop drain, notify UI, don't count against retries
        if (errMsg.includes("Passphrase required") || errMsg.includes("passphrase")) {
          await updateStatus(msg.id, "queued", msg.retryCount)
          if (onPassphraseNeededCallback) onPassphraseNeededCallback()
          break
        }

        if (isNetworkError) {
          // Network down — don't count against retry limit, re-queue and stop draining
          await updateStatus(msg.id, "queued", msg.retryCount)
          break
        }

        // Relay rejection or other error — count against retry limit
        const nextRetry = msg.retryCount + 1
        if (nextRetry >= MAX_RELAY_RETRIES) {
          await updateStatus(msg.id, "failed", nextRetry)
        } else {
          await updateStatus(msg.id, "queued", nextRetry)
          await sleep(backoffDelay(nextRetry))
        }
      }
    }
  } catch (drainError) {
    // Defensive: recover any messages stuck in "sending" state from this drain cycle
    try {
      const stuckPending = await getPending()
      for (const msg of stuckPending) {
        if (msg.status === "sending") {
          await updateStatus(msg.id, "queued", msg.retryCount)
        }
      }
    } catch {
      // Best effort — don't mask original error
    }
    console.warn("[QueueDrain] Drain cycle failed — restored stuck messages:", drainError)
  } finally {
    draining = false

    // Notify about quarantined messages after drain completes
    if (onQuarantineCallback) {
      try {
        const quarantined = await getQuarantinedCount()
        if (quarantined > 0) {
          onQuarantineCallback(quarantined)
        }
      } catch {
        // Best effort
      }
    }
  }
}

/** Start listening for online/offline events and drain on reconnect. */
export function startQueueWatcher(): () => void {
  const onOnline = () => drainQueue()

  if (typeof window !== "undefined") {
    window.addEventListener("online", onOnline)
  }

  // Register background sync so SW can drain when app is backgrounded
  requestBackgroundSync()

  // Initial drain on startup
  drainQueue()

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", onOnline)
    }
  }
}
