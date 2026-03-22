<script lang="ts">
  import {t} from "svelte-i18n"
  import {Pool} from "@welshman/net"
  import {derivePubkeyRelays, pubkey} from "@welshman/app"
  import {RelayMode} from "@welshman/util"
  import {ConnectionType, getSocketStatus} from "src/domain/connection"
  import {relayHealthTracker} from "src/engine/relay/relay-health"
  import {onMount} from "svelte"

  let connected = false
  let connectedCount = 0
  let totalCount = 0
  let rateLimitedCount = 0
  const alertCount = 0

  const readRelays = derivePubkeyRelays($pubkey, RelayMode.Read)
  const writeRelays = derivePubkeyRelays($pubkey, RelayMode.Write)

  $: relayUrls = Array.from(new Set([...$readRelays, ...$writeRelays]))
  $: totalCount = relayUrls.length

  $: {
    let count = 0
    for (const url of relayUrls) {
      const socket = Pool.get().get(url)
      if (socket && getSocketStatus(socket) === ConnectionType.Connected) {
        count++
      }
    }
    connectedCount = count
    connected = count > 0
  }

  $: connectionLabel = connected
    ? $t("status.relay.connected", {values: {connectedCount, totalCount}})
    : totalCount > 0
      ? rateLimitedCount > 0
        ? `Reconnecting to ${rateLimitedCount} relay(s)...`
        : $t("status.relay.reconnecting")
      : $t("status.relay.none")

  // Poll relay status since sockets don't emit reactive changes to Svelte
  onMount(() => {
    const interval = setInterval(() => {
      let count = 0
      let rlCount = 0
      for (const url of relayUrls) {
        const socket = Pool.get().get(url)
        if (socket && getSocketStatus(socket) === ConnectionType.Connected) {
          count++
        }
        // Check for rate-limited/demoted relays
        const metrics = relayHealthTracker.getAllMetrics()
        const entry = metrics.find(m => m.url === url)
        if (entry?.demoted) {
          rlCount++
        }
      }
      connectedCount = count
      connected = count > 0
      rateLimitedCount = rlCount
    }, 3000)
    return () => clearInterval(interval)
  })
</script>

<div
  class="bg-neutral-900/80 flex h-8 items-center justify-between border-b border-neutral-800 px-3 text-xs text-neutral-400">
  <div class="flex items-center gap-2">
    <span
      class="inline-block h-2 w-2 rounded-full"
      class:bg-green-400={connected}
      class:bg-red-400={!connected && totalCount > 0}
      class:bg-neutral-500={totalCount === 0} />
    <span>{connectionLabel}</span>
  </div>
  {#if alertCount > 0}
    <div class="text-yellow-400 flex items-center gap-1">
      <span>⚠</span>
      <span>{alertCount}</span>
    </div>
  {/if}
  {#if rateLimitedCount > 0}
    <div
      class="text-amber-400 flex items-center gap-1"
      title="{rateLimitedCount} relay(s) rate-limited">
      <span class="bg-amber-400 inline-block h-2 w-2 rounded-full" />
      <span>{rateLimitedCount} throttled</span>
    </div>
  {/if}
</div>
