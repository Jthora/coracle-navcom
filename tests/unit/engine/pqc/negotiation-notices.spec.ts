import {describe, expect, it} from "vitest"
import {getCompatibilityNegotiationNotice} from "../../../../src/engine/pqc/negotiation-notices"

describe("engine/pqc/negotiation-notices", () => {
  it("returns null for hybrid success", () => {
    const notice = getCompatibilityNegotiationNotice({
      ok: true,
      mode: "hybrid",
      alg: "hybrid-mlkem768+x25519-aead-v1",
      reason: "NEGOTIATION_OK_HYBRID",
    })

    expect(notice).toBeNull()
  })

  it("returns warning notice for compatibility fallback", () => {
    const notice = getCompatibilityNegotiationNotice({
      ok: true,
      mode: "classical",
      reason: "NEGOTIATION_FALLBACK_CLASSICAL",
    })

    expect(notice).toMatchObject({
      level: "warning",
      reason: "NEGOTIATION_FALLBACK_CLASSICAL",
    })
  })

  it("returns error notice for blocked compatibility outcomes", () => {
    const notice = getCompatibilityNegotiationNotice({
      ok: false,
      mode: "blocked",
      reason: "NEGOTIATION_NO_CAPS",
    })

    expect(notice).toMatchObject({
      level: "error",
      reason: "NEGOTIATION_NO_CAPS",
    })
  })
})
