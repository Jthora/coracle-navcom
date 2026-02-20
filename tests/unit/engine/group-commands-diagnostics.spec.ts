import {beforeEach, describe, expect, it, vi} from "vitest"

const {recordGroupDowngradeAudit} = vi.hoisted(() => ({
  recordGroupDowngradeAudit: vi.fn(),
}))

vi.mock("src/engine/group-downgrade-audit", () => ({
  recordGroupDowngradeAudit,
}))

import {createGroupCommandTransportDiagnostics} from "src/engine/group-commands"

describe("engine/group-commands diagnostics", () => {
  beforeEach(() => {
    recordGroupDowngradeAudit.mockReset()
  })

  it("records downgrade audit note for secure-to-baseline fallback", () => {
    const diagnostics = createGroupCommandTransportDiagnostics()

    diagnostics.onFallback({
      intent: {
        payload: {groupId: "ops"},
        actorRole: "member",
        createdAt: 100,
      },
      requestedMode: "secure-nip-ee",
      adapterId: "baseline-nip29",
      reason: "Secure capability unavailable",
    })

    expect(recordGroupDowngradeAudit).toHaveBeenCalledTimes(1)
    expect(recordGroupDowngradeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "ops",
        action: "transport-downgrade",
        requestedMode: "secure-nip-ee",
        resolvedMode: "baseline-nip29",
      }),
    )
  })

  it("does not record audit note when mode stays secure", () => {
    const diagnostics = createGroupCommandTransportDiagnostics()

    diagnostics.onFallback({
      intent: {
        payload: {groupId: "ops"},
        actorRole: "member",
        createdAt: 100,
      },
      requestedMode: "secure-nip-ee",
      adapterId: "secure-nip-ee",
      reason: "none",
    })

    expect(recordGroupDowngradeAudit).not.toHaveBeenCalled()
  })
})
