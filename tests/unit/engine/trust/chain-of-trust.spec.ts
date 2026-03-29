/**
 * Tests for chain of trust — certificate verification, delegation, revocation.
 */
import {describe, it, expect, vi, beforeEach} from "vitest"
import {
  parseDelegationCertificate,
  parseRevocation,
  verifyTrustChain,
  hasOperatorRoot,
  getOperatorRootPubkey,
} from "src/engine/trust/chain"
import type {DelegationCertificate} from "src/engine/trust/chain"
import {
  buildDelegationEvent,
  buildRevocationEvent,
  validateDelegationEvent,
  hasPermission,
} from "src/engine/trust/delegation"
import {
  ingestRevocations,
  isRevoked,
  isCertificateRevoked,
  needsRefresh,
  getAllRevocations,
  clearRevocationCache,
  getRevocationCacheStats,
} from "src/engine/trust/revocation"
import type {TrustedEvent} from "@welshman/util"

const ROOT = "a".repeat(64)
const ADMIN = "b".repeat(64)
const MEMBER = "c".repeat(64)
const OTHER = "d".repeat(64)

function makeEvent(overrides: Partial<TrustedEvent>): TrustedEvent {
  return {
    id: overrides.id ?? "evt1",
    pubkey: overrides.pubkey ?? ROOT,
    kind: overrides.kind ?? 30078,
    content: overrides.content ?? "",
    tags: overrides.tags ?? [],
    created_at: overrides.created_at ?? Math.floor(Date.now() / 1000),
    sig: overrides.sig ?? "sig",
  } as TrustedEvent
}

const futureTs = Math.floor(Date.now() / 1000) + 86400
const pastTs = Math.floor(Date.now() / 1000) - 86400

