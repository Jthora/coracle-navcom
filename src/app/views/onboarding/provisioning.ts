import {Router, addMaximalFallbacks} from "@welshman/router"
import {FOLLOWS, getRelaysFromList, makeEvent} from "@welshman/util"
import {publishThunk} from "@welshman/app"
import {uniqueFollowTags, uniqueRelays} from "src/app/views/onboarding/util"

type UserRelayListStoreValue = Parameters<typeof getRelaysFromList>[0]

type ApplyRelaysInput = {
  userRelayList: UserRelayListStoreValue
  defaultRelays: string[]
  setOutboxPolicies: (modifyTags: (tags: string[][]) => string[][]) => Promise<void>
  isOnline: boolean
}

export type ApplyRelaysResult = "already" | "applied" | "offline" | "failed"

export const attemptApplyDefaultRelays = async ({
  userRelayList,
  defaultRelays,
  setOutboxPolicies,
  isOnline,
}: ApplyRelaysInput): Promise<ApplyRelaysResult> => {
  const urls = getRelaysFromList(userRelayList)

  if (urls.length > 0) {
    return "already"
  }

  if (!isOnline) {
    return "offline"
  }

  try {
    const relays = uniqueRelays(defaultRelays.map(url => ["r", url]))
    await setOutboxPolicies(() => relays)

    return "applied"
  } catch {
    return "failed"
  }
}

type ApplyStarterFollowsInput = {
  enabled: boolean
  defaultFollows: string[]
  tagPubkey: (pk: string) => string[]
  isOnline: boolean
}

export type ApplyStarterFollowsResult = "disabled" | "applied" | "offline" | "failed"

export const attemptApplyStarterFollows = async ({
  enabled,
  defaultFollows,
  tagPubkey,
  isOnline,
}: ApplyStarterFollowsInput): Promise<ApplyStarterFollowsResult> => {
  if (!enabled) {
    return "disabled"
  }

  if (!isOnline) {
    return "offline"
  }

  try {
    const tags = uniqueFollowTags(defaultFollows, tagPubkey)
    const event = makeEvent(FOLLOWS, {tags})

    await publishThunk({
      event,
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    })

    return "applied"
  } catch {
    return "failed"
  }
}
