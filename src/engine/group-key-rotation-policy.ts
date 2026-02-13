import type {GroupKeyLifecycleState} from "src/engine/group-key-lifecycle"

export type GroupKeyRotationTrigger =
  | "schedule"
  | "membership-change"
  | "compromise-suspected"
  | "manual"

export type GroupKeyRotationPolicy = {
  maxKeyAgeSeconds: number
  retryBaseDelaySeconds: number
  retryMaxDelaySeconds: number
  maxRetries: number
}

export type EvaluateGroupKeyRotationInput = {
  keyState?: GroupKeyLifecycleState | null
  trigger: GroupKeyRotationTrigger
  now?: number
  policy?: Partial<GroupKeyRotationPolicy>
}

export const DEFAULT_GROUP_KEY_ROTATION_POLICY: GroupKeyRotationPolicy = {
  maxKeyAgeSeconds: 60 * 60 * 12,
  retryBaseDelaySeconds: 30,
  retryMaxDelaySeconds: 60 * 30,
  maxRetries: 5,
}

const isTerminal = (status: GroupKeyLifecycleState["status"]) =>
  status === "revoked" || status === "destroyed"

export const resolveGroupKeyRotationPolicy = (
  overrides: Partial<GroupKeyRotationPolicy> = {},
): GroupKeyRotationPolicy => ({
  ...DEFAULT_GROUP_KEY_ROTATION_POLICY,
  ...overrides,
})

export const getGroupKeyRotationRetryDelaySeconds = (
  attempt: number,
  policy: Partial<GroupKeyRotationPolicy> = {},
) => {
  const resolved = resolveGroupKeyRotationPolicy(policy)
  const exponent = Math.max(0, attempt - 1)
  const delay = resolved.retryBaseDelaySeconds * 2 ** exponent

  return Math.min(delay, resolved.retryMaxDelaySeconds)
}

export const shouldRotateGroupKey = ({
  keyState,
  trigger,
  now = Math.floor(Date.now() / 1000),
  policy,
}: EvaluateGroupKeyRotationInput): boolean => {
  if (
    trigger === "manual" ||
    trigger === "compromise-suspected" ||
    trigger === "membership-change"
  ) {
    return true
  }

  if (!keyState || isTerminal(keyState.status)) {
    return false
  }

  const resolved = resolveGroupKeyRotationPolicy(policy)
  const dueByAge = now >= keyState.createdAt + resolved.maxKeyAgeSeconds
  const dueByExpiry =
    typeof keyState.expiresAt === "number" &&
    now >= Math.max(keyState.createdAt, keyState.expiresAt - 60)

  return dueByAge || dueByExpiry || keyState.status === "expired"
}