describe("Chain of Trust", () => {
  describe("parseDelegationCertificate", () => {
    it("parses a valid delegation event", () => {
      const event = makeEvent({
        pubkey: ROOT,
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
          ["permissions", "group-admin,user-invite"],
          ["valid-until", String(futureTs)],
        ],
      })
      const cert = parseDelegationCertificate(event)
      expect(cert).not.toBeNull()
      expect(cert!.delegatorPubkey).toBe(ROOT)
      expect(cert!.delegatePubkey).toBe(ADMIN)
      expect(cert!.permissions).toEqual(["group-admin", "user-invite"])
      expect(cert!.validUntil).toBe(futureTs)
    })

    it("returns null for non-30078 kind", () => {
      const event = makeEvent({kind: 1})
      expect(parseDelegationCertificate(event)).toBeNull()
    })

    it("returns null for wrong d tag", () => {
      const event = makeEvent({tags: [["d", "revocation"]]})
      expect(parseDelegationCertificate(event)).toBeNull()
    })

    it("returns null if no p tag", () => {
      const event = makeEvent({tags: [["d", "delegation"]]})
      expect(parseDelegationCertificate(event)).toBeNull()
    })

    it("defaults validUntil to Infinity when no valid-until tag", () => {
      const event = makeEvent({
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
        ],
      })
      const cert = parseDelegationCertificate(event)
      expect(cert!.validUntil).toBe(Infinity)
    })
  })

  describe("parseRevocation", () => {
    it("parses a valid revocation event", () => {
      const event = makeEvent({
        tags: [
          ["d", "revocation"],
          ["e", "cert-id-1"],
          ["p", ADMIN],
        ],
      })
      const rev = parseRevocation(event)
      expect(rev).not.toBeNull()
      expect(rev!.eventId).toBe("cert-id-1")
      expect(rev!.revokedPubkey).toBe(ADMIN)
    })

    it("returns null for non-revocation d tag", () => {
      const event = makeEvent({tags: [["d", "delegation"]]})
      expect(parseRevocation(event)).toBeNull()
    })

    it("returns null if missing e or p tags", () => {
      const event = makeEvent({
        tags: [
          ["d", "revocation"],
          ["e", "x"],
        ],
      })
      expect(parseRevocation(event)).toBeNull()
    })
  })

  describe("verifyTrustChain", () => {
    const adminDelegation: DelegationCertificate = {
      eventId: "del-admin",
      delegatorPubkey: ROOT,
      delegatePubkey: ADMIN,
      permissions: ["group-admin"],
      validUntil: futureTs,
      revoked: false,
    }

    const memberDelegation: DelegationCertificate = {
      eventId: "del-member",
      delegatorPubkey: ADMIN,
      delegatePubkey: MEMBER,
      permissions: ["user-invite"],
      validUntil: futureTs,
      revoked: false,
    }

    it("identifies the operator root pubkey", () => {
      const result = verifyTrustChain(ROOT, [], [], ROOT)
      expect(result.level).toBe("operator")
      expect(result.valid).toBe(true)
      expect(result.chain).toHaveLength(1)
    })

    it("identifies an admin delegated by operator", () => {
      const result = verifyTrustChain(ADMIN, [adminDelegation], [], ROOT)
      expect(result.level).toBe("admin")
      expect(result.valid).toBe(true)
      expect(result.chain).toHaveLength(2)
      expect(result.chain[0].role).toBe("operator")
      expect(result.chain[1].role).toBe("admin")
    })

    it("identifies a member via admin delegation chain", () => {
      const result = verifyTrustChain(MEMBER, [adminDelegation, memberDelegation], [], ROOT)
      expect(result.level).toBe("member")
      expect(result.valid).toBe(true)
      expect(result.chain).toHaveLength(3)
    })

    it("returns unknown for unrecognized pubkey", () => {
      const result = verifyTrustChain(OTHER, [adminDelegation, memberDelegation], [], ROOT)
      expect(result.level).toBe("unknown")
      expect(result.valid).toBe(false)
    })

    it("returns unknown when delegation is revoked", () => {
      const revocations = [{eventId: "del-admin", revokedPubkey: ADMIN}]
      const result = verifyTrustChain(ADMIN, [adminDelegation], revocations, ROOT)
      expect(result.level).toBe("unknown")
      expect(result.valid).toBe(false)
    })

    it("returns unknown when delegation is expired", () => {
      const expiredDelegation = {...adminDelegation, validUntil: pastTs}
      const result = verifyTrustChain(ADMIN, [expiredDelegation], [], ROOT)
      expect(result.level).toBe("unknown")
      expect(result.valid).toBe(false)
    })

    it("returns unknown when admin in chain is revoked", () => {
      const revocations = [{eventId: "rev-admin", revokedPubkey: ADMIN}]
      const result = verifyTrustChain(
        MEMBER,
        [adminDelegation, memberDelegation],
        revocations,
        ROOT,
      )
      expect(result.level).toBe("unknown")
      expect(result.valid).toBe(false)
    })
  })
})

describe("Delegation", () => {
  describe("buildDelegationEvent", () => {
    it("creates correct kind 30078 event template", () => {
      const event = buildDelegationEvent(ADMIN, ["group-admin", "user-invite"], futureTs)
      expect(event.kind).toBe(30078)
      expect(event.tags).toContainEqual(["d", "delegation"])
      expect(event.tags).toContainEqual(["p", ADMIN])
      expect(event.tags).toContainEqual(["permissions", "group-admin,user-invite"])
      expect(event.tags).toContainEqual(["valid-until", String(futureTs)])
    })
  })

  describe("buildRevocationEvent", () => {
    it("creates correct revocation event template", () => {
      const event = buildRevocationEvent("cert-id-1", ADMIN)
      expect(event.kind).toBe(30078)
      expect(event.tags).toContainEqual(["d", "revocation"])
      expect(event.tags).toContainEqual(["e", "cert-id-1"])
      expect(event.tags).toContainEqual(["p", ADMIN])
    })
  })

  describe("validateDelegationEvent", () => {
    it("validates a correct delegation event", () => {
      const event = makeEvent({
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
          ["valid-until", String(futureTs)],
        ],
      })
      expect(validateDelegationEvent(event).valid).toBe(true)
    })

    it("rejects wrong kind", () => {
      const event = makeEvent({
        kind: 1,
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
        ],
      })
      expect(validateDelegationEvent(event).valid).toBe(false)
    })

    it("rejects missing d tag", () => {
      const event = makeEvent({tags: [["p", ADMIN]]})
      expect(validateDelegationEvent(event).valid).toBe(false)
    })

    it("rejects invalid pubkey length", () => {
      const event = makeEvent({
        tags: [
          ["d", "delegation"],
          ["p", "short"],
        ],
      })
      expect(validateDelegationEvent(event).valid).toBe(false)
    })

    it("rejects expired delegation", () => {
      const event = makeEvent({
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
          ["valid-until", String(pastTs)],
        ],
      })
      const result = validateDelegationEvent(event)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("expired")
    })
  })

  describe("hasPermission", () => {
    it("returns true for matching permission", () => {
      expect(hasPermission(["group-admin", "user-invite"], "group-admin")).toBe(true)
    })

    it("returns false for missing permission", () => {
      expect(hasPermission(["user-invite"], "group-admin")).toBe(false)
    })

    it("full-admin grants all permissions", () => {
      expect(hasPermission(["full-admin"], "group-admin")).toBe(true)
      expect(hasPermission(["full-admin"], "member-revoke")).toBe(true)
    })
  })
})

