export type DmMessageSecurityState = {
  badge: string
  icon: "lock" | "unlock"
  warning: string | null
}

const getTagValue = (tags: string[][], key: string) => tags.find(tag => tag[0] === key)?.[1]

const getFallbackWarning = (reason: string | undefined) => {
  if (!reason) {
    return "Compatibility fallback applied for this message."
  }

  return `Compatibility fallback applied: ${reason}.`
}

export const getDmMessageSecurityState = (message: {kind?: number; tags?: string[][]}) => {
  if (message?.kind !== 4) {
    return null
  }

  const tags = Array.isArray(message.tags) ? message.tags : []
  const pqcMode = getTagValue(tags, "pqc")
  const pqcReason = getTagValue(tags, "pqc_reason")

  if (!pqcMode) {
    return {
      badge: "Legacy DM",
      icon: "unlock",
      warning: null,
    } satisfies DmMessageSecurityState
  }

  if (pqcMode === "hybrid") {
    return {
      badge: "PQC Hybrid",
      icon: "lock",
      warning: null,
    } satisfies DmMessageSecurityState
  }

  if (pqcMode === "classical") {
    return {
      badge: "PQC Classical",
      icon: "lock",
      warning: getFallbackWarning(pqcReason),
    } satisfies DmMessageSecurityState
  }

  if (pqcMode === "encode-fallback" || pqcMode === "size-fallback") {
    return {
      badge: "PQC Fallback",
      icon: "unlock",
      warning: getFallbackWarning(pqcReason),
    } satisfies DmMessageSecurityState
  }

  return {
    badge: "Legacy DM",
    icon: "unlock",
    warning: null,
  } satisfies DmMessageSecurityState
}
