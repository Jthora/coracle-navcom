import {openDB} from "idb"
import type {IDBPDatabase} from "idb"

export interface QueuedMessage {
  id: string
  channelId: string
  content: string
  createdAt: number
  status: "queued" | "sending" | "sent" | "failed"
  retryCount: number
  lastRetryAt: number | null
}

const DB_NAME = "navcom-outbox"
const DB_VERSION = 1
const STORE_NAME = "messages"

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {keyPath: "id"})
        }
      },
    })
  }
  return dbPromise
}

let nextId = 0

export async function enqueue(channelId: string, content: string): Promise<string> {
  const db = await getDb()
  const id = `outbox-${Date.now()}-${nextId++}`
  const msg: QueuedMessage = {
    id,
    channelId,
    content,
    createdAt: Date.now(),
    status: "queued",
    retryCount: 0,
    lastRetryAt: null,
  }
  await db.put(STORE_NAME, msg)
  return id
}

export async function dequeue(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export async function getPending(): Promise<QueuedMessage[]> {
  const db = await getDb()
  const all: QueuedMessage[] = await db.getAll(STORE_NAME)
  return all
    .filter(m => m.status === "queued" || m.status === "sending")
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function updateStatus(
  id: string,
  status: QueuedMessage["status"],
  retryCount?: number,
): Promise<void> {
  const db = await getDb()
  const msg: QueuedMessage | undefined = await db.get(STORE_NAME, id)
  if (!msg) return
  msg.status = status
  if (retryCount !== undefined) {
    msg.retryCount = retryCount
    msg.lastRetryAt = Date.now()
  }
  await db.put(STORE_NAME, msg)
}

export async function getQueuedCount(): Promise<number> {
  const pending = await getPending()
  return pending.length
}

export async function clearSent(): Promise<void> {
  const db = await getDb()
  const all: QueuedMessage[] = await db.getAll(STORE_NAME)
  const tx = db.transaction(STORE_NAME, "readwrite")
  for (const msg of all) {
    if (msg.status === "sent") {
      await tx.store.delete(msg.id)
    }
  }
  await tx.done
}