describe("Revocation Cache", () => {
  beforeEach(() => {
    clearRevocationCache()
  })

  it("starts empty", () => {
    expect(getRevocationCacheStats().entries).toBe(0)
    expect(getRevocationCacheStats().revokedPubkeys).toBe(0)
  })

  it("ingests revocation events", () => {
    const events = [
      makeEvent({
        id: "rev1",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "cert-1"],
          ["p", ADMIN],
        ],
      }),
    ]
    const count = ingestRevocations(events)
    expect(count).toBe(1)
    expect(isRevoked(ADMIN)).toBe(true)
    expect(isCertificateRevoked("cert-1")).toBe(true)
  })

  it("deduplicates repeated ingestion", () => {
    const events = [
      makeEvent({
        id: "rev1",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "cert-1"],
          ["p", ADMIN],
        ],
      }),
    ]
    ingestRevocations(events)
    const secondCount = ingestRevocations(events)
    expect(secondCount).toBe(0)
    expect(getRevocationCacheStats().entries).toBe(1)
  })

  it("tracks multiple revocations", () => {
    const events = [
      makeEvent({
        id: "rev1",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "cert-1"],
          ["p", ADMIN],
        ],
      }),
      makeEvent({
        id: "rev2",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "cert-2"],
          ["p", MEMBER],
        ],
      }),
    ]
    ingestRevocations(events)
    expect(getRevocationCacheStats().entries).toBe(2)
    expect(getRevocationCacheStats().revokedPubkeys).toBe(2)
    expect(isRevoked(ADMIN)).toBe(true)
    expect(isRevoked(MEMBER)).toBe(true)
  })

  it("skips non-revocation events", () => {
    const events = [
      makeEvent({
        id: "del1",
        tags: [
          ["d", "delegation"],
          ["p", ADMIN],
        ],
      }),
    ]
    const count = ingestRevocations(events)
    expect(count).toBe(0)
  })

  it("getAllRevocations returns all entries", () => {
    ingestRevocations([
      makeEvent({
        id: "rev1",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "c1"],
          ["p", ADMIN],
        ],
      }),
    ])
    const all = getAllRevocations()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual({eventId: "c1", revokedPubkey: ADMIN})
  })

  it("needsRefresh returns true before any ingestion", () => {
    expect(needsRefresh()).toBe(true)
  })

  it("needsRefresh returns false after ingestion", () => {
    ingestRevocations([])
    expect(needsRefresh()).toBe(false)
  })

  it("clearRevocationCache resets everything", () => {
    ingestRevocations([
      makeEvent({
        id: "rev1",
        pubkey: ROOT,
        tags: [
          ["d", "revocation"],
          ["e", "c1"],
          ["p", ADMIN],
        ],
      }),
    ])
    clearRevocationCache()
    expect(isRevoked(ADMIN)).toBe(false)
    expect(getRevocationCacheStats().entries).toBe(0)
  })
})
