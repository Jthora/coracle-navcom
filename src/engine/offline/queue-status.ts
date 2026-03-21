import {writable} from "svelte/store"
import type {QueuedMessage} from "./outbox"
import {getPending} from "./outbox"

export type QueueStatus = "queued" | "sending" | "sent" | "failed"

export interface QueueStatusEntry {
  id: string
  channelId: string
  content: string
  status: QueueStatus
  retryCount: number
}

/** Reactive store of pending/failed outbox messages, keyed by outbox ID. */
export const outboxStatus = writable<QueueStatusEntry[]>([])

/** Refresh the outbox status from IndexedDB. */
export async function refreshOutboxStatus(): Promise<void> {
  try {
    const pending = await getPending()
    outboxStatus.set(
      pending.map((m: QueuedMessage) => ({
        id: m.id,
        channelId: m.channelId,
        content: m.content,
        status: m.status,
        retryCount: m.retryCount,
      })),
    )
  } catch {
    // IndexedDB unavailable
  }
}

/** Get queued messages for a specific channel. */
export function getChannelQueue(
  entries: QueueStatusEntry[],
  channelId: string,
): QueueStatusEntry[] {
  return entries.filter(e => e.channelId === channelId)
}
