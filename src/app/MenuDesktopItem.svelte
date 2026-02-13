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
    animation: nav-active-heartbeat-shiver 180ms steps(2, end) infinite;
  }

  .nav-active-line-heartbeat-core {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.25;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    opacity: 0.88;
  }

  .nav-active-line-heartbeat-spark {
    fill: none;
    stroke: currentColor;
    stroke-width: 0.95;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 3.2 5.6;
    stroke-dashoffset: 0;
    opacity: 0.9;
    filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 5px currentColor);
    animation:
      nav-active-spark-trace 220ms linear infinite,
      nav-active-spark-flicker 140ms steps(2, end) infinite;
  }

  .nav-active-line-heartbeat::after {
    content: "";
    position: absolute;
    left: -2px;
    right: -2px;
    top: 7px;
    height: 2px;
    opacity: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent 0 8px,
      currentColor 8px 9px,
      transparent 9px 15px,
      currentColor 15px 16px,
      transparent 16px 23px
    );
    filter: blur(0.6px);
    animation: nav-active-static-trail 10s infinite;
  }

  .nav-active-line-zigzag {
    position: absolute;
    top: -4px;
    left: 0;
    width: 96px;
    height: 8px;
    opacity: 0;
    transform: translateX(-110%);
    animation: nav-active-line-zigzag-sweep 10s infinite;
    pointer-events: none;
  }

  .nav-active-line-zigzag svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .nav-active-line-zigzag polyline {
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 2px currentColor);
  }

  @keyframes nav-active-heartbeat {
    0%,
    6.8%,
    100% {
      opacity: 0;
      transform: translateX(-118%);
    }

    0.9% {
      opacity: 0.45;
      transform: translateX(-94%);
    }

    1.9% {
      opacity: 1;
      transform: translateX(-60%);
    }

    2.9% {
      opacity: 0.92;
      transform: translateX(-35%);
    }

    3.8% {
      opacity: 0.78;
      transform: translateX(-8%);
    }

    4.9% {
      opacity: 0.5;
      transform: translateX(25%);
    }

    6.8% {
      opacity: 0;
      transform: translateX(76%);
    }
  }

  @keyframes nav-active-heartbeat-shiver {
    0%,
    100% {
      transform: translateY(0);
    }

    35% {
      transform: translateY(-0.2px);
    }

    65% {
      transform: translateY(0.25px);
    }
  }

  @keyframes nav-active-spark-trace {
    from {
      stroke-dashoffset: 22;
    }

    to {
      stroke-dashoffset: -22;
    }
  }

  @keyframes nav-active-spark-flicker {
    0%,
    40%,
    100% {
      opacity: 0.4;
    }

    20% {
      opacity: 1;
    }

    65% {
      opacity: 0.68;
    }

    80% {
      opacity: 0.95;
    }
  }

  @keyframes nav-active-static-trail {
    0%,
    0.8%,
    6.8%,
    100% {
      opacity: 0;
      transform: translateX(-10px);
    }

    2.1% {
      opacity: 0.5;
      transform: translateX(0);
    }

    3.8% {
      opacity: 0.36;
      transform: translateX(14px);
    }

    5.3% {
      opacity: 0.2;
      transform: translateX(24px);
    }
  }

  @keyframes nav-active-line-zigzag-sweep {
    0%,
    6.8%,
    100% {
      opacity: 0;
      transform: translateX(-110%);
    }

    1.1% {
      opacity: 0.35;
      transform: translateX(-86%);
    }

    2.2% {
      opacity: 0.95;
      transform: translateX(-52%);
    }

    3.4% {
      opacity: 0.82;
      transform: translateX(-20%);
    }

    4.6% {
      opacity: 0.56;
      transform: translateX(10%);
    }

    6.2% {
      opacity: 0;
      transform: translateX(58%);
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
        class="nav-active-line relative h-px w-full overflow-visible bg-accent"
        class:top-4={!small}
        class:top-3={small}>
        <div class="nav-active-line-zigzag" aria-hidden="true">
          <svg viewBox="0 0 96 8" preserveAspectRatio="none">
            <polyline
              points="0,4 8,4 14,1.1 20,6.8 26,1.3 32,6.7 38,1.4 44,6.6 50,1.5 56,6.4 62,1.9 68,6.1 74,2.4 80,5.5 88,4.2 96,4" />
          </svg>
        </div>
        <div class="nav-active-line-heartbeat" aria-hidden="true">
          <svg viewBox="0 0 156 12" preserveAspectRatio="none">
            <polyline
              class="nav-active-line-heartbeat-core"
              points="0,8 12,8 18,5 24,10.7 30,4.2 36,11.2 42,3.2 48,11.4 54,4.2 60,10.8 66,5 72,10 78,6 84,9.5 90,6.7 96,9 102,7.2 108,8.6 116,8 124,8 136,8 146,8 156,8" />
            <polyline
              class="nav-active-line-heartbeat-spark"
              points="0,8 12,8 17,4.4 22,10.8 28,3.6 34,11.4 40,2.6 46,11.4 52,3.6 58,10.8 64,4.6 70,10 76,6.2 82,9.6 88,6.8 94,9 100,7.3 106,8.6 116,8 126,8 138,8 148,8 156,8" />
          </svg>
        </div>
      </div>
    {/if}
  </div>
</Link>
