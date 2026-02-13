<style>
  .status-value {
    color: var(--accent);
    font-weight: 600;
  }

  .status-pulse {
    animation: status-pulse 1.6s ease-in-out infinite;
  }

  @keyframes status-pulse {
    0%,
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 currentColor;
    }

    50% {
      transform: scale(1.07);
      box-shadow: 0 0 0 6px transparent;
    }
  }
</style>

<script lang="ts">
  import {onMount} from "svelte"
  import {Pool} from "@welshman/net"
  import {derivePubkeyRelays, pubkey} from "@welshman/app"
  import {RelayMode} from "@welshman/util"
  import {messages} from "src/engine"
  import {ConnectionType, getSocketStatus} from "src/domain/connection"

  let innerWidth = 0
  let elapsedMs = 0
  const startedAt = Date.now()

  const readRelayUrls = derivePubkeyRelays($pubkey, RelayMode.Read)
  const writeRelayUrls = derivePubkeyRelays($pubkey, RelayMode.Write)
  const messagingRelayUrls = derivePubkeyRelays($pubkey, RelayMode.Messaging)

  $: relayUrls = Array.from(
    new Set([...$readRelayUrls, ...$writeRelayUrls, ...$messagingRelayUrls]),
  )

  $: connectedRelayCount = relayUrls.reduce((count, url) => {
    const socket = Pool.get().get(url)

    if (!socket) {
      return count
    }

    return getSocketStatus(socket) === ConnectionType.Connected ? count + 1 : count
  }, 0)

  $: uplinkConnected = connectedRelayCount > 0
  $: hours = Math.floor(elapsedMs / 3_600_000)
  $: minutes = Math.floor((elapsedMs % 3_600_000) / 60_000)
  $: seconds = Math.floor((elapsedMs % 60_000) / 1_000)
  $: uptime = [hours, minutes, seconds].map(n => String(n).padStart(2, "0")).join(":")

  onMount(() => {
    elapsedMs = Date.now() - startedAt

    const interval = setInterval(() => {
      elapsedMs = Date.now() - startedAt
    }, 1000)

    return () => clearInterval(interval)
  })
</script>

<svelte:window bind:innerWidth />

{#if innerWidth >= 1024}
  <div
    class="bottom-sai right-sai border-neutral-600/70 bg-neutral-950/95 pointer-events-none fixed left-72 z-nav h-8 border-t text-[11px] tracking-[0.12em] backdrop-blur-sm">
    <div class="aldrich relative flex h-full items-center overflow-hidden px-4">
      <div
        class="border-neutral-600/70 absolute inset-y-0 left-0 w-6 border-r bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_48%)]" />
      <div
        class="border-neutral-600/70 absolute inset-y-0 right-0 w-6 border-l bg-[linear-gradient(-135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_48%)]" />

      <div class="z-10 relative flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span
            class="h-2 w-2 rounded-full"
            class:bg-success={uplinkConnected}
            class:status-pulse={uplinkConnected}
            class:bg-neutral-500={!uplinkConnected} />
          <span class="font-semibold uppercase text-neutral-300">Uplink:</span>
          <span class:status-value={uplinkConnected} class:text-neutral-400={!uplinkConnected}
            >{uplinkConnected ? "Connected" : "Disconnected"}</span>
        </div>
        <div class="bg-neutral-700/80 h-3 w-px" />
        <div>
          <span class="font-semibold uppercase text-neutral-300">Relays:</span>
          <span class="status-value"> {connectedRelayCount}/{relayUrls.length}</span>
        </div>
        <div class="bg-neutral-700/80 h-3 w-px" />
        <div>
          <span class="font-semibold uppercase text-neutral-300">Messages:</span>
          <span class="status-value"> {$messages.length}</span>
        </div>
        <div class="bg-neutral-700/80 h-3 w-px" />
        <div>
          <span class="font-semibold uppercase text-neutral-300">Uptime:</span>
          <span class="status-value font-mono"> {uptime}</span>
        </div>
      </div>
    </div>
  </div>
{/if}
