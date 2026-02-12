<script lang="ts">
  import {createEventDispatcher, onMount} from "svelte"
  import {defaultGeointState, safeParseJson} from "src/app/util/geoint"
  import MapPickerModal from "src/app/shared/MapPickerModal.svelte"

  import type {GeointState} from "src/app/util/geoint"

  export let value: GeointState = defaultGeointState()
  export let onSave: (state: GeointState) => void
  export let onCancel: () => void
  export let onClear: () => void

  const dispatch = createEventDispatcher()

  let lat: number | string | null = value.lat ?? null
  let lon: number | string | null = value.lon ?? null
  let alt: number | string | null = value.alt ?? null
  let subtype = value.subtype ?? ""
  let confidence: number | string | null = value.confidence ?? null
  let timestamp = value.timestamp ?? ""
  let additionalRaw = value.additional ? JSON.stringify(value.additional, null, 2) : ""
  let error: string | null = null
  let jsonWarning: string | null = null
  const additionalPlaceholder = '{"note":"details"}'
  let showMapPicker = false
  let mapPicked = false

  const handleMapSave = ({lat: pickedLat, lon: pickedLon}: {lat: number; lon: number}) => {
    lat = Number(pickedLat.toFixed(6))
    lon = Number(pickedLon.toFixed(6))
    showMapPicker = false
    mapPicked = true
    const latInput = document?.getElementById("geo-modal-lat") as HTMLInputElement | null
    latInput?.focus()
  }

  const loadFromValue = () => {
    lat = value.lat ?? null
    lon = value.lon ?? null
    alt = value.alt ?? null
    subtype = value.subtype ?? ""
    confidence = value.confidence ?? null
    timestamp = value.timestamp ?? ""
    additionalRaw = value.additional ? JSON.stringify(value.additional, null, 2) : ""
    error = null
    jsonWarning = null
  }

  const reset = () => {
    lat = null
    lon = null
    alt = null
    subtype = ""
    confidence = null
    timestamp = ""
    additionalRaw = ""
    error = null
    jsonWarning = null
  }

  const handleSave = () => {
    error = null
    jsonWarning = null

    const latNum = Number(lat)
    const lonNum = Number(lon)

    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      error = "Add valid latitude and longitude"
      return
    }

    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      error = "Latitude must be between -90 and 90; longitude between -180 and 180"
      return
    }

    const parsedJson = safeParseJson(additionalRaw)
    if (!parsedJson.ok) {
      jsonWarning = "Additional data is not valid JSON; it was ignored"
      dispatch("warn", jsonWarning)
    } else {
      dispatch("warn", null)
    }

    const nextState: GeointState = {
      lat: latNum,
      lon: lonNum,
      alt: alt === null || alt === "" ? null : Number(alt),
      subtype: subtype?.trim() || null,
      confidence: confidence === null || confidence === "" ? null : Number(confidence),
      timestamp: timestamp?.trim() || null,
      additional: parsedJson.ok ? parsedJson.value : null,
    }

    onSave?.(nextState)
    dispatch("close")
  }

  const handleOverlayClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (target?.dataset?.role === "geo-modal-overlay") {
      handleCancel()
    }
  }

  const handleOverlayKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleCancel()
    }
  }

  const handleCancel = () => {
    loadFromValue()
    onCancel?.()
    dispatch("close")
  }

  const handleClear = () => {
    reset()
    onClear?.()
    dispatch("close")
  }

  onMount(() => {
    loadFromValue()
    const modal = document?.getElementById("geo-modal-lat")
    modal?.focus()
  })

  $: loadFromValue()
</script>

