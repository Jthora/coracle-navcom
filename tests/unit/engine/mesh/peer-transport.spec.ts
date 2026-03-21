import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"

// ── WebRTC Mocks ─────────────────────────────────────────────────────

class MockDataChannel {
  readyState = "connecting"
  label: string
  onopen: (() => void) | null = null
  onmessage: ((e: {data: string}) => void) | null = null
  onclose: (() => void) | null = null
  sent: string[] = []

  constructor(label: string) {
    this.label = label
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.readyState = "closed"
    this.onclose?.()
  }

  // Test helpers
  _open() {
    this.readyState = "open"
    this.onopen?.()
  }

  _receive(data: string) {
    this.onmessage?.({data})
  }
}

class MockRTCPeerConnection {
  localDescription: {type: string; sdp: string} | null = null
  remoteDescription: {type: string; sdp: string} | null = null
  connectionState = "new"
  iceGatheringState = "complete" // skip ICE gathering by default
  ondatachannel: ((e: {channel: MockDataChannel}) => void) | null = null
  onconnectionstatechange: (() => void) | null = null
  _channels: MockDataChannel[] = []
  _listeners = new Map<string, Set<() => void>>()

  createDataChannel(label: string): MockDataChannel {
    const ch = new MockDataChannel(label)
    this._channels.push(ch)
    return ch
  }

  async createOffer() {
    return {type: "offer", sdp: "mock-offer-sdp"}
  }

  async createAnswer() {
    return {type: "answer", sdp: "mock-answer-sdp"}
  }

  async setLocalDescription(desc: {type: string; sdp: string}) {
    this.localDescription = desc
  }

  async setRemoteDescription(desc: {type: string; sdp: string}) {
    this.remoteDescription = desc
  }

  addEventListener(event: string, handler: () => void) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event)!.add(handler)
  }

  removeEventListener(event: string, handler: () => void) {
    this._listeners.get(event)?.delete(handler)
  }

  close() {
    this.connectionState = "closed"
  }
}

class MockRTCSessionDescription {
  type: string
  sdp: string
  constructor(init: {type: string; sdp: string}) {
    this.type = init.type
    this.sdp = init.sdp
  }
}

// Install global mocks
vi.stubGlobal("RTCPeerConnection", MockRTCPeerConnection)
vi.stubGlobal("RTCSessionDescription", MockRTCSessionDescription)

// Now import the module under test
import {
  createOffer,
  acceptOffer,
  completeConnection,
  sendToPeer,
  broadcastToPeers,
  relayEventToPeers,
  disconnectPeer,
  disconnectAllPeers,
  getPeers,
  getConnectedPeers,
  onPeerMessage,
  _resetForTest,
} from "src/engine/mesh/peer-transport"
import type {PeerMessage} from "src/engine/mesh/peer-transport"

