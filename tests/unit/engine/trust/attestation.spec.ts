/**
 * Tests for trust attestation — parsing, summary, builder, store helpers.
 */
import {describe, it, expect} from "vitest"
import {
  isAttestationEvent,
  parseAttestation,
  getAttestationSummary,
  isAttested,
  buildAttestationTemplate,
  getMethodLabel,
  METHOD_LABELS,
  type Attestation,
} from "src/engine/trust/attestation"
import type {TrustedEvent} from "@welshman/util"

const ATTESTER = "a".repeat(64)
const TARGET = "b".repeat(64)
const OTHER = "c".repeat(64)

const now = Math.floor(Date.now() / 1000)
const futureTs = now + 86400
const pastTs = now - 86400

function makeEvent(overrides: Partial<TrustedEvent> = {}): TrustedEvent {
  return {
    id: overrides.id ?? "evt1",
    pubkey: overrides.pubkey ?? ATTESTER,
    kind: overrides.kind ?? 30078,
    content: overrides.content ?? "",
    tags: overrides.tags ?? [
      ["d", `attestation:${TARGET}`],
      ["p", TARGET],
      ["method", "in-person"],
      ["confidence", "high"],
      ["scope", "operational"],
    ],
    created_at: overrides.created_at ?? now,
    sig: overrides.sig ?? "sig",
  } as TrustedEvent
}

