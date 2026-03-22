import {GROUP_ENGINE_ERROR_CODE, isGroupEngineError} from "src/domain/group-engine-error"

export const GROUP_COMMAND_REASON = {
  PERMISSION_DENIED: "GROUP_COMMAND_PERMISSION_DENIED",
  INVALID_INPUT: "GROUP_COMMAND_INVALID_INPUT",
  CAPABILITY_BLOCKED: "GROUP_COMMAND_CAPABILITY_BLOCKED",
  POLICY_BLOCKED: "GROUP_COMMAND_POLICY_BLOCKED",
  PUBLISH_FAILED: "GROUP_COMMAND_PUBLISH_FAILED",
  UNKNOWN: "GROUP_COMMAND_UNKNOWN",
} as const

/** Unique triage codes for group command failures — searchable in logs */
export const GROUP_ERROR_CODE: Record<GroupCommandReasonCode, string> = {
  GROUP_COMMAND_PERMISSION_DENIED: "GRP-PERM-001",
  GROUP_COMMAND_INVALID_INPUT: "GRP-INP-001",
  GROUP_COMMAND_CAPABILITY_BLOCKED: "GRP-CAP-001",
  GROUP_COMMAND_POLICY_BLOCKED: "GRP-POL-001",
  GROUP_COMMAND_PUBLISH_FAILED: "GRP-PUB-001",
  GROUP_COMMAND_UNKNOWN: "GRP-UNK-001",
}

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
  // Log full error for developer debugging; user-facing messages use generic text
  const triageCode = classifyGroupCommandError(error)
  console.warn(`[GroupCommand] Command error [${triageCode}]:`, error)

  if (isGroupEngineError(error)) {
    // Engine errors have structured codes — use generic UI messages, not raw .message
    const genericMessage =
      GROUP_COMMAND_REASON_UI[
        error.code === GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED
          ? GROUP_COMMAND_REASON.PERMISSION_DENIED
          : error.code === GROUP_ENGINE_ERROR_CODE.INVALID_INPUT
            ? GROUP_COMMAND_REASON.INVALID_INPUT
            : error.code === GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED
              ? GROUP_COMMAND_REASON.CAPABILITY_BLOCKED
              : error.code === GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED
                ? GROUP_COMMAND_REASON.POLICY_BLOCKED
                : error.code === GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED ||
                    error.code === GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED
                  ? GROUP_COMMAND_REASON.PUBLISH_FAILED
                  : GROUP_COMMAND_REASON.UNKNOWN
      ] || GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.UNKNOWN]

    if (error.code === GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED) {
      return {
        ok: false,
        reason: GROUP_COMMAND_REASON.PERMISSION_DENIED,
        message: genericMessage,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.INVALID_INPUT) {
      return {
        ok: false,
        reason: GROUP_COMMAND_REASON.INVALID_INPUT,
        message: genericMessage,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED) {
      return {
        ok: false,
        reason: GROUP_COMMAND_REASON.CAPABILITY_BLOCKED,
        message: genericMessage,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED) {
      return {
        ok: false,
        reason: GROUP_COMMAND_REASON.POLICY_BLOCKED,
        message: genericMessage,
        retryable: error.retryable,
      }
    }

    if (
      error.code === GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED ||
      error.code === GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED
    ) {
      return {
        ok: false,
        reason: GROUP_COMMAND_REASON.PUBLISH_FAILED,
        message: genericMessage,
        retryable: error.retryable,
      }
    }
  }

  // For non-engine errors, classify by keyword but never pass raw message to UI
  const rawMessage = error instanceof Error ? error.message : ""
  const lower = rawMessage.toLowerCase()

  if (lower.includes("permission denied")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.PERMISSION_DENIED,
      message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.PERMISSION_DENIED],
      retryable: false,
    }
  }

  if (lower.includes("invalid")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.INVALID_INPUT,
      message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.INVALID_INPUT],
      retryable: false,
    }
  }

  if (lower.includes("capability gate")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.CAPABILITY_BLOCKED,
      message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.CAPABILITY_BLOCKED],
      retryable: false,
    }
  }

  if (lower.includes("tier policy blocked")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.POLICY_BLOCKED,
      message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.POLICY_BLOCKED],
      retryable: false,
    }
  }

  if (lower.includes("publish") || lower.includes("relay")) {
    return {
      ok: false,
      reason: GROUP_COMMAND_REASON.PUBLISH_FAILED,
      message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.PUBLISH_FAILED],
      retryable: true,
    }
  }

  return {
    ok: false,
    reason: GROUP_COMMAND_REASON.UNKNOWN,
    message: GROUP_COMMAND_REASON_UI[GROUP_COMMAND_REASON.UNKNOWN],
    retryable: true,
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

/** Derive triage code from an error without exposing details to the caller */
const classifyGroupCommandError = (error: unknown): string => {
  if (isGroupEngineError(error)) {
    const reason =
      error.code === GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED
        ? GROUP_COMMAND_REASON.PERMISSION_DENIED
        : error.code === GROUP_ENGINE_ERROR_CODE.INVALID_INPUT
          ? GROUP_COMMAND_REASON.INVALID_INPUT
          : error.code === GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED
            ? GROUP_COMMAND_REASON.CAPABILITY_BLOCKED
            : error.code === GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED
              ? GROUP_COMMAND_REASON.POLICY_BLOCKED
              : error.code === GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED ||
                  error.code === GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED
                ? GROUP_COMMAND_REASON.PUBLISH_FAILED
                : GROUP_COMMAND_REASON.UNKNOWN
    return GROUP_ERROR_CODE[reason]
  }
  return GROUP_ERROR_CODE[GROUP_COMMAND_REASON.UNKNOWN]
}

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
