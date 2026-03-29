<script lang="ts">
  import {groupProjections} from "src/app/groups/state"
  import {evaluateRelayFingerprintGate} from "src/engine/relay-fingerprint-gate"
  import type {GateResult} from "src/engine/relay-fingerprint-gate"
  import {loadRoomRelayPolicy, extractRelayUrls} from "src/app/groups/relay-policy"

  export let config: Record<string, unknown> | undefined = undefined

  type GroupAudit = {
    id: string
    title: string
    result: GateResult | null
  }

  $: audits = (() => {
    const items: GroupAudit[] = []
    for (const [gid, proj] of $groupProjections.entries()) {
      try {
        const policy = loadRoomRelayPolicy(gid)
        const groupRelays = extractRelayUrls(policy)
        const memberPubkeys = Object.keys(proj.members).filter(
          pk => proj.members[pk].status === "active",
        )
        // Build memberRelays map — in a real scenario this would come from
        // a member relay list store; for now use empty maps (no violations)
        const memberRelays = new Map<string, string[]>()
        const result = evaluateRelayFingerprintGate({groupRelays, memberPubkeys, memberRelays})
        items.push({id: gid, title: proj.group.title || gid.slice(0, 8), result})
      } catch {
        items.push({id: gid, title: proj.group.title || gid.slice(0, 8), result: null})
      }
    }
    return items
  })()
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="shrink-0 px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Security
  </h4>
  <div class="flex-1 overflow-y-auto px-2 pb-2">
    {#each audits as audit (audit.id)}
      <div class="flex items-center gap-2 py-1 text-xs">
        {#if audit.result === null}
          <span class="text-nc-text-muted">—</span>
        {:else if audit.result.ok}
          <span class="text-success">✓</span>
        {:else}
          <span class="text-danger">⚠</span>
        {/if}
        <span class="flex-1 truncate text-nc-text">{audit.title}</span>
        {#if audit.result && !audit.result.ok}
          <span class="text-[10px] text-danger"
            >{audit.result.violations.length} conflict{audit.result.violations.length !== 1
              ? "s"
              : ""}</span>
        {/if}
      </div>
    {:else}
      <p class="py-4 text-center text-xs text-nc-text-muted">No groups to audit</p>
    {/each}
  </div>
</div>
