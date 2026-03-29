/**
 * Meshtastic Bridge — Phase B of Mesh Networking (5.6.2.b)
 *
 * Encodes minimal Nostr events into compact packets suitable for
 * Meshtastic LoRa mesh radio (~200 byte max payload).
 *
 * Architecture:
 *   NavCom app ↔ BLE ↔ Meshtastic radio ↔ LoRa mesh ↔ Meshtastic radio ↔ BLE ↔ NavCom app
 *
 * This module handles encoding/decoding of compact Nostr events.
 * BLE transport is provided by @capacitor-community/bluetooth-le in native contexts.
 */

// ── Compact Wire Format ────────────────────────────────────────────────
//
//  [1 byte: type] [4 bytes: timestamp] [32 bytes: pubkey] [N bytes: content] [64 bytes: sig]
//
//  Total overhead: 101 bytes → ~99 bytes content at 200 byte max
//
//  Type byte:
//    0x01 = text message
//    0x02 = check-in (lat/lng packed)
//    0x03 = alert
//    0x10 = ack
//

export const PACKET_TYPE = {
  TEXT: 0x01,
  CHECK_IN: 0x02,
  ALERT: 0x03,
  ACK: 0x10,
} as const

export type PacketType = (typeof PACKET_TYPE)[keyof typeof PACKET_TYPE]

export const MAX_LORA_PAYLOAD = 200
export const HEADER_SIZE = 1 + 4 + 32 // type + timestamp + pubkey
export const SIGNATURE_SIZE = 64
export const OVERHEAD = HEADER_SIZE + SIGNATURE_SIZE // 101 bytes
export const MAX_CONTENT_BYTES = MAX_LORA_PAYLOAD - OVERHEAD // 99 bytes

export interface CompactNostrPacket {
  type: PacketType
  timestamp: number
  pubkey: Uint8Array // 32 bytes
  content: Uint8Array // variable, up to MAX_CONTENT_BYTES
  signature: Uint8Array // 64 bytes
}

// ── Encoding ───────────────────────────────────────────────────────────

/**
 * Encode a compact Nostr event into a binary packet for LoRa transmission.
 * Content is truncated to MAX_CONTENT_BYTES if too long.
 */
export function encodePacket(packet: CompactNostrPacket): Uint8Array {
  const contentLen = Math.min(packet.content.length, MAX_CONTENT_BYTES)
  const buf = new Uint8Array(HEADER_SIZE + contentLen + SIGNATURE_SIZE)
  let offset = 0

  // Type byte
  buf[offset++] = packet.type

  // Timestamp (4 bytes, big-endian, Unix seconds)
  const ts = packet.timestamp >>> 0
  buf[offset++] = (ts >>> 24) & 0xff
  buf[offset++] = (ts >>> 16) & 0xff
  buf[offset++] = (ts >>> 8) & 0xff
  buf[offset++] = ts & 0xff

  // Pubkey (32 bytes)
  buf.set(packet.pubkey.subarray(0, 32), offset)
  offset += 32

  // Content (variable)
  buf.set(packet.content.subarray(0, contentLen), offset)
  offset += contentLen

  // Signature (64 bytes at end)
  buf.set(packet.signature.subarray(0, 64), offset)

  return buf
}

/**
 * Decode a binary LoRa packet back into a CompactNostrPacket.
 * Returns null if packet is too small or malformed.
 */
export function decodePacket(buf: Uint8Array): CompactNostrPacket | null {
  if (buf.length < OVERHEAD) return null

  let offset = 0

  const type = buf[offset++] as PacketType

  // Timestamp (4 bytes, big-endian)
  const timestamp =
    ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0
  offset += 4

  // Pubkey
  const pubkey = buf.slice(offset, offset + 32)
  offset += 32

  // Content is everything between header and last 64 bytes
  const contentEnd = buf.length - SIGNATURE_SIZE
  const content = buf.slice(offset, contentEnd)

  // Signature (last 64 bytes)
  const signature = buf.slice(contentEnd, contentEnd + 64)

  return {type, timestamp, pubkey, content, signature}
}

// ── Nostr Event ↔ Compact Packet ────────────────────────────────────

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Determine the packet type for a Nostr event based on its tags.
 */
export function inferPacketType(tags: string[][]): PacketType {
  const msgType = tags.find(t => t[0] === "msg-type")?.[1]
  if (msgType === "check-in") return PACKET_TYPE.CHECK_IN
  if (msgType === "alert") return PACKET_TYPE.ALERT
  return PACKET_TYPE.TEXT
}

/**
 * Build a CompactNostrPacket from a partial Nostr event.
 * The pubkey and signature must be provided as hex strings (64 and 128 chars).
 * Returns null if pubkey or sig contain invalid hex.
 */
export function eventToPacket(event: {
  pubkey: string
  created_at: number
  content: string
  sig: string
  tags?: string[][]
}): CompactNostrPacket | null {
  const pubkey = hexToBytes(event.pubkey)
  const signature = hexToBytes(event.sig)
  if (!pubkey || !signature) return null
  return {
    type: inferPacketType(event.tags || []),
    timestamp: event.created_at,
    pubkey,
    content: encoder.encode(event.content.slice(0, MAX_CONTENT_BYTES)),
    signature,
  }
}

/**
 * Reconstruct a minimal Nostr-like event from a decoded packet.
 */
export function packetToEvent(packet: CompactNostrPacket): {
  pubkey: string
  created_at: number
  content: string
  sig: string
  kind: number
  tags: string[][]
} {
  const msgType =
    packet.type === PACKET_TYPE.CHECK_IN
      ? "check-in"
      : packet.type === PACKET_TYPE.ALERT
        ? "alert"
        : "message"

  return {
    kind: 445,
    pubkey: bytesToHex(packet.pubkey),
    created_at: packet.timestamp,
    content: decoder.decode(packet.content),
    sig: bytesToHex(packet.signature),
    tags: [["msg-type", msgType]],
  }
}

// ── Hex utilities ──────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null
  if (!/^[0-9a-fA-F]*$/.test(hex)) return null
  const len = hex.length / 2
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

// ── BLE Transport Stub ────────────────────────────────────────────────
// Real implementation requires @capacitor-community/bluetooth-le plugin.
// These types define the interface a native BLE adapter would implement.

export interface MeshtasticBleAdapter {
  /** Scan for nearby Meshtastic devices */
  scan(): Promise<{deviceId: string; name: string}[]>

  /** Connect to a specific Meshtastic device */
  connect(deviceId: string): Promise<void>

  /** Send a compact Nostr packet through Meshtastic */
  send(packet: Uint8Array): Promise<void>

  /** Register a callback for incoming packets */
  onReceive(callback: (packet: Uint8Array) => void): void

  /** Disconnect from the Meshtastic device */
  disconnect(): Promise<void>
}
