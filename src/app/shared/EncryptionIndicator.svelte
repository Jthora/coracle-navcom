<script lang="ts">
  import {t} from "svelte-i18n"
  // Encryption is shown per-channel, NOT per-message.
  // Per-message badges are intentionally omitted (design decision from spec 02-03).
  // Signal, WhatsApp, and every major E2E messenger shows encryption per-conversation.
  export let transportMode: string = "baseline-nip29"
  export let channelId: string = ""
  export let compact: boolean = false

  const TOOLTIP_KEY_PREFIX = "enc-tip-dismissed/"

  $: tier = transportMode === "secure-nip-ee" ? "encrypted" : "open"
  $: isEncrypted = tier === "encrypted"

  let showTooltip = false

  $: {
    if (isEncrypted && channelId && typeof localStorage !== "undefined") {
      const key = TOOLTIP_KEY_PREFIX + channelId
      showTooltip = !localStorage.getItem(key)
    } else {
      showTooltip = false
    }
  }

  function dismissTooltip() {
    if (channelId && typeof localStorage !== "undefined") {
      localStorage.setItem(TOOLTIP_KEY_PREFIX + channelId, "1")
    }
    showTooltip = false
  }
</script>

{#if isEncrypted}
  <span class="relative inline-flex items-center">
    {#if compact}
      <span class="text-xs text-success" title={$t("encryption.indicator.title")}>🔐</span>
    {:else}
      <span
        class="bg-success/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-success">
        🔐 {$t("encryption.indicator.label")}
      </span>
    {/if}

    {#if showTooltip}
      <div
        class="z-50 absolute left-0 top-full mt-2 w-64 rounded-lg border border-neutral-600 bg-neutral-800 p-3 shadow-lg">
        <p class="text-xs text-neutral-200">
          {$t("encryption.tooltip.explanation")}
        </p>
        <button
          class="mt-2 rounded bg-neutral-700 px-2.5 py-1 text-[11px] text-neutral-200 transition-colors hover:bg-neutral-600"
          on:click={dismissTooltip}>
          {$t("encryption.tooltip.dismiss")}
        </button>
      </div>
    {/if}
  </span>
{/if}
