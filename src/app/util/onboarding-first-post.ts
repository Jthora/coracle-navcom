import {get} from "svelte/store"
import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
import type {Thunk} from "@welshman/app"
import {thunkIsComplete} from "@welshman/app"
import {onboardingState, markFirstPostTracked} from "src/app/state/onboarding"
import {trackOnboarding} from "src/util/telemetry"

// Attach to a publish thunk and emit post_first_after_onboarding once per user after completion.
export const trackFirstPostAfterOnboarding = (thunk: Thunk) => {
  const state = get(onboardingState)
  if (!state.complete || state.firstPostTracked || !state.completionAt) return

  const unsubscribe = thunk.subscribe(t => {
    if (!thunkIsComplete(t)) return

    const statuses = Object.entries(t.results || {})
      .filter(([url]) => url !== LOCAL_RELAY_URL)
      .map(([, res]) => res.status)

    const hasSuccess = statuses.some(s => s === PublishStatus.Success)
    if (hasSuccess) {
      const msSinceComplete = Date.now() - state.completionAt
      trackOnboarding("post_first_after_onboarding", {ms_since_complete: msSinceComplete})
      markFirstPostTracked()
    }

    unsubscribe()
  })
}
