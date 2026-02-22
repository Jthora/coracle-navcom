import {describe, expect, it, vi} from "vitest"
import {
  GROUP_SECURE_PILOT_KILL_SWITCH_STORAGE_KEY,
  GROUP_SECURE_PILOT_STORAGE_KEY,
  initializeSecurePilotRuntime,
  resolveSecurePilotEnabled,
} from "src/app/groups/secure-pilot-bootstrap"

describe("app/groups secure-pilot-bootstrap", () => {
  it("uses env default when storage override is absent", () => {
    expect(resolveSecurePilotEnabled({envEnabled: true, storage: null})).toEqual({
      enabled: true,
      source: "env",
    })

    expect(
      resolveSecurePilotEnabled({
        envEnabled: false,
        storage: {
          getItem: () => null,
        },
      }),
    ).toEqual({enabled: false, source: "env"})
  })

  it("applies storage override when present", () => {
    expect(
      resolveSecurePilotEnabled({
        envEnabled: false,
        storage: {
          getItem: (key: string) => (key === GROUP_SECURE_PILOT_STORAGE_KEY ? "true" : null),
        },
      }),
    ).toEqual({enabled: true, source: "storage"})

    expect(
      resolveSecurePilotEnabled({
        envEnabled: true,
        storage: {
          getItem: (key: string) => (key === GROUP_SECURE_PILOT_STORAGE_KEY ? "false" : null),
        },
      }),
    ).toEqual({enabled: false, source: "storage"})
  })

  it("falls back to env default when storage throws", () => {
    const result = resolveSecurePilotEnabled({
      envEnabled: true,
      storage: {
        getItem: () => {
          throw new Error("storage unavailable")
        },
      },
    })

    expect(result).toEqual({enabled: true, source: "env"})
  })

  it("forces disabled state when env kill switch is enabled", () => {
    const result = resolveSecurePilotEnabled({
      envEnabled: true,
      envForceDisabled: true,
      storage: {
        getItem: (key: string) => (key === GROUP_SECURE_PILOT_STORAGE_KEY ? "true" : null),
      },
    })

    expect(result).toEqual({enabled: false, source: "kill-switch-env"})
  })

  it("forces disabled state when storage kill switch is enabled", () => {
    const result = resolveSecurePilotEnabled({
      envEnabled: true,
      storage: {
        getItem: (key: string) =>
          key === GROUP_SECURE_PILOT_KILL_SWITCH_STORAGE_KEY
            ? "true"
            : key === GROUP_SECURE_PILOT_STORAGE_KEY
              ? "true"
              : null,
      },
    })

    expect(result).toEqual({enabled: false, source: "kill-switch-storage"})
  })

  it("initializes runtime by calling setEnabled with resolved state", () => {
    const setEnabled = vi.fn()

    const result = initializeSecurePilotRuntime({
      envEnabled: false,
      storage: {
        getItem: (key: string) => (key === GROUP_SECURE_PILOT_STORAGE_KEY ? "true" : null),
      },
      setEnabled,
    })

    expect(result).toEqual({enabled: true, source: "storage"})
    expect(setEnabled).toHaveBeenCalledWith(true)
  })

  it("initializes runtime in disabled state when kill switch is set", () => {
    const setEnabled = vi.fn()

    const result = initializeSecurePilotRuntime({
      envEnabled: true,
      storage: {
        getItem: (key: string) =>
          key === GROUP_SECURE_PILOT_KILL_SWITCH_STORAGE_KEY ? "true" : null,
      },
      setEnabled,
    })

    expect(result).toEqual({enabled: false, source: "kill-switch-storage"})
    expect(setEnabled).toHaveBeenCalledWith(false)
  })
})
