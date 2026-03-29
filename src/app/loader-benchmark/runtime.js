import {clearCacheMetrics, getCacheMetricsSnapshot} from "src/engine"

const cloneDetails = details => (details && typeof details === "object" ? {...details} : undefined)

const cloneRun = run => ({
  ...run,
  metrics: run.metrics.map(metric => ({
    ...metric,
    details: cloneDetails(metric.details),
  })),
})

const getNavigatorProfile = () => {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "unknown",
      platform: "unknown",
      language: "unknown",
      hardwareConcurrency: null,
      deviceMemory: null,
      connection: {
        effectiveType: "unknown",
        saveData: false,
      },
    }
  }

  const runtimeNavigator = navigator
  const connection = runtimeNavigator.connection || {}

  return {
    userAgent: runtimeNavigator.userAgent || "unknown",
    platform: runtimeNavigator.platform || "unknown",
    language: runtimeNavigator.language || "unknown",
    hardwareConcurrency:
      typeof runtimeNavigator.hardwareConcurrency === "number"
        ? runtimeNavigator.hardwareConcurrency
        : null,
    deviceMemory:
      typeof runtimeNavigator.deviceMemory === "number" ? runtimeNavigator.deviceMemory : null,
    connection: {
      effectiveType:
        typeof connection.effectiveType === "string" ? connection.effectiveType : "unknown",
      saveData: Boolean(connection.saveData),
    },
  }
}

const createEnvironmentSnapshot = () => ({
  capturedAt: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
  viewport:
    typeof window !== "undefined"
      ? {
          width: window.innerWidth,
          height: window.innerHeight,
        }
      : {
          width: null,
          height: null,
        },
  location:
    typeof window !== "undefined"
      ? {
          origin: window.location.origin,
          pathname: window.location.pathname,
        }
      : {
          origin: "unknown",
          pathname: "unknown",
        },
  navigator: getNavigatorProfile(),
})

export const installLoaderBenchmarkRuntime = () => {
  const loaderBenchmarkRuns = []
  let sessionContext = {
    environment: createEnvironmentSnapshot(),
    relayProfile: "pending",
    accountState: "pending",
    notes: "",
  }

  window.__loaderBenchmark = {
    resetMetrics() {
      clearCacheMetrics()
    },
    setSessionContext(input = {}) {
      sessionContext = {
        ...sessionContext,
        ...input,
      }

      return {...sessionContext}
    },
    getSessionContext() {
      return {...sessionContext}
    },
    refreshEnvironmentSnapshot() {
      sessionContext = {
        ...sessionContext,
        environment: createEnvironmentSnapshot(),
      }

      return sessionContext.environment
    },
    captureRun({surface = "feed", label = "manual-run", notes = ""} = {}) {
      const metrics = getCacheMetricsSnapshot()

      const run = {
        surface,
        label,
        notes,
        capturedAt: new Date().toISOString(),
        metrics,
      }

      loaderBenchmarkRuns.push(run)

      return cloneRun(run)
    },
    getRuns() {
      return loaderBenchmarkRuns.map(run => cloneRun(run))
    },
    exportRuns() {
      return {
        capturedAt: new Date().toISOString(),
        sessionContext: {
          ...sessionContext,
          environment: {
            ...sessionContext.environment,
            navigator: {
              ...sessionContext.environment.navigator,
              connection: {
                ...sessionContext.environment.navigator.connection,
              },
            },
            viewport: {...sessionContext.environment.viewport},
            location: {...sessionContext.environment.location},
          },
        },
        runs: window.__loaderBenchmark.getRuns(),
      }
    },
    clearRuns() {
      loaderBenchmarkRuns.length = 0
    },
  }
}
