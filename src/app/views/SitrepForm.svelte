<!--
  SitrepForm.svelte — Situation Report form overlay.

  Three-field simplified form: description, location, severity.
  Generates kind 445 event with ["msg-type", "sitrep"] + severity + location tags.
-->

<script lang="ts">
  import {createEventDispatcher} from "svelte"

  const dispatch = createEventDispatcher<{
    submit: {content: string; severity: string; location: string | null; geohash: string | null}
    cancel: void
  }>()

  let description = ""
  let severity: "routine" | "important" | "urgent" = "routine"
  const setSeverity = (val: string) => {
    severity = val as "routine" | "important" | "urgent"
  }
  let locationText = ""
  let gpsLoading = false

  const COORD_RE = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/

  function validateLocation(text: string): string | null {
    if (!text.trim()) return null
    if (!COORD_RE.test(text.trim())) return "Use lat,lng format (e.g. 51.5074,-0.1278)"
    const [latStr, lngStr] = text
      .trim()
      .split(",")
      .map(s => s.trim())
    const lat = Number(latStr)
    const lng = Number(lngStr)
    if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90"
    if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180"
    return null
  }

  $: locationError = validateLocation(locationText)
  $: canSubmit = description.trim().length > 0 && !locationError

  async function useGps() {
    if (!navigator.geolocation) return
    gpsLoading = true
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000}),
      )
      const lat = pos.coords.latitude.toFixed(4)
      const lng = pos.coords.longitude.toFixed(4)
      locationText = `${lat},${lng}`
    } catch {
      // GPS unavailable
    } finally {
      gpsLoading = false
    }
  }

  function handleSubmit() {
    if (!canSubmit) return
    dispatch("submit", {
      content: description.trim(),
      severity,
      location: locationText.trim() || null,
      geohash: null,
    })
  }
</script>

<div class="bg-neutral-850 rounded-xl border border-neutral-700 p-4">
  <div class="mb-3 flex items-center gap-2">
    <span class="text-lg">📋</span>
    <h3 class="text-sm font-bold uppercase tracking-wide text-neutral-200">Situation Report</h3>
  </div>

  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1 block text-xs text-neutral-400" for="sitrep-desc">What's happening?</label>
      <textarea
        id="sitrep-desc"
        bind:value={description}
        rows="3"
        placeholder="Describe the situation..."
        class="w-full resize-none rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-accent focus:outline-none" />
    </div>

    <div>
      <label class="mb-1 block text-xs text-neutral-400" for="sitrep-location">Where?</label>
      <div class="flex gap-2">
        <input
          id="sitrep-location"
          type="text"
          bind:value={locationText}
          placeholder="lat,lng or description"
          class="flex-1 rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-accent focus:outline-none" />
        <button
          class="flex-shrink-0 rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-600"
          on:click={useGps}
          disabled={gpsLoading}>
          {gpsLoading ? "..." : "📍 GPS"}
        </button>
      </div>
      {#if locationError}
        <p class="text-red-400 mt-1 text-[11px]">{locationError}</p>
      {/if}
    </div>

    <div>
      <label class="mb-1.5 block text-xs text-neutral-400">How serious?</label>
      <div class="flex gap-2">
        {#each [["routine", "Routine"], ["important", "Important"], ["urgent", "Urgent"]] as [val, label]}
          <button
            class="flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors
              {severity === val
              ? val === 'urgent'
                ? 'bg-red-900/40 border-red-600 text-red-200'
                : val === 'important'
                  ? 'bg-amber-900/40 border-amber-600 text-amber-200'
                  : 'border-accent bg-neutral-700 text-accent'
              : 'border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}"
            on:click={() => setSeverity(val)}>
            {label}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex gap-2 pt-1">
      <button
        class="flex-1 rounded-lg bg-neutral-700 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-600"
        on:click={() => dispatch("cancel")}>
        Cancel
      </button>
      <button
        class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors
          {canSubmit
          ? 'bg-accent text-neutral-900 hover:opacity-90'
          : 'cursor-not-allowed bg-neutral-700 text-neutral-500'}"
        on:click={handleSubmit}
        disabled={!canSubmit}>
        Send SITREP
      </button>
    </div>
  </div>
</div>
