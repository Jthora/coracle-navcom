<script lang="ts">
  import type {GroupAdminMode} from "src/app/groups/admin-mode"

  export let mode: GroupAdminMode = "guided"
  export let onSelectMode: (mode: GroupAdminMode) => void
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Experience Mode</h3>
  <p class="mt-2 text-sm text-neutral-400">
    Guided mode keeps core actions simple. Expert mode exposes full policy and diagnostics controls.
  </p>
  <div class="mt-3 grid gap-2 sm:grid-cols-2">
    <button
      class="btn"
      class:btn-accent={mode === "guided"}
      type="button"
      on:click={() => onSelectMode("guided")}>
      Guided
    </button>
    <button
      class="btn"
      class:btn-accent={mode === "expert"}
      type="button"
      on:click={() => onSelectMode("expert")}>
      Expert
    </button>
  </div>
</div>
