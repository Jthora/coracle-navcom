import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"

// In-memory fake IDB store
function createFakeDb() {
  const data = new Map<string, any>()
  return {
    put(store: string, value: any) {
      data.set(value.id, structuredClone(value))
    },
    get(store: string, key: string) {
      const v = data.get(key)
      return v ? structuredClone(v) : undefined
    },
    getAll(store: string) {
      return Array.from(data.values()).map(v => structuredClone(v))
    },
    delete(store: string, key: string) {
      data.delete(key)
    },
    transaction(store: string, mode: string) {
      return {
        store: {
          delete(key: string) {
            data.delete(key)
          },
        },
        done: Promise.resolve(),
      }
    },
  }
}

const fakeDb = createFakeDb()

vi.mock("idb", () => ({
  openDB: vi.fn(() => Promise.resolve(fakeDb)),
}))

describe("offline/outbox", () => {
  let enqueue: typeof import("src/engine/offline/outbox").enqueue
  let dequeue: typeof import("src/engine/offline/outbox").dequeue
  let getPending: typeof import("src/engine/offline/outbox").getPending
  let updateStatus: typeof import("src/engine/offline/outbox").updateStatus
  let getQueuedCount: typeof import("src/engine/offline/outbox").getQueuedCount
  let clearSent: typeof import("src/engine/offline/outbox").clearSent

  beforeEach(async () => {
    vi.resetModules()

    // Re-mock after resetModules
    vi.doMock("idb", () => ({
      openDB: vi.fn(() => Promise.resolve(fakeDb)),
    }))

    // Clear in-memory store
    for (const key of (fakeDb as any).getAll("messages").map((m: any) => m.id)) {
      fakeDb.delete("messages", key)
    }

    const mod = await import("src/engine/offline/outbox")
    enqueue = mod.enqueue
    dequeue = mod.dequeue
    getPending = mod.getPending
    updateStatus = mod.updateStatus
    getQueuedCount = mod.getQueuedCount
    clearSent = mod.clearSent
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("enqueues a message and retrieves it as pending", async () => {
    const id = await enqueue("channel-1", "Hello offline")

    const pending = await getPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].channelId).toBe("channel-1")
    expect(pending[0].content).toBe("Hello offline")
    expect(pending[0].status).toBe("queued")
    expect(pending[0].id).toBe(id)
  })

  it("dequeues a message by id", async () => {
    const id = await enqueue("ch-1", "msg")

    await dequeue(id)

    const pending = await getPending()
    expect(pending).toHaveLength(0)
  })

  it("updateStatus changes status and retryCount", async () => {
    const id = await enqueue("ch-2", "retry test")

    await updateStatus(id, "sending")
    let pending = await getPending()
    expect(pending[0].status).toBe("sending")

    await updateStatus(id, "failed", 3)
    // Failed messages not in pending
    pending = await getPending()
    expect(pending).toHaveLength(0)

    const count = await getQueuedCount()
    expect(count).toBe(0)
  })

  it("getPending returns messages sorted by createdAt (FIFO)", async () => {
    await enqueue("ch-a", "first")
    // Tiny delay so timestamps differ
    await new Promise(r => setTimeout(r, 5))
    await enqueue("ch-b", "second")

    const pending = await getPending()
    expect(pending).toHaveLength(2)
    expect(pending[0].content).toBe("first")
    expect(pending[1].content).toBe("second")
  })

  it("clearSent removes only sent messages", async () => {
    const id1 = await enqueue("ch-1", "will be sent")
    await enqueue("ch-2", "still queued")

    await updateStatus(id1, "sent")

    await clearSent()

    const count = await getQueuedCount()
    expect(count).toBe(1)
  })
})

describe("offline/queue-drain", () => {
  it("registerSendMessage + drainQueue replays messages", async () => {
    vi.resetModules()

    vi.doMock("idb", () => ({
      openDB: vi.fn(() => Promise.resolve(fakeDb)),
    }))

    // Clear store
    for (const key of fakeDb.getAll("messages").map((m: any) => m.id)) {
      fakeDb.delete("messages", key)
    }

    // Simulate online
    vi.stubGlobal("navigator", {onLine: true})

    const outbox = await import("src/engine/offline/outbox")
    const drain = await import("src/engine/offline/queue-drain")

    const sent: string[] = []
    drain.registerSendMessage(async (channelId, content) => {
      sent.push(`${channelId}:${content}`)
    })

    await outbox.enqueue("ch-drain", "drain-msg-1")
    await outbox.enqueue("ch-drain", "drain-msg-2")

    await drain.drainQueue()

    expect(sent).toEqual(["ch-drain:drain-msg-1", "ch-drain:drain-msg-2"])

    // Messages should be dequeued after successful send
    const pending = await outbox.getPending()
    expect(pending).toHaveLength(0)

    vi.unstubAllGlobals()
  })

  it("retries failed messages with backoff", async () => {
    vi.resetModules()

    vi.doMock("idb", () => ({
      openDB: vi.fn(() => Promise.resolve(fakeDb)),
    }))

    for (const key of fakeDb.getAll("messages").map((m: any) => m.id)) {
      fakeDb.delete("messages", key)
    }

    vi.stubGlobal("navigator", {onLine: true})

    const outbox = await import("src/engine/offline/outbox")
    const drain = await import("src/engine/offline/queue-drain")

    let callCount = 0
    drain.registerSendMessage(async () => {
      callCount++
      throw new Error("relay unavailable")
    })

    await outbox.enqueue("ch-fail", "fail-msg")

    await drain.drainQueue()

    // Should have attempted once, but message still in queue with incremented retry
    expect(callCount).toBe(1)
    const pending = await outbox.getPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].retryCount).toBe(1)

    vi.unstubAllGlobals()
  })
})
