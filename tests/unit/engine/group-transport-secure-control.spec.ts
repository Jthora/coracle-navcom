import {describe, expect, it, vi} from "vitest"
import {
  GROUP_SECURE_CONTROL_REASON,
  buildSecureControlTemplate,
  parseSecureControlRequestResult,
  publishKeyShareForNewMember,
  rotateEpochAfterMemberRemoval,
  executeSecureGroupKeyRotation,
} from "src/engine/group-transport-secure-control"
import {GROUP_KINDS} from "src/domain/group-kinds"

describe("engine/group-transport-secure-control", () => {
  it("validates secure control payload shape and required fields", () => {
    const invalidShape = parseSecureControlRequestResult(null)
    const missingGroupId = parseSecureControlRequestResult({
      action: "create",
      payload: {groupId: ""},
      actorRole: "admin",
      requestedMode: "secure-nip-ee",
      createdAt: 100,
    })
    const missingMemberPubkey = parseSecureControlRequestResult({
      action: "join",
      payload: {groupId: "ops", memberPubkey: ""},
      actorRole: "member",
      requestedMode: "secure-nip-ee",
      createdAt: 100,
    })

    expect(invalidShape).toMatchObject({
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.INVALID_SHAPE,
    })
    expect(missingGroupId).toMatchObject({
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.GROUP_ID_REQUIRED,
    })
    expect(missingMemberPubkey).toMatchObject({
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.MEMBER_PUBKEY_REQUIRED,
    })
  })

  it("normalizes payload and builds expected template kinds", () => {
    const parsed = parseSecureControlRequestResult({
      action: "put-member",
      payload: {
        groupId: "  ops  ",
        memberPubkey: "a".repeat(64),
        role: "moderator",
      },
      actorRole: "admin",
      requestedMode: "secure-nip-ee",
      createdAt: 100,
    })

    expect(parsed).toMatchObject({ok: true})

    if (!parsed.ok) {
      throw new Error("Expected parsed control request")
    }

    const template = buildSecureControlTemplate(parsed.value)

    expect(template.kind).toBe(GROUP_KINDS.NIP29.PUT_USER)
    expect(template.tags).toEqual(
      expect.arrayContaining([
        ["h", "ops"],
        ["p", "a".repeat(64)],
        ["role", "moderator"],
      ]),
    )
  })

  it("builds create template with correct kind", () => {
    const parsed = parseSecureControlRequestResult({
      action: "create",
      payload: {
        groupId: "secure-ops",
        title: "Secure Ops",
        description: "PQC-secured ops channel",
      },
      actorRole: "admin",
      requestedMode: "secure-nip-ee",
      createdAt: 100,
    })

    expect(parsed).toMatchObject({ok: true})
    if (!parsed.ok) throw new Error("Expected parsed control request")

    const template = buildSecureControlTemplate(parsed.value)

    expect(template.kind).toBe(GROUP_KINDS.NIP29.CREATE_GROUP)
    expect(template.tags).toEqual(expect.arrayContaining([["h", "secure-ops"]]))
  })

  it("exports publishKeyShareForNewMember function", () => {
    expect(typeof publishKeyShareForNewMember).toBe("function")
  })

  it("exports rotateEpochAfterMemberRemoval function", () => {
    expect(typeof rotateEpochAfterMemberRemoval).toBe("function")
  })

  it("exports executeSecureGroupKeyRotation function", () => {
    expect(typeof executeSecureGroupKeyRotation).toBe("function")
  })
})
