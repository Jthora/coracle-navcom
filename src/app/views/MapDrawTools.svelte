<script lang="ts">
  import {t} from "svelte-i18n"
  import {createEventDispatcher} from "svelte"
  import GeoAnnotationForm from "src/app/views/GeoAnnotationForm.svelte"

  const dispatch = createEventDispatcher<{
    submit: {content: string; geoType: string; geojson: string; label: string}
    close: void
  }>()

  type DrawMode = "point" | "line" | "polygon" | "circle" | null

  let drawMode: DrawMode = null
  let showForm = false
  let drawnCoordinates: number[][] = []
  let drawnGeoType: "Point" | "LineString" | "Polygon" | "Circle" = "Point"

  const tools: {
    id: DrawMode
    icon: string
    labelKey: string
    geoType: "Point" | "LineString" | "Polygon" | "Circle"
  }[] = [
    {id: "point", icon: "fa-location-dot", labelKey: "map.draw.point", geoType: "Point"},
    {id: "line", icon: "fa-route", labelKey: "map.draw.line", geoType: "LineString"},
    {id: "polygon", icon: "fa-draw-polygon", labelKey: "map.draw.polygon", geoType: "Polygon"},
    {id: "circle", icon: "fa-circle", labelKey: "map.draw.circle", geoType: "Circle"},
  ]

  function selectTool(tool: (typeof tools)[0]) {
    drawMode = tool.id
    drawnGeoType = tool.geoType

    // For Phase 4 real Leaflet: this would activate the draw handler.
    // For now: simulate placement — use current GPS or center of map.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          drawnCoordinates = [[pos.coords.longitude, pos.coords.latitude]]
          showForm = true
        },
        () => {
          // Fallback: use a default coordinate and let user see the form
          drawnCoordinates = [[0, 0]]
          showForm = true
        },
        {enableHighAccuracy: true, timeout: 5000},
      )
    } else {
      drawnCoordinates = [[0, 0]]
      showForm = true
    }
  }

  function handleFormSubmit(
    e: CustomEvent<{content: string; geoType: string; geojson: string; label: string}>,
  ) {
    dispatch("submit", e.detail)
    showForm = false
    drawMode = null
  }

  function handleFormCancel() {
    showForm = false
    drawMode = null
  }
</script>

<div class="space-y-2">
  <p class="text-[10px] uppercase tracking-wider text-nc-text-muted">{$t("map.draw.heading")}</p>
  <div class="grid grid-cols-2 gap-1.5">
    {#each tools as tool (tool.id)}
      <button
        class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors
          {drawMode === tool.id
          ? 'bg-accent font-semibold text-neutral-900'
          : 'bg-nc-shell-bg text-nc-text hover:bg-nc-input'}"
        on:click={() => selectTool(tool)}
        aria-label={$t("map.draw.tool.aria", {values: {label: $t(tool.labelKey)}})}>
        <i class="fa {tool.icon} text-xs" />
        {$t(tool.labelKey)}
      </button>
    {/each}
  </div>

  {#if drawMode && !showForm}
    <p class="text-[10px] italic text-nc-text-muted">
      {drawMode === "point"
        ? $t("map.draw.hint.point")
        : drawMode === "line"
          ? $t("map.draw.hint.line")
          : drawMode === "polygon"
            ? $t("map.draw.hint.polygon")
            : $t("map.draw.hint.circle")}
    </p>
  {/if}

  {#if showForm}
    <GeoAnnotationForm
      geoType={drawnGeoType}
      coordinates={drawnCoordinates}
      on:submit={handleFormSubmit}
      on:cancel={handleFormCancel} />
  {/if}
</div>
