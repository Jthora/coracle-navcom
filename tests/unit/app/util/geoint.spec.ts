import {describe, expect, it} from "vitest"
import {
  BLOCK_BYTES,
  WARN_BYTES,
  buildGeoJsonPayload,
  buildGeoTagString,
  extractGeointPoint,
  ensureHashtag,
  geohashFromLatLon,
  safeParseJson,
  stripGeoJsonFromContent,
  sizeCheck,
} from "src/app/util/geoint"

describe("ensureHashtag", () => {
  it("keeps existing tag", () => {
    expect(ensureHashtag("hello #starcom_ops", "#starcom_ops")).toBe("hello #starcom_ops")
  })

  it("adds tag when empty", () => {
    expect(ensureHashtag("", "#starcom_ops")).toBe("#starcom_ops")
  })

  it("appends tag with spacing", () => {
    expect(ensureHashtag("note  ", "#starcom_ops")).toBe("note #starcom_ops")
  })
})

describe("buildGeoTagString", () => {
  it("formats lat/lon to six decimals", () => {
    expect(buildGeoTagString(47.6, -122.3, null)).toBe("lat:47.600000,lon:-122.300000")
  })

  it("includes altitude when present", () => {
    expect(buildGeoTagString(47.6, -122.3, 10)).toBe("lat:47.600000,lon:-122.300000,alt:10.0")
  })
})

describe("geohashFromLatLon", () => {
  it("encodes to expected hash", () => {
    expect(geohashFromLatLon(37.8324, 112.5584, 6)).toBe("ww8p1r")
  })

  it("returns undefined on invalid input", () => {
    expect(geohashFromLatLon(Number.NaN, 0)).toBeUndefined()
  })
})

describe("buildGeoJsonPayload", () => {
  it("constructs payload with normalized fields", () => {
    const payload = buildGeoJsonPayload(
      {
        lat: 47.6,
        lon: -122.3,
        alt: 10,
        subtype: "sighting",
        confidence: 85,
        timestamp: "2020-01-01T00:00:00Z",
        additional: {foo: "bar"},
      },
      "desc ",
    )

    expect(payload.geometry.coordinates).toEqual([-122.3, 47.6, 10])
    expect(payload.properties.type).toBe("sighting")
    expect(payload.properties.description).toBe("desc")
    expect(payload.properties.confidence).toBeCloseTo(0.85)
    expect(payload.properties.additional).toEqual({foo: "bar"})
    expect(payload.properties.version).toBe(1)
  })

  it("omits altitude when null and trims description", () => {
    const payload = buildGeoJsonPayload(
      {
        lat: 47.6,
        lon: -122.3,
        alt: null,
        subtype: "event",
        confidence: 0.5,
      },
      "  spaced  ",
    )

    expect(payload.geometry.coordinates).toEqual([-122.3, 47.6])
    expect(payload.properties.description).toBe("spaced")
  })

  it("normalizes confidence when given 0-100 scale", () => {
    const payload = buildGeoJsonPayload({lat: 1, lon: 1, confidence: 50}, "")

    expect(payload.properties.confidence).toBeCloseTo(0.5)
  })

  it("defaults timestamp when invalid", () => {
    const payload = buildGeoJsonPayload({lat: 0, lon: 0}, "")

    expect(typeof payload.properties.timestamp).toBe("string")
    expect(() => Date.parse(String(payload.properties.timestamp))).not.toThrow()
  })

  it("throws on invalid coordinates", () => {
    expect(() => buildGeoJsonPayload({lat: null, lon: null}, "text")).toThrow()
  })
})

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}')).toEqual({ok: true, value: {a: 1}})
  })

  it("returns error on invalid JSON", () => {
    const result = safeParseJson("not-json")

    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe("stripGeoJsonFromContent", () => {
  it("returns original content when delimiter absent", () => {
    expect(stripGeoJsonFromContent("hello world")).toBe("hello world")
  })

  it("strips delimiter and payload", () => {
    const text =
      '#starcom_intel ---GEOJSON---{"type":"Feature","geometry":{"type":"Point","coordinates":[1,2]},"properties":{}}'

    expect(stripGeoJsonFromContent(text)).toBe("#starcom_intel")
  })

  it("trims trailing whitespace before delimiter", () => {
    const text = "hi there   ---GEOJSON---{}"
    expect(stripGeoJsonFromContent(text)).toBe("hi there")
  })
})

describe("sizeCheck", () => {
  it("warns over threshold", () => {
    const content = "a".repeat(WARN_BYTES + 10)
    const result = sizeCheck(content)

    expect(result.warn).toBe(true)
    expect(result.block).toBe(false)
  })

  it("blocks over block threshold", () => {
    const content = "a".repeat(BLOCK_BYTES + 10)
    const result = sizeCheck(content)

    expect(result.block).toBe(true)
  })

  it("counts bytes not characters", () => {
    const content = "😀".repeat(Math.ceil(WARN_BYTES / 4) + 5)
    const result = sizeCheck(content)

    expect(result.warn || result.block).toBe(true)
  })
})

describe("extractGeointPoint", () => {
  it("extracts from geo tag when present", () => {
    const point = extractGeointPoint({
      tags: [["geo", "lat:47.600000,lon:-122.300000"]],
      content: "#starcom_intel",
    })

    expect(point).toEqual({lat: 47.6, lon: -122.3})
  })

  it("falls back to geojson payload when geo tag missing", () => {
    const point = extractGeointPoint({
      tags: [],
      content:
        '#starcom_intel ---GEOJSON---{"type":"Feature","geometry":{"type":"Point","coordinates":[-122.3,47.6]},"properties":{}}',
    })

    expect(point).toEqual({lat: 47.6, lon: -122.3})
  })

  it("returns null when coordinates are invalid", () => {
    const point = extractGeointPoint({
      tags: [["geo", "lat:200,lon:10"]],
      content: "#starcom_intel",
    })

    expect(point).toBeNull()
  })
})
