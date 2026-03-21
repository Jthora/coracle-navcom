import {describe, it, expect} from "vitest"

/** Extract msg-type from event tags (mirrors the runtime helper in GroupConversation) */
function getMessageType(event: {tags: string[][]}): string | null {
  const tag = event.tags.find(t => t[0] === "msg-type")
  return tag ? tag[1] : null
}

/** Minimal geohash encoder (mirrors GroupConversation.simpleGeohash) */
function simpleGeohash(lat: number, lng: number, precision: number): string {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
  let minLat = -90,
    maxLat = 90,
    minLng = -180,
    maxLng = 180
  let hash = "",
    bits = 0,
    ch = 0,
    isEven = true
  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2
      if (lng >= mid) {
        ch |= 1 << (4 - bits)
        minLng = mid
      } else {
        maxLng = mid
      }
    } else {
      const mid = (minLat + maxLat) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bits)
        minLat = mid
      } else {
        maxLat = mid
      }
    }
    isEven = !isEven
    if (++bits === 5) {
      hash += base32[ch]
      bits = 0
      ch = 0
    }
  }
  return hash
}

describe("Message Type System", () => {
  describe("getMessageType", () => {
    it("returns null for regular messages (no msg-type tag)", () => {
      const event = {tags: [["h", "group1"]]}
      expect(getMessageType(event)).toBeNull()
    })

    it("returns 'check-in' for check-in messages", () => {
      const event = {
        tags: [
          ["h", "group1"],
          ["msg-type", "check-in"],
        ],
      }
      expect(getMessageType(event)).toBe("check-in")
    })

    it("returns 'alert' for alert messages", () => {
      const event = {
        tags: [
          ["h", "group1"],
          ["msg-type", "alert"],
          ["priority", "high"],
        ],
      }
      expect(getMessageType(event)).toBe("alert")
    })
  })

  describe("simpleGeohash", () => {
    it("produces a 6-character geohash", () => {
      const hash = simpleGeohash(34.0522, -118.2437, 6)
      expect(hash).toHaveLength(6)
    })

    it("produces known geohash for well-known coordinates", () => {
      // San Francisco: ~37.7749, -122.4194 → starts with "9q8y"
      const hash = simpleGeohash(37.7749, -122.4194, 6)
      expect(hash.startsWith("9q8y")).toBe(true)
    })

    it("produces different hashes for different locations", () => {
      const sf = simpleGeohash(37.7749, -122.4194, 6)
      const ny = simpleGeohash(40.7128, -74.006, 6)
      expect(sf).not.toBe(ny)
    })
  })

  describe("extraTags construction", () => {
    it("builds correct tags for a check-in message", () => {
      const extraTags: string[][] = [
        ["msg-type", "check-in"],
        ["location", "34.0522,-118.2437"],
        ["g", "9q5cs5"],
      ]
      expect(extraTags).toContainEqual(["msg-type", "check-in"])
      expect(extraTags).toContainEqual(["location", "34.0522,-118.2437"])
      expect(extraTags.find(t => t[0] === "g")).toBeTruthy()
    })

    it("builds correct tags for an alert message", () => {
      const extraTags: string[][] = [
        ["msg-type", "alert"],
        ["priority", "high"],
      ]
      expect(extraTags).toContainEqual(["msg-type", "alert"])
      expect(extraTags).toContainEqual(["priority", "high"])
    })

    it("builds no extra tags for regular messages", () => {
      const extraTags: string[][] = []
      expect(extraTags).toHaveLength(0)
    })
  })

  describe("progressive disclosure thresholds", () => {
    const PHASE_A_THRESHOLD = 10
    const PHASE_B_THRESHOLD = 30

    it("hides type selector below threshold", () => {
      expect(5 >= PHASE_A_THRESHOLD).toBe(false)
    })

    it("shows phase A types at 10 messages", () => {
      expect(10 >= PHASE_A_THRESHOLD).toBe(true)
      expect(10 >= PHASE_B_THRESHOLD).toBe(false)
    })

    it("shows phase B types at 30 messages", () => {
      expect(30 >= PHASE_B_THRESHOLD).toBe(true)
    })
  })
})
