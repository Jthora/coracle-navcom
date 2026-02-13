import {parseGroupAddress} from "src/domain/group-id"

export const GROUP_ROUTE_GUARD_REASON = {
  INVALID_GROUP_ID: "GROUP_ROUTE_INVALID_GROUP_ID",
  BASELINE_TIER_REQUIRED: "GROUP_ROUTE_BASELINE_TIER_REQUIRED",
} as const

export type GroupRouteGuardReason =
  (typeof GROUP_ROUTE_GUARD_REASON)[keyof typeof GROUP_ROUTE_GUARD_REASON]

export type GroupRouteGuardFailure = {
  ok: false
  reason: GroupRouteGuardReason
  message: string
  redirectTo: string
}

export type GroupRouteGuardSuccess = {
  ok: true
}

const isElevatedGroupPath = (path: string) => /\/groups\/[^/]+\/(moderation|settings)$/.test(path)

export const guardGroupRoute = ({
  path,
  groupId,
}: {
  path: string
  groupId?: string
}): GroupRouteGuardSuccess | GroupRouteGuardFailure => {
  if (!groupId) {
    return {
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      message: "That group link is invalid. Please open a valid group address.",
      redirectTo: "/groups",
    }
  }

  const parsed = parseGroupAddress(groupId)

  if (!parsed) {
    return {
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      message: "That group link is invalid. Please open a valid group address.",
      redirectTo: "/groups",
    }
  }

  if (isElevatedGroupPath(path) && parsed.kind !== "relay") {
    return {
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.BASELINE_TIER_REQUIRED,
      message: "Moderation and settings are currently available for relay-addressed groups only.",
      redirectTo: `/groups/${encodeURIComponent(parsed.canonicalId)}`,
    }
  }

  return {ok: true}
}
