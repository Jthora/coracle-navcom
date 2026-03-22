<script lang="ts">
  export let value
</script>

<span
  class="rounded bg-nc-input px-1 py-px font-mono text-sm text-nc-text"
  class:overflow-auto={value.includes("\n")}
  class:whitespace-pre={value.includes("\n")}
  class:block={value.includes("\n")}>
  {value.trim()}
</span>
