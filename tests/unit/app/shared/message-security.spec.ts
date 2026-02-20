import {describe, expect, it} from "vitest"
import {getDmMessageSecurityState} from "../../../../src/app/shared/message-security"

describe("app/shared/message-security", () => {
  it("returns legacy state for untagged direct messages", () => {
    const state = getDmMessageSecurityState({kind: 4, tags: []})

    expect(state).toMatchObject({
      badge: "Legacy DM",
      icon: "unlock",
      warning: null,
    })
  })

  it("returns hybrid secure state for pqc hybrid messages", () => {
    const state = getDmMessageSecurityState({kind: 4, tags: [["pqc", "hybrid"]]})

    expect(state).toMatchObject({
      badge: "PQC Hybrid",
      icon: "lock",
      warning: null,
    })
  })

  it("returns classical secure state with fallback warning", () => {
    const state = getDmMessageSecurityState({
      kind: 4,
      tags: [
        ["pqc", "classical"],
        ["pqc_reason", "NEGOTIATION_NO_CAPS"],
      ],
    })

    expect(state?.badge).toBe("PQC Classical")
    expect(state?.icon).toBe("lock")
    expect(state?.warning).toContain("NEGOTIATION_NO_CAPS")
  })

  it("returns fallback state for encode/size fallback markers", () => {
    const state = getDmMessageSecurityState({
      kind: 4,
      tags: [
        ["pqc", "size-fallback"],
        ["pqc_reason", "DM_PAYLOAD_OVERSIZE_FALLBACK"],
      ],
    })

    expect(state?.badge).toBe("PQC Fallback")
    expect(state?.icon).toBe("unlock")
    expect(state?.warning).toContain("DM_PAYLOAD_OVERSIZE_FALLBACK")
  })
})