{#if showMapPicker}
  <MapPickerModal
    lat={typeof lat === "number" ? lat : Number(lat) || null}
    lon={typeof lon === "number" ? lon : Number(lon) || null}
    onClose={() => (showMapPicker = false)}
    onSave={handleMapSave} />
{/if}

<div
  class="z-50 fixed inset-0 flex items-start justify-center bg-black/60 p-4 md:items-center"
  role="dialog"
  aria-modal="true"
  data-role="geo-modal-overlay"
  on:click={handleOverlayClick}
  on:keydown={handleOverlayKeydown}
  tabindex="-1">
  <div
    class="h-full max-h-full w-full overflow-y-auto rounded-2xl bg-neutral-900 p-4 shadow-xl md:h-auto md:max-h-[90vh] md:max-w-xl">
    <div class="flex items-center justify-between pb-2">
      <div>
        <p class="text-lg font-semibold">GEOINT Location</p>
        <p class="text-sm text-neutral-300">Coordinates are public. Share responsibly.</p>
      </div>
      <button class="text-neutral-300" on:click={handleCancel} aria-label="Close geo modal">
        <i class="fa fa-times" />
      </button>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Latitude *</span>
        <div class="flex gap-2">
          <input
            id="geo-modal-lat"
            class="flex-1 rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
            type="number"
            step="0.000001"
            bind:value={lat}
            placeholder="47.6062" />
          <button
            type="button"
            class="hidden rounded border border-neutral-600 px-3 py-2 text-xs text-white hover:border-neutral-400 md:block"
            on:click={() => (showMapPicker = true)}>
            Pick on map
          </button>
        </div>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Longitude *</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="number"
          step="0.000001"
          bind:value={lon}
          placeholder="-122.3321" />
      </label>

      <div class="flex flex-col gap-1 md:col-span-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded border border-neutral-600 px-3 py-2 text-sm text-white hover:border-neutral-400 md:hidden"
            on:click={() => (showMapPicker = true)}>
            Pick on map
          </button>
          <button
            type="button"
            class="rounded border border-neutral-600 px-3 py-2 text-xs text-white hover:border-neutral-400"
            on:click={() => {
              lat = Number(lat) || 0
              lon = Number(lon) || 0
              mapPicked = false
            }}>
            Apply typed coords
          </button>
          {#if mapPicked}
            <span class="bg-emerald-600/30 text-emerald-100 rounded-full px-2 py-1 text-xs">
              Set from map
            </span>
          {/if}
        </div>
        <p class="text-xs text-neutral-400">
          Choose a location on an OpenStreetMap-based picker with a draggable pin, or enter
          coordinates directly.
        </p>
      </div>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Altitude (optional)</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="number"
          step="0.1"
          bind:value={alt}
          placeholder="100" />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Subtype</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="text"
          bind:value={subtype}
          placeholder="report / sighting / event" />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Confidence (0-100)</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="number"
          min="0"
          max="100"
          step="1"
          bind:value={confidence}
          placeholder="85" />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Timestamp (ISO)</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="text"
          bind:value={timestamp}
          placeholder={new Date().toISOString()} />
      </label>
    </div>

    <label class="mt-3 flex flex-col gap-1">
      <span class="text-sm text-neutral-200">Additional JSON (optional)</span>
      <textarea
        class="min-h-[96px] rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
        bind:value={additionalRaw}
        placeholder={additionalPlaceholder} />
    </label>

    {#if error}
      <p class="text-red-400 mt-2 text-sm">{error}</p>
    {/if}
    {#if jsonWarning}
      <p class="text-amber-400 mt-1 text-sm">{jsonWarning}</p>
    {/if}

    <div
      class="sticky bottom-0 mt-4 flex flex-wrap justify-end gap-2 bg-neutral-900 pt-2 md:static md:bg-transparent md:pt-0">
      <button class="rounded border border-neutral-600 px-3 py-2 text-sm" on:click={handleClear}>
        Clear
      </button>
      <button class="rounded border border-neutral-600 px-3 py-2 text-sm" on:click={handleCancel}>
        Cancel
      </button>
      <button
        class="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
        on:click={handleSave}
        aria-label="Save GEOINT state">
        Save
      </button>
    </div>
  </div>
</div>
