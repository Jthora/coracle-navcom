/**
 * Tests for draw tools geo-annotation event encoding.
 */
import {describe, it, expect} from "vitest"

/** Mirrors the event building logic from MapView.handleDrawSubmit */
function buildGeoAnnotationTags(
  content: string,
  geoType: string,
  geojson: string,
  label?: string,
): string[][] {
  const tags: string[][] = [
    ["msg-type", "geo-annotation"],
    ["geo-type", geoType],
    ["geojson", geojson],
  ]
  if (label) tags.push(["label", label])
  return tags
}

describe("Draw Tools — Geo-Annotation Encoding", () => {
  it("produces correct tags for a Point annotation", () => {
    const geojson = JSON.stringify({type: "Point", coordinates: [-74.006, 40.7128]})
    const tags = buildGeoAnnotationTags("Supply depot", "Point", geojson, "Depot Alpha")

    expect(tags).toContainEqual(["msg-type", "geo-annotation"])
    expect(tags).toContainEqual(["geo-type", "Point"])
    expect(tags).toContainEqual(["label", "Depot Alpha"])

    const geojsonTag = tags.find(t => t[0] === "geojson")
    expect(geojsonTag).toBeDefined()
    const parsed = JSON.parse(geojsonTag![1])
    expect(parsed.type).toBe("Point")
    expect(parsed.coordinates).toEqual([-74.006, 40.7128])
  })

  it("produces correct tags for a LineString annotation", () => {
    const coords = [
      [-74.0, 40.7],
      [-73.9, 40.8],
    ]
    const geojson = JSON.stringify({type: "LineString", coordinates: coords})
    const tags = buildGeoAnnotationTags("Route Alpha", "LineString", geojson)

    expect(tags).toContainEqual(["geo-type", "LineString"])
    expect(tags.find(t => t[0] === "label")).toBeUndefined()
  })

  it("produces correct tags for a Polygon annotation", () => {
    const ring = [
      [-74, 40],
      [-73, 40],
      [-73, 41],
      [-74, 41],
      [-74, 40],
    ]
    const geojson = JSON.stringify({type: "Polygon", coordinates: [ring]})
    const tags = buildGeoAnnotationTags("Restricted zone", "Polygon", geojson, "Zone Bravo")

    expect(tags).toContainEqual(["geo-type", "Polygon"])
    expect(tags).toContainEqual(["label", "Zone Bravo"])
  })

  it("produces correct tags for a Circle annotation", () => {
    const geojson = JSON.stringify({
      type: "Point",
      coordinates: [-74, 40],
      properties: {radius: 500},
    })
    const tags = buildGeoAnnotationTags("Patrol area", "Circle", geojson)

    expect(tags).toContainEqual(["geo-type", "Circle"])
    const parsed = JSON.parse(tags.find(t => t[0] === "geojson")![1])
    expect(parsed.properties.radius).toBe(500)
  })

  it("omits label tag when label is empty", () => {
    const geojson = JSON.stringify({type: "Point", coordinates: [0, 0]})
    const tags = buildGeoAnnotationTags("note", "Point", geojson)
    expect(tags.find(t => t[0] === "label")).toBeUndefined()
  })

  it("always includes msg-type=geo-annotation", () => {
    const geojson = JSON.stringify({type: "Point", coordinates: [0, 0]})
    const tags = buildGeoAnnotationTags("x", "Point", geojson)
    expect(tags[0]).toEqual(["msg-type", "geo-annotation"])
  })
})
