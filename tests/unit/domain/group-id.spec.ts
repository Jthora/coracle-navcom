import {describe, expect, it} from "vitest"
import {
  GROUP_ID_REASON,
  assertGroupAddress,
  isOpaqueGroupId,
  parseGroupAddress,
  parseGroupAddressResult,
  parseRelayGroupId,
} from "src/domain/group-id"
import {GROUP_ID_GOLDEN_VECTORS} from "./fixtures/group-id-vectors"

describe("group-id", () => {
  it("parses relay-based group IDs", () => {
    const parsed = parseRelayGroupId("groups.nostr.com'alpha_team")

    expect(parsed).toEqual({
      kind: "relay",
      canonicalId: "groups.nostr.com'alpha_team",
      relayHost: "groups.nostr.com",
      groupName: "alpha_team",
    })
  })

  it("normalizes case and spacing for relay IDs", () => {
    const parsed = parseGroupAddress("  Groups.Nostr.Com'ALPHA_TEAM  ")

    expect(parsed?.canonicalId).toBe("groups.nostr.com'alpha_team")
  })

  it("accepts opaque IDs", () => {
    expect(isOpaqueGroupId("team_ops_1")).toBe(true)

    const parsed = parseGroupAddress("team_ops_1")

    expect(parsed).toEqual({
      kind: "opaque",
      canonicalId: "team_ops_1",
    })
  })

  it("parses naddr-style addresses", () => {
    const parsed = parseGroupAddress(
      "34550:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:ops",
    )

    expect(parsed?.kind).toBe("naddr")
    expect(parsed?.canonicalId).toBe(
      "34550:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:ops",
    )
  })

  it("returns null for invalid tokens", () => {
    expect(parseGroupAddress("bad value with spaces")).toBeNull()
  })

  it("throws in assert helper when invalid", () => {
    expect(() => assertGroupAddress("")).toThrow()
  })

  it("returns detailed reason code for invalid relay format", () => {
    const result = parseGroupAddressResult("groups.nostr.com'")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.reason).toBe(GROUP_ID_REASON.INVALID_RELAY_FORMAT)
    }
  })

  it("returns detailed reason code for invalid naddr format", () => {
    const result = parseGroupAddressResult("not-an-address:still-not-valid")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.reason).toBe(GROUP_ID_REASON.INVALID_NADDR_FORMAT)
    }
  })

  it("passes golden serialization/deserialization vectors", () => {
    for (const vector of GROUP_ID_GOLDEN_VECTORS) {
      const parsed = parseGroupAddress(vector.input)

      expect(parsed?.kind, vector.name).toBe(vector.expected.kind)
      expect(parsed?.canonicalId, vector.name).toBe(vector.expected.canonicalId)
      expect(parseGroupAddress(parsed?.canonicalId || "")?.canonicalId, vector.name).toBe(
        vector.expected.canonicalId,
      )
    }
  })
})
