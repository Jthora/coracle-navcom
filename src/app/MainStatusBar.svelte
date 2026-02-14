<script lang="ts">
  import {onMount} from "svelte"
  import {Pool} from "@welshman/net"
  import {derivePubkeyRelays, pubkey} from "@welshman/app"
  import {RelayMode} from "@welshman/util"
  import {messages} from "src/engine"
  import {ConnectionType, getSocketStatus} from "src/domain/connection"
  import UplinkStatusDivider from "src/app/uplink-status/UplinkStatusDivider.svelte"
  import UplinkStatusConnection from "src/app/uplink-status/UplinkStatusConnection.svelte"
  import UplinkStatusItem from "src/app/uplink-status/UplinkStatusItem.svelte"

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
    class="bottom-sai right-sai fixed left-72 z-[500] h-8 border-t border-[#596170] bg-[linear-gradient(180deg,rgba(78,88,101,0.92),rgba(40,48,58,0.96)_16%,rgba(23,28,35,0.98)_60%,rgba(15,19,25,0.98))] shadow-[0_-2px_0_rgba(255,255,255,0.08),0_-1px_10px_rgba(0,0,0,0.55)] backdrop-blur-sm">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" aria-hidden="true" />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/65"
      aria-hidden="true" />

    <div class="relative flex h-full items-center px-4">
      <div class="z-10 relative ml-2 flex items-center gap-3">
        <UplinkStatusConnection connected={uplinkConnected} />
        <UplinkStatusDivider />
        <UplinkStatusItem
          label="Relays"
          value={`${connectedRelayCount}/${relayUrls.length}`}
          valueClass="text-accent" />
        <UplinkStatusDivider />
        <UplinkStatusItem
          label="Messages"
          value={String($messages.length)}
          valueClass="text-accent" />
        <UplinkStatusDivider />
        <UplinkStatusItem label="Uptime" value={uptime} valueClass="font-mono text-accent" />
      </div>
    </div>
  </div>
{/if}
