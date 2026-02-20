import type {PqcPolicyMode} from "src/engine/pqc/negotiation"

export type DmPayloadPreflightReason =
  | "DM_PAYLOAD_WITHIN_LIMIT"
  | "DM_PAYLOAD_OVERSIZE_FALLBACK"
  | "DM_PAYLOAD_OVERSIZE_BLOCKED"

export type DmPayloadSizePreflightInput = {
  content: string
  maxBytes: number
  policyMode: PqcPolicyMode
  allowClassicalFallback?: boolean
}

export type DmPayloadSizePreflightResult = {
  estimatedBytes: number
  maxBytes: number
  oversize: boolean
  allowed: boolean
  shouldFallback: boolean
  reason: DmPayloadPreflightReason
}

export const estimatePayloadSizeBytes = (content: string) => {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(content).length
  }

  return Buffer.byteLength(content, "utf8")
}

export const runDmPayloadSizePreflight = ({
  content,
  maxBytes,
  policyMode,
  allowClassicalFallback = true,
}: DmPayloadSizePreflightInput): DmPayloadSizePreflightResult => {
  const estimatedBytes = estimatePayloadSizeBytes(content)
  const oversize = estimatedBytes > maxBytes

  if (!oversize) {
    return {
      estimatedBytes,
      maxBytes,
      oversize,
      allowed: true,
      shouldFallback: false,
      reason: "DM_PAYLOAD_WITHIN_LIMIT",
    }
  }

  if (policyMode === "strict" || !allowClassicalFallback) {
    return {
      estimatedBytes,
      maxBytes,
      oversize,
      allowed: false,
      shouldFallback: false,
      reason: "DM_PAYLOAD_OVERSIZE_BLOCKED",
    }
  }

  return {
    estimatedBytes,
    maxBytes,
    oversize,
    allowed: true,
    shouldFallback: true,
    reason: "DM_PAYLOAD_OVERSIZE_FALLBACK",
  }
}
