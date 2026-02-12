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
  let mapLat: number | null = null
  let mapLon: number | null = null
  let latPlaceholder = "47.6062"
  let lonPlaceholder = "-122.3321"
  let deviceLat: number | null = null
  let deviceLon: number | null = null
  let locating = false

  const parseCoordInput = (value: number | string | null) => {
    if (value === null || value === undefined) return null
    if (typeof value === "string" && value.trim() === "") return null

    const num = Number(value)

    return Number.isFinite(num) ? num : null
  }

  const applyDeviceLocationIfEmpty = () => {
    if (deviceLat !== null && parseCoordInput(lat) === null) {
      lat = deviceLat
    }

    if (deviceLon !== null && parseCoordInput(lon) === null) {
      lon = deviceLon
    }
  }

  const requestDeviceLocation = () => {
    if (typeof navigator === "undefined" || !navigator?.geolocation || locating) return

    locating = true

    navigator.geolocation.getCurrentPosition(
      position => {
        locating = false
        deviceLat = Number(position.coords.latitude.toFixed(6))
        deviceLon = Number(position.coords.longitude.toFixed(6))
        applyDeviceLocationIfEmpty()
      },
      () => {
        locating = false
      },
      {enableHighAccuracy: true, maximumAge: 30000, timeout: 7000},
    )
  }

  const resolveLatLon = () => {
    const latNum = parseCoordInput(lat) ?? deviceLat
    const lonNum = parseCoordInput(lon) ?? deviceLon

    if (latNum === null || lonNum === null) {
      return {error: "Enter coordinates or allow location access to use your current position."}
    }

    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return {error: "Add valid latitude and longitude"}
    }

    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return {error: "Latitude must be between -90 and 90; longitude between -180 and 180"}
    }

    return {lat: latNum, lon: lonNum}
  }

  $: mapLat = parseCoordInput(lat) ?? deviceLat
  $: mapLon = parseCoordInput(lon) ?? deviceLon
  $: latPlaceholder = deviceLat !== null ? deviceLat.toFixed(6) : "47.6062"
  $: lonPlaceholder = deviceLon !== null ? deviceLon.toFixed(6) : "-122.3321"

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
    mapPicked = false
    applyDeviceLocationIfEmpty()
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
    mapPicked = false
    applyDeviceLocationIfEmpty()
  }

  const handleSave = () => {
    error = null
    jsonWarning = null
    const resolved = resolveLatLon()

    if ("error" in resolved) {
      error = resolved.error
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
      lat: resolved.lat,
      lon: resolved.lon,
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
    requestDeviceLocation()
    const modal = document?.getElementById("geo-modal-lat")
    modal?.focus()
  })

  $: loadFromValue()
</script>

{#if showMapPicker}
  <MapPickerModal
    lat={mapLat}
    lon={mapLon}
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
      <button
        class="flex h-11 w-11 items-center justify-center text-neutral-300 md:h-auto md:w-auto"
        on:click={handleCancel}
        aria-label="Close geo modal">
        <i class="fa fa-times" />
      </button>
    </div>

    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-neutral-200">Coordinates</span>
        {#if mapPicked}
          <span class="bg-emerald-600/30 text-emerald-100 rounded-full px-2 py-1 text-xs">
            Set from map
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded border border-neutral-600 p-3 text-white hover:border-neutral-400 md:p-2"
          aria-label="Pick location on map"
          on:click={() => (showMapPicker = true)}>
          <i class="fa fa-map" />
        </button>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Latitude *</span>
        <input
          id="geo-modal-lat"
          class="flex-1 rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="number"
          step="0.000001"
          bind:value={lat}
          placeholder={latPlaceholder}
          on:input={() => (mapPicked = false)} />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-neutral-200">Longitude *</span>
        <input
          class="rounded border border-neutral-700 bg-neutral-800 p-2 text-white"
          type="number"
          step="0.000001"
          bind:value={lon}
          placeholder={lonPlaceholder}
          on:input={() => (mapPicked = false)} />
      </label>

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

      <div class="text-xs text-neutral-400 md:col-span-2">
        Choose a location on the map with the draggable pin, type coordinates manually, or leave
        them blank to use your current position. Typed values apply automatically.
      </div>
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
      class="sticky bottom-0 mt-4 flex flex-wrap justify-end gap-2 bg-neutral-900 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-2 md:static md:bg-transparent md:pb-0 md:pt-0">
      <button class="rounded border border-neutral-600 px-4 py-2 text-sm" on:click={handleClear}>
        Clear
      </button>
      <button class="rounded border border-neutral-600 px-4 py-2 text-sm" on:click={handleCancel}>
        Cancel
      </button>
      <button
        class="rounded bg-white px-5 py-2 text-sm font-semibold text-black"
        on:click={handleSave}
        aria-label="Save GEOINT state">
        Save
      </button>
    </div>
  </div>
</div>
