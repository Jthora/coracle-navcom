import {describe, it, expect} from "vitest"
import {
  encodePacket,
  decodePacket,
  eventToPacket,
  packetToEvent,
  inferPacketType,
  hexToBytes,
  bytesToHex,
  PACKET_TYPE,
  MAX_LORA_PAYLOAD,
  OVERHEAD,
  MAX_CONTENT_BYTES,
  HEADER_SIZE,
  SIGNATURE_SIZE,
} from "src/engine/mesh/meshtastic-bridge"

describe("meshtastic-bridge", () => {
  describe("constants", () => {
    it("OVERHEAD is 101 bytes", () => {
      expect(OVERHEAD).toBe(101)
    })

    it("MAX_CONTENT_BYTES is 99", () => {
      expect(MAX_CONTENT_BYTES).toBe(99)
    })

    it("HEADER_SIZE is 37", () => {
      expect(HEADER_SIZE).toBe(37)
    })

    it("SIGNATURE_SIZE is 64", () => {
      expect(SIGNATURE_SIZE).toBe(64)
    })

    it("OVERHEAD + MAX_CONTENT = MAX_LORA_PAYLOAD", () => {
      expect(OVERHEAD + MAX_CONTENT_BYTES).toBe(MAX_LORA_PAYLOAD)
    })
  })

  describe("hexToBytes / bytesToHex", () => {
    it("round-trips hex string", () => {
      const hex = "0123456789abcdef"
      const bytes = hexToBytes(hex)
      expect(bytes).not.toBeNull()
      expect(bytesToHex(bytes!)).toBe(hex)
    })

    it("handles 32-byte pubkey", () => {
      const hex = "a".repeat(64)
      const bytes = hexToBytes(hex)
      expect(bytes).not.toBeNull()
      expect(bytes!.length).toBe(32)
      expect(bytesToHex(bytes!)).toBe(hex)
    })

    it("handles empty string", () => {
      const bytes = hexToBytes("")
      expect(bytes).not.toBeNull()
      expect(bytesToHex(bytes!)).toBe("")
    })

    it("returns null for odd-length hex", () => {
      expect(hexToBytes("abc")).toBeNull()
    })

    it("returns null for invalid hex characters", () => {
      expect(hexToBytes("zzzz")).toBeNull()
      expect(hexToBytes("gg00")).toBeNull()
    })

    it("returns null for mixed valid/invalid hex", () => {
      expect(hexToBytes("ab01xy")).toBeNull()
    })
  })

  describe("encodePacket / decodePacket", () => {
    const pubkey = new Uint8Array(32).fill(0xab)
    const signature = new Uint8Array(64).fill(0xcd)
    const content = new TextEncoder().encode("Hello mesh")

    it("round-trips a text packet", () => {
      const packet = {
        type: PACKET_TYPE.TEXT as any,
        timestamp: 1700000000,
        pubkey,
        content,
        signature,
      }

      const encoded = encodePacket(packet)
      expect(encoded.length).toBe(HEADER_SIZE + content.length + SIGNATURE_SIZE)

      const decoded = decodePacket(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded!.type).toBe(PACKET_TYPE.TEXT)
      expect(decoded!.timestamp).toBe(1700000000)
      expect(Array.from(decoded!.pubkey)).toEqual(Array.from(pubkey))
      expect(Array.from(decoded!.signature)).toEqual(Array.from(signature))
      expect(new TextDecoder().decode(decoded!.content)).toBe("Hello mesh")
    })

    it("round-trips a check-in packet", () => {
      const packet = {
        type: PACKET_TYPE.CHECK_IN as any,
        timestamp: 1700000001,
        pubkey,
        content: new TextEncoder().encode("40.7,-74.0"),
        signature,
      }

      const encoded = encodePacket(packet)
      const decoded = decodePacket(encoded)
      expect(decoded!.type).toBe(PACKET_TYPE.CHECK_IN)
    })

    it("round-trips an alert packet", () => {
      const packet = {
        type: PACKET_TYPE.ALERT as any,
        timestamp: 1700000002,
        pubkey,
        content: new TextEncoder().encode("Danger!"),
        signature,
      }

      const encoded = encodePacket(packet)
      const decoded = decodePacket(encoded)
      expect(decoded!.type).toBe(PACKET_TYPE.ALERT)
      expect(new TextDecoder().decode(decoded!.content)).toBe("Danger!")
    })

    it("truncates content exceeding MAX_CONTENT_BYTES", () => {
      const longContent = new Uint8Array(200).fill(0x41) // 200 bytes of 'A'
      const packet = {
        type: PACKET_TYPE.TEXT as any,
        timestamp: 1700000000,
        pubkey,
        content: longContent,
        signature,
      }

      const encoded = encodePacket(packet)
      expect(encoded.length).toBe(MAX_LORA_PAYLOAD)

      const decoded = decodePacket(encoded)
      expect(decoded!.content.length).toBe(MAX_CONTENT_BYTES)
    })

    it("handles empty content", () => {
      const packet = {
        type: PACKET_TYPE.TEXT as any,
        timestamp: 1700000000,
        pubkey,
        content: new Uint8Array(0),
        signature,
      }

      const encoded = encodePacket(packet)
      expect(encoded.length).toBe(OVERHEAD)

      const decoded = decodePacket(encoded)
      expect(decoded!.content.length).toBe(0)
    })

    it("returns null for too-small buffer", () => {
      expect(decodePacket(new Uint8Array(50))).toBeNull()
    })
  })

  describe("inferPacketType", () => {
    it("returns CHECK_IN for check-in msg-type", () => {
      expect(inferPacketType([["msg-type", "check-in"]])).toBe(PACKET_TYPE.CHECK_IN)
    })

    it("returns ALERT for alert msg-type", () => {
      expect(inferPacketType([["msg-type", "alert"]])).toBe(PACKET_TYPE.ALERT)
    })

    it("returns TEXT for unknown msg-type", () => {
      expect(inferPacketType([["msg-type", "message"]])).toBe(PACKET_TYPE.TEXT)
    })

    it("returns TEXT when no tags", () => {
      expect(inferPacketType([])).toBe(PACKET_TYPE.TEXT)
    })
  })

  describe("eventToPacket / packetToEvent", () => {
    const pubhex = "ab".repeat(32)
    const sighex = "cd".repeat(64)

    it("round-trips a text event", () => {
      const event = {
        pubkey: pubhex,
        created_at: 1700000000,
        content: "Hello from Nostr",
        sig: sighex,
        tags: [["msg-type", "message"]],
      }

      const packet = eventToPacket(event)
      expect(packet).not.toBeNull()
      expect(packet!.type).toBe(PACKET_TYPE.TEXT)

      const restored = packetToEvent(packet!)
      expect(restored.pubkey).toBe(pubhex)
      expect(restored.created_at).toBe(1700000000)
      expect(restored.content).toBe("Hello from Nostr")
      expect(restored.sig).toBe(sighex)
      expect(restored.kind).toBe(445)
      expect(restored.tags).toContainEqual(["msg-type", "message"])
    })

    it("round-trips a check-in event", () => {
      const event = {
        pubkey: pubhex,
        created_at: 1700000001,
        content: "40.7128,-74.0060",
        sig: sighex,
        tags: [["msg-type", "check-in"]],
      }

      const packet = eventToPacket(event)
      expect(packet).not.toBeNull()
      expect(packet!.type).toBe(PACKET_TYPE.CHECK_IN)

      const restored = packetToEvent(packet!)
      expect(restored.tags).toContainEqual(["msg-type", "check-in"])
    })

    it("round-trips an alert event", () => {
      const event = {
        pubkey: pubhex,
        created_at: 1700000002,
        content: "Contact spotted",
        sig: sighex,
        tags: [["msg-type", "alert"]],
      }

      const packet = eventToPacket(event)
      expect(packet).not.toBeNull()
      expect(packet!.type).toBe(PACKET_TYPE.ALERT)

      const restored = packetToEvent(packet!)
      expect(restored.tags).toContainEqual(["msg-type", "alert"])
      expect(restored.content).toBe("Contact spotted")
    })

    it("truncates long content", () => {
      const event = {
        pubkey: pubhex,
        created_at: 1700000000,
        content: "A".repeat(200),
        sig: sighex,
      }

      const packet = eventToPacket(event)
      expect(packet).not.toBeNull()
      const restored = packetToEvent(packet!)
      expect(restored.content.length).toBeLessThanOrEqual(MAX_CONTENT_BYTES)
    })

    it("returns null for invalid hex pubkey", () => {
      expect(
        eventToPacket({
          pubkey: "zz".repeat(32),
          created_at: 1700000000,
          content: "test",
          sig: "cd".repeat(64),
        }),
      ).toBeNull()
    })

    it("returns null for invalid hex signature", () => {
      expect(
        eventToPacket({
          pubkey: "ab".repeat(32),
          created_at: 1700000000,
          content: "test",
          sig: "not-hex",
        }),
      ).toBeNull()
    })
  })
})
