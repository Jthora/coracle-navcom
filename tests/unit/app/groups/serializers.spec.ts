import {describe, expect, it} from "vitest"
import {
  asGroupAddress,
  asGroupInviteLabel,
  asGroupInviteMode,
  asGroupInviteTier,
} from "src/app/groups/serializers"

describe("app/groups serializers", () => {
  it("serializes and parses valid group route IDs", () => {
    const raw = "Groups.Nostr.Com'ALPHA"
    const encoded = asGroupAddress.encode(raw)
    const decoded = asGroupAddress.decode(encoded) as {groupId: string}

    expect(decoded.groupId).toBe("groups.nostr.com'alpha")
  })

  it("returns empty id for invalid route IDs", () => {
    const decoded = asGroupAddress.decode("bad%20value") as {groupId: string}

    expect(decoded.groupId).toBe("")
  })

  it("parses invite prefill mode, tier, and label serializers", () => {
    const mode = asGroupInviteMode.decode("secure-nip-ee") as {preferredMode: string}
    const tier = asGroupInviteTier.decode("2") as {missionTier: number | null}
    const label = asGroupInviteLabel.decode("Ops%20Team") as {label: string}

    expect(mode.preferredMode).toBe("secure-nip-ee")
    expect(tier.missionTier).toBe(2)
    expect(label.label).toBe("Ops Team")
  })

  it("sanitizes invalid invite prefill mode and tier", () => {
    const mode = asGroupInviteMode.decode("invalid-mode") as {preferredMode: string}
    const tier = asGroupInviteTier.decode("9") as {missionTier: number | null}

    expect(mode.preferredMode).toBe("")
    expect(tier.missionTier).toBe(null)
  })
})
