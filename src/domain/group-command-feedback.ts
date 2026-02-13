export const GROUP_COMMAND_REASON = {
  PERMISSION_DENIED: "GROUP_COMMAND_PERMISSION_DENIED",
  INVALID_INPUT: "GROUP_COMMAND_INVALID_INPUT",
  CAPABILITY_BLOCKED: "GROUP_COMMAND_CAPABILITY_BLOCKED",
  POLICY_BLOCKED: "GROUP_COMMAND_POLICY_BLOCKED",
  PUBLISH_FAILED: "GROUP_COMMAND_PUBLISH_FAILED",
  UNKNOWN: "GROUP_COMMAND_UNKNOWN",
} as const

export type GroupCommandReasonCode =
  (typeof GROUP_COMMAND_REASON)[keyof typeof GROUP_COMMAND_REASON]

export type GroupCommandAck = {
  ok: boolean
  ackCount: number
  relayCount: number
  ackedRelays: string[]
}

export type GroupCommandOutcome<T = unknown> =
  | {
      ok: true
      ack: GroupCommandAck
      value: T
    }
  | {
      ok: false
      reason: GroupCommandReasonCode
      message: string
      retryable: boolean
      details?: unknown
    }

const asArray = (value: unknown) => (Array.isArray(value) ? value : [])

const toAckedRelays = (result: unknown): string[] => {
  if (typeof result !== "object" || result === null) return []

  const candidate = result as Record<string, unknown>
  const relays = asArray(candidate.relays).map(String)
  const published = asArray(candidate.publishedTo).map(String)
  const acked = asArray(candidate.ackedRelays).map(String)

  if (acked.length > 0) return acked
  if (published.length > 0) return published
  if (relays.length > 0) return relays

  return []
}

export const normalizeGroupCommandAck = (result: unknown): GroupCommandAck => {
  const ackedRelays = toAckedRelays(result)

  if (ackedRelays.length === 0) {
    return {
      ok: false,
      ackCount: 0,
      relayCount: 0,
      ackedRelays,
    }
  }

  return {
    ok: true,
    ackCount: ackedRelays.length,
    relayCount: ackedRelays.length,
    ackedRelays,
  }
}

export const mapGroupCommandError = (error: unknown): GroupCommandOutcome<never> => {
  const message = error instanceof Error ? error.message : "Unknown command failure"

  if (message.toLowerCase().includes("permission denied")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.PERMISSION_DENIED,
      message,
      retryable: false,
      details: error,
    }
  }

  if (message.toLowerCase().includes("invalid")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.INVALID_INPUT,
      message,
      retryable: false,
      details: error,
    }
  }

  if (message.toLowerCase().includes("capability gate")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.CAPABILITY_BLOCKED,
      message,
      retryable: false,
      details: error,
    }
  }

  if (message.toLowerCase().includes("tier policy blocked")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.POLICY_BLOCKED,
      message,
      retryable: false,
      details: error,
    }
  }

  if (message.toLowerCase().includes("publish") || message.toLowerCase().includes("relay")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.PUBLISH_FAILED,
      message,
      retryable: true,
      details: error,
    }
  }

  return {
    ok: false,
    reason: GROUP_COMMAND_REASON.UNKNOWN,
    message,
    retryable: true,
    details: error,
  }
}

export const GROUP_COMMAND_REASON_UI: Record<GroupCommandReasonCode, string> = {
  GROUP_COMMAND_PERMISSION_DENIED: "You are not allowed to perform this group action.",
  GROUP_COMMAND_INVALID_INPUT: "Group input is invalid. Review fields and try again.",
  GROUP_COMMAND_CAPABILITY_BLOCKED:
    "Requested secure capability is unavailable for this group or relay set.",
  GROUP_COMMAND_POLICY_BLOCKED:
    "Group policy prevents this mode selection until tier requirements are satisfied.",
  GROUP_COMMAND_PUBLISH_FAILED: "Failed to publish to relays. Retry when relay health improves.",
  GROUP_COMMAND_UNKNOWN: "The action failed unexpectedly. Retry or check relay diagnostics.",
}

export const toGroupCommandUiMessage = (reason: GroupCommandReasonCode) =>
  GROUP_COMMAND_REASON_UI[reason]

export const withGroupCommandRetry = async <T>(
  run: () => Promise<GroupCommandOutcome<T>>,
  retries = 1,
): Promise<GroupCommandOutcome<T>> => {
  let lastResult = await run()

  for (
    let attempt = 0;
    attempt < retries && "retryable" in lastResult && lastResult.retryable;
    attempt++
  ) {
    lastResult = await run()
  }

  return lastResult
}
