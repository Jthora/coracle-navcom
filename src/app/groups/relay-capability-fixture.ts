import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"

type RelayCapabilityFixtureMap = Record<string, Partial<RelayCapabilityCheck>>

const toRelayFixtureMap = (input: unknown): RelayCapabilityFixtureMap | null => {
  if (!input || typeof input !== "object") {
    return null
  }

  return input as RelayCapabilityFixtureMap
}

const toDefaultFixtureCheck = (relay: string): RelayCapabilityCheck => ({
  relay,
  status: "ready",
  supportsGroups: true,
  supportsNip29: true,
  supportsNip42: false,
  supportsNip104: true,
  supportsNipEeSignal: true,
  supportsNavcomBaseline: true,
  isNavcomDefaultRelay: relay.includes("navcom"),
  advertisedNips: [29, 104],
  authRequired: false,
  challengeResponseAuth: false,
  details: "Fixture relay capability result.",
})

export const resolveRelayCapabilityFixture = (relays: string[]): RelayCapabilityCheck[] | null => {
  if (typeof window === "undefined" || !(window as any).Cypress) {
    return null
  }

  const fixtureMap = toRelayFixtureMap((window as any).__groupRelayCapabilityFixture)

  if (!fixtureMap) {
    return null
  }

  return relays.map(relay => ({
    ...toDefaultFixtureCheck(relay),
    ...(fixtureMap[relay] || {}),
    relay,
  }))
}
