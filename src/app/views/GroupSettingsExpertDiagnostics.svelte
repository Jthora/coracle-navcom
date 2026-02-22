<script lang="ts">
  import type {GroupProjection} from "src/domain/group"

  export let projection: GroupProjection
  export let actorRole: string
  export let secureCapabilityWarning: string | null
  export let policySummary = ""
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Expert Diagnostics</h3>
  <div class="mt-3 grid gap-2 text-sm text-neutral-300 sm:grid-cols-2">
    <div class="rounded border border-neutral-700 px-3 py-2">
      Protocol: <span class="text-neutral-100">{projection.group.protocol}</span>
    </div>
    <div class="rounded border border-neutral-700 px-3 py-2">
      Transport: <span class="text-neutral-100">{projection.group.transportMode}</span>
    </div>
    <div class="rounded border border-neutral-700 px-3 py-2">
      Actor role: <span class="text-neutral-100">{actorRole}</span>
    </div>
    <div class="rounded border border-neutral-700 px-3 py-2">
      Active members: <span class="text-neutral-100"
        >{Object.values(projection.members).filter(m => m.status === "active").length}</span>
    </div>
  </div>

  {#if policySummary}
    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      Policy summary: <span class="text-neutral-100">{policySummary}</span>
    </div>
  {/if}

  {#if secureCapabilityWarning}
    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-warning">
      {secureCapabilityWarning}
    </div>
  {/if}
</div>
