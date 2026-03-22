<script lang="ts">
  import type {GroupProjection} from "src/domain/group"

  export let projection: GroupProjection
  export let actorRole: string
  export let secureCapabilityWarning: string | null
  export let policySummary = ""
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Expert Diagnostics</h3>
  <div class="mt-3 grid gap-2 text-sm text-nc-text sm:grid-cols-2">
    <div class="rounded border border-nc-shell-border px-3 py-2">
      Protocol: <span class="text-nc-text">{projection.group.protocol}</span>
    </div>
    <div class="rounded border border-nc-shell-border px-3 py-2">
      Transport: <span class="text-nc-text">{projection.group.transportMode}</span>
    </div>
    <div class="rounded border border-nc-shell-border px-3 py-2">
      Actor role: <span class="text-nc-text">{actorRole}</span>
    </div>
    <div class="rounded border border-nc-shell-border px-3 py-2">
      Active members: <span class="text-nc-text"
        >{Object.values(projection.members).filter(m => m.status === "active").length}</span>
    </div>
  </div>

  {#if policySummary}
    <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
      Policy summary: <span class="text-nc-text">{policySummary}</span>
    </div>
  {/if}

  {#if secureCapabilityWarning}
    <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-warning">
      {secureCapabilityWarning}
    </div>
  {/if}
</div>
