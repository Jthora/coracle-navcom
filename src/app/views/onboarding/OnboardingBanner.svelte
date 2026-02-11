<script lang="ts">
  import {pubkey} from "@welshman/app"
  import {router} from "src/app/util/router"
  import {env} from "src/engine"
  import {onboardingState} from "src/app/state/onboarding"

  const {page} = router

  const goToSignup = () => {
    const target = $page?.path || "/notes"
    const qp = env.ENABLE_GUIDED_SIGNUP ? {returnTo: target} : {}
    router
      .at(env.ENABLE_GUIDED_SIGNUP ? "/signup" : "/login")
      .qp(qp)
      .open()
  }
</script>

{#if (env.ENABLE_GUIDED_SIGNUP || env.ENABLE_GUIDED_SIGNUP_SHADOW) && ($onboardingState.pending || $onboardingState.backupNeeded)}
  <div
    class="z-banner left-sai right-sai pointer-events-none fixed top-4 flex justify-center px-3 lg:top-20 lg:pl-72 lg:pr-6">
    <div
      class="border-accent/40 bg-neutral-900/95 pointer-events-auto flex w-full max-w-3xl flex-1 items-center gap-3 rounded border px-4 py-3 text-neutral-100 shadow-2xl">
      <div class="flex-1 text-sm">
        {#if $onboardingState.backupNeeded}
          Finish securing your key. Export or confirm your backup.
        {:else}
          Finish signup to apply defaults and get posting.
        {/if}
      </div>
      {#if !$pubkey}
        <button class="btn btn-accent" on:click={goToSignup}>Get started</button>
      {:else}
        <button class="btn btn-accent" on:click={goToSignup}>Finish setup</button>
      {/if}
    </div>
  </div>
{/if}
