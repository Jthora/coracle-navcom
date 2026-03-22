import {describe, it, expect} from "vitest"
import {deriveMarkers, MARKER_STYLES} from "src/app/views/marker-derivation"

function makeEvent(overrides: {
  id?: string
  pubkey?: string
  content?: string
  tags?: string[][]
  created_at?: number
}) {
  return {
    id: overrides.id || "evt-1",
    pubkey: overrides.pubkey || "pub-1",
    content: overrides.content || "test message",
    tags: overrides.tags || [],
    created_at: overrides.created_at || 1700000000,
    kind: 445,
    sig: "fake-sig",
  }
}

describe("marker-derivation", () => {
  describe("deriveMarkers", () => {
    it("returns empty array for messages without location", () => {
      const msgs = [makeEvent({tags: [["h", "group1"]]})]
      expect(deriveMarkers(msgs as any)).toEqual([])
    })

    it("extracts marker from check-in with location", () => {
      const msgs = [
        makeEvent({
          id: "checkin-1",
          tags: [
            ["h", "group1"],
            ["msg-type", "check-in"],
            ["location", "34.0522,-118.2437"],
          ],
          content: "I'm at base camp",
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers).toHaveLength(1)
      expect(markers[0]).toMatchObject({
        id: "checkin-1",
        lat: 34.0522,
        lng: -118.2437,
        type: "check-in",
        preview: "I'm at base camp",
      })
    })

    it("extracts marker from alert with location", () => {
      const msgs = [
        makeEvent({
          tags: [
            ["msg-type", "alert"],
            ["location", "-33.8688,151.2093"],
          ],
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers).toHaveLength(1)
      expect(markers[0].type).toBe("alert")
      expect(markers[0].lat).toBeCloseTo(-33.8688)
    })

    it("extracts spotrep markers", () => {
      const msgs = [
        makeEvent({
          tags: [
            ["msg-type", "spotrep"],
            ["location", "48.8566,2.3522"],
          ],
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers[0].type).toBe("spotrep")
    })

    it("extracts sitrep markers with correct type and style", () => {
      const msgs = [
        makeEvent({
          id: "sitrep-1",
          tags: [
            ["msg-type", "sitrep"],
            ["location", "51.5074,-0.1278"],
          ],
          content: "Situation update: area cleared",
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers).toHaveLength(1)
      expect(markers[0]).toMatchObject({
        id: "sitrep-1",
        type: "sitrep",
        lat: 51.5074,
        lng: -0.1278,
      })
      expect(MARKER_STYLES["sitrep"]).toBeDefined()
      expect(MARKER_STYLES["sitrep"].color).toBe("#f59e0b")
    })

    it("treats unknown msg-type as regular message", () => {
      const msgs = [
        makeEvent({
          tags: [
            ["msg-type", "unknown-type"],
            ["location", "0,0"],
          ],
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers[0].type).toBe("message")
    })

    it("skips messages with invalid location format", () => {
      const msgs = [
        makeEvent({tags: [["location", "not-a-coordinate"]]}),
        makeEvent({tags: [["location", "999,-999"]]}), // out of bounds
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers).toHaveLength(0)
    })

    it("handles multiple messages", () => {
      const msgs = [
        makeEvent({id: "m1", tags: [["location", "10,20"]]}),
        makeEvent({id: "m2", tags: []}), // no location
        makeEvent({
          id: "m3",
          tags: [
            ["location", "30,40"],
            ["msg-type", "check-in"],
          ],
        }),
      ]
      const markers = deriveMarkers(msgs as any)
      expect(markers).toHaveLength(2)
      expect(markers.map(m => m.id)).toEqual(["m1", "m3"])
    })

    it("truncates preview to 100 chars", () => {
      const longContent = "A".repeat(200)
      const msgs = [makeEvent({content: longContent, tags: [["location", "10,20"]]})]
      const markers = deriveMarkers(msgs as any)
      expect(markers[0].preview.length).toBe(100)
    })
  })

  describe("MARKER_STYLES", () => {
    it("has styles for all marker types", () => {
      expect(MARKER_STYLES["check-in"]).toBeDefined()
      expect(MARKER_STYLES["alert"]).toBeDefined()
      expect(MARKER_STYLES["sitrep"]).toBeDefined()
      expect(MARKER_STYLES["spotrep"]).toBeDefined()
      expect(MARKER_STYLES["message"]).toBeDefined()
    })

    it("each style has icon, color, and cssClass", () => {
      for (const [, style] of Object.entries(MARKER_STYLES)) {
        expect(style.icon).toBeTruthy()
        expect(style.color).toMatch(/^#/)
        expect(style.cssClass).toBeTruthy()
      }
    })
  })
})
