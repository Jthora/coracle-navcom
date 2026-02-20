export type PqcDmSendFeedback = {
  code: string
  summary: string
}

const STRICT_SETTINGS_HINT =
  "Review DM security settings to allow compatibility fallback or retry after peer PQC metadata refresh."

const CODE_SUMMARIES: Record<string, string> = {
  DM_POLICY_BLOCKED: `Secure DM send is blocked by strict policy. ${STRICT_SETTINGS_HINT}`,
  DM_NEGOTIATION_FAILED:
    "Secure DM send could not negotiate a hybrid profile with the recipient. Retry after peer capabilities refresh.",
  DM_KEY_UNAVAILABLE:
    "Recipient PQC key is unavailable. Ask the recipient to publish a PQC key and retry.",
  DM_KEY_STALE: "Recipient PQC key is stale. Refresh peer PQC metadata before sending again.",
  DM_KEY_EXPIRED: "Recipient PQC key is expired. Wait for key rotation and retry secure send.",
  DM_ENVELOPE_ENCODE_FAILED:
    "Secure DM envelope encoding failed. Retry sending, and switch to compatibility mode if the issue persists.",
  DM_PAYLOAD_OVERSIZE_BLOCKED:
    "Secure DM payload exceeds the configured size budget in strict mode. Shorten the message or allow fallback.",
}

const FALLBACK_PREFIX = "Secure DM send was blocked by PQC policy"

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === "object") {
    const message = (error as {message?: unknown}).message

    if (typeof message === "string") {
      return message
    }

    const legacyError = (error as {error?: unknown}).error

    if (typeof legacyError === "string") {
      return legacyError
    }
  }

  return ""
}

const extractCode = (message: string) => {
  const patterns = [
    /DM send blocked by PQC policy:\s*([A-Z0-9_]+)/,
    /DM send blocked by PQC envelope encode failure:\s*([A-Z0-9_]+)/,
    /DM send blocked by PQC payload preflight:\s*([A-Z0-9_]+)/,
    /\b(DM_(?:POLICY_BLOCKED|NEGOTIATION_FAILED|KEY_UNAVAILABLE|KEY_STALE|KEY_EXPIRED|ENVELOPE_ENCODE_FAILED|PAYLOAD_OVERSIZE_BLOCKED))\b/,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(message)

    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

export const getPqcDmSendBlockFeedback = (error: unknown): PqcDmSendFeedback | null => {
  const message = extractErrorMessage(error)
  const code = extractCode(message)

  if (!code) {
    return null
  }

  return {
    code,
    summary: CODE_SUMMARIES[code] || `${FALLBACK_PREFIX}: ${code}. ${STRICT_SETTINGS_HINT}`,
  }
}
