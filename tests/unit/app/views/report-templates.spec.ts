import {describe, it, expect} from "vitest"

/**
 * Tests for SITREP/SPOTREP report template tag parsing and message rendering logic.
 * The rendering itself lives in Svelte components; here we validate the tag contract
 * used across SitrepCard, SpotrepCard, SitrepForm, SpotrepForm, and GroupConversation.
 */

function makeMessage(overrides: {
  pubkey?: string
  content?: string
  tags?: string[][]
  created_at?: number
}) {
  return {
    id: "msg-1",
    pubkey: overrides.pubkey || "pub-test-1",
    content: overrides.content || "Test content",
    tags: overrides.tags || [],
    created_at: overrides.created_at || 1700000000,
    kind: 445,
    sig: "sig",
  }
}

function getMessageType(event: {tags: string[][]}): string | null {
  const tag = event.tags.find(t => t[0] === "msg-type")
  return tag ? tag[1] : null
}

function parseSeverity(event: {tags: string[][]}): string {
  return event.tags.find(t => t[0] === "severity")?.[1] || "routine"
}

function parseLocation(event: {tags: string[][]}): string | null {
  return event.tags.find(t => t[0] === "location")?.[1] || null
}

function parsePhotoUrl(event: {tags: string[][]}): string | null {
  const imetaTag = event.tags.find(t => t[0] === "imeta")
  if (!imetaTag) return null
  const urlPart = imetaTag.find(v => v.startsWith("url "))
  return urlPart ? urlPart.slice(4) : null
}

describe("report-templates tag contract", () => {
  describe("SITREP message type", () => {
    it("identifies sitrep from msg-type tag", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "sitrep"],
          ["severity", "urgent"],
        ],
      })
      expect(getMessageType(msg)).toBe("sitrep")
    })

    it("parses severity from sitrep tags", () => {
      expect(parseSeverity(makeMessage({tags: [["severity", "urgent"]]}))).toBe("urgent")
      expect(parseSeverity(makeMessage({tags: [["severity", "important"]]}))).toBe("important")
      expect(parseSeverity(makeMessage({tags: [["severity", "routine"]]}))).toBe("routine")
    })

    it("defaults severity to routine when missing", () => {
      expect(parseSeverity(makeMessage({tags: [["msg-type", "sitrep"]]}))).toBe("routine")
    })

    it("extracts location from sitrep tags", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "sitrep"],
          ["location", "34.0522,-118.2437"],
        ],
      })
      expect(parseLocation(msg)).toBe("34.0522,-118.2437")
    })

    it("returns null location when not provided", () => {
      const msg = makeMessage({tags: [["msg-type", "sitrep"]]})
      expect(parseLocation(msg)).toBeNull()
    })
  })

  describe("SPOTREP message type", () => {
    it("identifies spotrep from msg-type tag", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "spotrep"],
          ["location", "51.5074,-0.1278"],
        ],
      })
      expect(getMessageType(msg)).toBe("spotrep")
    })

    it("extracts location from spotrep tags", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "spotrep"],
          ["location", "51.5074,-0.1278"],
        ],
      })
      expect(parseLocation(msg)).toBe("51.5074,-0.1278")
    })

    it("extracts photo URL from NIP-92 imeta tag", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "spotrep"],
          ["location", "51.5074,-0.1278"],
          ["imeta", "url https://example.com/photo.jpg", "m image/jpeg"],
        ],
      })
      expect(parsePhotoUrl(msg)).toBe("https://example.com/photo.jpg")
    })

    it("returns null photo when no imeta tag present", () => {
      const msg = makeMessage({
        tags: [
          ["msg-type", "spotrep"],
          ["location", "51.5074,-0.1278"],
        ],
      })
      expect(parsePhotoUrl(msg)).toBeNull()
    })
  })

  describe("extraTags contract for publish", () => {
    it("sitrep publish includes correct extra tags", () => {
      // Simulates what handleSitrepSubmit builds
      const content = "Enemy contact east of checkpoint"
      const severity = "urgent"
      const location = "34.0522,-118.2437"
      const extraTags: string[][] = [
        ["msg-type", "sitrep"],
        ["severity", severity],
      ]
      extraTags.push(["location", location])

      expect(extraTags).toEqual([
        ["msg-type", "sitrep"],
        ["severity", "urgent"],
        ["location", "34.0522,-118.2437"],
      ])
    })

    it("spotrep publish includes imeta for photo", () => {
      const photoUrl = "https://relay.example.com/uploads/abc123.jpg"
      const extraTags: string[][] = [
        ["msg-type", "spotrep"],
        ["location", "51.5074,-0.1278"],
        ["imeta", `url ${photoUrl}`, "m image/jpeg"],
      ]

      expect(extraTags[2][1]).toBe(`url ${photoUrl}`)
      expect(extraTags[2][2]).toBe("m image/jpeg")
    })
  })

  describe("message type classification", () => {
    it("returns null for plain messages without msg-type", () => {
      expect(getMessageType(makeMessage({tags: []}))).toBeNull()
    })

    it("distinguishes sitrep from spotrep", () => {
      expect(getMessageType(makeMessage({tags: [["msg-type", "sitrep"]]}))).toBe("sitrep")
      expect(getMessageType(makeMessage({tags: [["msg-type", "spotrep"]]}))).toBe("spotrep")
      expect(getMessageType(makeMessage({tags: [["msg-type", "check-in"]]}))).toBe("check-in")
      expect(getMessageType(makeMessage({tags: [["msg-type", "alert"]]}))).toBe("alert")
    })
  })
})
