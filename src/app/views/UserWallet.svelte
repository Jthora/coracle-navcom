<script lang="ts">
  import {nwc} from "@getalby/sdk"
  import {LOCALE} from "@welshman/lib"
  import {displayRelayUrl, fromMsats} from "@welshman/util"
  import {session} from "@welshman/app"
  import Icon from "src/partials/Icon.svelte"
  import Link from "src/partials/Link.svelte"
  import {getWebLn} from "src/engine"
  import {router} from "src/app/util"
</script>

<div class="flex flex-col gap-6">
  <div class="panel p-4">
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg text-accent" />
        <h2 class="text-lg uppercase tracking-[0.08em]">Your Wallet</h2>
      </div>
      {#if $session?.wallet}
        <div class="flex items-center gap-2 text-sm text-success">
          <i class="fa fa-check" />
          Connected
        </div>
      {:else}
        <Link modal class="btn btn-accent" href={router.at("settings/wallet/connect").toString()}>
          Connect Wallet
        </Link>
      {/if}
    </div>
  </div>
  <div class="panel flex flex-col gap-4 p-4">
    {#if $session?.wallet}
      {#if $session.wallet?.type === "webln"}
        {@const {node, version} = $session.wallet.info}
        <div class="panel-row !items-center !justify-between gap-3 !px-3 !py-2">
          <p>
            Connected to <strong>{node?.alias || version || "unknown wallet"}</strong>
            via <strong>{$session.wallet.type}</strong>
          </p>
          <p class="flex gap-2 whitespace-nowrap text-neutral-100">
            Balance:
            {#await getWebLn()
              ?.enable()
              .then(() => getWebLn().getBalance())}
              <span class="loading loading-spinner loading-sm"></span>
            {:then res}
              {new Intl.NumberFormat(LOCALE).format(res?.balance || 0)}
            {:catch}
              [unknown]
            {/await}
            sats
          </p>
        </div>
      {:else if $session.wallet.type === "nwc"}
        {@const {lud16, relayUrl, nostrWalletConnectUrl} = $session.wallet.info}
        <div class="panel-row !items-center !justify-between gap-3 !px-3 !py-2">
          <p>
            Connected to <strong>{lud16}</strong> via <strong>{displayRelayUrl(relayUrl)}</strong>
          </p>
          <p class="flex gap-2 whitespace-nowrap text-neutral-100">
            Balance:
            {#await new nwc.NWCClient({nostrWalletConnectUrl}).getBalance()}
              <span class="loading loading-spinner loading-sm"></span>
            {:then res}
              {new Intl.NumberFormat(LOCALE).format(fromMsats(res?.balance || 0))}
            {:catch}
              [unknown]
            {/await}
            sats
          </p>
        </div>
      {/if}
      <Link modal class="btn" href={router.at("settings/wallet/disconnect").toString()}>
        <Icon icon="close-circle" />
        Disconnect Wallet
      </Link>
    {:else}
      <p class="py-12 text-center opacity-75">No wallet connected</p>
    {/if}
  </div>
</div>
