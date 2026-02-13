<style>
  .nav-active-line-heartbeat {
    position: absolute;
    top: -6px;
    left: 0;
    width: 156px;
    height: 12px;
    opacity: 0;
    transform: translateX(-118%);
    animation: nav-active-heartbeat 10s infinite;
    filter: drop-shadow(0 0 3px currentColor);
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(0, 0, 0, 0.14) 16%,
      rgba(0, 0, 0, 0.95) 52%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(0, 0, 0, 0.14) 16%,
      rgba(0, 0, 0, 0.95) 52%,
      transparent 100%
    );
  }

  .nav-active-line-heartbeat svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .nav-active-line-heartbeat polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.25;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  @keyframes nav-active-heartbeat {
    0%,
    6.6%,
    100% {
      opacity: 0;
      transform: translateX(-118%);
    }

    0.8% {
      opacity: 0.3;
      transform: translateX(-92%);
    }

    1.8% {
      opacity: 0.95;
      transform: translateX(-58%);
    }

    2.8% {
      opacity: 0.82;
      transform: translateX(-30%);
    }

    3.8% {
      opacity: 0.7;
      transform: translateX(-2%);
    }

    4.8% {
      opacity: 0.46;
      transform: translateX(28%);
    }

    6.6% {
      opacity: 0;
      transform: translateX(72%);
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
        in:fly|local={{x: 50, duration: 450, easing: elasticOut}}
        class="nav-active-line relative h-px w-full overflow-visible bg-accent"
        class:top-4={!small}
        class:top-3={small}>
        <div class="nav-active-line-heartbeat" aria-hidden="true">
          <svg viewBox="0 0 156 12" preserveAspectRatio="none">
            <polyline
              points="0,8 12,8 18,5 24,10.7 30,4.2 36,11.2 42,3.2 48,11.4 54,4.2 60,10.8 66,5 72,10 78,6 84,9.5 90,6.7 96,9 102,7.2 108,8.6 116,8 124,8 136,8 146,8 156,8" />
          </svg>
        </div>
      </div>
    {/if}
  </div>
</Link>
