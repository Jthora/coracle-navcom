import {describe, it, expect, vi, beforeEach} from "vitest"
import {classifyPresence, getGroupHealth, getGroupPresenceSummary, getMemberPresence} from "src/app/groups/presence"
import type {MemberPresenceData, PresenceSummary} from "src/app/groups/presence"

describe("classifyPresence", () => {
  it("returns 'active' for timestamp within 15 minutes", () => {
    const fiveMinAgo = Math.floor(Date.now() / 1000) - 5 * 60
    expect(classifyPresence(fiveMinAgo)).toBe("active")
  })

  it("returns 'active' for timestamp exactly at 15 minute boundary", () => {
    const exactBoundary = Math.floor(Date.now() / 1000) - 15 * 60
    expect(classifyPresence(exactBoundary)).toBe("active")
  })

  it("returns 'recent' for timestamp between 15 min and 2 hours", () => {
    const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60
    expect(classifyPresence(oneHourAgo)).toBe("recent")
  })

  it("returns 'recent' for timestamp at 2 hour boundary", () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 2 * 60 * 60
    expect(classifyPresence(twoHoursAgo)).toBe("recent")
  })

  it("returns 'cold' for timestamp between 2 and 24 hours", () => {
    const sixHoursAgo = Math.floor(Date.now() / 1000) - 6 * 60 * 60
    expect(classifyPresence(sixHoursAgo)).toBe("cold")
  })

  it("returns 'cold' for timestamp at 24 hour boundary", () => {
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    expect(classifyPresence(twentyFourHoursAgo)).toBe("cold")
  })

  it("returns 'unknown' for timestamp older than 24 hours", () => {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - 48 * 60 * 60
    expect(classifyPresence(twoDaysAgo)).toBe("unknown")
  })

  it("returns 'unknown' for zero timestamp", () => {
    expect(classifyPresence(0)).toBe("unknown")
  })

  it("returns 'unknown' for negative timestamp", () => {
    expect(classifyPresence(-100)).toBe("unknown")
  })

  it("returns 'active' for future timestamp (clock skew)", () => {
    const future = Math.floor(Date.now() / 1000) + 300
    expect(classifyPresence(future)).toBe("active")
  })
})

// Helper to build a presence map for testing
function buildPresenceMap(
  data: Record<string, Record<string, MemberPresenceData>>,
): Map<string, Map<string, MemberPresenceData>> {
  const map = new Map<string, Map<string, MemberPresenceData>>()
  for (const [groupId, members] of Object.entries(data)) {
    const groupMap = new Map<string, MemberPresenceData>()
    for (const [pubkey, presence] of Object.entries(members)) {
      groupMap.set(pubkey, presence)
    }
    map.set(groupId, groupMap)
  }
  return map
}

describe("getMemberPresence", () => {
  it("returns correct status for known member", () => {
    const map = buildPresenceMap({
      group1: {pk1: {lastSeen: Math.floor(Date.now() / 1000) - 60, status: "active"}},
    })
    expect(getMemberPresence(map, "group1", "pk1")).toBe("active")
  })

  it("returns 'unknown' for non-existent group", () => {
    const map = buildPresenceMap({})
    expect(getMemberPresence(map, "nonexistent", "pk1")).toBe("unknown")
  })

  it("returns 'unknown' for non-existent member in valid group", () => {
    const map = buildPresenceMap({
      group1: {pk1: {lastSeen: 100, status: "cold"}},
    })
    expect(getMemberPresence(map, "group1", "missing")).toBe("unknown")
  })
})

describe("getGroupHealth", () => {
  it("returns 'healthy' when majority are active", () => {
    const now = Math.floor(Date.now() / 1000)
    const map = buildPresenceMap({
      group1: {
        pk1: {lastSeen: now - 60, status: "active"},
        pk2: {lastSeen: now - 120, status: "active"},
        pk3: {lastSeen: now - 180, status: "active"},
        pk4: {lastSeen: now - 7200, status: "cold"},
      },
    })
    expect(getGroupHealth(map, "group1")).toBe("healthy")
  })

  it("returns 'degraded' when majority are active+recent", () => {
    const now = Math.floor(Date.now() / 1000)
    const map = buildPresenceMap({
      group1: {
        pk1: {lastSeen: now - 60, status: "active"},
        pk2: {lastSeen: now - 3600, status: "recent"},
        pk3: {lastSeen: now - 3600, status: "recent"},
        pk4: {lastSeen: now - 50000, status: "unknown"},
      },
    })
    expect(getGroupHealth(map, "group1")).toBe("degraded")
  })

  it("returns 'cold' when majority are cold or unknown", () => {
    const now = Math.floor(Date.now() / 1000)
    const map = buildPresenceMap({
      group1: {
        pk1: {lastSeen: now - 50000, status: "unknown"},
        pk2: {lastSeen: now - 50000, status: "unknown"},
        pk3: {lastSeen: now - 50000, status: "unknown"},
      },
    })
    expect(getGroupHealth(map, "group1")).toBe("cold")
  })

  it("returns 'cold' for non-existent group", () => {
    const map = buildPresenceMap({})
    expect(getGroupHealth(map, "nonexistent")).toBe("cold")
  })

  it("returns 'cold' for empty group", () => {
    const map = buildPresenceMap({group1: {}})
    expect(getGroupHealth(map, "group1")).toBe("cold")
  })
})

describe("getGroupPresenceSummary", () => {
  it("returns correct counts for mixed group", () => {
    const now = Math.floor(Date.now() / 1000)
    const map = buildPresenceMap({
      group1: {
        pk1: {lastSeen: now - 60, status: "active"},
        pk2: {lastSeen: now - 60, status: "active"},
        pk3: {lastSeen: now - 3600, status: "recent"},
        pk4: {lastSeen: now - 20000, status: "cold"},
        pk5: {lastSeen: 0, status: "unknown"},
      },
    })
    const summary = getGroupPresenceSummary(map, "group1")
    expect(summary.active).toBe(2)
    expect(summary.recent).toBe(1)
    expect(summary.cold).toBe(1)
    expect(summary.unknown).toBe(1)
  })

  it("returns all zeros for non-existent group", () => {
    const map = buildPresenceMap({})
    const summary = getGroupPresenceSummary(map, "nonexistent")
    expect(summary).toEqual({active: 0, recent: 0, cold: 0, unknown: 0})
  })

  it("counts sum to total members", () => {
    const now = Math.floor(Date.now() / 1000)
    const map = buildPresenceMap({
      group1: {
        pk1: {lastSeen: now - 60, status: "active"},
        pk2: {lastSeen: now - 3600, status: "recent"},
        pk3: {lastSeen: now - 20000, status: "cold"},
      },
    })
    const summary = getGroupPresenceSummary(map, "group1")
    const total = summary.active + summary.recent + summary.cold + summary.unknown
    expect(total).toBe(3)
  })
})
