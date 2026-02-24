export const GROUP_ENGINE_ERROR_CODE = {
  PERMISSION_DENIED: "GROUP_ENGINE_PERMISSION_DENIED",
  INVALID_INPUT: "GROUP_ENGINE_INVALID_INPUT",
  CAPABILITY_BLOCKED: "GROUP_ENGINE_CAPABILITY_BLOCKED",
  POLICY_BLOCKED: "GROUP_ENGINE_POLICY_BLOCKED",
  ADAPTER_UNSUPPORTED: "GROUP_ENGINE_ADAPTER_UNSUPPORTED",
  DISPATCH_FAILED: "GROUP_ENGINE_DISPATCH_FAILED",
} as const

export type GroupEngineErrorCode =
  (typeof GROUP_ENGINE_ERROR_CODE)[keyof typeof GROUP_ENGINE_ERROR_CODE]

export class GroupEngineError extends Error {
  code: GroupEngineErrorCode
  retryable: boolean
  details?: unknown

  constructor({
    code,
    message,
    retryable,
    details,
  }: {
    code: GroupEngineErrorCode
    message: string
    retryable: boolean
    details?: unknown
  }) {
    super(message)
    this.name = "GroupEngineError"
    this.code = code
    this.retryable = retryable
    this.details = details
  }
}

export const createGroupEngineError = ({
  code,
  message,
  retryable,
  details,
}: {
  code: GroupEngineErrorCode
  message: string
  retryable: boolean
  details?: unknown
}) =>
  new GroupEngineError({
    code,
    message,
    retryable,
    details,
  })

export const isGroupEngineError = (error: unknown): error is GroupEngineError =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "retryable" in error,
  )
