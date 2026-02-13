export type GroupMissionTier = 0 | 1 | 2

export type GroupPolicyDraft = {
  tier: GroupMissionTier
  preferredMode: "baseline-nip29" | "secure-nip-ee"
  allowDowngrade: boolean
}

export type GroupPolicyNotice = {
  level: "info" | "warning"
  message: string
}

export const createDefaultGroupPolicyDraft = (): GroupPolicyDraft => ({
  tier: 0,
  preferredMode: "baseline-nip29",
  allowDowngrade: true,
})

export const evaluateGroupPolicyDraft = (draft: GroupPolicyDraft): GroupPolicyNotice[] => {
  const notices: GroupPolicyNotice[] = []

  if (draft.preferredMode === "baseline-nip29") {
    notices.push({
      level: "info",
      message: "Baseline mode favors relay-managed compatibility for current deployments.",
    })
  }

  if (draft.preferredMode === "secure-nip-ee") {
    notices.push({
      level: "info",
      message: "Secure mode requires compatible relay and signer capabilities.",
    })
  }

  if (draft.tier >= 1 && draft.allowDowngrade) {
    notices.push({
      level: "warning",
      message: "Tier 1+ should only downgrade with explicit user/admin acknowledgement.",
    })
  }

  if (draft.tier === 2 && draft.allowDowngrade) {
    notices.push({
      level: "warning",
      message: "Tier 2 cannot auto-downgrade; require audited admin override events.",
    })
  }

  return notices
}

export const isGroupPolicyDraftValid = (draft: GroupPolicyDraft) =>
  !(draft.tier === 2 && draft.allowDowngrade)

export const asGroupPolicySummary = (draft: GroupPolicyDraft) =>
  `Tier ${draft.tier} · ${draft.preferredMode} · downgrade ${draft.allowDowngrade ? "enabled" : "disabled"}`
