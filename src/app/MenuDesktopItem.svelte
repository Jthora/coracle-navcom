<style>
  .nav-active-line-heartbeat {
    position: absolute;
    top: -7px;
    left: 0;
    width: 120px;
    height: 14px;
    opacity: 0;
    transform: translateX(-135%);
    animation: nav-active-heartbeat 10s infinite;
    filter: drop-shadow(0 0 4px currentColor);
  }

  .nav-active-line-heartbeat svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .nav-active-line-heartbeat polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  @keyframes nav-active-heartbeat {
    0%,
    76.5%,
    100% {
      opacity: 0;
      transform: translateX(-135%);
    }

    78.2% {
      opacity: 0.42;
      transform: translateX(-108%);
    }

    79.3% {
      opacity: 0.76;
      transform: translateX(-84%);
    }

    80.4% {
      opacity: 0.58;
      transform: translateX(-68%);
    }

    81.9% {
      opacity: 1;
      transform: translateX(-28%);
    }

    82.7% {
      opacity: 0.9;
      transform: translateX(-2%);
    }

    83.9% {
      opacity: 0.72;
      transform: translateX(30%);
    }

    84.8% {
      opacity: 0.48;
      transform: translateX(52%);
    }

    86.2% {
      opacity: 0;
      transform: translateX(128%);
    }
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {elasticOut} from "svelte/easing"
  import {fly} from "src/util/transition"
  import Link from "src/partials/Link.svelte"

  export let path = null
  export let isActive = false
  export let small = false
  export let short = innerHeight < 650

  $: className = cx("relative staatliches block transition-all", $$props.class, {
    "h-10": !small && short,
    "h-12": !small && !short,
    "h-10 text-lg": small,
    "text-3xl": !small && isActive,
    "text-2xl": !small && !isActive,
    "text-accent": isActive,
    "text-neutral-200 hover:text-accent": !isActive,
  })
</script>

<Link {...$$props} randomizeKey class={className} href={path} on:click>
  <div class="absolute left-8 flex gap-5 whitespace-nowrap pt-2" class:-right-3={isActive}>
    <slot />
    {#if isActive}
      <div
        in:fly|local={{x: 50, duration: 1000, easing: elasticOut}}
        class="nav-active-line relative h-px w-full overflow-hidden bg-accent"
        class:top-4={!small}
        class:top-3={small}>
        <div class="nav-active-line-heartbeat" aria-hidden="true">
          <svg viewBox="0 0 120 14" preserveAspectRatio="none">
            <polyline
              points="0,8 14,8 22,6 30,8 38,9.5 44,2.4 50,12.4 58,8 72,8 79,6.4 86,8 95,8.8 102,8 112,8 120,8" />
          </svg>
        </div>
      </div>
    {/if}
  </div>
</Link>