describe("Trust Attestation", () => {
  describe("isAttestationEvent", () => {
    it("returns true for valid attestation event", () => {
      expect(isAttestationEvent(makeEvent())).toBe(true)
    })

    it("returns false for non-30078 kind", () => {
      expect(isAttestationEvent(makeEvent({kind: 1}))).toBe(false)
    })

    it("returns false for 30078 without attestation d-tag", () => {
      const evt = makeEvent({tags: [["d", "delegation:something"]]})
      expect(isAttestationEvent(evt)).toBe(false)
    })

    it("returns false for 30078 with no d-tag", () => {
      const evt = makeEvent({tags: [["p", TARGET]]})
      expect(isAttestationEvent(evt)).toBe(false)
    })
  })

  describe("parseAttestation", () => {
    it("parses a valid attestation event", () => {
      const result = parseAttestation(makeEvent())
      expect(result).not.toBeNull()
      expect(result!.attester).toBe(ATTESTER)
      expect(result!.target).toBe(TARGET)
      expect(result!.method).toBe("in-person")
      expect(result!.confidence).toBe("high")
      expect(result!.scope).toBe("operational")
      expect(result!.expired).toBe(false)
    })

    it("returns null for non-attestation event", () => {
      expect(parseAttestation(makeEvent({kind: 1}))).toBeNull()
    })

    it("returns null when p-tag mismatches d-tag target", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", OTHER],
          ["method", "in-person"],
          ["confidence", "high"],
          ["scope", "operational"],
        ],
      })
      expect(parseAttestation(evt)).toBeNull()
    })

    it("defaults method to self-declared when missing", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", TARGET],
          ["confidence", "high"],
          ["scope", "operational"],
        ],
      })
      const result = parseAttestation(evt)
      expect(result!.method).toBe("self-declared")
    })

    it("defaults confidence to low when missing", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", TARGET],
          ["method", "video-call"],
          ["scope", "personal"],
        ],
      })
      const result = parseAttestation(evt)
      expect(result!.confidence).toBe("low")
    })

    it("parses valid-until and marks expired", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", TARGET],
          ["method", "in-person"],
          ["confidence", "high"],
          ["scope", "operational"],
          ["valid-until", String(pastTs)],
        ],
      })
      const result = parseAttestation(evt)
      expect(result!.validUntil).toBe(pastTs)
      expect(result!.expired).toBe(true)
    })

    it("parses valid-until and marks not expired for future", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", TARGET],
          ["method", "in-person"],
          ["confidence", "high"],
          ["scope", "operational"],
          ["valid-until", String(futureTs)],
        ],
      })
      const result = parseAttestation(evt)
      expect(result!.validUntil).toBe(futureTs)
      expect(result!.expired).toBe(false)
    })

    it("parses context tag", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["p", TARGET],
          ["method", "in-person"],
          ["confidence", "high"],
          ["scope", "operational"],
          ["context", "Met at conference"],
        ],
      })
      const result = parseAttestation(evt)
      expect(result!.context).toBe("Met at conference")
    })

    it("accepts attestation without p-tag", () => {
      const evt = makeEvent({
        tags: [
          ["d", `attestation:${TARGET}`],
          ["method", "referral"],
          ["confidence", "medium"],
          ["scope", "personal"],
        ],
      })
      const result = parseAttestation(evt)
      expect(result).not.toBeNull()
      expect(result!.target).toBe(TARGET)
    })
  })

  describe("getAttestationSummary", () => {
    function makeMap(attestations: Attestation[]): Map<string, Attestation[]> {
      const map = new Map<string, Attestation[]>()
      for (const a of attestations) {
        const existing = map.get(a.target) || []
        existing.push(a)
        map.set(a.target, existing)
      }
      return map
    }

    function makeAttestation(overrides: Partial<Attestation> = {}): Attestation {
      return {
        id: "att1",
        attester: ATTESTER,
        target: TARGET,
        method: "in-person",
        confidence: "high",
        scope: "operational",
        createdAt: now,
        validUntil: null,
        context: "",
        expired: false,
        raw: makeEvent(),
        ...overrides,
      }
    }

    it("returns isAttested true when active attestations exist", () => {
      const map = makeMap([makeAttestation()])
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.isAttested).toBe(true)
      expect(summary.attestations).toHaveLength(1)
    })

    it("returns isAttested false for unknown pubkey", () => {
      const map = new Map<string, Attestation[]>()
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.isAttested).toBe(false)
      expect(summary.attestations).toHaveLength(0)
    })

    it("separates expired from active", () => {
      const map = makeMap([
        makeAttestation({id: "a1", expired: false}),
        makeAttestation({id: "a2", expired: true}),
      ])
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.attestations).toHaveLength(1)
      expect(summary.expiredAttestations).toHaveLength(1)
    })

    it("computes highest confidence correctly", () => {
      const map = makeMap([
        makeAttestation({id: "a1", confidence: "low"}),
        makeAttestation({id: "a2", confidence: "high"}),
        makeAttestation({id: "a3", confidence: "medium"}),
      ])
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.highestConfidence).toBe("high")
    })

    it("returns null highest confidence when no active attestations", () => {
      const map = makeMap([makeAttestation({expired: true})])
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.highestConfidence).toBeNull()
    })

    it("collects unique methods", () => {
      const map = makeMap([
        makeAttestation({id: "a1", method: "in-person"}),
        makeAttestation({id: "a2", method: "video-call"}),
        makeAttestation({id: "a3", method: "in-person"}),
      ])
      const summary = getAttestationSummary(map, TARGET)
      expect(summary.methods).toHaveLength(2)
      expect(summary.methods).toContain("in-person")
      expect(summary.methods).toContain("video-call")
    })
  })

  describe("isAttested", () => {
    it("returns true when active attestation exists", () => {
      const map = new Map<string, Attestation[]>()
      map.set(TARGET, [{expired: false} as Attestation])
      expect(isAttested(map, TARGET)).toBe(true)
    })

    it("returns false when only expired attestations exist", () => {
      const map = new Map<string, Attestation[]>()
      map.set(TARGET, [{expired: true} as Attestation])
      expect(isAttested(map, TARGET)).toBe(false)
    })

    it("returns false for unknown pubkey", () => {
      const map = new Map<string, Attestation[]>()
      expect(isAttested(map, TARGET)).toBe(false)
    })
  })

  describe("buildAttestationTemplate", () => {
    it("builds correct event template", () => {
      const template = buildAttestationTemplate({
        target: TARGET,
        method: "in-person",
        confidence: "high",
        scope: "operational",
      })
      expect(template.kind).toBe(30078)
      expect(template.content).toBe("")
      expect(template.tags).toContainEqual(["d", `attestation:${TARGET}`])
      expect(template.tags).toContainEqual(["p", TARGET])
      expect(template.tags).toContainEqual(["method", "in-person"])
      expect(template.tags).toContainEqual(["confidence", "high"])
      expect(template.tags).toContainEqual(["scope", "operational"])
    })

    it("includes valid-until when provided", () => {
      const template = buildAttestationTemplate({
        target: TARGET,
        method: "video-call",
        confidence: "medium",
        scope: "personal",
        validUntil: futureTs,
      })
      expect(template.tags).toContainEqual(["valid-until", String(futureTs)])
    })

    it("omits valid-until when not provided", () => {
      const template = buildAttestationTemplate({
        target: TARGET,
        method: "in-person",
        confidence: "high",
        scope: "operational",
      })
      const hasValidUntil = template.tags.some(t => t[0] === "valid-until")
      expect(hasValidUntil).toBe(false)
    })

    it("includes context when provided", () => {
      const template = buildAttestationTemplate({
        target: TARGET,
        method: "in-person",
        confidence: "high",
        scope: "operational",
        context: "Met at key-signing party",
      })
      expect(template.tags).toContainEqual(["context", "Met at key-signing party"])
    })

    it("truncates context to 280 chars", () => {
      const longContext = "x".repeat(500)
      const template = buildAttestationTemplate({
        target: TARGET,
        method: "in-person",
        confidence: "high",
        scope: "operational",
        context: longContext,
      })
      const ctxTag = template.tags.find(t => t[0] === "context")
      expect(ctxTag![1]).toHaveLength(280)
    })
  })

  describe("METHOD_LABELS", () => {
    it("has labels for all 8 standard methods", () => {
      expect(Object.keys(METHOD_LABELS)).toHaveLength(8)
      expect(METHOD_LABELS["in-person"]).toBe("In Person")
      expect(METHOD_LABELS["key-exchange"]).toBe("Key Exchange")
      expect(METHOD_LABELS["video-call"]).toBe("Video Call")
      expect(METHOD_LABELS["voice-call"]).toBe("Voice Call")
      expect(METHOD_LABELS["referral"]).toBe("Referral")
      expect(METHOD_LABELS["organizational"]).toBe("Organizational")
      expect(METHOD_LABELS["long-standing"]).toBe("Long Standing")
      expect(METHOD_LABELS["self-declared"]).toBe("Self Declared")
    })
  })

  describe("getMethodLabel", () => {
    it("returns label for known method", () => {
      expect(getMethodLabel("in-person")).toBe("In Person")
    })

    it("returns raw string for unknown method", () => {
      expect(getMethodLabel("custom-method")).toBe("custom-method")
    })
  })
})
