import {describe, expect, it} from "vitest"
import {
  negotiatePqcMode,
  type PqcNegotiationInput,
  type PqcNegotiationReasonCode,
  type PqcPolicyMode,
} from "../../../../src/engine/pqc/negotiation"

describe("engine/pqc/negotiation", () => {
  const baseInput: Omit<PqcNegotiationInput, "policyMode"> = {
    preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
    localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
    peerCapabilities: {
      modes: ["hybrid", "classical"],
      algs: ["hybrid-mlkem768+x25519-aead-v1"],
    },
    hasValidPeerPqKey: true,
  }

  type TruthTableCase = {
    label: string
    input: Partial<Omit<PqcNegotiationInput, "policyMode">> & {policyMode: PqcPolicyMode}
    expectedReason: PqcNegotiationReasonCode
  }

  it("selects hybrid when capabilities and key are valid", () => {
    const result = negotiatePqcMode({...baseInput, policyMode: "strict"})

    expect(result).toMatchObject({
      ok: true,
      mode: "hybrid",
      reason: "NEGOTIATION_OK_HYBRID",
    })
  })

  it("blocks strict mode when capabilities are missing", () => {
    const result = negotiatePqcMode({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: null,
      hasValidPeerPqKey: true,
    })

    expect(result).toMatchObject({
      ok: false,
      mode: "blocked",
      reason: "NEGOTIATION_NO_CAPS",
    })
  })

  it("falls back in compatibility mode when capabilities are stale", () => {
    const result = negotiatePqcMode({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: {
        modes: ["hybrid", "classical"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
        stale: true,
      },
      hasValidPeerPqKey: true,
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "classical",
      reason: "NEGOTIATION_FALLBACK_CLASSICAL",
    })
  })

  it("blocks strict mode when shared algorithms do not match", () => {
    const result = negotiatePqcMode({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem1024+x25519-aead-v1"],
      peerCapabilities: {
        modes: ["hybrid"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
      },
      hasValidPeerPqKey: true,
    })

    expect(result).toMatchObject({
      ok: false,
      mode: "blocked",
      reason: "NEGOTIATION_NO_SHARED_ALG",
    })
  })

  it("falls back in compatibility mode when peer key is invalid", () => {
    const result = negotiatePqcMode({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: {
        modes: ["hybrid", "classical"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
      },
      hasValidPeerPqKey: false,
    })

    expect(result).toMatchObject({
      ok: true,
      mode: "classical",
      reason: "NEGOTIATION_FALLBACK_CLASSICAL",
    })
  })

  it("blocks compatibility mode when fallback is disabled", () => {
    const result = negotiatePqcMode({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: null,
      hasValidPeerPqKey: false,
      allowClassicalFallback: false,
    })

    expect(result).toMatchObject({
      ok: false,
      mode: "blocked",
      reason: "NEGOTIATION_NO_CAPS",
    })
  })

  const blockedCases: TruthTableCase[] = [
    {
      label: "strict missing caps",
      input: {policyMode: "strict", peerCapabilities: null},
      expectedReason: "NEGOTIATION_NO_CAPS",
    },
    {
      label: "strict stale caps",
      input: {
        policyMode: "strict",
        peerCapabilities: {
          modes: ["hybrid", "classical"],
          algs: ["hybrid-mlkem768+x25519-aead-v1"],
          stale: true,
        },
      },
      expectedReason: "NEGOTIATION_STALE_CAPS",
    },
    {
      label: "strict no shared algorithm",
      input: {
        policyMode: "strict",
        localSupportedAlgs: ["hybrid-mlkem1024+x25519-aead-v1"],
      },
      expectedReason: "NEGOTIATION_NO_SHARED_ALG",
    },
    {
      label: "strict missing key",
      input: {policyMode: "strict", hasValidPeerPqKey: false},
      expectedReason: "NEGOTIATION_MISSING_KEY",
    },
  ]

  it.each(blockedCases)(
    "covers truth-table blocked outcomes: $label",
    ({input, expectedReason}) => {
      const result = negotiatePqcMode({...baseInput, ...input})

      expect(result).toMatchObject({
        ok: false,
        mode: "blocked",
        reason: expectedReason,
      })
    },
  )

  const fallbackCases: Array<{
    label: string
    input: Partial<Omit<PqcNegotiationInput, "policyMode">> & {policyMode: "compatibility"}
  }> = [
    {
      label: "compatibility missing caps",
      input: {policyMode: "compatibility", peerCapabilities: null},
    },
    {
      label: "compatibility stale caps",
      input: {
        policyMode: "compatibility",
        peerCapabilities: {
          modes: ["hybrid", "classical"],
          algs: ["hybrid-mlkem768+x25519-aead-v1"],
          stale: true,
        },
      },
    },
    {
      label: "compatibility no shared algorithm",
      input: {
        policyMode: "compatibility",
        localSupportedAlgs: ["hybrid-mlkem1024+x25519-aead-v1"],
      },
    },
    {
      label: "compatibility missing key",
      input: {policyMode: "compatibility", hasValidPeerPqKey: false},
    },
  ]

  it.each(fallbackCases)("covers truth-table fallback outcomes: $label", ({input}) => {
    const result = negotiatePqcMode({...baseInput, ...input})

    expect(result).toMatchObject({
      ok: true,
      mode: "classical",
      reason: "NEGOTIATION_FALLBACK_CLASSICAL",
    })
  })
})
