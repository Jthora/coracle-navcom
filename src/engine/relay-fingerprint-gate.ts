import {normalizeRelayUrl} from "src/app/groups/relay-policy"

export type GateInput = {
  memberRelays: Map<string, string[]> // pubkey → personal relay URLs
  groupRelays: string[] // group's relay URLs
  memberPubkeys: string[]
}

export type Violation = {
  pubkey: string
  personalRelay: string
  groupRelay: string
  overlapType: "exact"
}

export type GateResult = {
  ok: boolean
  violations: Violation[]
}

/**
 * Pure function: evaluates whether any member's personal relay list overlaps
 * with the group's relay set. Overlap means the member can be correlated
 * across personal and group traffic on the same relay — a fingerprinting risk.
 */
export function evaluateRelayFingerprintGate(input: GateInput): GateResult {
  if (!input || !input.groupRelays || !input.memberRelays) {
    return {ok: true, violations: []}
  }

  const normalizedGroupRelays = new Set(input.groupRelays.map(normalizeRelayUrl))

  if (normalizedGroupRelays.size === 0) {
    return {ok: true, violations: []}
  }

  const violations: Violation[] = []

  for (const pubkey of input.memberPubkeys) {
    const personalRelays = input.memberRelays.get(pubkey)
    if (!personalRelays) continue

    for (const relay of personalRelays) {
      const normalized = normalizeRelayUrl(relay)
      if (normalizedGroupRelays.has(normalized)) {
        // Find the original group relay URL for display purposes
        const matchingGroupRelay =
          input.groupRelays.find(gr => normalizeRelayUrl(gr) === normalized) || normalized
        violations.push({
          pubkey,
          personalRelay: relay,
          groupRelay: matchingGroupRelay,
          overlapType: "exact",
        })
      }
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  }
}
