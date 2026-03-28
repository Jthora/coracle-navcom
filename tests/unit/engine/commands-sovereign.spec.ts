import {describe, it, expect, vi, beforeEach} from "vitest"

// Mock all dependencies before importing the module under test
const mockSign = vi.fn()
const mockPublishThunk = vi.fn()
const mockEnqueueSignedEvent = vi.fn()
const mockGetQueuedCount = vi.fn()
const mockUpdateQueuedCount = vi.fn()
const mockGetUrls = vi.fn(() => ["wss://relay1.test", "wss://relay2.test"])
const mockPolicy = vi.fn(() => ({getUrls: mockGetUrls}))
const mockPublishEvent = vi.fn(() => ({policy: mockPolicy}))
const mockRouterGet = vi.fn(() => ({PublishEvent: mockPublishEvent}))

let sovereignValue = false

vi.mock("src/engine/state", () => ({
  sign: (...args: any[]) => mockSign(...args),
  anonymous: vi.fn(),
  getClientTags: vi.fn(),
  getSetting: vi.fn(),
  userFeedFavorites: {subscribe: vi.fn()},
  withIndexers: vi.fn(),
}))

vi.mock("@welshman/app", () => ({
  follow: vi.fn(),
  unfollow: vi.fn(),
  userMessagingRelayList: {subscribe: vi.fn()},
  pubkey: {subscribe: vi.fn()},
  repository: {subscribe: vi.fn()},
  session: {subscribe: vi.fn()},
  signer: {subscribe: vi.fn()},
  tagPubkey: vi.fn(),
  userRelayList: {subscribe: vi.fn()},
  publishThunk: (...args: any[]) => mockPublishThunk(...args),
  sendWrapped: vi.fn(),
}))

vi.mock("@welshman/router", () => ({
  Router: {get: mockRouterGet},
  addMaximalFallbacks: vi.fn(),
  addMinimalFallbacks: vi.fn(),
}))

vi.mock("src/engine/offline/outbox", () => ({
  enqueue: vi.fn(),
  enqueueSignedEvent: (...args: any[]) => mockEnqueueSignedEvent(...args),
  getQueuedCount: () => mockGetQueuedCount(),
}))

vi.mock("src/engine/offline/queue-drain", () => ({
  registerSendMessage: vi.fn(),
}))

vi.mock("src/engine/connection-state", () => ({
  isSovereign: {
    subscribe: (fn: (v: boolean) => void) => {
      fn(sovereignValue)
      return () => {}
    },
    _isSovereignMock: true,
  },
  updateQueuedCount: (...args: any[]) => mockUpdateQueuedCount(...args),
}))

vi.mock("svelte/store", async () => {
  const actual = await vi.importActual("svelte/store")
  return {
    ...(actual as any),
    get: (store: any) => {
      // The isSovereign store mock has a _isSovereignMock flag
      if (store && store._isSovereignMock) {
        return sovereignValue
      }
      let val: any
      store.subscribe((v: any) => {
        val = v
      })()
      return val
    },
  }
})

// Mock remaining transitive dependencies
vi.mock("src/engine/pqc/dm-send-policy", () => ({resolveDmSendPolicy: vi.fn()}))
vi.mock("src/engine/pqc/dm-size-preflight", () => ({runDmPayloadSizePreflight: vi.fn()}))
vi.mock("src/engine/pqc/pq-key-lifecycle", () => ({
  ensureOwnPqcKey: vi.fn(),
  resolvePeerPqPublicKey: vi.fn(),
}))
vi.mock("src/engine/pqc/dm-envelope", () => ({buildDmPqcEnvelope: vi.fn()}))
vi.mock("src/util/html", () => ({stripExifData: vi.fn()}))
vi.mock("src/util/nostr", () => ({appDataKeys: {}, nsecDecode: vi.fn()}))

const fakeEvent = {
  id: "abc123",
  pubkey: "pub123",
  kind: 1,
  content: "test",
  tags: [],
  created_at: 1000,
  sig: "sig123",
}

describe("signAndPublish sovereign mode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSign.mockResolvedValue(fakeEvent)
    mockPublishThunk.mockResolvedValue(fakeEvent)
    mockEnqueueSignedEvent.mockResolvedValue("outbox-1")
    mockGetQueuedCount.mockResolvedValue(1)
  })

  it("enqueues event when sovereign", async () => {
    sovereignValue = true
    const {signAndPublish} = await import("src/engine/commands")
    const result = await signAndPublish({kind: 1, content: "test", tags: []})

    expect(mockSign).toHaveBeenCalledOnce()
    expect(mockEnqueueSignedEvent).toHaveBeenCalledWith(fakeEvent, [
      "wss://relay1.test",
      "wss://relay2.test",
    ])
    expect(mockUpdateQueuedCount).toHaveBeenCalledWith(1)
    expect(mockPublishThunk).not.toHaveBeenCalled()
    expect(result).toEqual(fakeEvent)
  })

  it("publishes normally when connected", async () => {
    sovereignValue = false
    const {signAndPublish} = await import("src/engine/commands")
    const result = await signAndPublish({kind: 1, content: "test", tags: []})

    expect(mockSign).toHaveBeenCalledOnce()
    expect(mockPublishThunk).toHaveBeenCalled()
    expect(mockEnqueueSignedEvent).not.toHaveBeenCalled()
    expect(result).toEqual(fakeEvent)
  })

  it("updates queued count after enqueue", async () => {
    sovereignValue = true
    mockGetQueuedCount.mockResolvedValue(3)
    const {signAndPublish} = await import("src/engine/commands")
    await signAndPublish({kind: 1, content: "test", tags: []})

    expect(mockUpdateQueuedCount).toHaveBeenCalledWith(3)
  })

  it("returns signed event regardless of mode", async () => {
    const {signAndPublish} = await import("src/engine/commands")

    sovereignValue = true
    const resultSovereign = await signAndPublish({kind: 1, content: "a", tags: []})

    sovereignValue = false
    const resultConnected = await signAndPublish({kind: 1, content: "b", tags: []})

    expect(resultSovereign).toEqual(fakeEvent)
    expect(resultConnected).toEqual(fakeEvent)
  })
})
