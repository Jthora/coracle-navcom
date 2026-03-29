/**
 * Peer-to-Peer Transport — Phase C of Mesh Networking (5.6.2.c)
 *
 * WebRTC data channels for direct device-to-device communication.
 * Signaling happens out-of-band (QR code, BLE, or local relay).
 *
 * Architecture:
 *   Peer A generates offer → share via QR/BLE → Peer B generates answer → share back → connected
 *   Once connected, messages flow directly via RTCDataChannel.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface PeerConnection {
  id: string
  pc: RTCPeerConnection
  channel: RTCDataChannel | null
  state: "connecting" | "connected" | "disconnected"
  remotePubkey: string | null
}

export interface PeerMessage {
  type: "nostr-event" | "ack" | "peer-info"
  payload: string
}

export type PeerEventCallback = (peerId: string, message: PeerMessage) => void

// ── RTC Configuration ──────────────────────────────────────────────────

const RTC_CONFIG: RTCConfiguration = {
  // No STUN/TURN servers — local-only operation by design.
  // In LAN/mesh scenarios, devices are on the same network segment.
  iceServers: [],
}

const DATA_CHANNEL_LABEL = "navcom-p2p"

// ── Peer Manager ───────────────────────────────────────────────────────

const peers = new Map<string, PeerConnection>()
let onMessageCallback: PeerEventCallback | null = null

/**
 * Register a callback for incoming peer messages.
 */
export function onPeerMessage(callback: PeerEventCallback) {
  onMessageCallback = callback
}

/**
 * Get all currently known peers.
 */
export function getPeers(): PeerConnection[] {
  return Array.from(peers.values())
}

/**
 * Get connected peers only.
 */
export function getConnectedPeers(): PeerConnection[] {
  return Array.from(peers.values()).filter(p => p.state === "connected")
}

// ── Offer / Answer Flow ────────────────────────────────────────────────

/**
 * Create an offer (initiator side).
 * Returns the SDP offer as a string to share with the remote peer (e.g., via QR code).
 */
export async function createOffer(peerId: string): Promise<string> {
  const pc = new RTCPeerConnection(RTC_CONFIG)
  const channel = pc.createDataChannel(DATA_CHANNEL_LABEL)

  const peer: PeerConnection = {
    id: peerId,
    pc,
    channel,
    state: "connecting",
    remotePubkey: null,
  }

  wireUpChannel(peer, channel)
  wireUpConnectionState(peer)

  peers.set(peerId, peer)

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  // Wait for ICE gathering to complete (local candidates only, fast)
  await waitForIceGathering(pc)

  return JSON.stringify(pc.localDescription)
}

/**
 * Accept an offer (responder side) and produce an answer.
 * Returns the SDP answer as a string to share back with the initiator,
 * or null if the offer is malformed.
 */
export async function acceptOffer(peerId: string, offerSdp: string): Promise<string | null> {
  let offer: {type?: string; sdp?: string}
  try {
    offer = JSON.parse(offerSdp)
  } catch {
    return null
  }
  if (!offer?.type || !offer?.sdp) return null

  const pc = new RTCPeerConnection(RTC_CONFIG)

  const peer: PeerConnection = {
    id: peerId,
    pc,
    channel: null,
    state: "connecting",
    remotePubkey: null,
  }

  pc.ondatachannel = event => {
    peer.channel = event.channel
    wireUpChannel(peer, event.channel)
  }

  wireUpConnectionState(peer)

  peers.set(peerId, peer)

  await pc.setRemoteDescription(new RTCSessionDescription(offer as RTCSessionDescriptionInit))

  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  await waitForIceGathering(pc)

  return JSON.stringify(pc.localDescription)
}

/**
 * Complete the connection by applying the remote answer (initiator side).
 * Returns false if the peer is unknown or the answer is malformed.
 */
export async function completeConnection(peerId: string, answerSdp: string): Promise<boolean> {
  const peer = peers.get(peerId)
  if (!peer) return false

  let answer: {type?: string; sdp?: string}
  try {
    answer = JSON.parse(answerSdp)
  } catch {
    return false
  }
  if (!answer?.type || !answer?.sdp) return false

  await peer.pc.setRemoteDescription(new RTCSessionDescription(answer as RTCSessionDescriptionInit))
  return true
}

// ── Sending ────────────────────────────────────────────────────────────

/**
 * Send a message to a specific peer.
 */
export function sendToPeer(peerId: string, message: PeerMessage): boolean {
  const peer = peers.get(peerId)
  if (!peer?.channel || peer.channel.readyState !== "open") return false

  peer.channel.send(JSON.stringify(message))
  return true
}

/**
 * Broadcast a message to all connected peers.
 */
export function broadcastToPeers(message: PeerMessage): number {
  let sent = 0
  const data = JSON.stringify(message)
  for (const peer of peers.values()) {
    if (peer.channel?.readyState === "open") {
      peer.channel.send(data)
      sent++
    }
  }
  return sent
}

/**
 * Send a Nostr event (JSON string) to all connected peers (store-and-forward).
 */
export function relayEventToPeers(eventJson: string): number {
  return broadcastToPeers({type: "nostr-event", payload: eventJson})
}

// ── Disconnect ─────────────────────────────────────────────────────────

/**
 * Disconnect from a specific peer.
 */
export function disconnectPeer(peerId: string) {
  const peer = peers.get(peerId)
  if (peer) {
    peer.channel?.close()
    peer.pc.close()
    peer.state = "disconnected"
    peers.delete(peerId)
  }
}

/**
 * Disconnect from all peers.
 */
export function disconnectAllPeers() {
  for (const [id] of peers) {
    disconnectPeer(id)
  }
}

// ── Internal Helpers ───────────────────────────────────────────────────

function wireUpChannel(peer: PeerConnection, channel: RTCDataChannel) {
  channel.onopen = () => {
    peer.state = "connected"
  }

  channel.onmessage = event => {
    try {
      const msg = JSON.parse(event.data) as PeerMessage
      onMessageCallback?.(peer.id, msg)
    } catch {
      // ignore malformed messages
    }
  }

  channel.onclose = () => {
    peer.state = "disconnected"
  }
}

function wireUpConnectionState(peer: PeerConnection) {
  peer.pc.onconnectionstatechange = () => {
    const state = peer.pc.connectionState
    if (state === "connected") {
      peer.state = "connected"
    } else if (state === "disconnected" || state === "failed" || state === "closed") {
      peer.state = "disconnected"
    }
  }
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise(resolve => {
    if (pc.iceGatheringState === "complete") {
      resolve()
      return
    }
    const handler = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", handler)
        resolve()
      }
    }
    pc.addEventListener("icegatheringstatechange", handler)
    // Safety timeout — local ICE gathering should be near-instant
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", handler)
      resolve()
    }, 2000)
  })
}

// For testing — reset module state
export function _resetForTest() {
  disconnectAllPeers()
  onMessageCallback = null
}
