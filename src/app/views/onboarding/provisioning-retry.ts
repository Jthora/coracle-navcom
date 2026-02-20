import {
  attemptApplyDefaultRelays,
  attemptApplyStarterFollows,
} from "src/app/views/onboarding/provisioning"

type RelayProvisioningDeps = {
  getUserRelayList: () => any
  defaultRelays: string[]
  setOutboxPolicies: (modifyTags: (tags: string[][]) => string[][]) => Promise<void>
  isOnline: () => boolean
  showWarning: (message: string) => void
  trackOnboardingEdge: (event: string, recovered: boolean) => void
  getRelayEdgeLogged: () => boolean
  setRelayEdgeLogged: (value: boolean) => void
  setQueueRelays: (value: boolean) => void
  setRelaysApplied: (value: boolean) => void
}

type StarterProvisioningDeps = {
  getStarterFollowsEnabled: () => boolean
  defaultFollows: string[]
  tagPubkey: (pk: string) => string[]
  isOnline: () => boolean
  showWarning: (message: string) => void
  trackOnboardingEdge: (event: string, recovered: boolean) => void
  getFollowsEdgeLogged: () => boolean
  setFollowsEdgeLogged: (value: boolean) => void
  setQueueFollows: (value: boolean) => void
  setStarterApplied: (value: boolean) => void
}

type OnboardingProvisioningRetryDeps = {
  relays: RelayProvisioningDeps
  follows: StarterProvisioningDeps
}

export const createOnboardingProvisioningRetry = ({
  relays,
  follows,
}: OnboardingProvisioningRetryDeps) => {
  const applyRelaysIfNeeded = async (attempt = 0) => {
    const result = await attemptApplyDefaultRelays({
      userRelayList: relays.getUserRelayList(),
      defaultRelays: relays.defaultRelays,
      setOutboxPolicies: relays.setOutboxPolicies,
      isOnline: relays.isOnline(),
    })

    if (result === "already" || result === "applied") {
      relays.setRelaysApplied(true)
      relays.setQueueRelays(false)
      if (relays.getRelayEdgeLogged()) {
        relays.trackOnboardingEdge("relay_publish_fail", true)
        relays.trackOnboardingEdge("relay_offline", true)
        relays.setRelayEdgeLogged(false)
      }
      return
    }

    if (result === "offline") {
      relays.setQueueRelays(true)
      relays.setRelaysApplied(false)
      if (!relays.getRelayEdgeLogged()) {
        relays.trackOnboardingEdge("relay_offline", false)
        relays.setRelayEdgeLogged(true)
      }
      return
    }

    relays.setRelaysApplied(false)
    if (attempt === 0) {
      relays.showWarning("Relay defaults not applied. Retrying in the background.")
      if (!relays.getRelayEdgeLogged()) {
        relays.trackOnboardingEdge("relay_publish_fail", false)
        relays.setRelayEdgeLogged(true)
      }
    }

    if (attempt < 2) {
      const delay = 800 * Math.pow(2, attempt)
      setTimeout(() => applyRelaysIfNeeded(attempt + 1), delay)
    } else {
      relays.setQueueRelays(true)
    }
  }

  const applyStarterFollowsIfEnabled = async (attempt = 0) => {
    const result = await attemptApplyStarterFollows({
      enabled: follows.getStarterFollowsEnabled(),
      defaultFollows: follows.defaultFollows,
      tagPubkey: follows.tagPubkey,
      isOnline: follows.isOnline(),
    })

    if (result === "disabled") {
      follows.setStarterApplied(false)
      return
    }

    if (result === "applied") {
      follows.setStarterApplied(true)
      follows.setQueueFollows(false)
      if (follows.getFollowsEdgeLogged()) {
        follows.trackOnboardingEdge("starter_fail", true)
        follows.trackOnboardingEdge("starter_offline", true)
        follows.setFollowsEdgeLogged(false)
      }
      return
    }

    if (result === "offline") {
      follows.setQueueFollows(true)
      follows.setStarterApplied(false)
      if (!follows.getFollowsEdgeLogged()) {
        follows.trackOnboardingEdge("starter_offline", false)
        follows.setFollowsEdgeLogged(true)
      }
      return
    }

    follows.setStarterApplied(false)
    if (attempt === 0) {
      follows.showWarning("Starter follows not applied. Retrying in the background.")
      if (!follows.getFollowsEdgeLogged()) {
        follows.trackOnboardingEdge("starter_fail", false)
        follows.setFollowsEdgeLogged(true)
      }
    }

    if (attempt < 2) {
      const delay = 800 * Math.pow(2, attempt)
      setTimeout(() => applyStarterFollowsIfEnabled(attempt + 1), delay)
    } else {
      follows.setQueueFollows(true)
    }
  }

  return {
    applyRelaysIfNeeded,
    applyStarterFollowsIfEnabled,
  }
}
