<script lang="ts">
  import {slide} from "src/util/transition"
</script>

<div
  in:slide={{delay: 500}}
  class="fixed bottom-[calc(var(--saib)+var(--mode-tab-height))] left-0 right-0 z-nav rounded-t-[18px] border-t border-nc-shell-border bg-[linear-gradient(180deg,rgba(var(--nc-shell-bg-rgb),0.9),rgba(var(--nc-shell-deep-rgb),0.95))] px-4 py-2 shadow-[0_-12px_28px_rgba(0,0,0,0.45)] backdrop-blur-sm lg:bottom-0 lg:left-72">
  <div class="m-auto flex max-w-2xl p-4">
    <slot />
  </div>
</div>
