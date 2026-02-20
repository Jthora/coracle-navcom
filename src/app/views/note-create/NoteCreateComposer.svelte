<script lang="ts">
  import {dateToSeconds, now} from "@welshman/lib"
  import {GEOJSON_DELIMITER} from "src/app/util/geoint"
  import type {GeointState} from "src/app/util/geoint"
  import type {Values} from "src/app/shared/NoteOptions.svelte"
  import Button from "src/partials/Button.svelte"
  import Content from "src/partials/Content.svelte"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import PostTypeSelector from "src/app/shared/PostTypeSelector.svelte"
  import GeoSummary from "src/app/shared/GeoSummary.svelte"
  import {commaFormat} from "src/util/misc"

  export let selectedType: "default" | "ops" | "geoint"
  export let geointState: GeointState
  export let geoError: string | null
  export let extraJsonWarning: string | null
  export let geohashWarning: string | null
  export let sizeWarning: string | null
  export let sizeBlocked: string | null
  export let showPreview: boolean
  export let showGeoJsonPreview: boolean
  export let previewData: {human: string; payload: any | null}
  export let editor: any
  export let uploading: boolean
  export let publishing: "signing" | "pow" | null
  export let options: Values
  export let charCount: number
  export let wordCount: number
  export let hasValidGeo: () => boolean
  export let onSubmit: () => void
  export let onSwitchType: (type: "default" | "ops" | "geoint") => void
  export let onOpenGeoModal: () => void
  export let onClearGeo: () => void
  export let onToggleGeoJsonPreview: () => void
  export let onTogglePreview: () => void
  export let onOpenOptions: () => void
  export let onUploadClick: () => void
</script>

<form on:submit|preventDefault={onSubmit}>
  <Content size="lg">
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-2xl font-bold">Create a Note</span>
        <PostTypeSelector selected={selectedType} onSelect={onSwitchType} />
      </div>

      {#if selectedType === "geoint"}
        <div
          class="border-amber-500/40 bg-amber-500/10 text-amber-100 rounded-xl border p-3 text-sm">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>GEOINT posts are public. Share coordinates responsibly.</span>
            <div class="flex flex-wrap gap-2">
              <button
                class="rounded bg-white px-3 py-1 text-xs font-semibold text-black"
                type="button"
                on:click={onOpenGeoModal}>
                {hasValidGeo() ? "Edit location" : "Add location"}
              </button>
              <button
                class="rounded border border-neutral-600 px-3 py-1 text-xs text-white"
                type="button"
                on:click={onClearGeo}>
                Clear
              </button>
            </div>
          </div>
          {#if geoError}
            <p class="text-red-300 mt-2">{geoError}</p>
          {/if}
          {#if extraJsonWarning}
            <p class="text-amber-200 mt-2">{extraJsonWarning}</p>
          {/if}
          {#if geohashWarning}
            <p class="text-amber-200 mt-2">{geohashWarning}</p>
          {/if}
          {#if sizeWarning}
            <p class="text-amber-200 mt-2">{sizeWarning}</p>
          {/if}
        </div>
        <GeoSummary value={geointState} onEdit={onOpenGeoModal} onClear={onClearGeo} />
      {/if}
    </div>
    <FlexColumn>
      <Field label="What do you want to say?">
        <div
          class="rounded-xl border border-solid border-neutral-600 p-3"
          class:bg-white={!showPreview}
          class:text-black={!showPreview}
          class:bg-tinted-700={showPreview}>
          {#if showPreview}
            <div class="flex flex-col gap-3">
              <NoteContent note={{content: previewData.human, tags: []}} />

              {#if selectedType === "geoint" && hasValidGeo() && previewData.payload}
                <div
                  class="rounded border border-neutral-600 bg-neutral-900 p-3 text-sm text-white">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">GEOJSON payload (sent compacted)</span>
                    <button
                      class="text-xs text-neutral-300 underline"
                      type="button"
                      on:click={onToggleGeoJsonPreview}>
                      {showGeoJsonPreview ? "Hide" : "Show"}
                    </button>
                  </div>
                  {#if showGeoJsonPreview}
                    <pre
                      class="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-tight">{JSON.stringify(
                        previewData.payload,
                        null,
                        2,
                      )}</pre>
                    <p class="mt-2 text-xs text-neutral-300">Delimiter: {GEOJSON_DELIMITER}</p>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
          <div class:hidden={showPreview}>
            <EditorContent {editor} class="min-h-24" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 text-neutral-200">
          <small>
            {commaFormat(charCount)} characters
          </small>
          <span>•</span>
          <small>
            {commaFormat(wordCount)} words
          </small>
          <span>•</span>
          <button type="button" on:click={onTogglePreview} class="cursor-pointer text-sm underline">
            {showPreview ? "Hide" : "Show"} Preview
          </button>
          <button type="button" on:click={onOpenOptions} class="cursor-pointer text-sm">
            <i class="fa fa-cog" />
          </button>
        </div>
      </Field>
      <div class="flex gap-2">
        <Button
          type="submit"
          class="btn btn-accent flex-grow"
          disabled={selectedType === "geoint" && !hasValidGeo()}
          loading={uploading || Boolean(publishing)}>
          {#if uploading || !!publishing}
            {#if publishing === "signing"}
              Signing your note...
            {:else if publishing === "pow"}
              Generating Work...
            {:else}
              Uploading media...
            {/if}
          {:else if options?.publish_at && dateToSeconds(options.publish_at) > now()}
            Schedule
          {:else}
            Send
          {/if}
        </Button>
        <button
          class="hover:bg-white-l staatliches flex h-7 w-7 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded bg-white px-6 text-xl text-black transition-all"
          on:click|preventDefault={onUploadClick}>
          <i class="fa fa-upload" />
        </button>
      </div>
      {#if sizeBlocked}
        <p class="text-red-400 text-sm">{sizeBlocked}</p>
      {/if}
    </FlexColumn>
  </Content>
</form>
