<script lang="ts">
  import {onMount} from "svelte"
  import {resolvePeerPqPublicKey} from "src/engine/pqc/pq-key-lifecycle"

  export let peerPubkey: string

  let status: "loading" | "available" | "unavailable" = "loading"

  onMount(async () => {
    const key = await resolvePeerPqPublicKey(peerPubkey)
    status = key ? "available" : "unavailable"
  })
</script>

{#if status === "available"}
  <span
    class="bg-green-900/30 text-green-400 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
    title="PQC encryption available">
    🔒 PQC
  </span>
{:else if status === "unavailable"}
  <span
    class="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-500"
    title="Standard encryption only">
    ⚠ Standard
  </span>
{/if}
