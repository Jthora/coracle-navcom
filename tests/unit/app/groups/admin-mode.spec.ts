import {describe, expect, it} from "vitest"
import {getGroupAdminMode, setGroupAdminMode} from "src/app/groups/admin-mode"

describe("app/groups/admin-mode", () => {
  it("returns guided mode when storage read throws", () => {
    const original = window.localStorage

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("read failure")
        },
        setItem: () => undefined,
      },
    })

    expect(getGroupAdminMode("relay.example'ops")).toBe("guided")

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: original,
    })
  })

  it("does not throw when storage write fails", () => {
    const original = window.localStorage

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("write failure")
        },
      },
    })

    expect(() => setGroupAdminMode("relay.example'ops", "expert")).not.toThrow()

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: original,
    })
  })
})
