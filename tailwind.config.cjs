/** @type {import('tailwindcss').Config} */

const colors = {
  black: "black",
  white: "white",
  transparent: "transparent",
  accent: "var(--accent)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  success: "var(--success)",
  // NavCom semantic tokens
  "nc-shell": "var(--nc-shell-bg)",
  "nc-shell-deep": "var(--nc-shell-deep)",
  "nc-shell-border": "var(--nc-shell-border)",
  "nc-card": "var(--nc-surface-card)",
  "nc-card-hover": "var(--nc-surface-hover)",
  "nc-input": "var(--nc-surface-input)",
  "nc-elevated": "var(--nc-surface-elevated)",
  "nc-divider": "var(--nc-surface-divider)",
  "nc-accent": "var(--nc-accent-primary)",
  "nc-accent-hover": "var(--nc-accent-hover)",
  "nc-accent-glow": "var(--nc-accent-glow)",
  "nc-text": "var(--nc-text)",
  "nc-text-muted": "var(--nc-text-muted)",
}

const baseColors = [
  "neutral-100",
  "neutral-200",
  "neutral-300",
  "neutral-400",
  "neutral-500",
  "neutral-50",
  "neutral-600",
  "neutral-700",
  "neutral-800",
  "neutral-900",
  "neutral-950",
  "tinted-100",
  "tinted-200",
  "tinted-400",
  "tinted-500",
  "tinted-600",
  "tinted-700",
  "tinted-800",
]

const dynamicColors = generateVariants(baseColors)

function generateVariants(baseColors) {
  const result = {}

  baseColors.forEach(baseColor => {
    const lightKey = `${baseColor}-l`
    const darkKey = `${baseColor}-d`

    result[baseColor] = `var(--${baseColor})`
    result[lightKey] = `var(--${lightKey})`
    result[darkKey] = `var(--${darkKey})`
  })

  return result
}

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,svelte}"],
  darkMode: "class",
  safelist: [
    "w-4",
    "h-4",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "grid-cols-5",
    "grid-cols-6",
    "grid-cols-7",
    "grid-cols-8",
    "col-span-1",
    "col-span-2",
    "col-span-3",
    "col-span-4",
    "col-span-5",
  ],
  theme: {
    extend: {},
    zIndex: {
      none: 0,
      feature: 1,
      nav: 2,
      chat: 3,
      popover: 4,
      modal: 5,
      sidebar: 6,
      overlay: 7,
      toast: 8,
    },
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    colors: {
      ...colors,
      ...dynamicColors,
    },
  },
  plugins: [],
}
