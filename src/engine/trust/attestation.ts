/**
 * Trust attestation — peer-to-peer identity verification records.
 *
 * Uses kind 30078 (NIP-78 app data) with d-tag prefix "attestation:"
 * to store attestation records as parameterized replaceable events.
 * Each (attester, target) pair produces one replaceable attestation.
 */

import {derived, type Readable} from "svelte/store"
import {repository} from "@welshman/app"
import {deriveEvents} from "@welshman/store"
import type {TrustedEvent} from "@welshman/util"

// ── Types ──────────────────────────────────────────────────

export type AttestationMethod =
  | "in-person"
  | "key-exchange"
  | "video-call"
  | "voice-call"
  | "referral"
  | "organizational"
  | "long-standing"
  | "self-declared"
  | string

export type Confidence = "high" | "medium" | "low"
export type Scope = "operational" | "personal" | "financial"

export type Attestation = {
  id: string
  attester: string
  target: string
  method: AttestationMethod
  confidence: Confidence
  scope: Scope
  createdAt: number
  validUntil: number | null
  context: string
  expired: boolean
  raw: TrustedEvent
}

export type AttestationSummary = {
  pubkey: string
  attestations: Attestation[]
  expiredAttestations: Attestation[]
  highestConfidence: Confidence | null
  isAttested: boolean
  methods: AttestationMethod[]
}

// ── Method Labels ──────────────────────────────────────────

export const METHOD_LABELS: Record<string, string> = {
  "in-person": "In Person",
  "key-exchange": "Key Exchange",
  "video-call": "Video Call",
  "voice-call": "Voice Call",
  referral: "Referral",
  organizational: "Organizational",
  "long-standing": "Long Standing",
  "self-declared": "Self Declared",
}

export const getMethodLabel = (method: string): string => METHOD_LABELS[method] || method

// ── Event Parser ───────────────────────────────────────────

const ATTESTATION_D_PREFIX = "attestation:"

export const isAttestationEvent = (event: TrustedEvent): boolean => {
  if (event.kind !== 30078) return false
  const dTag = event.tags.find(t => t[0] === "d")?.[1]
  return dTag?.startsWith(ATTESTATION_D_PREFIX) ?? false
}

const getTag = (event: TrustedEvent, name: string): string | undefined =>
  event.tags.find(t => t[0] === name)?.[1]

export const parseAttestation = (event: TrustedEvent): Attestation | null => {
  if (!isAttestationEvent(event)) return null

  const dTag = getTag(event, "d")
  const target = dTag?.slice(ATTESTATION_D_PREFIX.length)
  const pTag = getTag(event, "p")

  if (!target || (pTag && pTag !== target)) return null

  const method = getTag(event, "method") || "self-declared"
  const confidence = (getTag(event, "confidence") as Confidence) || "low"
  const scope = (getTag(event, "scope") as Scope) || "operational"
  const validUntilStr = getTag(event, "valid-until")
  const validUntil = validUntilStr ? parseInt(validUntilStr, 10) : null
  const context = getTag(event, "context") || ""

  const now = Math.floor(Date.now() / 1000)
  const expired = validUntil !== null && validUntil < now

  return {
    id: event.id,
    attester: event.pubkey,
    target,
    method,
    confidence,
    scope,
    createdAt: event.created_at,
    validUntil,
    context,
    expired,
    raw: event,
  }
}

// ── Derived Store ──────────────────────────────────────────

const attestationEvents = deriveEvents({
  repository,
  filters: [{kinds: [30078]}],
})

export const attestationsByTarget: Readable<Map<string, Attestation[]>> = derived(
  attestationEvents,
  $events => {
    const result = new Map<string, Attestation[]>()

    for (const event of $events) {
      const attestation = parseAttestation(event)
      if (!attestation) continue

      const existing = result.get(attestation.target) || []
      existing.push(attestation)
      result.set(attestation.target, existing)
    }

    for (const [, attestations] of result) {
      attestations.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  },
)

// ── Helpers ────────────────────────────────────────────────

const confidenceOrder: Record<Confidence, number> = {high: 3, medium: 2, low: 1}

export const getAttestationSummary = (
  attestations: Map<string, Attestation[]>,
  pubkey: string,
): AttestationSummary => {
  const all = attestations.get(pubkey) || []
  const active = all.filter(a => !a.expired)
  const expired = all.filter(a => a.expired)

  const highestConfidence =
    active.length > 0
      ? active.reduce((best, a) =>
          confidenceOrder[a.confidence] > confidenceOrder[best.confidence] ? a : best,
        ).confidence
      : null

  return {
    pubkey,
    attestations: active,
    expiredAttestations: expired,
    highestConfidence,
    isAttested: active.length > 0,
    methods: [...new Set(active.map(a => a.method))],
  }
}

export const isAttested = (attestations: Map<string, Attestation[]>, pubkey: string): boolean => {
  const all = attestations.get(pubkey) || []
  return all.some(a => !a.expired)
}

// ── Event Builder ──────────────────────────────────────────

export const buildAttestationTemplate = ({
  target,
  method,
  confidence,
  scope,
  validUntil,
  context,
}: {
  target: string
  method: AttestationMethod
  confidence: Confidence
  scope: Scope
  validUntil?: number
  context?: string
}) => ({
  kind: 30078,
  tags: [
    ["d", `attestation:${target}`],
    ["p", target],
    ["method", method],
    ["confidence", confidence],
    ["scope", scope],
    ...(validUntil ? [["valid-until", String(validUntil)]] : []),
    ...(context ? [["context", context.slice(0, 280)]] : []),
  ],
  content: "",
})
