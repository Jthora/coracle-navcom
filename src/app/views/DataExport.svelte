<script lang="ts">
  import {repository, pubkey} from "@welshman/app"
  import {Capacitor} from "@capacitor/core"
  import {Filesystem, Directory, Encoding} from "@capacitor/filesystem"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {showInfo, showError, showActionToast} from "src/partials/Toast.svelte"

  let userOnly = true

  const downloadNative = async (filename, jsonl) => {
    try {
      const permissionStatus = await Filesystem.checkPermissions()

      if (permissionStatus.publicStorage !== "granted") {
        const requested = await Filesystem.requestPermissions()
        if (requested.publicStorage !== "granted") {
          showError(
            "Export failed — storage permission is required. Please grant storage access in your device settings.",
          )
          return
        }
      }

      await Filesystem.writeFile({
        path: `${filename}.jsonl`,
        data: jsonl,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })

      showInfo(`File saved to your documents folder as ${filename}.jsonl`)
    } catch (error) {
      console.error("Error saving file:", error)
      const msg = error instanceof Error ? error.message : ""
      if (msg.includes("SecurityException") || msg.includes("permission")) {
        showError(
          "Export failed — storage permission may be required. Check your device settings and try again.",
        )
      } else if (msg.includes("FileNotFoundException") || msg.includes("No such file")) {
        showActionToast("Export failed — target folder not found.", "Retry", () =>
          downloadNative(filename, jsonl),
        )
      } else {
        showActionToast("Export failed. Please try again.", "Retry", () =>
          downloadNative(filename, jsonl),
        )
      }
    }
  }

  const downloadWeb = (filename, jsonl) => {
    try {
      const data = new TextEncoder().encode(jsonl)
      const blob = new Blob([data], {type: "application/octet-stream"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")

      a.href = url
      a.download = `${filename}.jsonl`
      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting file:", error)
      showError("Export failed — could not create download. Please try again.")
    }
  }

  const submit = async () => {
    const date = new Date().toISOString().slice(0, 10)
    const filename = `navcom-export-${date}`
    const events = Array.from(repository.query([userOnly ? {authors: [$pubkey]} : {}]))
    const jsonl = events
      .filter(e => e.sig)
      .map(e => JSON.stringify(e))
      .join("\n")

    if (Capacitor.isNativePlatform()) {
      downloadNative(filename, jsonl)
    } else {
      downloadWeb(filename, jsonl)
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <FlexColumn>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>Export Settings</Heading>
      <p>Select which events you'd like to export</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <FieldInline label="Only export your events">
        <Toggle bind:value={userOnly} />
        <p slot="info">If enabled, only your events will be exported.</p>
      </FieldInline>
      <Button class="btn" type="submit">Export</Button>
    </div>
  </FlexColumn>
</form>
