import {defineConfig} from "vitest/config"
import {fileURLToPath} from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    dir: "tests/unit",
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
  },
})
