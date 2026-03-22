<script lang="ts">
  import {t} from "svelte-i18n"
  import {createEventDispatcher} from "svelte"

  const dispatch = createEventDispatcher<{
    submit: {content: string; geoType: string; geojson: string; label: string}
    cancel: void
  }>()

  export let geoType: "Point" | "LineString" | "Polygon" | "Circle" = "Point"
  export let coordinates: number[][] = []

  let label = ""
  let description = ""

  $: geoTypeLabel =
    geoType === "Point"
      ? $t("geo.type.point")
      : geoType === "LineString"
        ? $t("geo.type.route")
        : geoType === "Polygon"
          ? $t("geo.type.area")
          : $t("geo.type.radiusZone")

  $: geojsonObj =
    geoType === "Circle"
      ? {
          type: "Point",
          coordinates: coordinates[0] || [0, 0],
          properties: {radius: coordinates[1]?.[0] || 100},
        }
      : geoType === "Point"
        ? {type: "Point", coordinates: coordinates[0] || [0, 0]}
        : {
            type: geoType,
            coordinates:
              geoType === "Polygon" && coordinates.length > 0 ? [coordinates] : coordinates,
          }

  function handleSubmit() {
    if (!description.trim()) return
    dispatch("submit", {
      content: description.trim(),
      geoType,
      geojson: JSON.stringify(geojsonObj),
      label: label.trim(),
    })
  }
</script>

<div class="max-w-sm rounded-xl border border-nc-shell-border bg-nc-shell-deep p-4 shadow-xl">
  <h3 class="mb-3 text-sm font-semibold text-nc-text">
    {$t("geo.form.heading", {values: {geoTypeLabel}})}
  </h3>

  <div class="space-y-3">
    <div>
      <label for="geo-label" class="text-xs text-nc-text-muted">{$t("geo.form.label.label")}</label>
      <input
        id="geo-label"
        type="text"
        bind:value={label}
        class="mt-1 w-full rounded-lg border border-nc-shell-border bg-nc-shell-bg px-3 py-2 text-sm text-nc-text placeholder-nc-text-muted"
        placeholder={$t("geo.form.label.placeholder")} />
    </div>

    <div>
      <label for="geo-desc" class="text-xs text-nc-text-muted"
        >{$t("geo.form.description.label")}</label>
      <textarea
        id="geo-desc"
        bind:value={description}
        rows="3"
        class="mt-1 w-full resize-none rounded-lg border border-nc-shell-border bg-nc-shell-bg px-3 py-2 text-sm text-nc-text placeholder-nc-text-muted"
        placeholder={$t("geo.form.description.placeholder", {values: {geoTypeLabel}})} />
    </div>

    <div class="bg-nc-shell-bg/50 rounded px-2 py-1.5 text-[10px] text-nc-text-muted">
      {$t("geo.form.info.type")} <span class="text-nc-text-muted">{geoType}</span> ·
      {$t("geo.form.info.points")} <span class="text-nc-text-muted">{coordinates.length}</span>
    </div>

    <div class="flex gap-2">
      <button
        class="hover:bg-accent/90 flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-neutral-900 transition-colors disabled:opacity-40"
        disabled={!description.trim()}
        on:click={handleSubmit}>
        {$t("geo.form.action.submit")}
      </button>
      <button
        class="rounded-lg bg-nc-shell-bg px-3 py-2 text-sm text-nc-text transition-colors hover:bg-nc-input"
        on:click={() => dispatch("cancel")}>
        {$t("geo.form.action.cancel")}
      </button>
    </div>
  </div>
</div>
