import Bowser from "bowser"
import {derived, writable, get} from "svelte/store"
import {parseHex} from "src/util/html"

// Browser

export const browser = Bowser.parse(window.navigator.userAgent)

// Settings

export const appName = import.meta.env.VITE_APP_NAME

// Install prompt

export const installPrompt = writable(null)

export const installAsPWA = () => {
  get(installPrompt).prompt()

  get(installPrompt).userChoice.then(result => {
    installPrompt.set(null)
  })
}

// ── Theme Engine ──────────────────────────────────────────────────────
// NavCom tri-axis theme: Shell × Surface × Accent
// Each axis has 4 palettes. Users mix-and-match independently.

export type ShellPalette = "midnight" | "void" | "carbon" | "nebula"
export type SurfacePalette = "steel" | "obsidian" | "graphite" | "abyss"
export type AccentPalette = "cyan" | "amber" | "emerald" | "arc"

export interface NavComThemeConfig {
  shell: ShellPalette
  surface: SurfacePalette
  accent: AccentPalette
}

const SHELL_PALETTES: Record<ShellPalette, {bg: string; bgDeep: string; border: string; text: string; textMuted: string}> = {
  midnight: {bg: "#0c1220", bgDeep: "#050a14", border: "#162038", text: "#c8d8f0", textMuted: "#6b82a8"},
  void: {bg: "#0b0e12", bgDeep: "#050608", border: "#181c20", text: "#e6edf3", textMuted: "#4b5563"},
  carbon: {bg: "#141416", bgDeep: "#0d0d0f", border: "#28282e", text: "#d8d8dc", textMuted: "#6b6b72"},
  nebula: {bg: "#120e1c", bgDeep: "#080510", border: "#221a38", text: "#d0c8e8", textMuted: "#7868a0"},
}

const SURFACE_PALETTES: Record<SurfacePalette, {card: string; cardHover: string; input: string; elevated: string; divider: string}> = {
  steel: {card: "#0f1520", cardHover: "#141c2a", input: "#0c1018", elevated: "#1a2030", divider: "#1e2c40"},
  obsidian: {card: "#0f1114", cardHover: "#141820", input: "#0b0e12", elevated: "#181c20", divider: "#20262c"},
  graphite: {card: "#141416", cardHover: "#1a1a1e", input: "#101012", elevated: "#1e1e22", divider: "#2a2a30"},
  abyss: {card: "#0c1215", cardHover: "#10181e", input: "#0a0e12", elevated: "#121a20", divider: "#1a252e"},
}

const ACCENT_PALETTES: Record<AccentPalette, {primary: string; primaryRgb: string; hover: string; glow: string; gradient?: string}> = {
  cyan: {primary: "#22d3ee", primaryRgb: "34, 211, 238", hover: "#67e8f9", glow: "#22d3ee"},
  amber: {primary: "#f5b942", primaryRgb: "245, 185, 66", hover: "#fcd34d", glow: "#f5b942"},
  emerald: {primary: "#34d399", primaryRgb: "52, 211, 153", hover: "#6ee7b7", glow: "#34d399"},
  arc: {primary: "#a78bfa", primaryRgb: "167, 139, 250", hover: "#c4b5fd", glow: "#8b5cf6", gradient: "linear-gradient(135deg, #a78bfa, #6366f1)"},
}

export const SHELL_PALETTE_NAMES: ShellPalette[] = ["midnight", "void", "carbon", "nebula"]
export const SURFACE_PALETTE_NAMES: SurfacePalette[] = ["steel", "obsidian", "graphite", "abyss"]
export const ACCENT_PALETTE_NAMES: AccentPalette[] = ["cyan", "amber", "emerald", "arc"]

const DEFAULT_THEME: NavComThemeConfig = {shell: "void", surface: "obsidian", accent: "cyan"}

const VALID_SHELLS = new Set(SHELL_PALETTE_NAMES)
const VALID_SURFACES = new Set(SURFACE_PALETTE_NAMES)
const VALID_ACCENTS = new Set(ACCENT_PALETTE_NAMES)

function loadThemeConfig(): NavComThemeConfig {
  try {
    const raw = localStorage.getItem("ui/navcom-theme")
    if (!raw) return DEFAULT_THEME
    const parsed = JSON.parse(raw)
    return {
      shell: VALID_SHELLS.has(parsed.shell) ? parsed.shell : DEFAULT_THEME.shell,
      surface: VALID_SURFACES.has(parsed.surface) ? parsed.surface : DEFAULT_THEME.surface,
      accent: VALID_ACCENTS.has(parsed.accent) ? parsed.accent : DEFAULT_THEME.accent,
    }
  } catch {
    return DEFAULT_THEME
  }
}

export const navcomTheme = writable<NavComThemeConfig>(loadThemeConfig())

navcomTheme.subscribe(value => {
  localStorage.setItem("ui/navcom-theme", JSON.stringify(value))
  document.documentElement.classList.add("dark")
})

export const setShell = (shell: ShellPalette) => navcomTheme.update(t => ({...t, shell}))
export const setSurface = (surface: SurfacePalette) => navcomTheme.update(t => ({...t, surface}))
export const setAccent = (accent: AccentPalette) => navcomTheme.update(t => ({...t, accent}))

