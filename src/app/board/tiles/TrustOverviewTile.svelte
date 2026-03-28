<script lang="ts">
  import {attestationsByTarget, getAttestationSummary} from "src/engine/trust/attestation"
  import {groupProjections} from "src/app/groups/state"

  export let config: Record<string, unknown> | undefined = undefined

  $: allMembers = (() => {
    const members = new Set<string>()
    for (const [, proj] of $groupProjections) {
      for (const pubkey of Object.keys(proj.members)) {
        members.add(pubkey)
      }
    }
    return [...members]
  })()

  $: attested = allMembers.filter(pk => getAttestationSummary($attestationsByTarget, pk).isAttested)

  $: unattested = allMembers.filter(
    pk => !getAttestationSummary($attestationsByTarget, pk).isAttested,
  )

  $: recentAttestations = (() => {
    const all: Array<{attester: string; target: string; method: string; createdAt: number}> = []
    for (const [, attestations] of $attestationsByTarget) {
      for (const a of attestations) {
        if (!a.expired) all.push(a)
      }
    }
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  })()
</script>

<div class="flex h-full flex-col p-2 text-xs">
  <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">Trust</h4>
  <div class="mt-2 flex gap-4">
    <div>
      <span class="text-lg font-bold text-success">{attested.length}</span>
      <span class="text-nc-text-muted"> attested</span>
    </div>
    <div>
      <span class="text-lg font-bold text-nc-text-muted">{unattested.length}</span>
      <span class="text-nc-text-muted"> unattested</span>
    </div>
  </div>
  {#if recentAttestations.length > 0}
    <div class="mt-2">
      <p class="text-[10px] font-bold uppercase text-nc-text-muted">Recent</p>
      {#each recentAttestations as a}
        <p class="truncate text-nc-text-muted">✦ {a.method} — {a.target.slice(0, 8)}</p>
      {/each}
    </div>
  {/if}
</div>
