import {mkdirSync, writeFileSync} from "node:fs"
import {join} from "node:path"
import {defineConfig} from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on) {
      on("task", {
        writeGroupTelemetryArtifact({
          spec,
          test,
          events,
        }: {
          spec: string
          test: string
          events: Array<{event: string; props?: Record<string, unknown>}>
        }) {
          const outputDir = join(process.cwd(), "cypress", "artifacts", "group-telemetry")

          mkdirSync(outputDir, {recursive: true})

          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          const filename = `${spec}-${timestamp}.json`

          writeFileSync(
            join(outputDir, filename),
            JSON.stringify(
              {
                spec,
                test,
                capturedAt: new Date().toISOString(),
                eventCount: Array.isArray(events) ? events.length : 0,
                events: Array.isArray(events) ? events : [],
              },
              null,
              2,
            ),
            "utf8",
          )

          return null
        },
      })
    },
  },
})
