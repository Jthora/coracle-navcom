<script lang="ts">
  import {
    navcomTheme,
    setShell,
    setSurface,
    setAccent,
    SHELL_PALETTE_NAMES,
    SURFACE_PALETTE_NAMES,
    ACCENT_PALETTE_NAMES,
  } from "src/partials/state"
  import type {ShellPalette, SurfacePalette, AccentPalette} from "src/partials/state"

  const shellSwatches: Record<ShellPalette, {color: string; label: string}> = {
    midnight: {color: "#0c1220", label: "Midnight"},
    void: {color: "#0b0e12", label: "Void"},
    carbon: {color: "#141416", label: "Carbon"},
    nebula: {color: "#120e1c", label: "Nebula"},
  }

  const surfaceSwatches: Record<SurfacePalette, {color: string; label: string}> = {
    steel: {color: "#0f1520", label: "Steel"},
    obsidian: {color: "#0f1114", label: "Obsidian"},
    graphite: {color: "#141416", label: "Graphite"},
    abyss: {color: "#0c1215", label: "Abyss"},
  }

  const accentSwatches: Record<AccentPalette, {color: string; label: string; gradient?: string}> = {
    cyan: {color: "#22d3ee", label: "Cyan"},
    amber: {color: "#f5b942", label: "Amber"},
    emerald: {color: "#34d399", label: "Emerald"},
    arc: {color: "#a78bfa", label: "Arc", gradient: "linear-gradient(135deg, #a78bfa, #6366f1)"},
  }
</script>

<div class="nc-theme-controls flex flex-col gap-5">
  <!-- Shell -->
  <div class="flex flex-col gap-2">
    <span class="nc-label">Shell</span>
    <div class="flex gap-2">
      {#each SHELL_PALETTE_NAMES as name}
        <button
          class="nc-swatch"
          class:nc-swatch-active={$navcomTheme.shell === name}
          style="background: {shellSwatches[name].color}"
          title={shellSwatches[name].label}
          on:click={() => setShell(name)}>
          <span class="nc-swatch-label">{shellSwatches[name].label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Surface -->
  <div class="flex flex-col gap-2">
    <span class="nc-label">Surface</span>
    <div class="flex gap-2">
      {#each SURFACE_PALETTE_NAMES as name}
        <button
          class="nc-swatch"
          class:nc-swatch-active={$navcomTheme.surface === name}
          style="background: {surfaceSwatches[name].color}"
          title={surfaceSwatches[name].label}
          on:click={() => setSurface(name)}>
          <span class="nc-swatch-label">{surfaceSwatches[name].label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Accent -->
  <div class="flex flex-col gap-2">
    <span class="nc-label">Accent</span>
    <div class="flex gap-2">
      {#each ACCENT_PALETTE_NAMES as name}
        <button
          class="nc-swatch nc-swatch-accent"
          class:nc-swatch-active={$navcomTheme.accent === name}
          style="background: {accentSwatches[name].gradient || accentSwatches[name].color}"
          title={accentSwatches[name].label}
          on:click={() => setAccent(name)}>
          <span class="nc-swatch-label">{accentSwatches[name].label}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .nc-swatch {
    width: 56px;
    height: 40px;
    border-radius: 6px;
    border: 2px solid var(--nc-surface-divider, #20262c);
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 80ms ease;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 3px;
    position: relative;
    overflow: hidden;
  }

  .nc-swatch:hover {
    border-color: rgba(var(--accent-rgb), 0.5);
    box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.2);
    transform: translateY(-1px);
  }

  .nc-swatch-active {
    border-color: var(--accent) !important;
    box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.35), inset 0 0 8px rgba(var(--accent-rgb), 0.1) !important;
  }

  .nc-swatch-label {
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--nc-text-muted);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  .nc-swatch-accent {
    height: 32px;
  }
</style>
