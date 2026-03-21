import type {NetContext} from "@welshman/net"
import type {AppContext} from "@welshman/app"
import type {SwipeCustomEvent} from "src/util/swipe"

declare module "fuse.js/dist/fuse.min.js"

declare module "@welshman/lib" {
  interface Context {
    net: NetContext
    app: AppContext
  }
}

declare namespace svelteHTML {
  interface HTMLAttributes {
    "on:swipe"?: (event: SwipeCustomEvent) => any
  }
}

interface LoaderBenchmarkRun {
  surface: string
  label: string
  notes?: string
  capturedAt: string
  metrics: unknown[]
}

interface LoaderBenchmarkSessionContext {
  environment?: Record<string, unknown>
  relayProfile?: string
  accountState?: string
  notes?: string
}

interface Window {
  __loaderBenchmark: {
    resetMetrics: () => void
    captureRun: (input?: {surface?: string; label?: string; notes?: string}) => LoaderBenchmarkRun
    setSessionContext: (input?: LoaderBenchmarkSessionContext) => LoaderBenchmarkSessionContext
    getSessionContext: () => LoaderBenchmarkSessionContext
    refreshEnvironmentSnapshot: () => Record<string, unknown>
    getRuns: () => LoaderBenchmarkRun[]
    exportRuns: () => {
      capturedAt: string
      sessionContext: LoaderBenchmarkSessionContext
      runs: LoaderBenchmarkRun[]
    }
    clearRuns: () => void
  }
}
