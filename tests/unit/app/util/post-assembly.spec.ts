import {describe, expect, it} from "vitest"
import {GEOJSON_DELIMITER, GeointState, geohashFromLatLon} from "src/app/util/geoint"
import {shapePostForSubmit} from "src/app/util/post-assembly"

describe("shapePostForSubmit", () => {
  it("keeps default content and tags", () => {
    const baseTags = [["client", "navcom"]]
    const result = shapePostForSubmit({
      type: "default",
      baseText: "Hello world",
      tags: baseTags,
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBe("Hello world")
    expect(result.tags).toHaveLength(1)
    expect(result.tags[0]).toEqual(["client", "navcom"])
  })

  it("dedupes ops hashtag and adds app tag", () => {
    const result = shapePostForSubmit({
      type: "ops",
      baseText: "Routine check #starcom_ops",
      tags: [],
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBe("Routine check #starcom_ops")
    expect(result.tags).toContainEqual(["app", "starcom"])
    expect(result.tags).toContainEqual(["t", "starcom_ops"])
  })

  it("builds geo content with delimiter, payload, and geo tags", () => {
    const state: GeointState = {
      lat: 40,
      lon: -74,
      alt: null,
      subtype: null,
      confidence: 80,
      timestamp: "2026-02-11T00:00:00Z",
      additional: null,
    }

    const result = shapePostForSubmit({
      type: "geoint",
      baseText: "Intel note",
      tags: [["client", "navcom"]],
      geointState: state,
    })

    expect(result.error).toBeUndefined()
    expect(result.content).toBeDefined()
    expect(result.content?.includes(GEOJSON_DELIMITER)).toBe(true)

    const [human, payloadJson] = (result.content as string).split(GEOJSON_DELIMITER)
    expect(human.trim()).toBe("Intel note #starcom_intel")

    const payload = JSON.parse(payloadJson)
    expect(payload.geometry.coordinates[0]).toBeCloseTo(-74, 6)
    expect(payload.geometry.coordinates[1]).toBeCloseTo(40, 6)
    expect(payload.properties.description).toBe("Intel note")
    expect(payload.properties.version).toBe(1)

    expect(result.tags).toContainEqual(["app", "starcom-geoint"])
    expect(result.tags).toContainEqual(["t", "starcom_intel"])
    expect(result.tags).toContainEqual(["geoint-type", "report"])
    expect(result.tags).toContainEqual(["geo", "lat:40.000000,lon:-74.000000"])

    const expectedHash = geohashFromLatLon(40, -74)
    if (expectedHash) {
      expect(result.tags).toContainEqual(["g", expectedHash])
    }
  })

  it("does not duplicate the geo hashtag", () => {
    const result = shapePostForSubmit({
      type: "geoint",
      baseText: "Intel note #starcom_intel",
      tags: [],
      geointState: {lat: 1, lon: 1, additional: null},
    })

    const [human] = (result.content as string).split(GEOJSON_DELIMITER)
    expect(human.trim()).toBe("Intel note #starcom_intel")
  })

  it("appends geo hashtag when text is empty", () => {
    const result = shapePostForSubmit({
      type: "geoint",
      baseText: " ",
      tags: [],
      geointState: {lat: 0, lon: 0, additional: null},
    })

    const [human, payloadJson] = (result.content as string).split(GEOJSON_DELIMITER)
    expect(human.trim()).toBe("#starcom_intel")
    const payload = JSON.parse(payloadJson)
    expect(payload.properties.description).toBe("")
  })

  it("blocks when combined geo content exceeds size budget", () => {
    const big = "a".repeat(11_000)
    const result = shapePostForSubmit({
      type: "geoint",
      baseText: big,
      tags: [],
      geointState: {lat: 10, lon: 10, additional: null},
    })

    expect(result.sizeBlocked).toBeTruthy()
    expect(result.content).toBeUndefined()
  })

  it("preserves existing option tags (warning/expiration)", () => {
    const state: GeointState = {
      lat: 10,
      lon: 20,
      additional: null,
      alt: null,
      subtype: null,
      confidence: null,
      timestamp: null,
    }

    const tags = [
      ["client", "navcom"],
      ["content-warning", "spoilers"],
      ["expiration", "12345"],
    ]

    const result = shapePostForSubmit({
      type: "geoint",
      baseText: "Warning note",
      tags,
      geointState: state,
    })

    expect(result.error).toBeUndefined()
    expect(result.tags).toContainEqual(["content-warning", "spoilers"])
    expect(result.tags).toContainEqual(["expiration", "12345"])
  })

  it("does not duplicate existing geoint topic tag", () => {
    const result = shapePostForSubmit({
      type: "geoint",
      baseText: "Intel note #starcom_intel",
      tags: [["t", "starcom_intel"]],
      geointState: {lat: 12, lon: 34, additional: null},
    })

    expect(result.tags.filter(tag => tag[0] === "t" && tag[1] === "starcom_intel")).toHaveLength(1)
  })
})