// Legacy compat — keep `theme` store for components that read it
export const theme = derived(navcomTheme, () => "dark" as const)
export const toggleTheme = () => {} // No-op — dark-only for ops aesthetic

export const themeColors = derived(navcomTheme, $cfg => {
  const shell = SHELL_PALETTES[$cfg.shell]
  const surface = SURFACE_PALETTES[$cfg.surface]
  const accent = ACCENT_PALETTES[$cfg.accent]

  const colors: Record<string, string> = {
    // Semantic accent
    "accent": accent.primary,
    "accent-rgb": accent.primaryRgb,

    // Neutral scale (mapped from shell + surface)
    "neutral-950": shell.bgDeep,
    "neutral-900": shell.bg,
    "neutral-800": surface.card,
    "neutral-700": surface.elevated,
    "neutral-600": surface.divider,
    "neutral-500": shell.textMuted,
    "neutral-400": shell.textMuted,
    "neutral-300": adjustBrightness(shell.text, -25),
    "neutral-200": adjustBrightness(shell.text, -10),
    "neutral-100": shell.text,
    "neutral-50": "#f8fafc",

    // Tinted scale (surface-derived with accent tint)
    "tinted-800": shell.bgDeep,
    "tinted-700": mixColors(surface.card, accent.primary, 0.03),
    "tinted-600": mixColors(surface.elevated, accent.primary, 0.05),
    "tinted-500": mixColors(surface.divider, accent.primary, 0.06),
    "tinted-400": mixColors(shell.border, accent.primary, 0.08),
    "tinted-200": mixColors(shell.textMuted, accent.primary, 0.1),
    "tinted-100": mixColors(shell.text, accent.primary, 0.05),

    // Status colors
    "success": "#7af57a",
    "success-rgb": "122, 245, 122",
    "warning": "#f5b942",
    "warning-rgb": "245, 185, 66",
    "danger": "#dc2626",
    "danger-rgb": "220, 38, 38",

    // NavCom extended tokens
    "nc-shell-bg": shell.bg,
    "nc-shell-deep": shell.bgDeep,
    "nc-shell-border": shell.border,
    "nc-shell-bg-rgb": parseHex(shell.bg).join(", "),
    "nc-shell-deep-rgb": parseHex(shell.bgDeep).join(", "),
    "nc-shell-border-rgb": parseHex(shell.border).join(", "),
    "nc-surface-card": surface.card,
    "nc-surface-hover": surface.cardHover,
    "nc-surface-input": surface.input,
    "nc-surface-elevated": surface.elevated,
    "nc-surface-divider": surface.divider,
    "nc-surface-card-rgb": parseHex(surface.card).join(", "),
    "nc-accent-primary": accent.primary,
    "nc-accent-hover": accent.hover,
    "nc-accent-glow": accent.glow,
    "nc-text": shell.text,
    "nc-text-muted": shell.textMuted,
  }

  // Generate -l (lighter) and -d (darker) variants for base neutral/tinted tokens
  const expanded: Record<string, string> = {}
  for (const [k, v] of Object.entries(colors)) {
    expanded[k] = v
    if (k.startsWith("neutral-") || k.startsWith("tinted-")) {
      expanded[`${k}-l`] = adjustBrightness(v, 10)
      expanded[`${k}-d`] = adjustBrightness(v, -10)
    }
  }

  return expanded
})

export const themeVariables = derived(themeColors, $colors =>
  Object.entries($colors)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n"),
)

export const themeBackgroundGradient = derived(themeColors, $colors => {
  const color = parseHex($colors["neutral-800"])

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
})

// Accent gradient (for arc palette or solid for others)
export const accentGradient = derived(navcomTheme, $cfg => {
  const accent = ACCENT_PALETTES[$cfg.accent]
  return accent.gradient || accent.primary
})

function adjustBrightness(hexColor: string, brightnessPercent: number): string {
  hexColor = hexColor.replace("#", "")
  const r = parseInt(hexColor.substring(0, 2), 16)
  const g = parseInt(hexColor.substring(2, 4), 16)
  const b = parseInt(hexColor.substring(4, 6), 16)
  const adjust = brightnessPercent / 100
  const clamp = (value: number) => Math.max(0, Math.min(255, value))
  return (
    "#" +
    clamp(Math.round(r + r * adjust)).toString(16).padStart(2, "0") +
    clamp(Math.round(g + g * adjust)).toString(16).padStart(2, "0") +
    clamp(Math.round(b + b * adjust)).toString(16).padStart(2, "0")
  )
}

function mixColors(base: string, mix: string, ratio: number): string {
  const b = parseHex(base)
  const m = parseHex(mix)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    "#" +
    clamp(b[0] * (1 - ratio) + m[0] * ratio).toString(16).padStart(2, "0") +
    clamp(b[1] * (1 - ratio) + m[1] * ratio).toString(16).padStart(2, "0") +
    clamp(b[2] * (1 - ratio) + m[2] * ratio).toString(16).padStart(2, "0")
  )
}
