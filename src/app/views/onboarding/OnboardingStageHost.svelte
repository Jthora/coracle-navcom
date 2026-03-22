<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Start from "src/app/views/onboarding/Start.svelte"
  import KeyChoice from "src/app/views/onboarding/KeyChoice.svelte"
  import ProfileLite from "src/app/views/onboarding/ProfileLite.svelte"
  import Complete from "src/app/views/onboarding/Complete.svelte"
  import ImportPasswordPrompt from "src/app/views/onboarding/ImportPasswordPrompt.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let currentStage
  export let hasKey
  export let selectedPath
  export let hasNip07
  export let signerApps
  export let keyLoading
  export let keyError
  export let finishing
  export let relaysApplied
  export let starterApplied
  export let backupNeeded
  export let profile
  export let showImportPassword
  export let importPasswordLoading
  export let importPasswordError

  export let onContinueStart
  export let onSkipExisting
  export let onBackToStart
  export let onSkipKey
  export let onSelectPath
  export let onManaged
  export let onImport
  export let onExternal
  export let onExtension
  export let onSignerApp
  export let onProfileChange
  export let onBackProfile
  export let onContinueProfile
  export let onBackDone
  export let onFinish
  export let onImportPasswordSubmit
  export let onImportPasswordCancel
</script>

<FlexColumn class="mt-8">
  {#key currentStage}
    {#if currentStage === "start"}
      <Start {hasKey} onContinue={onContinueStart} {onSkipExisting} />
    {:else if currentStage === "key"}
      <KeyChoice
        {selectedPath}
        {hasNip07}
        {signerApps}
        loading={keyLoading}
        error={keyError}
        on:select={e => onSelectPath(e.detail.path)}
        on:managed={onManaged}
        on:import={e => onImport(e.detail.secret)}
        on:external={onExternal}
        on:extension={onExtension}
        on:signerApp={e => onSignerApp(e.detail.app)} />
      <div class="mt-4 flex justify-between text-sm text-nc-text-muted">
        <div>Managed is fastest. Advanced options remain available.</div>
        <div class="flex gap-2">
          <Button class="btn btn-low whitespace-normal text-center" on:click={onBackToStart}>
            Back
          </Button>
          <Button class="btn btn-accent whitespace-normal text-center" on:click={onSkipKey}>
            Skip for now
          </Button>
          <Popover triggerType="mouseenter">
            <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
            <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
              Skips picking a key right now and moves to profile. You’ll still need a key before
              finishing, so choose one of the options when you’re ready.
            </div>
          </Popover>
        </div>
      </div>
    {:else if currentStage === "profile"}
      <ProfileLite
        handle={profile.handle}
        displayName={profile.displayName}
        starterFollows={profile.starterFollows}
        loading={finishing}
        onChange={onProfileChange}
        onBack={onBackProfile}
        onContinue={onContinueProfile} />
    {:else if currentStage === "done"}
      <Complete {relaysApplied} {starterApplied} {backupNeeded} onBack={onBackDone} {onFinish} />
    {/if}
  {/key}

  <div class="m-auto flex items-center gap-2">
    <div class="flex gap-2">
      {#each ["start", "key", "profile", "done"] as s}
        <div
          class="h-2 w-2 rounded-full"
          class:bg-nc-text={s === currentStage}
          class:bg-nc-shell-border={s !== currentStage} />
      {/each}
    </div>
    <Popover triggerType="mouseenter">
      <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
      <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
        These dots show your progress through the four steps. You can go back, but some steps (like
        choosing a key) must be completed before finishing.
      </div>
    </Popover>
  </div>

  <ImportPasswordPrompt
    open={showImportPassword}
    loading={importPasswordLoading}
    error={importPasswordError}
    on:submit={e => onImportPasswordSubmit(e.detail.password)}
    on:cancel={onImportPasswordCancel} />
</FlexColumn>
