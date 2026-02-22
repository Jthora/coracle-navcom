export const getGroupInviteCreateHref = (groupId: string) =>
  `/invite/create?initialGroupAddress=${encodeURIComponent(groupId)}`

export const getGroupJoinPrefillHref = (groupId: string) =>
  `/groups/create?groupId=${encodeURIComponent(groupId)}`

export const getAbsoluteGroupJoinPrefillHref = (groupId: string) => {
  if (typeof window === "undefined") {
    return getGroupJoinPrefillHref(groupId)
  }

  return `${window.location.origin}${getGroupJoinPrefillHref(groupId)}`
}
