<script lang="ts">
  // Disable ts errors in this file because on:swipe type declarations aren't working
  // @ts-nocheck

  import {randomId} from "@welshman/lib"
  import {onMount} from "svelte"
  import {tweened} from "svelte/motion"
  import {fly, fade} from "src/util/transition"
  import {router} from "src/app/util/router"
  import {swipe} from "src/util/swipe"
  import {cubicOut} from "svelte/easing"

  export let mini = false
  export let drawer = false
  export let overlay = false
  export let virtual = true
  export let onEscape = null
  export let canClose = true
  export let canCloseAll = true

  const {history} = router

  let root, content, closing, historyItem, isNested

  const tryClose = () => {
    // Since we're popping, avoid double clicks
    if (!canClose || closing) {
      return
    }

    // Don't cascade closing nested modals
    if (root.querySelector(".modal")) {
      return
    }

    // If there's another modal in the list after this one, skip if it's not already closing
    const next = root.nextElementSibling
    if (next?.classList.contains("modal") && !next?.classList.contains("pointer-events-none")) {
      return
    }

    closing = true
    onEscape?.()
    tryPop()
  }

  const tryPop = () => {
    if ($history[0] === historyItem) {
      router.pop()
    }
  }

  onMount(() => {
    const key = randomId()

    // Make sure we can identify this modal by key
    // If we're virtual, add a new one, if not update the old one
    if (virtual) {
      router.virtual().open({key, mini})
    }

    historyItem = $history[0]
    isNested = Boolean($history[1]?.modal)

    // If history changes and removes this modal, notify the caller if virtual
    const unsub = history.subscribe($history => {
      if (!$history.includes(historyItem) && !closing) {
        onEscape?.()
      }
    })

    // When unmounting, sync history via pop if virtual
    return () => {
      unsub()
      tryPop()
      router.remove(key)
    }
  })

  const translateY = tweened(0, {easing: cubicOut, duration: 150})

  function handleSwipe(e: CustomEvent) {
    if (e.detail.isTop && !mini) {
      translateY.set(e.detail.deltaY, {duration: 0})
    }
  }

  function handleSwipeEnd(e) {
    if ($translateY > 200) {
      tryClose()
    } else {
      $translateY = 0
    }
  }
  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      tryClose?.()
    }
  }} />

<div bind:this={root} class="modal group absolute {$$props.class}">
  <slot name="wrapper">
    <div
      transition:fade
      class="fixed inset-0 z-modal"
      class:z-overlay={overlay}
      class:pointer-events-none={closing}
      class:ml-72={innerWidth >= 1024 && !overlay}>
      <div
        class="absolute inset-0 cursor-pointer bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.08),rgba(0,0,0,0.68))] backdrop-blur-sm"
        on:click|stopPropagation={tryClose} />
      <div
        class="modal-content scroll-container p-sai ml-0 h-full overflow-auto"
        class:overflow-hidden={mini}
        class:pointer-events-none={mini}
        use:swipe
        on:swipe={handleSwipe}
        on:end={handleSwipeEnd}
        transition:fly={{y: 1000}}
        style="margin-top: {$translateY}px;"
        bind:this={content}>
        {#if overlay}
          <slot />
        {:else}
          <div
            class="pointer-events-auto flex min-h-full flex-col justify-center transition-all duration-500"
            class:mt-12={drawer}
            class:mt-[45vh]={mini && window.innerHeight > 600}>
            {#if canClose}
              <div
                class="pointer-events-none sticky top-0 z-popover mx-auto flex min-h-16 w-full flex-col items-end gap-2 p-2">
                <div
                  class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
                       border border-solid border-accent bg-accent text-white transition-colors hover:bg-accent"
                  on:click|stopPropagation={tryClose}>
                  <i class="fa fa-times fa-lg cy-modal-close" />
                </div>
                <div
                  class:hidden={!isNested || !canCloseAll}
                  class="clear-modals pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center
                         rounded-full border border-solid border-tinted-700 bg-neutral-600 text-neutral-100 transition-colors hover:bg-neutral-600"
                  on:click|stopPropagation={() => router.clearModals()}>
                  <i class="fa-angles-down fa fa-lg" />
                </div>
              </div>
            {/if}
            <div on:click|stopPropagation class="">
              <div
                class="relative m-auto h-full min-h-screen w-full cursor-auto overflow-hidden rounded-[14px] border border-neutral-700 bg-[linear-gradient(180deg,rgba(15,17,20,0.95),rgba(5,6,8,0.98))] shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_0_1px_rgba(99,230,255,0.12)]">
                <div class="modal-content-inner m-auto flex max-w-2xl flex-col gap-4 p-4">
                  <slot />
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </slot>
</div>
