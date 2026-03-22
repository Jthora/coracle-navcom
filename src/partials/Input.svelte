<script lang="ts">
  import cx from "classnames"

  export let initialValue: string | number = ""
  export let value = initialValue
  export let element = null
  export let hideBefore = false
  export let hideAfter = false
  export let format: (x: any) => string = null
  export let parse: (x: string) => any = null
  export let dark = false

  const showBefore = $$slots.before && !hideBefore
  const showAfter = $$slots.after && !hideAfter

  const onInput = e => {
    if (parse) {
      value = parse(e.target.value)
    } else if (["range", "number"].includes($$props.type)) {
      value = parseFloat(e.target.value)
    } else {
      value = e.target.value
    }
  }

  $: inputValue = format ? format(value) : value
</script>

<div
  class={cx(
    $$props.class,
    "relative h-9 overflow-hidden rounded-[4px] border border-nc-shell-border bg-nc-input text-nc-text shadow-[inset_0_1px_0_rgba(var(--accent-rgb),0.18)] transition-all focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.25),0_0_0_4px_rgba(var(--accent-rgb),0.18)]",
    {
      "!border-0 !bg-transparent !shadow-none": $$props.type === "range",
    },
  )}>
  <input
    {...$$props}
    class={cx(
      "h-9 w-full bg-transparent px-3 pb-px caret-[var(--accent)] outline-none placeholder:text-nc-text-muted",
      {
        "pl-10": showBefore,
        "pr-10": showAfter,
      },
    )}
    value={inputValue}
    bind:this={element}
    on:input={onInput}
    on:change
    on:blur
    on:focus
    on:input
    on:keydown />
  {#if showBefore}
    <div class="absolute left-0 top-0 flex h-7 items-center gap-2 px-3 opacity-75">
      <div>
        <slot name="before" />
      </div>
    </div>
  {/if}
  {#if showAfter}
    <div
      class="absolute right-0 top-0 m-px flex h-7 items-center gap-2 rounded-full px-3 opacity-75">
      <div>
        <slot name="after" />
      </div>
    </div>
  {/if}
</div>
