import {describe, expect, it} from "vitest"
import {
  GROUP_INVITE_DECODE_RECOVERY_REASON,
  decodeGroupInvitePayloads,
  decodeGroupInvitePayloadsResult,
  encodeGroupInvitePayloads,
  parseGroupInvitePayload,
  GROUP_INVITE_PARSE_REASON,
} from "src/app/invite/schema"

describe("app/invite schema", () => {
  it("parses structured group invite payload with canonical group id", () => {
    const result = parseGroupInvitePayload({
      groupId: "Relay.EXAMPLE'OPS",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops Team",
    })

    expect(result.ok).toBe(true)

    if (!result.ok) return

    expect(result.value).toEqual({
      groupId: "relay.example'ops",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops Team",
    })
  })

  it("rejects invalid mode and tier values", () => {
    const invalidMode = parseGroupInvitePayload({
      groupId: "relay.example'ops",
      preferredMode: "invalid-mode",
    })

    expect(invalidMode).toMatchObject({
      ok: false,
      error: {reason: GROUP_INVITE_PARSE_REASON.INVALID_MODE},
    })

    const invalidTier = parseGroupInvitePayload({
      groupId: "relay.example'ops",
      missionTier: 9,
    })

    expect(invalidTier).toMatchObject({
      ok: false,
      error: {reason: GROUP_INVITE_PARSE_REASON.INVALID_TIER},
    })
  })

  it("decodes legacy csv group addresses for backward compatibility", () => {
    const decoded = decodeGroupInvitePayloads("relay.one'ops,relay.two'coord")

    expect(decoded).toEqual([{groupId: "relay.one'ops"}, {groupId: "relay.two'coord"}])
  })

  it("encodes and decodes structured payload entries", () => {
    const encoded = encodeGroupInvitePayloads([
      {
        groupId: "relay.example'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 2,
        label: "Ops",
      },
      {
        groupId: "relay.example'general",
        preferredMode: "baseline-nip29",
      },
    ])

    const decoded = decodeGroupInvitePayloads(encoded)

    expect(decoded).toEqual([
      {
        groupId: "relay.example'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 2,
        label: "Ops",
      },
      {
        groupId: "relay.example'general",
        preferredMode: "baseline-nip29",
      },
    ])
  })

  it("decodes json-array payload forms", () => {
    const decoded = decodeGroupInvitePayloads(
      JSON.stringify([
        {
          groupId: "relay.alpha'ops",
          preferredMode: "secure-nip-ee",
          missionTier: 1,
        },
        {
          groupId: "relay.beta'general",
        },
      ]),
    )

    expect(decoded).toEqual([
      {
        groupId: "relay.alpha'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 1,
      },
      {
        groupId: "relay.beta'general",
      },
    ])
  })

  it("fails soft on malformed URI input", () => {
    expect(() => decodeGroupInvitePayloads("%E0%A4%A")).not.toThrow()
    expect(decodeGroupInvitePayloads("%E0%A4%A")).toEqual([])
  })

  it("skips malformed delimited entries and keeps valid ones", () => {
    const encodedValid = encodeURIComponent("relay.valid'ops|secure-nip-ee|1|Ops")
    const malformed = "relay.bad'ops|bad%ZZ|1|Broken"
    const decoded = decodeGroupInvitePayloads(`${malformed},${encodedValid}`)

    expect(decoded).toEqual([
      {
        groupId: "relay.valid'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 1,
        label: "Ops",
      },
    ])
  })

  it("returns typed recoverable decode errors for malformed input", () => {
    const malformed = decodeGroupInvitePayloadsResult("%E0%A4%A")

    expect(malformed.payloads).toEqual([])
    expect(malformed.errors).toContainEqual({
      reason: GROUP_INVITE_DECODE_RECOVERY_REASON.URI_MALFORMED,
      value: "%E0%A4%A",
    })

    const mixed = decodeGroupInvitePayloadsResult(
      "relay.bad'ops|bad%ZZ|1|Broken,relay.good'ops%7Csecure-nip-ee%7C1%7COps",
    )

    expect(mixed.payloads).toEqual([
      {
        groupId: "relay.good'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 1,
        label: "Ops",
      },
    ])
    expect(mixed.errors).toContainEqual({
      reason: GROUP_INVITE_DECODE_RECOVERY_REASON.ENTRY_URI_MALFORMED,
      value: "relay.bad'ops|bad%ZZ|1|Broken",
    })
  })
})
