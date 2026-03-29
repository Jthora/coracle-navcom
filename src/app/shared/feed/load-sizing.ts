type NetworkConnection = {
  effectiveType?: string
  saveData?: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkConnection
  deviceMemory?: number
}

export type FeedLoadProfile = {
  networkTier: "slow" | "moderate" | "fast" | "unknown"
  deviceTier: "low" | "standard" | "high" | "unknown"
  saveData: boolean
}

export type FeedLoadPlan = {
  initialLoadSize: number
  incrementalLoadSize: number
  prefetchThreshold: number
  profile: FeedLoadProfile
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const detectFeedLoadProfile = (): FeedLoadProfile => {
  if (typeof navigator === "undefined") {
    return {
      networkTier: "unknown",
      deviceTier: "unknown",
      saveData: false,
    }
  }

  const runtimeNavigator = navigator as NavigatorWithConnection
  const connection = runtimeNavigator.connection
  const effectiveType = connection?.effectiveType
  const saveData = Boolean(connection?.saveData)
  const cpuCores =
    typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 0
  const deviceMemory =
    typeof runtimeNavigator.deviceMemory === "number" ? runtimeNavigator.deviceMemory : 0

  const networkTier: FeedLoadProfile["networkTier"] =
    effectiveType === "slow-2g" || effectiveType === "2g"
      ? "slow"
      : effectiveType === "3g"
        ? "moderate"
        : effectiveType === "4g"
          ? "fast"
          : "unknown"

  const deviceTier: FeedLoadProfile["deviceTier"] =
    cpuCores > 0 && cpuCores <= 2
      ? "low"
      : cpuCores >= 8 && deviceMemory >= 8
        ? "high"
        : cpuCores > 0
          ? "standard"
          : "unknown"

  return {
    networkTier,
    deviceTier,
    saveData,
  }
}

export const getAdaptiveFeedLoadPlan = (useWindowing: boolean): FeedLoadPlan => {
  const profile = detectFeedLoadProfile()

  if (!useWindowing) {
    return {
      initialLoadSize: 1000,
      incrementalLoadSize: 250,
      prefetchThreshold: 250,
      profile,
    }
  }

  let initialLoadSize = 25

  if (profile.saveData || profile.networkTier === "slow") {
    initialLoadSize -= 10
  } else if (profile.networkTier === "moderate") {
    initialLoadSize -= 5
  } else if (profile.networkTier === "fast") {
    initialLoadSize += 5
  }

  if (profile.deviceTier === "low") {
    initialLoadSize -= 5
  } else if (profile.deviceTier === "high") {
    initialLoadSize += 5
  }

  initialLoadSize = clamp(initialLoadSize, 10, 40)

  return {
    initialLoadSize,
    incrementalLoadSize: initialLoadSize,
    prefetchThreshold: Math.max(10, initialLoadSize),
    profile,
  }
}
