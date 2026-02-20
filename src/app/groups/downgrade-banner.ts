import {getLatestGroupDowngradeAudit} from "src/engine/group-downgrade-audit"

const asReason = (reason?: string) => {
  if (!reason) {
    return "Secure capability was unavailable."
  }

  return reason.trim().endsWith(".") ? reason.trim() : `${reason.trim()}.`
}

export const getGroupDowngradeBannerMessageWith = (
  groupId: string,
  resolveLatest: (groupId: string) => ReturnType<typeof getLatestGroupDowngradeAudit>,
) => {
  const latest = resolveLatest(groupId)

  if (!latest) {
    return null
  }

  return `Compatibility fallback active for this group. Recent secure downgrade: ${asReason(latest.reason)}`
}

export const getGroupDowngradeBannerMessage = (groupId: string) =>
  getGroupDowngradeBannerMessageWith(groupId, getLatestGroupDowngradeAudit)
