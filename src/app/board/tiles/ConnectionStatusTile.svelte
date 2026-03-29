<script lang="ts">
  import {connectionState} from "src/engine/connection-state"
  import {relayHealthTracker} from "src/engine/relay/relay-health"

  export let config: Record<string, unknown> | undefined = undefined

  $: mode = $connectionState.mode
  $: queuedCount = $connectionState.queuedCount

  function getMetrics() {
    const all = relayHealthTracker.getAllMetrics()
    return {
      total: all.length,
      healthy: all.filter(m => !m.demoted).length,
      demoted: all.filter(m => m.demoted).length,
    }
  }

  $: metrics = getMetrics()

  function elapsed(): string {
    const ts = $connectionState.since
    if (!ts) return ""
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    return `${Math.floor(diff / 3600)}h`
  }
</script>

<div class="flex h-full flex-col p-2 text-xs">
  <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">Connection</h4>
  <div class="mt-2 flex items-center gap-2">
    <span class={mode === "sovereign" ? "text-warning" : "text-success"}>
      {mode === "sovereign" ? "◆" : "●"}
    </span>
    <span class="font-bold uppercase text-nc-text"
      >{mode === "sovereign" ? "SOVEREIGN" : "CONNECTED"}</span>
    {#if elapsed()}
      <span class="text-nc-text-muted">({elapsed()})</span>
    {/if}
  </div>
  {#if queuedCount > 0}
    <p class="mt-1 text-nc-text-muted">{queuedCount} event{queuedCount !== 1 ? "s" : ""} queued</p>
  {/if}
  <div class="mt-auto text-nc-text-muted">
    <p>{metrics.healthy}/{metrics.total} relays healthy</p>
    {#if metrics.demoted > 0}
      <p class="text-danger">{metrics.demoted} relay{metrics.demoted !== 1 ? "s" : ""} demoted</p>
    {/if}
  </div>
</div>
