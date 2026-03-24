import {describe, it, expect} from "vitest"
import {evaluateRelayFingerprintGate} from "src/engine/relay-fingerprint-gate"
import type {GateInput} from "src/engine/relay-fingerprint-gate"

describe("evaluateRelayFingerprintGate", () => {
  it("returns ok: true when no overlaps exist", () => {
    const input: GateInput = {
      memberRelays: new Map([
        ["pk1", ["wss://personal.relay.com"]],
        ["pk2", ["wss://other.relay.com"]],
      ]),
      groupRelays: ["wss://group.relay.com"],
      memberPubkeys: ["pk1", "pk2"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it("detects single relay overlap", () => {
    const input: GateInput = {
      memberRelays: new Map([["pk1", ["wss://shared.relay.com"]]]),
      groupRelays: ["wss://shared.relay.com"],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].pubkey).toBe("pk1")
    expect(result.violations[0].personalRelay).toBe("wss://shared.relay.com")
    expect(result.violations[0].groupRelay).toBe("wss://shared.relay.com")
  })

  it("detects multiple members overlapping", () => {
    const input: GateInput = {
      memberRelays: new Map([
        ["pk1", ["wss://shared.relay.com"]],
        ["pk2", ["wss://shared.relay.com"]],
      ]),
      groupRelays: ["wss://shared.relay.com"],
      memberPubkeys: ["pk1", "pk2"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(2)
  })

  it("detects same member overlapping on multiple relays", () => {
    const input: GateInput = {
      memberRelays: new Map([["pk1", ["wss://relay-a.com", "wss://relay-b.com"]]]),
      groupRelays: ["wss://relay-a.com", "wss://relay-b.com"],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(2)
  })

  it("normalizes URLs before comparison (trailing slash)", () => {
    const input: GateInput = {
      memberRelays: new Map([["pk1", ["wss://relay.example.com/"]]]),
      groupRelays: ["wss://relay.example.com"],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(1)
  })

  it("normalizes URLs before comparison (case insensitive)", () => {
    const input: GateInput = {
      memberRelays: new Map([["pk1", ["wss://RELAY.EXAMPLE.COM"]]]),
      groupRelays: ["wss://relay.example.com"],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(1)
  })

  it("handles empty memberRelays map → ok", () => {
    const input: GateInput = {
      memberRelays: new Map(),
      groupRelays: ["wss://relay.com"],
      memberPubkeys: [],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it("handles empty groupRelays → ok", () => {
    const input: GateInput = {
      memberRelays: new Map([["pk1", ["wss://relay.com"]]]),
      groupRelays: [],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it("handles null/undefined input → ok", () => {
    const result = evaluateRelayFingerprintGate(null as unknown as GateInput)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it("handles member not in memberRelays map", () => {
    const input: GateInput = {
      memberRelays: new Map(),
      groupRelays: ["wss://relay.com"],
      memberPubkeys: ["pk1"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it("collects all violations (does not short-circuit)", () => {
    const input: GateInput = {
      memberRelays: new Map([
        ["pk1", ["wss://shared-a.com", "wss://shared-b.com"]],
        ["pk2", ["wss://shared-a.com"]],
        ["pk3", ["wss://safe.relay.com"]],
      ]),
      groupRelays: ["wss://shared-a.com", "wss://shared-b.com"],
      memberPubkeys: ["pk1", "pk2", "pk3"],
    }
    const result = evaluateRelayFingerprintGate(input)
    expect(result.ok).toBe(false)
    expect(result.violations).toHaveLength(3) // pk1×2 + pk2×1
  })
})