describe("peer-transport", () => {
  beforeEach(() => {
    _resetForTest()
  })

  afterEach(() => {
    _resetForTest()
  })

  // ── Offer / Answer ─────────────────────────────────────────────

  describe("createOffer", () => {
    it("returns a JSON SDP offer string", async () => {
      const offer = await createOffer("peer-1")
      const parsed = JSON.parse(offer)
      expect(parsed.type).toBe("offer")
      expect(parsed.sdp).toBe("mock-offer-sdp")
    })

    it("adds the peer to the peers list", async () => {
      await createOffer("peer-1")
      expect(getPeers()).toHaveLength(1)
      expect(getPeers()[0].id).toBe("peer-1")
      expect(getPeers()[0].state).toBe("connecting")
    })
  })

  describe("acceptOffer", () => {
    it("returns a JSON SDP answer string", async () => {
      const offerSdp = JSON.stringify({type: "offer", sdp: "mock-offer-sdp"})
      const answer = await acceptOffer("peer-2", offerSdp)
      expect(answer).not.toBeNull()
      const parsed = JSON.parse(answer!)
      expect(parsed.type).toBe("answer")
      expect(parsed.sdp).toBe("mock-answer-sdp")
    })

    it("adds the peer to the peers list", async () => {
      const offerSdp = JSON.stringify({type: "offer", sdp: "mock-offer-sdp"})
      await acceptOffer("peer-2", offerSdp)
      expect(getPeers()).toHaveLength(1)
      expect(getPeers()[0].id).toBe("peer-2")
    })

    it("returns null for malformed JSON", async () => {
      expect(await acceptOffer("peer-bad", "not json")).toBeNull()
    })

    it("returns null for missing type/sdp fields", async () => {
      expect(await acceptOffer("peer-bad", JSON.stringify({foo: "bar"}))).toBeNull()
    })
  })

  describe("completeConnection", () => {
    it("sets the remote description on the initiator peer", async () => {
      await createOffer("peer-3")
      const answerSdp = JSON.stringify({type: "answer", sdp: "mock-answer-sdp"})
      const result = await completeConnection("peer-3", answerSdp)

      expect(result).toBe(true)
      const peer = getPeers()[0]
      expect(peer.pc.remoteDescription).toEqual({type: "answer", sdp: "mock-answer-sdp"})
    })

    it("returns false for unknown peer", async () => {
      expect(await completeConnection("unknown", "{}")).toBe(false)
    })

    it("returns false for malformed JSON", async () => {
      await createOffer("peer-3b")
      expect(await completeConnection("peer-3b", "not json")).toBe(false)
    })

    it("returns false for missing type/sdp fields", async () => {
      await createOffer("peer-3c")
      expect(await completeConnection("peer-3c", JSON.stringify({foo: "bar"}))).toBe(false)
    })
  })

  // ── Sending ────────────────────────────────────────────────────

  describe("sendToPeer", () => {
    it("returns false when peer has no open channel", async () => {
      await createOffer("peer-4")
      const result = sendToPeer("peer-4", {type: "ack", payload: "ok"})
      expect(result).toBe(false)
    })

    it("sends when channel is open", async () => {
      await createOffer("peer-5")
      const peer = getPeers()[0]
      const ch = peer.channel as unknown as MockDataChannel
      ch._open()
      const msg: PeerMessage = {type: "nostr-event", payload: '{"kind":445}'}
      const result = sendToPeer("peer-5", msg)
      expect(result).toBe(true)
      expect(ch.sent).toHaveLength(1)
      expect(JSON.parse(ch.sent[0])).toEqual(msg)
    })

    it("returns false for unknown peer", () => {
      expect(sendToPeer("nobody", {type: "ack", payload: ""})).toBe(false)
    })
  })

  describe("broadcastToPeers", () => {
    it("sends to all connected peers", async () => {
      await createOffer("a")
      await createOffer("b")
      const peers = getPeers()
      ;(peers[0].channel as unknown as MockDataChannel)._open()
      ;(peers[1].channel as unknown as MockDataChannel)._open()

      const count = broadcastToPeers({type: "peer-info", payload: "hello"})
      expect(count).toBe(2)
    })

    it("skips peers with closed channels", async () => {
      await createOffer("a")
      await createOffer("b")
      const peers = getPeers()
      ;(peers[0].channel as unknown as MockDataChannel)._open()
      // peers[1] channel stays in "connecting" state

      const count = broadcastToPeers({type: "ack", payload: ""})
      expect(count).toBe(1)
    })
  })

  describe("relayEventToPeers", () => {
    it("wraps string as nostr-event message", async () => {
      await createOffer("r1")
      const ch = getPeers()[0].channel as unknown as MockDataChannel
      ch._open()

      relayEventToPeers('{"kind":445}')
      const sent = JSON.parse(ch.sent[0])
      expect(sent.type).toBe("nostr-event")
      expect(sent.payload).toBe('{"kind":445}')
    })
  })

  // ── Receiving ──────────────────────────────────────────────────

  describe("onPeerMessage", () => {
    it("triggers callback on incoming messages", async () => {
      const received: Array<{peerId: string; msg: PeerMessage}> = []
      onPeerMessage((peerId, msg) => received.push({peerId, msg}))

      await createOffer("m1")
      const ch = getPeers()[0].channel as unknown as MockDataChannel
      ch._open()
      ch._receive(JSON.stringify({type: "ack", payload: "ok"}))

      expect(received).toHaveLength(1)
      expect(received[0].peerId).toBe("m1")
      expect(received[0].msg.type).toBe("ack")
    })

    it("ignores malformed messages without errors", async () => {
      onPeerMessage(() => {
        throw new Error("should not be called")
      })

      await createOffer("m2")
      const ch = getPeers()[0].channel as unknown as MockDataChannel
      ch._open()
      // Send non-JSON — should not throw
      expect(() => ch._receive("not json at all")).not.toThrow()
    })
  })

  // ── Disconnect ─────────────────────────────────────────────────

  describe("disconnect", () => {
    it("removes peer from list", async () => {
      await createOffer("d1")
      expect(getPeers()).toHaveLength(1)
      disconnectPeer("d1")
      expect(getPeers()).toHaveLength(0)
    })

    it("disconnectAllPeers clears all peers", async () => {
      await createOffer("d2")
      await createOffer("d3")
      expect(getPeers()).toHaveLength(2)
      disconnectAllPeers()
      expect(getPeers()).toHaveLength(0)
    })

    it("is a no-op for unknown peer", () => {
      expect(() => disconnectPeer("unknown")).not.toThrow()
    })
  })

  // ── State Helpers ──────────────────────────────────────────────

  describe("getConnectedPeers", () => {
    it("filters to connected peers only", async () => {
      await createOffer("c1")
      await createOffer("c2")
      const peers = getPeers()
      ;(peers[0].channel as unknown as MockDataChannel)._open()
      // c1 is now connected via channel onopen handler

      const connected = getConnectedPeers()
      expect(connected).toHaveLength(1)
      expect(connected[0].id).toBe("c1")
    })
  })
})
