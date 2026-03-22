<!--
  SpotrepForm.svelte — Spot Report form overlay.

  Location required. Observation text + optional photo attachment.
  Generates kind 445 event with ["msg-type", "spotrep"] + location tags.
-->

<script lang="ts">
  import {createEventDispatcher} from "svelte"

  const dispatch = createEventDispatcher<{
    submit: {content: string; location: string; geohash: string | null; photoUrl: string | null}
    cancel: void
  }>()

  let observation = ""
  let locationText = ""
  let gpsLoading = false
  let photoUrl = ""

  const COORD_RE = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/
  const URL_RE = /^https?:\/\/.+/i

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
  $: photoUrlError =
    photoUrl.trim() && !URL_RE.test(photoUrl.trim()) ? "Must be an http:// or https:// URL" : null
  $: canSubmit =
    observation.trim().length > 0 &&
    locationText.trim().length > 0 &&
    !locationError &&
    !photoUrlError

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
      content: observation.trim(),
      location: locationText.trim(),
      geohash: null,
      photoUrl: photoUrl.trim() || null,
    })
  }
</script>

<div class="bg-neutral-850 rounded-xl border border-neutral-700 p-4">
  <div class="mb-3 flex items-center gap-2">
    <span class="text-lg">📌</span>
    <h3 class="text-sm font-bold uppercase tracking-wide text-neutral-200">Spot Report</h3>
  </div>

  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1 block text-xs text-neutral-400" for="spotrep-obs"
        >What did you observe?</label>
      <textarea
        id="spotrep-obs"
        bind:value={observation}
        rows="3"
        placeholder="Describe what you see..."
        class="w-full resize-none rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-accent focus:outline-none" />
    </div>

    <div>
      <label class="mb-1 block text-xs text-neutral-400" for="spotrep-location"
        >Location (required)</label>
      <div class="flex gap-2">
        <input
          id="spotrep-location"
          type="text"
          bind:value={locationText}
          placeholder="lat,lng"
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
      {:else if !locationText.trim()}
        <p class="text-amber-400 mt-1 text-[11px]">Location is required for spot reports</p>
      {/if}
    </div>

    <div>
      <label class="mb-1 block text-xs text-neutral-400" for="spotrep-photo"
        >Photo URL (optional)</label>
      <input
        id="spotrep-photo"
        type="text"
        bind:value={photoUrl}
        placeholder="https://..."
        class="w-full rounded-lg border border-neutral-600 bg-neutral-700 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-accent focus:outline-none" />
      {#if photoUrlError}
        <p class="text-red-400 mt-1 text-[11px]">{photoUrlError}</p>
      {/if}
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
        Send SPOTREP
      </button>
    </div>
  </div>
</div>
