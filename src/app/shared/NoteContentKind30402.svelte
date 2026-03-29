<script lang="ts">
  import cx from "classnames"
  import {deriveIsDeleted} from "@welshman/store"
  import {fromPairs} from "@welshman/lib"
  import {getTagValue} from "@welshman/util"
  import {repository} from "@welshman/app"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {commaFormat} from "src/util/misc"

  export let note
  export let showMedia = false
  export let showEntire = false

  const {title, summary, location, status} = fromPairs(note.tags)
  const [price, code = "SAT"] = getTagValue("price", note.tags)?.slice(1) || []
  const deleted = deriveIsDeleted(repository, note)
</script>

<FlexColumn>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2 text-xl">
      <div class="flex items-center gap-3">
        <strong class={cx({"line-through": $deleted})}>
          {title}
        </strong>
        {#if $deleted}
          <Chip danger small>Deleted</Chip>
        {:else if status === "sold"}
          <Chip danger small>Sold</Chip>
        {:else}
          <Chip small>Available</Chip>
        {/if}
      </div>
      <span class="whitespace-nowrap">
        <CurrencySymbol {code} />{commaFormat(price || 0)}
        {code}
      </span>
    </div>
    {#if location}
      <div class="flex items-center gap-2 text-sm text-nc-text">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
    {#if summary !== note.content}
      <p class="text-nc-text">{summary}</p>
    {/if}
    <div class="h-px bg-nc-shell-border" />
    <NoteContentKind1 {note} {showEntire} {showMedia} />
  </div>
  <NoteContentTopics {note} />
</FlexColumn>
