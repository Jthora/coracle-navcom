import {describe, it, expect} from "vitest"
import {readFileSync} from "fs"
import {resolve} from "path"
import {initI18n, loadOperatorOverrides} from "src/locales"

describe("i18n infrastructure", () => {
  it("initI18n does not throw", () => {
    expect(() => initI18n()).not.toThrow()
  })

  it("loadOperatorOverrides accepts an overrides object", () => {
    expect(() => loadOperatorOverrides({"mode.tab.comms": "Teams"})).not.toThrow()
  })
})

describe("en.json locale keys", () => {
  const en = JSON.parse(readFileSync(resolve(__dirname, "../../../src/locales/en.json"), "utf-8"))

  it("has at least 80 keys", () => {
    expect(Object.keys(en).length).toBeGreaterThanOrEqual(80)
  })

  it("every key is a non-empty string", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(typeof key).toBe("string")
      expect(typeof value).toBe("string")
      expect((value as string).length).toBeGreaterThan(0)
    }
  })

  it("contains core mode keys", () => {
    expect(en["mode.tab.comms"]).toBe("Chat")
    expect(en["mode.tab.map"]).toBe("Map")
    expect(en["mode.tab.ops"]).toBe("Ops")
  })

  it("contains pluralization keys with ICU syntax", () => {
    expect(en["channel.members.count"]).toContain("{count, plural,")
    expect(en["ops.channel.members"]).toContain("{count, plural,")
  })

  it("contains interpolation keys with {variable} syntax", () => {
    expect(en["status.relay.connected"]).toContain("{connectedCount}")
    expect(en["geo.form.heading"]).toContain("{geoTypeLabel}")
  })

  it("contains all map layer keys", () => {
    expect(en["map.layer.checkIns"]).toBe("Check-Ins")
    expect(en["map.layer.alerts"]).toBe("Alerts")
    expect(en["map.layer.spotreps"]).toBe("SPOTREPs")
    expect(en["map.layer.members"]).toBe("Members")
  })

  it("contains all draw tool keys", () => {
    expect(en["map.draw.point"]).toBe("Point")
    expect(en["map.draw.line"]).toBe("Line")
    expect(en["map.draw.polygon"]).toBe("Polygon")
    expect(en["map.draw.circle"]).toBe("Circle")
  })

  it("contains all message type keys", () => {
    expect(en["msgType.message"]).toBe("Message")
    expect(en["msgType.checkIn"]).toBe("Check-In")
    expect(en["msgType.alert"]).toBe("Alert")
    expect(en["msgType.sitrep"]).toBe("SITREP")
    expect(en["msgType.spotrep"]).toBe("SPOTREP")
  })

  it("keys follow dot-separated naming convention", () => {
    for (const key of Object.keys(en)) {
      expect(key).toMatch(/^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+$/)
    }
  })
})
