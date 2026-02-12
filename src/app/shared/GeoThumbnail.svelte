<script lang="ts">
  import {extractGeointPoint} from "src/app/util/geoint"

  export let event

  const zoom = 5
  let imageError = false
  let point = extractGeointPoint(event)

  const toFixed = (value: number) => Number(value).toFixed(4)

  $: point = extractGeointPoint(event)
  $: staticMapUrl =
    point &&
    `https://staticmap.openstreetmap.de/staticmap.php?center=${point.lat},${point.lon}&zoom=${zoom}&size=320x160&markers=${point.lat},${point.lon},red-pushpin`
  $: mapUrl =
    point &&
    `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=${zoom}/${point.lat}/${point.lon}`
</script>

{#if point}
  <div class="bg-neutral-900/40 mt-3 rounded-lg border border-neutral-700 p-2">
    <div class="mb-2 flex items-center justify-between text-xs text-neutral-300">
      <span class="font-semibold">GEOINT location</span>
      <a class="underline" href={mapUrl} target="_blank" rel="noreferrer">Open map</a>
    </div>

    {#if !imageError}
      <img
        class="h-28 w-full rounded object-cover"
        src={staticMapUrl}
        alt={`Map preview at lat ${toFixed(point.lat)}, lon ${toFixed(point.lon)}`}
        loading="lazy"
        on:error={() => (imageError = true)} />
    {/if}

    <p class="mt-2 text-xs text-neutral-300">
      Lat {toFixed(point.lat)} · Lon {toFixed(point.lon)}
    </p>
  </div>
{/if}
