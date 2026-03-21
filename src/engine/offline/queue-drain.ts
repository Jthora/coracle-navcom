import {getPending, updateStatus, dequeue} from "./outbox"
import {requestBackgroundSync} from "./sw-sync"

const MAX_RELAY_RETRIES = 5
const BASE_DELAY_MS = 2_000

let draining = false
let sendMessageFn: ((channelId: string, content: string, delay: number) => Promise<any>) | null =
  null

/** Register the sendMessage function to avoid circular imports. */
export function registerSendMessage(
  fn: (channelId: string, content: string, delay: number) => Promise<any>,
): void {
  sendMessageFn = fn
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
  } finally {
    draining = false
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
