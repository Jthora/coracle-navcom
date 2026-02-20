import {describe, expect, it} from "vitest"
import {getPqcDmSendBlockFeedback} from "../../../../src/engine/pqc/dm-send-feedback"

describe("engine/pqc/dm-send-feedback", () => {
  it("maps strict policy block reason to actionable summary", () => {
    const feedback = getPqcDmSendBlockFeedback(
      new Error("DM send blocked by PQC policy: DM_POLICY_BLOCKED"),
    )

    expect(feedback).toMatchObject({
      code: "DM_POLICY_BLOCKED",
    })
    expect(feedback?.summary).toContain("blocked by strict policy")
  })

  it("maps payload preflight oversize code to actionable summary", () => {
    const feedback = getPqcDmSendBlockFeedback(
      new Error("DM send blocked by PQC payload preflight: DM_PAYLOAD_OVERSIZE_BLOCKED"),
    )

    expect(feedback).toMatchObject({
      code: "DM_PAYLOAD_OVERSIZE_BLOCKED",
    })
    expect(feedback?.summary).toContain("exceeds the configured size budget")
  })

  it("returns null for non-PQC send failures", () => {
    const feedback = getPqcDmSendBlockFeedback(new Error("network timeout"))

    expect(feedback).toBeNull()
  })
})
