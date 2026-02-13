import {
  encodeGroupInvitePayloads,
  parseGroupInvitePayload,
  type GroupInviteMissionTier,
  type GroupInvitePayload,
} from "src/app/invite/schema"

export type InviteGroupDraft = {
  groupId: string
  preferredMode: "baseline-nip29" | "secure-nip-ee"
  missionTier: GroupInviteMissionTier
  label: string
}

export type InviteQueryBuildInput = {
  people: string[]
  relays: Array<{url: string; claim: string}>
  group?: InviteGroupDraft
}

const GROUP_MODE_HINTS: Record<InviteGroupDraft["preferredMode"], string> = {
  "baseline-nip29": "Mode hint: Baseline NIP-29 works across standard relay-managed group lanes.",
  "secure-nip-ee": "Mode hint: Secure NIP-EE requires compatible secure-group capabilities.",
}

const GROUP_TIER_HINTS: Record<GroupInviteMissionTier, string> = {
  0: "Tier hint: Tier 0 favors broad compatibility and lowest friction onboarding.",
  1: "Tier hint: Tier 1 balances interoperability and stronger policy controls.",
  2: "Tier hint: Tier 2 expects stricter controls and secure-mode readiness.",
}

export const createDefaultInviteGroupDraft = (groupId = ""): InviteGroupDraft => ({
  groupId,
  preferredMode: "baseline-nip29",
  missionTier: 0,
  label: "",
})

export const toGroupInvitePayload = (draft: InviteGroupDraft): GroupInvitePayload | null => {
  const parsed = parseGroupInvitePayload(draft)

  return parsed.ok ? parsed.value : null
}

export const getGroupInviteHints = (draft: InviteGroupDraft) => [
  GROUP_MODE_HINTS[draft.preferredMode],
  GROUP_TIER_HINTS[draft.missionTier],
]

export const buildInviteQueryParams = ({
  people,
  relays,
  group,
}: InviteQueryBuildInput): URLSearchParams => {
  const params = new URLSearchParams()

  if (people.length > 0) {
    params.set("people", people.join(","))
  }

  if (relays.length > 0) {
    params.set("relays", relays.map(relay => [relay.url, relay.claim].join("|")).join(","))
  }

  if (group) {
    const payload = toGroupInvitePayload(group)

    if (payload) {
      params.set("groups", encodeGroupInvitePayloads([payload]))
    }
  }

  return params
}
