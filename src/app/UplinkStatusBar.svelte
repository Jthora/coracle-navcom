<script lang="ts">
  import {onMount} from "svelte"
  import {Pool} from "@welshman/net"
  import {derivePubkeyRelays, pubkey} from "@welshman/app"
  import {RelayMode} from "@welshman/util"
  import {messages} from "src/engine"
  import {ConnectionType, getSocketStatus} from "src/domain/connection"
  import UplinkStatusVent from "src/app/uplink-status/UplinkStatusVent.svelte"
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
    class="bottom-sai right-sai border-neutral-600/70 bg-neutral-950/95 pointer-events-none fixed left-72 z-nav h-7 border-t backdrop-blur-sm">
    <div class="relative flex h-full items-center overflow-hidden">
      <UplinkStatusVent side="left" />
      <UplinkStatusVent side="right" />

      <div class="z-10 relative ml-10 flex items-center gap-3">
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
