import {trackGroupTelemetry} from "src/app/groups/telemetry"
import {GROUP_ENGINE_ERROR_CODE, isGroupEngineError} from "src/domain/group-engine-error"

export type GroupErrorContext =
  | "create"
  | "join"
  | "relay-check-create"
  | "relay-check-join"
  | "relay-auth-create"
  | "relay-auth-join"
  | "share-package"
  | "group-send"
  | "invite-share"
  | "invite-create"
  | "invite-accept"
  | "secure-encryption"
  | "group-admin-save-policy"
  | "group-admin-put-member"
  | "group-admin-remove-member"
  | "group-admin-moderation-submit"
  | "group-admin-leave"
  | "relay-policy-load"
  | "mixed-capability-simulation"

export type GroupErrorCode =
  | "GROUP_ERROR_PERMISSION_DENIED"
  | "GROUP_ERROR_INVALID_INPUT"
  | "GROUP_ERROR_CAPABILITY_BLOCKED"
  | "GROUP_ERROR_POLICY_BLOCKED"
  | "GROUP_ERROR_RELAY_UNREACHABLE"
  | "GROUP_ERROR_AUTH_REQUIRED"
  | "GROUP_ERROR_ENCRYPTION_FAILED"
  | "GROUP_ERROR_CLIPBOARD_UNAVAILABLE"
  | "GROUP_ERROR_SHARE_UNAVAILABLE"
  | "GROUP_ERROR_DISPATCH_FAILED"
  | "GROUP_ERROR_UNKNOWN"

type GroupErrorClassification = {
  code: GroupErrorCode
  message: string
  retryable: boolean
}

const normalizeMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || "Unknown group error"
  }

  if (typeof error === "string") {
    return error
  }

  return "Unknown group error"
}

const classifyGroupError = (error: unknown): GroupErrorClassification => {
  if (isGroupEngineError(error)) {
    if (error.code === GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED) {
      return {
        code: "GROUP_ERROR_PERMISSION_DENIED",
        message: error.message,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.INVALID_INPUT) {
      return {
        code: "GROUP_ERROR_INVALID_INPUT",
        message: error.message,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED) {
      return {
        code: "GROUP_ERROR_CAPABILITY_BLOCKED",
        message: error.message,
        retryable: error.retryable,
      }
    }

    if (error.code === GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED) {
      return {
        code: "GROUP_ERROR_POLICY_BLOCKED",
        message: error.message,
        retryable: error.retryable,
      }
    }

    if (
      error.code === GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED ||
      error.code === GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED
    ) {
      return {
        code: "GROUP_ERROR_DISPATCH_FAILED",
        message: error.message,
        retryable: error.retryable,
      }
    }
  }

  const message = normalizeMessage(error)
  const normalized = message.toLowerCase()

  if (normalized.includes("permission denied")) {
    return {
      code: "GROUP_ERROR_PERMISSION_DENIED",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("invalid") || normalized.includes("cannot be empty")) {
    return {
      code: "GROUP_ERROR_INVALID_INPUT",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("capability") || normalized.includes("secure mode requires")) {
    return {
      code: "GROUP_ERROR_CAPABILITY_BLOCKED",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("tier") || normalized.includes("policy")) {
    return {
      code: "GROUP_ERROR_POLICY_BLOCKED",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("auth") || normalized.includes("signer")) {
    return {
      code: "GROUP_ERROR_AUTH_REQUIRED",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("encrypt") || normalized.includes("decrypt")) {
    return {
      code: "GROUP_ERROR_ENCRYPTION_FAILED",
      message,
      retryable: true,
    }
  }

  if (normalized.includes("clipboard")) {
    return {
      code: "GROUP_ERROR_CLIPBOARD_UNAVAILABLE",
      message,
      retryable: false,
    }
  }

  if (normalized.includes("share")) {
    return {
      code: "GROUP_ERROR_SHARE_UNAVAILABLE",
      message,
      retryable: false,
    }
  }

  if (
    normalized.includes("relay") ||
    normalized.includes("publish") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("unreachable")
  ) {
    return {
      code: "GROUP_ERROR_RELAY_UNREACHABLE",
      message,
      retryable: true,
    }
  }

  if (normalized.includes("dispatch") || normalized.includes("failed")) {
    return {
      code: "GROUP_ERROR_DISPATCH_FAILED",
      message,
      retryable: true,
    }
  }

  return {
    code: "GROUP_ERROR_UNKNOWN",
    message,
    retryable: true,
  }
}

const GROUP_ERROR_FALLBACK_MESSAGE: Record<GroupErrorContext, string> = {
  create: "Group create failed. Review setup details and retry.",
  join: "Group join failed. Verify the invite, relays, and retry.",
  "relay-check-create": "Relay capability check failed for create flow.",
  "relay-check-join": "Relay capability check failed for join flow.",
  "relay-auth-create": "Relay authentication failed during create flow.",
  "relay-auth-join": "Relay authentication failed during join flow.",
  "share-package": "Unable to build or copy access package.",
  "group-send": "Unable to send group message.",
  "invite-share": "Unable to share invite link.",
  "invite-create": "Unable to create invite link.",
  "invite-accept": "Unable to process invite payload.",
  "secure-encryption": "Secure group encryption flow failed.",
  "group-admin-save-policy": "Unable to submit group settings update.",
  "group-admin-put-member": "Unable to submit member update.",
  "group-admin-remove-member": "Unable to submit member removal.",
  "group-admin-moderation-submit": "Unable to submit moderation action.",
  "group-admin-leave": "Unable to leave group.",
  "relay-policy-load": "Unable to load relay policy; defaults applied.",
  "mixed-capability-simulation": "Mixed capability simulation failed.",
}

export const reportGroupError = ({
  context,
  error,
  flow,
  groupId,
  source,
  dedupeKey,
  minIntervalMs,
}: {
  context: GroupErrorContext
  error: unknown
  flow?: "create" | "join" | "chat" | "invite"
  groupId?: string
  source?: string
  dedupeKey?: string
  minIntervalMs?: number
}) => {
  const classified = classifyGroupError(error)

  trackGroupTelemetry(
    "group_error_reported",
    {
      context,
      flow: flow || "chat",
      group_id_present: Boolean(groupId),
      source: source || "ui",
      error_code: classified.code,
      error_message: classified.message,
      retryable: classified.retryable,
      result: "error",
    },
    {
      dedupeKey,
      minIntervalMs,
    },
  )

  return {
    ...classified,
    userMessage: classified.message || GROUP_ERROR_FALLBACK_MESSAGE[context],
  }
}
